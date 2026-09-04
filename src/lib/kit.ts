/**
 * The product itself — every number on the page comes from here, so the
 * calculator, the spec tables and the sales copy can never drift apart.
 *
 * Sources: VOLT Polska datasheet for SINUS PRO ULTRA 3000 12/230V
 * (1500 W / 3000 VA, 100 A MPPT 30–500 V) and the Humsienk 12 V 314 Ah Mini
 * LiFePO4 spec sheet (4 019 Wh, 200 A BMS, IP65).
 */

export const inverter = {
  brand: 'VOLT Polska',
  model: 'Sinus PRO Ultra 3000 12/230 В',
  /** Headline form — the voltage suffix belongs in the spec table, not in an H2. */
  shortModel: 'Sinus PRO Ultra 3000',
  origin: 'Польща',
  /** Continuous real power the unit holds indefinitely. */
  powerW: 1500,
  /** Short-term surge — motor and compressor start-ups. */
  peakVA: 3000,
  batteryV: 12,
  waveform: 'Чиста синусоїда',
  outputV: '220–230 В ±5%',
  frequency: '50 / 60 Гц',
  /** Milliseconds between mains loss and the load being back on battery. */
  transferMsPc: 10,
  transferMsHome: 20,
  /**
   * No-load consumption, straight off the VOLT datasheet. This is the number
   * that surprises people: run a 15 W router on its own and the inverter's own
   * 30 W is TWICE the load, which is why a tiny load does not buy thousands of
   * hours. It is charged only while the grid is down — on mains the inverter
   * feeds itself from the wall, not from the bank.
   */
  idleW: 30,
  acChargerA: 60,
  mppt: {
    currentA: 100,
    pvVoltage: '30–500 В',
    maxPvW: 1500,
  },
  sizeMm: '330 × 278 × 98',
  weightKg: 4.3,
  tempRange: '−10 °C … +55 °C',
  warrantyMonths: 24,
} as const;

export const battery = {
  brand: 'Humsienk',
  model: '12 В 314 А·год Mini LiFePO₄',
  chemistry: 'LiFePO₄ (літій-залізо-фосфат)',
  nominalV: 12.8,
  capacityAh: 314,
  /** Nameplate energy of one module. */
  energyWh: 4019,
  bmsA: 200,
  /** Continuous AC-side power the BMS can feed. */
  bmsOutputW: 2560,
  cycles: 6000,
  /** Depth of discharge the cycle rating is quoted at. */
  cycleDod: 80,
  ip: 'IP65',
  sizeMm: '382 × 193 × 249',
  weightKg: 28,
  terminals: 'M8',
  chargeTemp: '0 °C … +45 °C',
  dischargeTemp: '−20 °C … +65 °C',
  selfDischarge: '≤ 3 % на місяць',
  bluetooth: 'Bluetooth 5.0 + застосунок HumSienk Smart BMS',
  maxParallel: 4,
  warrantyMonths: 12,
  certificates: ['IEC62619', 'CE-EMC', 'CE-RoHS', 'UN38.3', 'FCC'],
} as const;

/** Commercial terms of the kit as sold on this page. */
export const kit = {
  priceUah: 45000,
  /** Modules in the kit as sold. */
  batteries: 1,
  maxBatteries: 4,
  /** Rough retail delta per extra 4 kWh module. [ЗАПОВНИТИ — уточнити] */
  extraBatteryUah: 26000,
  includes: [
    'Інвертор VOLT Sinus PRO Ultra 3000 12/230 В зі вбудованим MPPT 100 А',
    'Акумулятор Humsienk LiFePO₄ 12 В 314 А·год (4 019 Вт·год)',
    'Силові кабелі з наконечниками M8, запобіжник 200 А з тримачем',
    'Кріплення інвертора на стіну та комплект метизів',
    'Налаштування режимів під ваш об’єкт і письмова інструкція українською',
  ],
} as const;

/* ── Derived energy model ─────────────────────────────────────────────────
   Real autonomy is not «ємність ÷ потужність». Three losses are always in
   play and all three live here so the calculator and the copy agree. */

/** LiFePO4 is safe to cycle deep, but reserving 10 % protects cycle life. */
export const USABLE_DOD = 0.9;
/** Round-trip DC→AC efficiency of the inverter under a typical home load. */
export const INVERTER_EFFICIENCY = 0.92;

/** Usable AC energy of a bank of `n` modules, in watt-hours. */
export function usableWh(n: number): number {
  return battery.energyWh * n * USABLE_DOD;
}

/* ── Recharge model ───────────────────────────────────────────────────────
   Used by the outage-schedule check: can the bank refill during the hours the
   grid is up, faster than the outage hours drain it?

   Charging is NOT one flat rate, and treating it as one is what made an
   obviously-fine schedule read as a failure. A LiFePO4 pack takes the charger's
   full current until it is nearly full (the CC phase), and only then does the
   current taper (CV). A blackout schedule almost never fills the bank — it
   tops up what the evening used — so that top-up happens entirely at full
   current, with no taper at all.

   The other correction: the pack sits at ~13.6 V while charging, not at its
   12.8 V nominal. Using the nominal figure understated the charger by 6 %. */

/** Average terminal voltage through the constant-current phase. */
export const CHARGE_VOLTAGE = 13.6;

/** DC power the built-in AC charger delivers at full current. */
export const CHARGE_W = inverter.acChargerA * CHARGE_VOLTAGE;

/** AC→DC conversion loss. Distinct from the taper, which is modelled below. */
export const CHARGE_CONVERSION = 0.95;

/** Watt-hours stored per hour while the charger holds full current. */
export const CC_RATE = CHARGE_W * CHARGE_CONVERSION;

/** Share of the bank that fills at full current before the current tapers. */
export const CC_SHARE = 0.85;

/** Average rate through the taper, as a fraction of the full-current rate. */
export const TAPER_FACTOR = 0.5;

/**
 * Where the bank ends up after `hours` on mains, starting from `socWh`.
 *
 * Charging from an arbitrary state of charge is the case that actually matters:
 * a blackout schedule never starts from empty, it tops up from wherever the
 * last outage left the pack. Full current until 85 %, then the taper, then the
 * hard ceiling of the bank — you cannot put in more than it holds.
 */
export function chargeFrom(socWh: number, hours: number, bankWh: number): number {
  let soc = Math.max(0, Math.min(bankWh, socWh));
  let left = Math.max(0, hours);
  if (left === 0) return soc;

  const ccCeiling = bankWh * CC_SHARE;
  if (soc < ccCeiling) {
    const spent = Math.min(left, (ccCeiling - soc) / CC_RATE);
    soc += spent * CC_RATE;
    left -= spent;
  }
  if (left > 0) soc = Math.min(bankWh, soc + left * CC_RATE * TAPER_FACTOR);
  return soc;
}

/** Watt-hours that can be put back into an empty bank in `hours` of mains. */
export function restorableWh(hours: number, bankWh: number): number {
  return chargeFrom(0, hours, bankWh);
}

/** Hours of mains needed to put `wh` back into a bank of `bankWh`. */
export function hoursToRestore(wh: number, bankWh: number): number {
  if (wh <= 0) return 0;
  const ccWh = bankWh * CC_SHARE;
  if (wh <= ccWh) return wh / CC_RATE;
  return ccWh / CC_RATE + (wh - ccWh) / (CC_RATE * TAPER_FACTOR);
}

/** Hours to fill the whole bank from empty. */
export const fullRechargeHours = (bankWh: number) => hoursToRestore(bankWh, bankWh);
