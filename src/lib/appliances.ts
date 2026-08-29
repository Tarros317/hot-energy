/**
 * Appliance load model for the autonomy calculator.
 *
 * Every appliance carries how many hours a day it ACTUALLY DRAWS POWER, and
 * the visitor can change that number per appliance. A fridge is plugged in for
 * 24 hours but its compressor runs about eight of them, so eight is the honest
 * default — not 24, and not the nameplate.
 *
 * Average draw = watts × hoursPerDay ÷ 24. That assumes usage is spread evenly
 * across the day, which is the standard assumption and is why the panel also
 * reports what happens when EVERYTHING is on at once: those two numbers
 * bracket the truth, and an evening blackout sits nearer the second.
 *
 * `mode` survives for a different job — the simultaneity check. Only one
 * short-cycle appliance realistically runs at a time (nobody microwaves lunch
 * while vacuuming), so `burst` items collapse to their largest single draw when
 * the inverter's 1 500 W limit is tested.
 *
 * `watts` is the AVERAGE draw while running; `peakW` (when it differs) is the
 * nameplate draw used for the inverter head-room check. `startup` is the inrush
 * multiplier of motors and compressors.
 *
 * SCOPE: nothing here draws 1 500 W or more. Appliances the kit physically
 * cannot run — kettle, iron, hairdryer, water heater, washing machine,
 * dishwasher — are deliberately not offered, so the calculator only ever
 * configures loads this inverter can actually carry. The FAQ still answers the
 * kettle question directly, which is where that disclosure belongs.
 *
 * Figures are typical values for CURRENT mid-market appliances in Ukrainian
 * households, cross-checked against consumption tables (termocom.com.ua,
 * journal.vencon.ua). They are deliberately not nameplate maximums: a fridge
 * labelled 150 W runs its compressor at 80–120 W, and a vacuum sold today
 * cannot exceed 900 W under EU ecodesign rules at all.
 */

export type ApplianceGroupId = 'essentials' | 'work' | 'kitchen' | 'home';

/**
 * How the usage time is expressed and whether the visitor can change it.
 *
 * `fixed` is for appliances where the answer is physics, not preference. A
 * fridge is plugged in 24/7 and its compressor runs about a third of that —
 * asking someone to slide "hours per day" invites the wrong answer (24), which
 * would triple its real consumption. A router genuinely does draw its 12 W
 * around the clock. Neither gets a slider; both state their average instead.
 */
export type UsageUnit = 'fixed' | 'h' | 'min';

export type Appliance = {
  id: string;
  name: string;
  /** Short, human explanation of the usage assumption. Shown on selection. */
  note: string;
  group: ApplianceGroupId;
  watts: number;
  peakW?: number;
  startup?: number;
  /** Only one `burst` appliance is assumed to run at a time. */
  mode: 'always' | 'session' | 'burst';
  /** Default hours per day the appliance actually consumes power. */
  hoursPerDay: number;
  unit: UsageUnit;
};

/** Slider bounds, for the two adjustable kinds. */
export const USAGE_RANGE: Record<'h' | 'min', { min: number; max: number; step: number }> = {
  h: { min: 1, max: 24, step: 1 },
  min: { min: 5, max: 240, step: 5 },
};

export const groups: { id: ApplianceGroupId; label: string; hint: string }[] = [
  { id: 'essentials', label: 'Життєзабезпечення', hint: 'Працює весь час, поки немає світла' },
  { id: 'work', label: 'Робота і зв’язок', hint: 'Вмикаєте, коли треба' },
  { id: 'kitchen', label: 'Кухня', hint: 'Короткі вмикання по кілька хвилин' },
  { id: 'home', label: 'Побут і клімат', hint: 'Найпотужніше в домі' },
];

export const appliances: Appliance[] = [
  // ── Життєзабезпечення ──────────────────────────────────────────────────
  {
    id: 'fridge',
    name: 'Холодильник',
    note: 'Увімкнений цілодобово, але компресор працює приблизно третину часу',
    group: 'essentials',
    mode: 'always',
    watts: 120,
    startup: 3,
    // 0.35 duty × 24 h — the compressor time, not the plug-in time.
    hoursPerDay: 8.4,
    unit: 'fixed',
  },
  {
    id: 'freezer',
    name: 'Морозильна камера',
    note: 'Теж циклами, трохи економніша за холодильник',
    group: 'essentials',
    mode: 'always',
    watts: 100,
    startup: 3,
    hoursPerDay: 8.4,
    unit: 'fixed',
  },
  {
    id: 'light',
    name: 'Освітлення LED',
    note: 'Світло у 3–4 кімнатах; узимку вечори довші',
    group: 'essentials',
    mode: 'always',
    watts: 40,
    hoursPerDay: 8,
    unit: 'h',
  },
  {
    id: 'router',
    name: 'Роутер та інтернет',
    note: 'Роутер, ONU, IP-телефонія — цілодобово',
    group: 'essentials',
    mode: 'always',
    watts: 12,
    hoursPerDay: 24,
    unit: 'fixed',
  },
  {
    id: 'boiler',
    name: 'Газовий котел',
    note: 'Автоматика й насос котла вмикаються приблизно половину доби',
    group: 'essentials',
    mode: 'always',
    watts: 90,
    startup: 2.5,
    hoursPerDay: 12,
    unit: 'h',
  },
  {
    id: 'pumpCirc',
    name: 'Циркуляційний насос',
    note: 'Окремий насос контуру опалення',
    group: 'essentials',
    mode: 'always',
    watts: 45,
    startup: 2.5,
    hoursPerDay: 16,
    unit: 'h',
  },
  {
    id: 'wellPump',
    name: 'Насосна станція',
    note: 'Свердловина: близько 10 запусків на добу по 3 хвилини',
    group: 'essentials',
    mode: 'burst',
    watts: 650,
    startup: 3,
    hoursPerDay: 0.5,
    unit: 'min',
  },
  {
    id: 'security',
    name: 'Сигналізація та відеонагляд',
    note: 'Камери, реєстратор, датчики — цілодобово',
    group: 'essentials',
    mode: 'always',
    watts: 25,
    hoursPerDay: 24,
    unit: 'fixed',
  },
  {
    id: 'charging',
    name: 'Зарядка гаджетів',
    note: 'Телефони, повербанки, ліхтарі',
    group: 'essentials',
    mode: 'always',
    watts: 20,
    hoursPerDay: 8,
    unit: 'h',
  },

  // ── Робота і зв’язок ───────────────────────────────────────────────────
  {
    id: 'tv',
    name: 'Телевізор',
    note: 'Скільки годин на добу він реально ввімкнений',
    group: 'work',
    mode: 'session',
    watts: 90,
    hoursPerDay: 5,
    unit: 'h',
  },
  {
    id: 'laptop',
    name: 'Ноутбук',
    note: 'Робочий день або вечір за ноутбуком',
    group: 'work',
    mode: 'session',
    watts: 50,
    hoursPerDay: 6,
    unit: 'h',
  },
  {
    id: 'pc',
    name: 'ПК і монітор',
    note: 'Системний блок з монітором',
    group: 'work',
    mode: 'session',
    watts: 240,
    hoursPerDay: 6,
    unit: 'h',
  },
  {
    id: 'console',
    name: 'Ігрова консоль',
    note: 'PlayStation або Xbox',
    group: 'work',
    mode: 'session',
    watts: 150,
    hoursPerDay: 3,
    unit: 'h',
  },
  {
    id: 'starlink',
    name: 'Starlink',
    note: 'Термінал зі споживанням близько 50 Вт цілодобово',
    group: 'work',
    mode: 'always',
    watts: 50,
    hoursPerDay: 24,
    unit: 'fixed',
  },

  // ── Кухня ──────────────────────────────────────────────────────────────
  {
    id: 'microwave',
    name: 'Мікрохвильова піч',
    note: 'Споживання з розетки, а не «вихідна» потужність із шильдика',
    group: 'kitchen',
    mode: 'burst',
    watts: 1200,
    hoursPerDay: 10 / 60,
    unit: 'min',
  },
  {
    id: 'coffee',
    name: 'Кавомашина',
    note: 'Кілька порцій на день по дві хвилини',
    group: 'kitchen',
    mode: 'burst',
    watts: 1100,
    hoursPerDay: 6 / 60,
    unit: 'min',
  },
  {
    id: 'multicooker',
    name: 'Мультиварка',
    note: 'Одна програма на 40 хвилин',
    group: 'kitchen',
    mode: 'burst',
    watts: 800,
    hoursPerDay: 40 / 60,
    unit: 'min',
  },
  {
    id: 'toaster',
    name: 'Тостер',
    note: 'Раз на день, кілька хвилин',
    group: 'kitchen',
    mode: 'burst',
    watts: 850,
    hoursPerDay: 5 / 60,
    unit: 'min',
  },

  // ── Побут і клімат ─────────────────────────────────────────────────────
  {
    id: 'vacuum',
    name: 'Пилосос',
    note: 'Сучасні моделі не перевищують 900 Вт за нормами ЄС',
    group: 'home',
    mode: 'burst',
    watts: 900,
    startup: 2,
    hoursPerDay: 8 / 60,
    unit: 'min',
  },
  {
    id: 'ac',
    name: 'Кондиціонер',
    note: 'Інверторна спліт-система на повній потужності',
    group: 'home',
    mode: 'session',
    watts: 750,
    startup: 2,
    hoursPerDay: 8,
    unit: 'h',
  },
  {
    id: 'heater',
    name: 'Обігрівач 1 кВт',
    note: 'Найненажерливіший сценарій у переліку',
    group: 'home',
    mode: 'session',
    watts: 1000,
    hoursPerDay: 6,
    unit: 'h',
  },
  {
    id: 'fan',
    name: 'Вентилятор',
    note: 'Побутовий вентилятор',
    group: 'home',
    mode: 'session',
    watts: 40,
    startup: 2,
    hoursPerDay: 8,
    unit: 'h',
  },
];

export const applianceById = new Map(appliances.map((a) => [a.id, a]));

/** One-tap starting points — most visitors never build a list from zero. */
export const presets: { id: string; label: string; caption: string; items: string[] }[] = [
  {
    id: 'minimum',
    label: 'Мінімум',
    caption: 'Світло, зв’язок, холодильник',
    items: ['light', 'router', 'fridge'],
  },
  {
    id: 'apartment',
    label: 'Квартира',
    caption: 'Стартовий набір: світло, зв’язок, холодильник, ноутбук',
    items: ['fridge', 'light', 'router', 'laptop'],
  },
  {
    id: 'house',
    label: 'Будинок з котлом',
    caption: 'Опалення і вода не зупиняються',
    items: ['boiler', 'pumpCirc', 'wellPump', 'light', 'router', 'fridge', 'tv'],
  },
  {
    id: 'remote',
    label: 'Робота з дому',
    caption: 'Робоче місце, яке не вимикається',
    items: ['pc', 'router', 'starlink', 'light', 'fridge', 'charging'],
  },
];

/* ── Core vs catalogue ────────────────────────────────────────────────────
   A wall of tiles reads as work. Only the appliances a Ukrainian household
   reaches for by reflex during a blackout stay on screen; the rest live in a
   searchable catalogue and appear as tiles once added.

   The cut is the whole `essentials` group — that IS the product's story, and
   the page is sold on «котел не зупиниться» — plus the two daily objects
   nobody thinks of as optional. */
const CORE_IDS = new Set([
  'fridge',
  'freezer',
  'light',
  'router',
  'boiler',
  'pumpCirc',
  'wellPump',
  'security',
  'charging',
  'tv',
  'laptop',
]);

export const isCore = (id: string) => CORE_IDS.has(id);
export const coreAppliances = appliances.filter((a) => CORE_IDS.has(a.id));
export const catalogAppliances = appliances.filter((a) => !CORE_IDS.has(a.id));

/**
 * Extra words the catalogue search should match. People type what they say —
 * «свч», «кондей», «пк» — not the label on the tile.
 */
const SEARCH_TERMS: Record<string, string[]> = {
  fridge: ['холодос', 'фрідж'],
  freezer: ['морозилка', 'ларь'],
  light: ['лампи', 'лампочки', 'світло'],
  router: ['вайфай', 'wifi', 'інтернет', 'модем', 'онт'],
  boiler: ['котел', 'опалення', 'газовий'],
  pumpCirc: ['насос', 'опалення'],
  wellPump: ['свердловина', 'вода', 'насос', 'гідрофор'],
  security: ['камери', 'сигналка', 'домофон'],
  charging: ['телефон', 'повербанк', 'зарядка'],
  tv: ['телек', 'телевізор'],
  laptop: ['ноут', 'лаптоп'],
  pc: ['пк', 'компютер', 'комп', 'системний блок', 'монітор'],
  console: ['приставка', 'плейстейшн', 'playstation', 'xbox'],
  starlink: ['старлінк', 'супутник', 'тарілка'],
  microwave: ['мікрохвильовка', 'свч', 'мікра'],
  coffee: ['кава', 'кавоварка', 'еспресо'],
  multicooker: ['мультиварка', 'скороварка'],
  toaster: ['тостер'],
  vacuum: ['пилосос'],
  ac: ['кондей', 'кондиціонер', 'спліт', 'спліт-система'],
  heater: ['обігрівач', 'тепловентилятор', 'конвектор', 'дуйка'],
  fan: ['вентилятор'],
};

/** Apostrophes vary (’ ' ʼ) and casing is noise — normalise both sides. */
const normalize = (s: string) =>
  s.toLowerCase().replace(/[’'ʼ`]/g, '').replace(/\s+/g, ' ').trim();

export function matchesQuery(a: Appliance, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  if (normalize(a.name).includes(q)) return true;
  return (SEARCH_TERMS[a.id] ?? []).some((t) => normalize(t).includes(q));
}

/** «8 год» / «20 хв», whichever unit this appliance is set in. */
export function formatUsage(a: Appliance, hours: number): string {
  return a.unit === 'min' ? `${Math.round(hours * 60)} хв` : `${Math.round(hours)} год`;
}

/** Average draw of one unit, in watts, at the given daily usage. */
export const averageWattsOf = (a: Appliance, hours: number) => (a.watts * hours) / 24;

/** The line a `fixed` appliance shows where the others show a slider. */
export function usageSummary(a: Appliance): string {
  const avg = Math.round(averageWattsOf(a, a.hoursPerDay));
  return avg === a.watts
    ? `Цілодобово · ${a.watts} Вт`
    : `Цілодобово · у середньому ${avg} Вт`;
}
