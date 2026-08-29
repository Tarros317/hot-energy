import type { Metadata } from 'next';
import { site, absoluteUrl } from '@/lib/site';
import { battery, inverter, kit } from '@/lib/kit';

/**
 * Central SEO helpers. Every page builds its <head> and JSON-LD through these
 * so title patterns, canonicals and schema stay consistent as the landing
 * grows into a full site.
 */

export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
}): Metadata {
  const url = absoluteUrl(opts.path);
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: site.name,
      locale: 'uk_UA',
      title: opts.ogTitle ?? opts.title,
      description: opts.description,
      url,
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.ogTitle ?? opts.title,
      description: opts.description,
    },
  };
}

export function organizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site.url}/#organization`,
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    email: site.email,
    telephone: site.phone.display,
    logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.svg') },
    areaServed: { '@type': 'Country', name: 'Україна' },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      telephone: site.phone.display,
      email: site.email,
      areaServed: 'UA',
      availableLanguage: ['uk', 'ru'],
    },
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    name: site.name,
    url: site.url,
    inLanguage: 'uk-UA',
    publisher: { '@id': `${site.url}/#organization` },
  };
}

/** The kit itself — the entity this landing page is about. */
export function productJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${site.url}/#product`,
    name: 'Комплект безперебійного живлення Hot Energy 4 кВт·год',
    description: site.description,
    image: [absoluteUrl('/images/inverter-angle.png'), absoluteUrl('/images/battery.png')],
    brand: { '@type': 'Brand', name: site.name },
    category: 'Джерела безперебійного живлення',
    isRelatedTo: [
      { '@type': 'Product', name: `${inverter.brand} ${inverter.model}` },
      { '@type': 'Product', name: `${battery.brand} ${battery.model}` },
    ],
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Ємність', value: '4,02 кВт·год' },
      { '@type': 'PropertyValue', name: 'Номінальна потужність', value: `${inverter.powerW} Вт` },
      { '@type': 'PropertyValue', name: 'Пікова потужність', value: `${inverter.peakVA} ВА` },
      { '@type': 'PropertyValue', name: 'Тип акумулятора', value: battery.chemistry },
      { '@type': 'PropertyValue', name: 'Ресурс', value: `${battery.cycles} циклів` },
    ],
    offers: {
      '@type': 'Offer',
      price: kit.priceUah,
      priceCurrency: 'UAH',
      availability: 'https://schema.org/InStock',
      url: site.url,
      seller: { '@id': `${site.url}/#organization` },
    },
  };
}

export function faqJsonLd(items: readonly { q: string; a: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

export type Crumb = { label: string; href: string };

export function breadcrumbJsonLd(crumbs: Crumb[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: absoluteUrl(c.href),
    })),
  };
}
