'use client';

import { useCallback, useState } from 'react';
import { sendLeadDirect } from '@/lib/lead-direct';
import type { LeadInput } from '@/lib/lead-payload';

export type LeadStatus = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Shared submit pipeline for every form on the site — the dialog and any
 * inline block. API route first; if it reports failure the visitor's own
 * browser posts to the relay, which is immune to serverless-IP blocks.
 *
 * Validation lives here too, so the dialog and the inline form can never
 * disagree about what counts as a usable phone number.
 */
export function useLeadSubmit() {
  const [status, setStatus] = useState<LeadStatus>('idle');
  const [error, setError] = useState('');

  const submit = useCallback(async (lead: LeadInput, honeypot?: unknown) => {
    if (typeof honeypot === 'string' && honeypot.trim() !== '') {
      setStatus('success'); // bot: pretend it worked, deliver nothing
      return true;
    }
    if (lead.name.trim().length < 2) {
      setStatus('error');
      setError('Вкажіть, будь ласка, ім’я.');
      return false;
    }
    if (lead.phone.replace(/\D/g, '').length < 9) {
      setStatus('error');
      setError('Перевірте номер телефону — здається, він неповний.');
      return false;
    }

    setStatus('submitting');
    setError('');

    let delivered = false;
    let apiError = '';
    try {
      const res = await fetch('/api/zayavka', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lead, website: honeypot }),
      });
      const data = await res.json().catch(() => ({}));
      delivered = res.ok && data.ok;
      if (!delivered) apiError = data.error || '';
    } catch {
      /* network error → fall through to the direct path */
    }
    if (!delivered) delivered = await sendLeadDirect(lead);

    if (delivered) {
      setStatus('success');
      return true;
    }
    setStatus('error');
    setError(apiError || 'Не вдалося надіслати. Зателефонуйте нам — приймемо заявку голосом.');
    return false;
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError('');
  }, []);

  return { status, error, submit, reset };
}
