import type { Metadata, Viewport } from 'next';
import { Manrope, Unbounded, JetBrains_Mono } from 'next/font/google';
import { site } from '@/lib/site';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SmoothScroll } from '@/components/layout/SmoothScroll';
import { LeadModalHost } from '@/components/lead/LeadModal';
import { JsonLd } from '@/components/seo/JsonLd';
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import './globals.css';

/* Cyrillic is not optional here — every subset below is loaded with it. */

const manrope = Manrope({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

// Display face, used only for the logotype, the hero keyword and big numerals.
const unbounded = Unbounded({
  subsets: ['cyrillic', 'latin'],
  weight: ['500', '600', '700'],
  variable: '--font-unbounded',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const fontVars = [manrope.variable, unbounded.variable, jetbrains.variable].join(' ');

// ≤160 chars so Google doesn't truncate the snippet.
const metaDescription =
  'Комплект безперебійного живлення 4 кВт·год: інвертор 1500 Вт з MPPT і LiFePO4 314 А·год. 45 000 ₴. Порахуйте автономність на своїх приладах.';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — комплект безперебійного живлення 4 кВт·год для дому`,
    template: `%s | ${site.name}`,
  },
  description: metaDescription,
  applicationName: site.name,
  keywords: [
    'комплект безперебійного живлення',
    'ДБЖ для дому',
    'LiFePO4 акумулятор',
    'інвертор чиста синусоїда',
    'резервне живлення квартири',
    'живлення газового котла',
  ],
  alternates: { canonical: site.url },
  openGraph: {
    type: 'website',
    siteName: site.name,
    locale: 'uk_UA',
    title: `${site.name} — комплект безперебійного живлення 4 кВт·год`,
    description: metaDescription,
    url: site.url,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — комплект безперебійного живлення 4 кВт·год`,
    description: metaDescription,
  },
  formatDetection: { telephone: false },
};

/**
 * viewport-fit=cover lets the dark canvas run under the notch and home
 * indicator; safe-area insets are then honoured per element (header, mobile
 * action bar, dialog).
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#06080b',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={fontVars}>
      <body className="grain min-h-dvh bg-abyss text-frost antialiased">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <SmoothScroll />
        <a
          href="#kalkulyator"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-120 focus:rounded-xl focus:bg-ember-400 focus:px-4 focus:py-2 focus:font-semibold focus:text-abyss"
        >
          Перейти до калькулятора
        </a>
        <Header />
        <main id="top">{children}</main>
        <Footer />
        <LeadModalHost />
      </body>
    </html>
  );
}
