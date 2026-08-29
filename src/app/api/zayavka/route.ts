import { NextResponse } from 'next/server';
import { site } from '@/lib/site';
import { buildLeadSections, toTelegramMessage, type LeadInput } from '@/lib/lead-payload';

/**
 * Lead intake. Every enquiry on the site lands in one Telegram group.
 *
 * This has to be a server route and cannot be done from the browser: the bot
 * token is a credential, and anything the page can read, every visitor can
 * read. That is also why there is no second, browser-side delivery channel any
 * more — see lead-transport for what replaced it.
 */

export const runtime = 'nodejs';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

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

  if (buildLeadSections(lead, meta).length === 0) {
    return NextResponse.json({ ok: false, error: 'Порожня заявка.' }, { status: 400 });
  }

  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    // Loud on the server, quiet to the visitor: a misconfigured deploy is our
    // problem, and the form should not blame them for it.
    console.error('[zayavka] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не налаштовані');
    return NextResponse.json({ ok: false, error: '' }, { status: 500 });
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: toTelegramMessage(lead, meta),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (!res.ok || !data.ok) {
      // `description` is the only thing that says WHY — «chat not found», «bot
      // was kicked», a parse error in the markup. Dropping it means debugging
      // a lost lead blind, so it goes to the function log verbatim.
      console.error('[zayavka] Telegram відмовив:', res.status, data.description ?? '');
      return NextResponse.json({ ok: false, error: '' }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[zayavka] Запит до Telegram не пройшов:', err);
    return NextResponse.json({ ok: false, error: '' }, { status: 502 });
  }
}
