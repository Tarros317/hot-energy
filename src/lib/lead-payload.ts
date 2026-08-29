/**
 * Single source of truth for WHAT a lead contains and HOW it is labelled.
 *
 * Both delivery paths build their message from here — the server route
 * (api/zayavka, which renders the HTML mail) and the browser fallback
 * (lead-direct, which hands flat key/value pairs to the relay). Keeping the
 * wording and field order in one place is the point.
 */

export type LeadSource = {
  /** Stable id of the trigger that opened the form, e.g. 'hero'. */
  id: string;
  /** Visible label of the button the visitor clicked. */
  button: string;
};

export type LeadInput = {
  name: string;
  phone: string;
  /** Which form sent this, e.g. 'Калькулятор — підбір комплекту'. */
  context: string;
  page: string;
  pageTitle?: string;
  source?: LeadSource;
  message?: string;
  /** Extra answers keyed by their visible Ukrainian label. */
  fields?: Record<string, string>;
};

export type LeadRow = {
  label: string;
  value: string;
  href?: string;
  emphasis?: boolean;
};

export type LeadSection = { title: string; rows: LeadRow[] };

export type LeadMeta = {
  /** Localised submission timestamp, e.g. '25.08.2026, 14:05'. */
  sentAt: string;
  /** Absolute site origin, used to turn `page` into a clickable URL. */
  siteUrl: string;
};

/** '+38 067 000 00 00' → a dialable tel: target. */
export function phoneHref(phone: string): string | undefined {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.length >= 7 ? `tel:${digits}` : undefined;
}

export function pageUrl(page: string, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '');
  return `${base}${page.startsWith('/') ? page : `/${page}`}`;
}

export function pageLabel(l: LeadInput): string {
  if (l.page === '/') return 'Головна';
  if (l.pageTitle) {
    const clean = l.pageTitle.split('|')[0].split(' — ')[0].trim();
    if (clean) return clean;
  }
  return l.page;
}

export function leadSubject(l: LeadInput): string {
  const where = l.source?.button ? `${l.context} · ${l.source.button}` : l.context;
  return `Заявка: ${l.name} — ${where}`;
}

/**
 * The lead as ordered sections. Order is deliberate: what the office needs to
 * ACT on (who, how to reach them) first, what they need to QUOTE second, and
 * the technical origin trail last.
 */
export function buildLeadSections(l: LeadInput, meta: LeadMeta): LeadSection[] {
  const contact: LeadRow[] = [
    { label: 'Ім’я', value: l.name, emphasis: true },
    { label: 'Телефон', value: l.phone, href: phoneHref(l.phone), emphasis: true },
  ];

  const request: LeadRow[] = [
    ...Object.entries(l.fields ?? {}).map(([label, value]) => ({ label, value })),
    { label: 'Коментар', value: l.message ?? '' },
  ];

  const origin: LeadRow[] = [
    { label: 'Форма', value: l.context },
    { label: 'Кнопка', value: l.source?.button ?? '' },
    { label: 'Сторінка', value: pageLabel(l), href: pageUrl(l.page, meta.siteUrl) },
    { label: 'Надійшла', value: meta.sentAt },
    { label: 'ID тригера', value: l.source?.id ?? '' },
  ];

  return [
    { title: 'Контакт', rows: contact },
    { title: 'Запит', rows: request },
    { title: 'Звідки заявка', rows: origin },
  ]
    .map((s) => ({ ...s, rows: s.rows.filter((r) => r.value) }))
    .filter((s) => s.rows.length > 0);
}

/**
 * Flat label→value map for the keyless relay, which renders its OWN table and
 * accepts no custom HTML. Origin first, because "which form / which button" is
 * what the plain table would otherwise bury at the bottom.
 */
export function toRelayFields(l: LeadInput, meta: LeadMeta): Record<string, string> {
  const out: Record<string, string> = {};
  const put = (k: string, v?: string) => {
    if (v) out[k] = v;
  };

  put('Заявка через', l.context);
  put('Кнопка', l.source?.button);
  put('Сторінка', `${pageLabel(l)} — ${pageUrl(l.page, meta.siteUrl)}`);
  put('Ім’я', l.name);
  put('Телефон', l.phone);
  for (const [k, v] of Object.entries(l.fields ?? {})) put(k, v);
  put('Коментар', l.message);
  put('Надійшла', meta.sentAt);
  put('ID тригера', l.source?.id);

  return out;
}
