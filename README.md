# Hot Energy

Лендінг комплекту безперебійного живлення для дому: інвертор **VOLT Sinus PRO Ultra 3000
12/230 В** (1 500 Вт / 3 000 ВА, вбудований MPPT 100 А) + LiFePO4-акумулятор
**Humsienk 12 В 314 А·год** (4 019 Вт·год). Ціна комплекту — 45 000 ₴.

Next.js 16 (App Router) · React 19 · Tailwind 4 · Motion · Lenis · TypeScript.

## Запуск

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
npm run images   # перезавантажити фото з Unsplash у public/images/u
```

## Структура

```
src/
  app/                     layout, page, api/zayavka, robots, sitemap, manifest, icon
  components/
    home/                  секції лендінгу (одна секція — один файл)
    layout/                Header, Footer, SmoothScroll
    lead/LeadModal.tsx     єдиний діалог заявки для всіх CTA
    seo/JsonLd.tsx
    ui/                    Container, Reveal, Counter, ParallaxPhoto, Logo, ApplianceIcon
  lib/
    site.ts                бренд, контакти, навігація
    kit.ts                 ВСІ характеристики товару — єдине джерело правди
    appliances.ts          модель споживання приладів для калькулятора
    calc.ts                математика автономності
    faq.ts                 питання + відповіді (годують і акордеон, і JSON-LD)
    lead-*.ts              payload, доставка, конфіги форм
    media.ts, seo.ts, utils.ts
scripts/
  download-images.mjs      дзеркалить фото Unsplash у public/images/u
  cutout.mjs               вирізає білий фон зі студійних фото товару
```

Архітектура повторює `www.imperialbasselin.com`, щоб лендінг далі розгортався
в повноцінний сайт: додати сторінку — це новий каталог у `src/app/`, який
використовує ті самі `pageMetadata()`, `Reveal`, `Container` і `LeadModalHost`.

## Що треба заповнити перед запуском

Позначено в коді як `[ЗАПОВНИТИ]`:

| Файл | Поле | Що це |
| --- | --- | --- |
| `src/lib/site.ts` | `phone`, `email`, `address`, `legalName` | реальні контакти й юрособа |
| `src/lib/kit.ts` | `extraBatteryUah` | ціна додаткового акумулятора (зараз 26 000 ₴ — орієнтир) |
| `.env` | `NEXT_PUBLIC_SITE_URL` | канонічний домен без слеша в кінці |
| `.env` | `CONTACT_TO` | пошта, куди падають заявки |

## Заявки

Усі форми (діалог + інлайн-форма в блоці «Індивідуальний підбір») ідуть через
один pipeline у `src/lib/use-lead-submit.ts`:

1. `POST /api/zayavka` — валідація, honeypot, throttle 5 запитів/хв на IP,
   далі доставка через keyless-релей.
2. Якщо роут відповів помилкою — браузер відвідувача сам постить у релей
   (`src/lib/lead-direct.ts`). Заблокований serverless-IP не коштує ліда.

Формат листа задано в `src/lib/lead-payload.ts` — обидва шляхи будують його
звідти, тому лід виглядає однаково незалежно від маршруту. Коли з’явиться SMTP,
достатньо замінити доставку в `api/zayavka/route.ts`.

## Калькулятор

`src/lib/appliances.ts` описує не тільки потужність, а й **режим** споживання:

- `always` — працює весь час відключення (`watts × duty`; компресор холодильника
  вмикається ≈ 35 % часу);
- `session` — активне користування частину часу (`watts × share`);
- `burst` — короткі вмикання (`usesPerDay × minutesPerUse`, рознесені на 16 годин
  активного дня). Саме тому чайник не «з’їдає» батарею за годину.

`src/lib/calc.ts` рахує два незалежні питання:

- **енергія** — середнє навантаження проти корисної ємності (DoD 90 %, ККД
  інвертора 92 %, власне споживання 30 Вт);
- **потужність** — чи витягне інвертор одночасне вмикання (1 500 Вт номінал) і
  пусковий струм двигунів (3 000 ВА пік).

Прилад може пройти перший тест і провалити другий — тоді калькулятор говорить
про це прямо, замість того щоб показати зручну кількість годин.

## Медіа

- Фото товару — студійні знімки виробників з вирізаним білим фоном
  (`scripts/cutout.mjs`, flood-fill від краю кадру).
- Фонові фото — Unsplash, дзеркаляться локально в `public/images/u`, щоб
  `next/image` оптимізував їх з диска, а не через CDN на першому запиті.
  Після додавання нового `U()` у `media.ts` додайте id у
  `scripts/download-images.mjs` і виконайте `npm run images`.
