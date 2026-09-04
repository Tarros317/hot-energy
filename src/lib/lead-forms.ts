/**
 * Per-trigger lead-form configs. Every CTA on the page opens the SAME dialog
 * component with its OWN headline, promise bullets and extra field — a visitor
 * who clicks «Розрахувати мій комплект» inside the calculator should not land
 * in a generic "leave your number" box.
 *
 * Core fields are always the same three the brief asks for: name, phone,
 * comment. Anything else is optional and lives in `fields`.
 */

export type LeadField = {
  name: string;
  label: string;
  type: 'text' | 'select';
  options?: string[];
  placeholder?: string;
};

export type LeadFormConfig = {
  headline: string;
  sub: string;
  bullets: string[];
  cta: string;
  fields: LeadField[];
};

export type LeadContextConfig = {
  /** Shown as the dialog's kicker and reported in the notification e-mail. */
  context: string;
  form: LeadFormConfig;
};

const OBJECT_FIELD: LeadField = {
  name: 'object',
  label: 'Що живимо',
  type: 'select',
  options: ['Квартира', 'Приватний будинок', 'Офіс або магазин', 'Дача', 'Ще не визначився'],
};

/** Global fallback — the header CTA and any trigger without its own config. */
export const GLOBAL_LEAD: LeadContextConfig = {
  context: 'Замовити комплект',
  form: {
    headline: 'Залиште номер — передзвонимо за 15 хвилин',
    sub: 'Підкажемо, чи вистачить базового комплекту саме вам, і скільки він відпрацює на ваших приладах.',
    bullets: ['Дзвінок за 15 хвилин', 'Консультація безкоштовна', 'Доставка по Україні'],
    cta: 'Замовити дзвінок',
    fields: [OBJECT_FIELD],
  },
};

export const LEAD_FORMS = {
  hero: {
    context: 'Головна — комплект 4 кВт·год',
    form: {
      headline: 'Комплект 4 кВт·год за 45 000 ₴',
      sub: 'Залиште номер — уточнимо адресу доставки та відповімо на питання про підключення.',
      bullets: ['Дзвінок за 15 хвилин', 'Гарантія 12 місяців на акумулятор', 'Доставка по Україні'],
      cta: 'Замовити комплект',
      fields: [OBJECT_FIELD],
    },
  },

  calculator: {
    context: 'Калькулятор — розрахунок автономності',
    form: {
      headline: 'Перевіримо ваш розрахунок',
      sub: 'Надішліть список приладів із калькулятора — інженер перевірить цифри й скаже, скільки акумуляторів потрібно саме вам.',
      bullets: ['Перевірка розрахунку', 'Підбір кількості батарей', 'Без нав’язування'],
      cta: 'Надіслати розрахунок',
      fields: [OBJECT_FIELD],
    },
  },

  custom: {
    context: 'Індивідуальний підбір комплекту',
    form: {
      headline: 'Зберемо комплект під ваші задачі',
      sub: 'Опишіть, що має працювати під час відключення — запропонуємо конфігурацію за потужністю та ємністю, а не «що є на складі».',
      bullets: ['Розрахунок під об’єкт', 'Від 1 до 4 акумуляторів', 'Можна дозбирати пізніше'],
      cta: 'Отримати конфігурацію',
      fields: [
        OBJECT_FIELD,
        {
          name: 'priority',
          label: 'Що найважливіше',
          type: 'select',
          options: [
            'Довше тримати світло та інтернет',
            'Живити котел і опалення',
            'Потужні прилади (насос, бойлер, інструмент)',
            'Робоче місце та техніка',
            'Максимальна автономність',
          ],
        },
      ],
    },
  },

  inverter: {
    context: 'Інвертор Sinus PRO Ultra 3000',
    form: {
      headline: 'Питання по інвертору?',
      sub: 'Розкажемо про режими роботи, підключення сонячних панелей і те, як інвертор поводиться з вашим котлом.',
      bullets: ['Відповідь інженера', 'Схема підключення', 'Налаштування під об’єкт'],
      cta: 'Поставити питання',
      fields: [],
    },
  },

  battery: {
    context: 'Акумулятор Humsienk 314 А·год',
    form: {
      headline: 'Скільки акумуляторів вам потрібно?',
      sub: 'Один модуль — це 4 кВт·год. Порахуємо, скільки треба саме вам, і чи є сенс брати одразу два.',
      bullets: ['Гарантія 12 місяців', 'До 4 модулів у паралель', 'Можна дозбирати пізніше'],
      cta: 'Порахувати ємність',
      fields: [OBJECT_FIELD],
    },
  },

  final: {
    context: 'Фінальний блок — замовлення',
    form: {
      headline: 'Наступне відключення зустрінете зі світлом',
      sub: 'Залиште номер — узгодимо комплектацію, доставку та встановлення.',
      bullets: ['Дзвінок за 15 хвилин', 'Доставка 1–3 дні', 'Допомога з підключенням'],
      cta: 'Замовити комплект',
      fields: [OBJECT_FIELD],
    },
  },
} as const satisfies Record<string, LeadContextConfig>;
