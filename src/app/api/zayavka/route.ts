import { NextResponse } from 'next/server';
import { site } from '@/lib/site';
import {
  buildLeadSections,
  leadSubject,
  toRelayFields,
  type LeadInput,
} from '@/lib/lead-payload';

/**
 * Lead intake.
 *
 * Delivery today goes through a keyless form relay so the site can go live
 * before the client's mailbox exists. When SMTP credentials land, swap
 * `deliver()` for a nodemailer transport — the payload shape is already fixed
 * by lead-payload, and buildLeadSections() renders the office e-mail.
 *
 * The browser retries through lead-direct if this route reports failure, so a
 * blocked serverless IP never costs a lead.
 */

export const runtime = 'nodejs';

const TO = process.env.CONTACT_TO || site.email;

/** Crude per-instance throttle — enough to blunt a naive flood. */
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  let body: (LeadInput & { website?: unknown }) | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Некоректний запит.' }, { status: 400 });
  }
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Порожній запит.' }, { status: 400 });
  }

  // Honeypot — bots fill every field they find, humans never see this one.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  const name = String(body.name ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  if (name.length < 2) {
    return NextResponse.json({ ok: false, error: 'Вкажіть, будь ласка, ім’я.' }, { status: 400 });
  }
  if (phone.replace(/\D/g, '').length < 9) {
    return NextResponse.json(
      { ok: false, error: 'Перевірте номер телефону.' },
      { status: 400 },
    );
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Забагато спроб. Зачекайте хвилину або зателефонуйте нам.' },
      { status: 429 },
    );
  }

  const lead: LeadInput = {
    name,
    phone,
    context: String(body.context ?? 'Заявка з сайту'),
    page: String(body.page ?? '/'),
    pageTitle: body.pageTitle ? String(body.pageTitle) : undefined,
    source: body.source,
    message: body.message ? String(body.message).slice(0, 2000) : undefined,
    fields: body.fields,
  };

  const meta = {
    sentAt: new Date().toLocaleString('uk-UA', {
      timeZone: 'Europe/Kyiv',
      dateStyle: 'short',
      timeStyle: 'short',
    }),
    siteUrl: site.url,
  };

  // buildLeadSections is what the eventual HTML mail renders from; calling it
  // here keeps the server path honest about the payload it claims to deliver.
  const sections = buildLeadSections(lead, meta);
  if (sections.length === 0) {
    return NextResponse.json({ ok: false, error: 'Порожня заявка.' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${TO}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        ...toRelayFields(lead, meta),
        _subject: leadSubject(lead),
        _template: 'table',
        _captcha: 'false',
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: string | boolean };
    const ok = res.ok && (data.success === 'true' || data.success === true);
    if (!ok) {
      return NextResponse.json({ ok: false, error: '' }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    // The browser will retry through lead-direct.
    return NextResponse.json({ ok: false, error: '' }, { status: 502 });
  }
}
