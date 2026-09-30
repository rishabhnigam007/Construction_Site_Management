import { RateGroup, AttendanceStatus, WorkerCategory } from '../types';

export const DEFAULT_SHIFT_HOURS = 8;

/**
 * Calculates hourly Overtime (OT) rate from day rate.
 * Formula: Day Rate / Shift Hours (Default 8 hours).
 * Floored to integer to match contractor standard (e.g. 550 / 8 = 68/hr; 850 / 8 = 106/hr).
 */
export function calculateOtRate(dayRate: number, shiftHours = DEFAULT_SHIFT_HOURS): number {
  if (!dayRate || dayRate <= 0 || !shiftHours || shiftHours <= 0) return 0;
  return Math.floor(dayRate / shiftHours);
}

/**
 * Clamps OT workers count to never exceed total workers in the rate group.
 */
export function clampOtWorkers(otWorkers: number | '', groupCount: number | ''): number {
  const count = typeof groupCount === 'number' ? Math.max(0, groupCount) : 0;
  if (typeof otWorkers !== 'number' || otWorkers <= 0) return 0;
  return Math.min(otWorkers, count);
}

/**
 * Calculates full financial breakdown for a single rate group.
 */
export function calculateRateGroupTotals(group: Partial<RateGroup>, shiftHours = DEFAULT_SHIFT_HOURS): {
  calculatedOtRate: number;
  calculatedGroupBase: number;
  calculatedGroupOt: number;
  calculatedGroupTotal: number;
} {
  const count = typeof group.count === 'number' ? Math.max(0, group.count) : 0;
  const dayRate = typeof group.dayRate === 'number' ? Math.max(0, group.dayRate) : 0;
  const clampedOtWorkers = clampOtWorkers(group.otWorkers ?? 0, count);
  const otHours = typeof group.otHours === 'number' ? Math.max(0, group.otHours) : 0;

  const otRate = calculateOtRate(dayRate, shiftHours);
  const groupBase = count * dayRate;
  const groupOt = clampedOtWorkers * otHours * otRate;
  const groupTotal = groupBase + groupOt;

  return {
    calculatedOtRate: otRate,
    calculatedGroupBase: Number(groupBase.toFixed(2)),
    calculatedGroupOt: Number(groupOt.toFixed(2)),
    calculatedGroupTotal: Number(groupTotal.toFixed(2)),
  };
}

/**
 * Calculates individual wage for named worker attendance.
 */
export function calculateWorkerWage(
  status: AttendanceStatus,
  dayRate: number,
  otHours = 0,
  shiftHours = DEFAULT_SHIFT_HOURS
): number {
  const validRate = Math.max(0, dayRate || 0);
  const validOtHours = Math.max(0, otHours || 0);
  const otRate = calculateOtRate(validRate, shiftHours);
  const otAmount = validOtHours * otRate;

  let baseAmount = 0;
  if (status === 'full') {
    baseAmount = validRate;
  } else if (status === 'half') {
    baseAmount = validRate * 0.5;
  } else {
    baseAmount = 0;
  }

  return Number((baseAmount + otAmount).toFixed(2));
}

/**
 * Aggregates all rate groups for an entry.
 */
export function aggregateEntryTotals(groups: RateGroup[], shiftHours = DEFAULT_SHIFT_HOURS) {
  let totalWorkers = 0;
  let totalMesans = 0;
  let totalHelpers = 0;
  let totalWageAmount = 0;

  groups.forEach((group) => {
    const count = typeof group.count === 'number' ? group.count : 0;
    const totals = calculateRateGroupTotals(group, shiftHours);

    totalWorkers += count;
    if (group.workerType === 'mesan') {
      totalMesans += count;
    } else if (group.workerType === 'helper') {
      totalHelpers += count;
    }

    totalWageAmount += totals.calculatedGroupTotal;
  });

  return {
    totalWorkers,
    totalMesans,
    totalHelpers,
    totalWageAmount: Number(totalWageAmount.toFixed(2)),
  };
}

/**
 * Creates a blank new rate group
 */
export function createBlankRateGroup(workerType: WorkerCategory, customTitle?: string): RateGroup {
  return {
    id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    workerType,
    customTitle,
    count: '',
    dayRate: '',
    otWorkers: '',
    otHours: '',
    calculatedOtRate: 0,
    calculatedGroupBase: 0,
    calculatedGroupOt: 0,
    calculatedGroupTotal: 0,
  };
}
