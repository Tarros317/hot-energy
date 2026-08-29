'use client';

import { useCallback, useState } from 'react';
import { postLead } from '@/lib/lead-transport';
import type { LeadInput } from '@/lib/lead-payload';

export type LeadStatus = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Shared submit pipeline for every form on the site — the dialog and any
 * inline block. Delivery itself lives in lead-transport; this hook owns the
 * validation and the status the form renders from.
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

    const { ok, error: apiError } = await postLead(lead, honeypot);

    if (ok) {
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
