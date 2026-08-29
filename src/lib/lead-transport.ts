'use client';

import type { LeadInput } from '@/lib/lead-payload';

export type LeadResult = { ok: boolean; error: string };

/**
 * The one way a form reaches the office.
 *
 * There used to be a second, browser-side channel here that posted to a keyless
 * mail relay whenever the API route failed. It cannot survive the move to
 * Telegram: the bot token is a credential, so the browser can never hold it,
 * and the address the relay fell back to is a placeholder nobody reads — a form
 * that reports success into a dead mailbox is worse than one that admits it
 * failed.
 *
 * What replaced it covers the failure that actually happens on a serverless
 * host: a cold function that times out or 502s on the first hit. So a transport
 * failure is retried once, and a rejection the server meant (a 4xx — bad phone,
 * honeypot) is not, because repeating it would only produce the same answer.
 */

const RETRY_DELAY_MS = 800;

type Attempt = LeadResult & { retryable: boolean };

async function attempt(lead: LeadInput, honeypot?: unknown): Promise<Attempt> {
  try {
    const res = await fetch('/api/zayavka', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lead, website: honeypot }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (res.ok && data.ok) return { ok: true, error: '', retryable: false };
    return { ok: false, error: data.error ?? '', retryable: res.status >= 500 };
  } catch {
    // Network-level failure: no response at all, so nothing was decided.
    return { ok: false, error: '', retryable: true };
  }
}

export async function postLead(lead: LeadInput, honeypot?: unknown): Promise<LeadResult> {
  const first = await attempt(lead, honeypot);
  if (first.ok || !first.retryable) return { ok: first.ok, error: first.error };

  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  const second = await attempt(lead, honeypot);
  return { ok: second.ok, error: second.error };
}
