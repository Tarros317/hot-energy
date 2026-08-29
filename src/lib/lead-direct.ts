/**
 * Browser-side delivery fallback. If /api/zayavka fails (no SMTP configured
 * yet, or the serverless egress IP is challenged by the relay), the visitor's
 * OWN browser posts the enquiry — a real browser origin and IP, which is what
 * the keyless relay is designed for.
 *
 * Field labels and their order come from lead-payload, the same module the
 * server route uses, so a lead looks identical whichever path delivered it.
 */

import { leadSubject, toRelayFields, type LeadInput } from '@/lib/lead-payload';
import { site } from '@/lib/site';

const TO = site.email;

export async function sendLeadDirect(lead: LeadInput): Promise<boolean> {
  const meta = {
    sentAt: new Date().toLocaleString('uk-UA', {
      timeZone: 'Europe/Kyiv',
      dateStyle: 'short',
      timeStyle: 'short',
    }),
    siteUrl: window.location.origin,
  };

  const form: Record<string, string> = {
    ...toRelayFields(lead, meta),
    _subject: leadSubject(lead),
    _template: 'table',
    _captcha: 'false',
  };

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${TO}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(form),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: string | boolean };
    return res.ok && (data.success === 'true' || data.success === true);
  } catch {
    return false;
  }
}
