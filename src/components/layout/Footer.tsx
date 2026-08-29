import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { nav, site } from '@/lib/site';
import { battery, inverter } from '@/lib/kit';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/8 bg-ink-950 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] pt-16 sm:pb-14 sm:pt-20">
      <div aria-hidden className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
      <Container className="relative">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo markClassName="h-10 w-10" wordClassName="text-lg" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ash">
              Комплекти безперебійного живлення на LiFePO₄ для квартир і приватних будинків.
              Підбираємо під ваші прилади, а не під залишки на складі.
            </p>
            <ul className="mt-6 space-y-2 text-xs text-dim">
              <li>{inverter.brand} · {inverter.model}</li>
              <li>{battery.brand} · {battery.model}</li>
            </ul>
          </div>

          <nav aria-label="Розділи">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ember-500">
              Сторінка
            </h2>
            <ul className="mt-4 space-y-2.5">
              {nav.map(({ label, href }) => (
                <li key={href}>
                  <a href={href} className="inline-flex min-h-11 items-center text-sm text-mist transition-colors hover:text-frost">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ember-500">
              Комплект
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-mist">
              <li>4,02 кВт·год ємності</li>
              <li>{inverter.powerW} Вт · {inverter.peakVA} ВА пік</li>
              <li>MPPT {inverter.mppt.currentA} А у комплекті</li>
              <li>{battery.warrantyYears} років гарантії на АКБ</li>
              <li>{site.serviceArea}</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ember-500">
              Контакти
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={site.phone.href}
                  className="flex min-h-11 items-center gap-2.5 text-frost transition-colors hover:text-ember-300"
                >
                  <Phone aria-hidden className="size-4 shrink-0 text-ember-400" />
                  <span className="tnum">{site.phone.display}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="flex min-h-11 items-center gap-2.5 text-mist transition-colors hover:text-frost"
                >
                  <Mail aria-hidden className="size-4 shrink-0 text-ember-400" />
                  {site.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-mist">
                <Clock aria-hidden className="size-4 shrink-0 text-ember-400" />
                {site.workingHours}
              </li>
              <li className="flex items-center gap-2.5 text-mist">
                <MapPin aria-hidden className="size-4 shrink-0 text-ember-400" />
                {site.address.city} · {site.serviceArea}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/8 pt-6 text-xs text-dim sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {site.name}. Усі права захищено.</p>
          <p className="max-w-xl sm:text-right">
            Розрахунки калькулятора — оцінні: реальна автономність залежить від набору приладів,
            температури та стану мережі.
          </p>
        </div>
      </Container>
    </footer>
  );
}
