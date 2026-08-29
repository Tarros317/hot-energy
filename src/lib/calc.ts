/**
 * Autonomy maths for the calculator.
 *
 * Two questions get answered separately, because they fail for different
 * reasons:
 *
 *   1. HOW LONG will the bank last?  → energy question.  Average draw over the
 *      outage, including the inverter's own 30 W idle, against usable Wh.
 *   2. WILL IT EVEN START?           → power question.  Everything that can be
 *      on at the same moment against the inverter's 1 500 W continuous rating,
 *      plus motor inrush against its 3 000 VA surge rating.
 *
 * A load can pass (1) and fail (2) — a 2 kW kettle costs almost no energy but
 * a 1 500 W inverter simply will not run it. The UI must say so instead of
 * printing a comfortable number of hours.
 */

import { applianceById, type Appliance } from '@/lib/appliances';
import {
  INVERTER_EFFICIENCY,
  battery,
  chargeFrom,
  fullRechargeHours,
  inverter,
  restorableWh,
  usableWh,
} from '@/lib/kit';

/**
 * id → how many, and how long each runs per day. Absent = not selected.
 * `hours` starts from the appliance's own default and is then the visitor's to
 * change, which is why it lives in the selection rather than in the catalogue.
 */
export type SelectionItem = { qty: number; hours: number };
export type Selection = Record<string, SelectionItem>;

export type LoadLine = {
  appliance: Appliance;
  qty: number;
  /** Average AC watts this line contributes across the whole outage. */
  avgW: number;
  /** Nameplate watts when running — what the inverter has to hold. */
  runW: number;
};

export type CalcResult = {
  lines: LoadLine[];
  /** Average AC load of everything selected, in watts. */
  avgLoadW: number;
  /** DC draw including inverter idle and conversion losses. */
  drawW: number;
  /** Usable AC energy of the bank. */
  usableWh: number;
  /** Autonomy in hours. Infinity when nothing is selected. */
  hours: number;
  /** Realistic simultaneous load — the continuous-rating check. */
  peakW: number;
  /** Peak plus the single largest motor inrush — the surge-rating check. */
  surgeVA: number;
  /** peakW as a share of the inverter's continuous rating (0–1+). */
  loadRatio: number;
  overContinuous: boolean;
  overSurge: boolean;
  /** Appliances whose own draw exceeds the inverter on their own. */
  tooBig: Appliance[];
  /** Energy the bank gives back per full charge, kWh. */
  energyKwh: number;
  count: number;
  /** Autonomy if every selected appliance ran simultaneously, in hours. */
  hoursAtPeak: number;
};

/**
 * Average AC watts one unit of an appliance adds, assuming its daily usage is
 * spread evenly across the 24 hours. `hoursAtPeak` on the result is the other
 * bracket: what happens if everything runs at once instead.
 */
function averageWatts(a: Appliance, hours: number): number {
  return (a.watts * Math.max(0, hours)) / 24;
}

/** Watts the inverter must hold while this appliance runs. */
function runningWatts(a: Appliance): number {
  return a.peakW ?? a.watts;
}

export function calculate(selection: Selection, batteries: number): CalcResult {
  const lines: LoadLine[] = [];

  for (const [id, item] of Object.entries(selection)) {
    if (!item?.qty) continue;
    const appliance = applianceById.get(id);
    if (!appliance) continue;
    lines.push({
      appliance,
      qty: item.qty,
      avgW: averageWatts(appliance, item.hours) * item.qty,
      runW: runningWatts(appliance) * item.qty,
    });
  }

  lines.sort((a, b) => b.avgW - a.avgW);

  const avgLoadW = lines.reduce((sum, l) => sum + l.avgW, 0);
  const count = lines.reduce((sum, l) => sum + l.qty, 0);

  // Energy side. Conversion losses hit the load; the inverter's idle draw is
  // a constant on the DC side and is charged even when the house is asleep.
  const drawW = avgLoadW > 0 ? avgLoadW / INVERTER_EFFICIENCY + inverter.idleW : 0;
  const bankWh = usableWh(batteries);
  const hours = drawW > 0 ? bankWh / drawW : Infinity;

  // Power side. Continuous loads are genuinely simultaneous; of the short
  // bursts only ONE realistically runs at a time — nobody boils the kettle
  // while ironing and vacuuming.
  const continuousW = lines
    .filter((l) => l.appliance.mode !== 'burst')
    .reduce((sum, l) => sum + runningWatts(l.appliance) * l.qty, 0);
  const burstPeaks = lines
    .filter((l) => l.appliance.mode === 'burst')
    .map((l) => runningWatts(l.appliance) * l.qty);
  const largestBurst = burstPeaks.length ? Math.max(...burstPeaks) : 0;
  const peakW = continuousW + largestBurst;

  // Inrush: the biggest single start-up, layered on top of everything running.
  const largestInrush = lines.reduce((max, l) => {
    const factor = l.appliance.startup ?? 1;
    const extra = runningWatts(l.appliance) * (factor - 1);
    return Math.max(max, extra);
  }, 0);

  // Anything whose own nameplate draw already exceeds the inverter.
  const tooBig = lines
    .filter((l) => runningWatts(l.appliance) > inverter.powerW)
    .map((l) => l.appliance);

  return {
    lines,
    avgLoadW,
    drawW,
    usableWh: bankWh,
    hours,
    peakW,
    surgeVA: peakW + largestInrush,
    loadRatio: peakW / inverter.powerW,
    overContinuous: peakW > inverter.powerW,
    overSurge: peakW + largestInrush > inverter.peakVA,
    tooBig,
    energyKwh: (battery.energyWh * batteries) / 1000,
    count,
    hoursAtPeak: peakW > 0 ? bankWh / (peakW / INVERTER_EFFICIENCY + inverter.idleW) : Infinity,
  };
}

/** 5.4 → «5 год 24 хв». Infinity and 0 handled for the empty state. */
export function formatHours(h: number): { value: string; unit: string } {
  if (!Number.isFinite(h) || h <= 0) return { value: '—', unit: '' };
  if (h >= 100) return { value: '99+', unit: 'год' };
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  if (minutes === 60) return { value: String(hours + 1), unit: 'год' };
  if (hours === 0) return { value: String(minutes), unit: 'хв' };
  if (minutes === 0) return { value: String(hours), unit: 'год' };
  // Zero-padded so the dial reads like an instrument and the digits don't
  // shuffle sideways as the value ticks past a round hour.
  return { value: `${hours} год ${String(minutes).padStart(2, '0')}`, unit: 'хв' };
}

/* ── Outage schedule ─────────────────────────────────────────────
   The honest answer to "how long does this last on my schedule" is NOT a
   per-day energy balance. That framing was wrong in a way that mattered: a
   20/2 schedule shows a daily shortfall, but the bank starts FULL, so the
   shortfall eats into a reserve first. With ~30 h of autonomy, 20/2 still
   covers more than two days before the house goes dark — the deficit view
   reported only that the balance was negative, which reads as "it fails
   immediately" and is simply not what happens.

   It also made extra batteries look pointless: they do not change the balance
   (same charger current either way), but they very much change how long the
   reserve lasts. Nothing but a simulation captures that.

   So: walk the cycle. Discharge for `off` hours, charge for `on` hours, repeat,
   and report the wall-clock moment the bank first cannot see an outage through.
   The inverter's idle draw counts only against the outage hours; on mains it
   feeds itself from the wall.
*/

/** Cycle cap for the walk. At a 22 h cycle this is well over a year. */
const MAX_CYCLES = 500;

export type Sustainability = {
  /** One cycle: hours without mains, then hours with. */
  offHours: number;
  onHours: number;
  /** Watt-hours one outage takes out of the bank. */
  usedPerOutageWh: number;
  /** Watt-hours one grid window puts back, measured from a post-outage bank. */
  restoredPerWindowWh: number;
  /** Net change per full cycle. Negative means the reserve drifts down. */
  netPerCycleWh: number;
  /**
   * Wall-clock hours from a full bank until the house first goes dark, grid
   * windows included. `null` when the schedule never runs the bank down.
   */
  coverageHours: number | null;
  /** Whole outages ridden out end to end before that moment. */
  outagesCovered: number;
  /** Hours to fill the whole bank from empty — quoted in the methodology. */
  fullRechargeHours: number;
};

export function sustainability(
  result: CalcResult,
  batteries: number,
  offHours: number,
  onHours: number,
): Sustainability {
  const off = Math.max(0, Math.min(24, offHours));
  const on = Math.max(0, Math.min(24, onHours));
  const bankWh = usableWh(batteries);
  const draw = result.drawW;

  const usedPerOutageWh = draw * off;
  // Quoted at full charger current, i.e. what the window is worth once the bank
  // has actually been drawn down. Measuring it from a nearly-full bank instead
  // would report a smaller figure the bigger the bank is — true of the taper,
  // but backwards as a headline, since a bank that full was never at risk.
  // The simulation below still models the taper cycle by cycle.
  const restoredPerWindowWh = restorableWh(on, bankWh);

  let soc = bankWh;
  let elapsed = 0;
  let outagesCovered = 0;
  let coverageHours: number | null = null;

  if (draw > 0 && off > 0) {
    for (let i = 0; i < MAX_CYCLES; i += 1) {
      const runnable = soc / draw;
      if (runnable < off) {
        coverageHours = elapsed + runnable;
        break;
      }
      soc -= usedPerOutageWh;
      elapsed += off;
      outagesCovered += 1;
      soc = chargeFrom(soc, on, bankWh);
      elapsed += on;
    }
  }

  return {
    offHours: off,
    onHours: on,
    usedPerOutageWh,
    restoredPerWindowWh,
    netPerCycleWh: restoredPerWindowWh - usedPerOutageWh,
    coverageHours,
    outagesCovered,
    fullRechargeHours: fullRechargeHours(bankWh),
  };
}
