'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, Loader2, Phone, X } from 'lucide-react';
import { lockScroll, unlockScroll } from '@/components/layout/SmoothScroll';
import { postLead } from '@/lib/lead-transport';
import { site } from '@/lib/site';
import { GLOBAL_LEAD, type LeadContextConfig } from '@/lib/lead-forms';
import type { LeadInput, LeadSource } from '@/lib/lead-payload';

/**
 * One dialog, many contexts. Every CTA on the page opens THIS component and
 * passes its own config, so a visitor who clicks inside the calculator gets a
 * form that talks about their calculation — not a generic "leave your number".
 *
 * Desktop: centred card. Mobile: bottom sheet, safe-area aware and scrollable.
 * Focus is trapped, Escape and backdrop close, page scroll (including Lenis)
 * is paused while open.
 */

export type LeadModalPayload = {
  /** Pre-fill for the comment field — the calculator sends its result here. */
  note?: string;
  config?: LeadContextConfig;
  source?: LeadSource;
  /** Hidden context reported in the e-mail, e.g. the appliance list. */
  meta?: Record<string, string>;
};

const EVENT = 'he:lead-open';

export function openLeadModal(payload?: LeadModalPayload) {
  window.dispatchEvent(new CustomEvent<LeadModalPayload>(EVENT, { detail: payload }));
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

const fieldClass =
  'w-full rounded-xl border border-white/12 bg-ink-900 px-4 py-3 text-[0.95rem] text-frost transition-colors placeholder:text-dim focus:border-ember-400/60 focus:outline-none';
const labelClass = 'mb-1.5 block text-xs font-semibold tracking-wide text-mist';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * `createPortal(…, document.body)` cannot run during SSR, so the dialog must
 * render nothing until it is on the client. useSyncExternalStore gives that
 * answer directly (server snapshot false, client snapshot true) instead of the
 * usual setState-in-an-effect, which costs an extra render pass.
 */
const NEVER_CHANGES = () => () => {};
const useMounted = () => useSyncExternalStore(NEVER_CHANGES, () => true, () => false);

export function LeadModalHost() {
  const reduce = useReducedMotion();
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState<LeadContextConfig>(GLOBAL_LEAD);
  const [source, setSource] = useState<LeadSource | undefined>();
  const [meta, setMeta] = useState<Record<string, string> | undefined>();
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<LeadModalPayload | undefined>).detail;
      restoreFocusRef.current = document.activeElement as HTMLElement | null;
      setCfg(detail?.config ?? GLOBAL_LEAD);
      setSource(detail?.source);
      setMeta(detail?.meta);
      setNote(detail?.note ?? '');
      setStatus('idle');
      setError('');
      setOpen(true);
    };
    window.addEventListener(EVENT, onOpen);
    return () => window.removeEventListener(EVENT, onOpen);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    restoreFocusRef.current?.focus?.();
  }, []);

  // Scroll lock + Escape + focus trap. The lock is ref-counted in
  // SmoothScroll because more than one overlay can be open at once.
  useEffect(() => {
    if (!open) return;
    lockScroll();

    // Focus the name field by name — `input:not([type=hidden])` would land on
    // the honeypot, which is a visible text input parked off-screen.
    // Skipped on touch, where autofocus throws the keyboard over the sheet.
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const t = coarse
      ? undefined
      : setTimeout(() => {
          panelRef.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
        }, 70);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null,
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      if (t) clearTimeout(t);
      unlockScroll();
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    setError('');

    const fd = new FormData(e.currentTarget);
    const fields: Record<string, string> = { ...(meta ?? {}) };
    for (const f of cfg.form.fields) {
      const v = String(fd.get(f.name) ?? '').trim();
      if (v) fields[f.label] = v;
    }

    const core: LeadInput = {
      name: String(fd.get('name') ?? '').trim(),
      phone: String(fd.get('phone') ?? '').trim(),
      context: cfg.context,
      page: window.location.pathname,
      pageTitle: document.title,
      source: source ?? { id: 'dialog', button: cfg.form.cta },
      fields,
      message: String(fd.get('message') ?? '').trim(),
    };

    if (core.name.length < 2) {
      setStatus('error');
      setError('Вкажіть, будь ласка, ім’я.');
      return;
    }
    if (core.phone.replace(/\D/g, '').length < 9) {
      setStatus('error');
      setError('Перевірте номер телефону — здається, він неповний.');
      return;
    }

    const { ok, error: apiError } = await postLead(core, fd.get('website'));

    if (ok) {
      setStatus('success');
    } else {
      setStatus('error');
      setError(apiError || 'Не вдалося надіслати. Зателефонуйте нам — приймемо заявку голосом.');
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="lead-modal"
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-110 flex items-end justify-center sm:items-center sm:p-6"
        >
          <motion.button
            type="button"
            aria-label="Закрити"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: 0.22 }}
            onClick={close}
            className="absolute inset-0 cursor-default touch-none bg-abyss/80 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-modal-title"
            variants={{
              hidden: { opacity: 0, y: reduce ? 0 : 44, scale: reduce ? 1 : 0.99 },
              visible: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="relative flex max-h-[95svh] w-full flex-col overflow-hidden rounded-t-3xl border border-ember-400/25 bg-ink-950 shadow-[0_30px_90px_rgba(0,0,0,0.8)] sm:max-h-[88svh] sm:max-w-lg sm:rounded-3xl"
          >
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ember-400/70 to-transparent"
            />

            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/8 px-5 pt-5 pb-4 sm:px-7">
              <div>
                <p className="eyebrow">{cfg.context}</p>
                <h2
                  id="lead-modal-title"
                  className="font-heading mt-2 text-lg leading-snug text-cloud sm:text-[1.4rem]"
                >
                  {cfg.form.headline}
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Закрити"
                className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-white/12 text-mist transition-colors hover:border-ember-400/50 hover:text-frost"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            {/* min-h-0 is load-bearing: without it this flex child refuses to
                shrink below its content and NOTHING scrolls on a phone. */}
            <div
              data-lenis-prevent
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-7 sm:pb-7"
            >
              {status === 'success' ? (
                <div role="status" className="flex flex-col items-start gap-4 py-3">
                  <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-volt-400/40 bg-volt-400/10">
                    <Check aria-hidden className="size-7 text-volt-400" />
                  </span>
                  <h3 className="font-heading text-2xl text-cloud">Заявку прийнято</h3>
                  <p className="max-w-sm text-sm leading-relaxed text-mist">
                    {site.responseTime}. Якщо зручніше — телефонуйте самі:{' '}
                    <a href={site.phone.href} className="text-ember-300 hover:underline">
                      {site.phone.display}
                    </a>
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="mt-1 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/12 px-5 text-sm text-frost transition-colors hover:border-white/30"
                  >
                    Закрити
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-mist">{cfg.form.sub}</p>

                  <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                    {cfg.form.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-1.5 text-xs text-ash">
                        <Check aria-hidden className="size-3.5 shrink-0 text-ember-400" />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <form onSubmit={onSubmit} className="mt-5 grid gap-3.5" noValidate>
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden
                      className="absolute left-[-9999px] h-0 w-0 opacity-0"
                    />

                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="lm-name" className={labelClass}>
                          Ім’я <span className="text-ember-400">*</span>
                        </label>
                        <input
                          id="lm-name"
                          name="name"
                          required
                          autoComplete="name"
                          placeholder="Олександр"
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="lm-phone" className={labelClass}>
                          Телефон <span className="text-ember-400">*</span>
                        </label>
                        <input
                          id="lm-phone"
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          required
                          autoComplete="tel"
                          placeholder="+38 (0__) ___-__-__"
                          className={fieldClass}
                        />
                      </div>
                    </div>

                    {cfg.form.fields.map((f) => (
                      <div key={f.name}>
                        <label htmlFor={`lm-${f.name}`} className={labelClass}>
                          {f.label}
                        </label>
                        {f.type === 'select' ? (
                          <select id={`lm-${f.name}`} name={f.name} className={fieldClass}>
                            <option value="">Не обрано</option>
                            {(f.options ?? []).map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id={`lm-${f.name}`}
                            name={f.name}
                            placeholder={f.placeholder}
                            className={fieldClass}
                          />
                        )}
                      </div>
                    ))}

                    <div>
                      <label htmlFor="lm-message" className={labelClass}>
                        Коментар
                      </label>
                      <textarea
                        id="lm-message"
                        name="message"
                        rows={note ? 5 : 2}
                        value={note}
                        onChange={(ev) => setNote(ev.target.value)}
                        placeholder="Що саме має працювати під час відключення?"
                        className={fieldClass}
                      />
                    </div>

                    {status === 'error' && (
                      <p role="alert" className="text-sm text-alarm-300">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-ember-300 to-ember-500 px-7 font-semibold text-abyss transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {status === 'submitting' ? (
                        <>
                          <Loader2 aria-hidden className="size-4 animate-spin" /> Надсилаємо…
                        </>
                      ) : (
                        <>
                          {cfg.form.cta} <ArrowRight aria-hidden className="size-4" />
                        </>
                      )}
                    </button>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <a
                        href={site.phone.href}
                        className="inline-flex min-h-11 items-center gap-2 text-sm text-frost transition-colors hover:text-ember-300"
                      >
                        <Phone aria-hidden className="size-4 text-ember-400" />
                        <span className="tnum">{site.phone.display}</span>
                      </a>
                      <p className="text-[0.7rem] leading-snug text-dim">
                        Номер — лише для дзвінка по цій заявці.
                      </p>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Client trigger usable from server components. */
export function LeadButton({
  label,
  payload,
  sourceId = 'cta',
  variant = 'solid',
  className,
}: {
  label: string;
  payload?: LeadModalPayload;
  sourceId?: string;
  variant?: 'solid' | 'ghost';
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        openLeadModal({ ...payload, source: payload?.source ?? { id: sourceId, button: label } })
      }
      className={
        variant === 'solid'
          ? `inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-ember-300 to-ember-500 px-7 font-semibold text-abyss shadow-[0_8px_28px_-8px_rgba(246,133,14,0.65)] transition-opacity hover:opacity-95 ${className ?? ''}`
          : `inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-ember-400/40 px-6 font-semibold text-frost transition-colors hover:border-ember-300 hover:bg-ember-400/10 ${className ?? ''}`
      }
    >
      {label}
      <ArrowRight aria-hidden className="size-4" />
    </button>
  );
}
