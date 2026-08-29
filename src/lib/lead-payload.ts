/**
 * Single source of truth for WHAT a lead contains and HOW it is labelled.
 *
 * The server route (api/zayavka) renders its Telegram message from here, so
 * the wording and the field order live in one place rather than being
 * restated by whatever channel happens to carry the lead.
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

/* ── Telegram rendering ──────────────────────────────────────────────────
   Telegram accepts a small HTML subset and is strict about it: an unescaped
   `<` or a tag it does not know makes it reject the whole message, and the
   lead is gone. Everything below exists to make that impossible. */

/** Telegram requires &, < and > escaped everywhere, attribute values included. */
export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderValue(row: LeadRow, cap: number): string {
  const raw = row.value.length > cap ? `${row.value.slice(0, cap)}…` : row.value;
  const value = escapeHtml(raw);

  // Telegram allows only http, https and tg: links — a tel: href is rejected
  // outright. <code> is the better answer anyway: it is tap-to-copy, which is
  // what someone reading the lead on a phone actually wants from a number.
  if (row.href?.startsWith('tel:')) return `<code>${value}</code>`;
  if (row.href?.startsWith('http')) return `<a href="${escapeHtml(row.href)}">${value}</a>`;
  return row.emphasis ? `<b>${value}</b>` : value;
}

function render(l: LeadInput, meta: LeadMeta, cap: number): string {
  const lines = [`⚡️ <b>${escapeHtml(leadSubject(l))}</b>`];
  for (const section of buildLeadSections(l, meta)) {
    lines.push('', `<b>${escapeHtml(section.title)}</b>`);
    for (const row of section.rows) {
      lines.push(`${escapeHtml(row.label)}: ${renderValue(row, cap)}`);
    }
  }
  return lines.join('\n');
}

/**
 * The lead as one Telegram message.
 *
 * Telegram caps a message at 4096 characters. Trimming the finished HTML would
 * cut a tag in half and get the message rejected, so the cap is applied to each
 * VALUE before any tags go on, and tightened until the whole thing fits. The
 * result is always valid markup, whatever someone types into the comment box.
 */
export function toTelegramMessage(l: LeadInput, meta: LeadMeta): string {
  for (const cap of [700, 300, 120]) {
    const text = render(l, meta, cap);
    if (text.length <= 4000) return text;
  }
  return render(l, meta, 60);
}
