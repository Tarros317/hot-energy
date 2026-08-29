/**
 * Site-wide constants — single source of truth for brand, contacts and nav.
 *
 * [ЗАПОВНИТИ] marks values the client must confirm before launch: phone,
 * address and legal entity are placeholders today.
 */
export const site = {
  name: 'Hot Energy',
  legalName: 'Hot Energy', // [ЗАПОВНИТИ] ФОП / ТОВ
  tagline: 'Комплекти безперебійного живлення для дому та квартири',
  description:
    'Домашній комплект безперебійного живлення на 4 кВт·год: інвертор чистої синусоїди VOLT Sinus PRO Ultra 3000 з MPPT 100 А та LiFePO4-акумулятор Humsienk 12 В 314 А·год. Світло, інтернет, котел і холодильник працюють, поки в будинку темно.',
  domain: 'hot-energy.com.ua',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hot-energy.com.ua',

  email: 'info@hot-energy.com.ua', // [ЗАПОВНИТИ]

  phone: {
    display: '+38 (067) 000-00-00', // [ЗАПОВНИТИ]
    href: 'tel:+380670000000',
    viber: 'viber://chat?number=%2B380670000000',
    telegram: 'https://t.me/hotenergy',
  },

  address: {
    city: 'Київ', // [ЗАПОВНИТИ]
    region: 'Київська область',
    country: 'UA',
  },

  /** True by policy — repeated in copy, JSON-LD and the lead forms. */
  serviceArea: 'Доставка по всій Україні',
  responseTime: 'Передзвонюємо протягом 15 хвилин у робочі години',
  workingHours: 'Пн–Нд, 09:00–20:00',

  social: [] as { label: string; href: string }[],
} as const;

/** In-page anchors — one entry per landing section, used by header + footer. */
export const nav = [
  { label: 'Комплект', href: '#komplekt' },
  { label: 'Калькулятор', href: '#kalkulyator' },
  { label: 'Інвертор', href: '#invertor' },
  { label: 'Акумулятор', href: '#akumulyator' },
  { label: 'Як це працює', href: '#yak-pratsyuye' },
  { label: 'Питання', href: '#pytannya' },
] as const;

export function absoluteUrl(path: string): string {
  const base = site.url.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** 45 000 → «45 000» (non-breaking thin spaces, so prices never wrap). */
export function uah(value: number): string {
  return value.toLocaleString('uk-UA').replace(/ /g, ' ');
}
