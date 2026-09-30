import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertCircle, Clock, Zap } from 'lucide-react';
import { RateGroup } from '../../types';
import { calculateRateGroupTotals, clampOtWorkers } from '../../utils/wageCalculator';
import { formatINR } from '../../utils/formatters';

interface RateGroupCardProps {
  group: RateGroup;
  index: number;
  totalGroupsInTab: number;
  shiftHours?: number;
  onChange: (updatedGroup: RateGroup) => void;
  onDelete: (groupId: string) => void;
}

export const RateGroupCard: React.FC<RateGroupCardProps> = ({
  group,
  index,
  totalGroupsInTab,
  shiftHours = 8,
  onChange,
  onDelete,
}) => {
  const { t } = useTranslation();
  const totals = calculateRateGroupTotals(group, shiftHours);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Block e, E, +, - from numeric inputs
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleCountChange = (valueStr: string) => {
    const val = valueStr === '' ? '' : parseInt(valueStr, 10);
    const newCount = isNaN(val as number) ? '' : Math.max(0, val as number);
    
    // Auto clamp OT workers if count drops below current otWorkers
    const newOtWorkers = clampOtWorkers(group.otWorkers, newCount);

    onChange({
      ...group,
      count: newCount,
      otWorkers: newOtWorkers,
    });
  };

  const handleRateChange = (valueStr: string) => {
    const val = valueStr === '' ? '' : parseFloat(valueStr);
    const newRate = isNaN(val as number) ? '' : Math.max(0, val as number);
    onChange({
      ...group,
      dayRate: newRate,
    });
  };

  const handleOtWorkersChange = (valueStr: string) => {
    const val = valueStr === '' ? '' : parseInt(valueStr, 10);
    const rawOtWorkers = isNaN(val as number) ? '' : Math.max(0, val as number);
    const clamped = clampOtWorkers(rawOtWorkers, group.count);
    onChange({
      ...group,
      otWorkers: clamped,
    });
  };

  const handleOtHoursChange = (valueStr: string) => {
    const val = valueStr === '' ? '' : parseFloat(valueStr);
    const newOtHours = isNaN(val as number) ? '' : Math.max(0, val as number);
    onChange({
      ...group,
      otHours: newOtHours,
    });
  };

  const isOtClamped =
    typeof group.otWorkers === 'number' &&
    typeof group.count === 'number' &&
    group.otWorkers > 0 &&
    group.otWorkers === group.count;

  // Contextual placeholders based on workerType and index
  const ratePlaceholder =
    group.workerType === 'mesan'
      ? index === 0
        ? 'e.g. 850'
        : `e.g. ${850 + index * 50}`
      : index === 0
      ? 'e.g. 550'
      : `e.g. ${550 + index * 50}`;

  const countPlaceholder =
    group.workerType === 'mesan'
      ? index === 0
        ? 'e.g. 2'
        : `e.g. ${Math.max(1, 2 + index)}`
      : index === 0
      ? 'e.g. 4'
      : `e.g. ${Math.max(2, 4 + index * 2)}`;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm space-y-3 transition-all">
      {/* Header: Group Title + Delete */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center border border-slate-300 dark:border-slate-700">
            {index + 1}
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
            {group.customTitle || `${t('wage.group')} #${index + 1}`}
          </span>
        </div>

        {totalGroupsInTab > 1 && (
          <button
            type="button"
            onClick={() => onDelete(group.id)}
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Delete Group"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Grid Inputs: Count & Day Rate */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Workers Count */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {t('wage.workers_count')} <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            placeholder={countPlaceholder}
            value={group.count}
            onKeyDown={handleKeyDown}
            onChange={(e) => handleCountChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 outline-none tabular-nums transition-all"
          />
        </div>

        {/* Day Rate (₹) */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {t('wage.day_rate')} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder={ratePlaceholder}
              value={group.dayRate}
              onKeyDown={handleKeyDown}
              onChange={(e) => handleRateChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 outline-none tabular-nums transition-all"
            />
          </div>
        </div>
      </div>

      {/* Overtime (OT) Section */}
      <div className="bg-amber-50/70 dark:bg-slate-950/40 border border-amber-200/80 dark:border-slate-800 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Overtime (OT)</span>
          </div>

          {/* Auto OT Rate Preview Badge */}
          {totals.calculatedOtRate > 0 && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/50 border border-amber-300/80 dark:border-amber-800/60 px-2 py-0.5 rounded-md">
              <Zap className="w-3 h-3 text-amber-600" />
              <span>
                {t('wage.hourly_ot_rate')}: {formatINR(totals.calculatedOtRate, true)}/hr
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* OT Workers Count */}
          <div className="space-y-1">
            <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {t('wage.ot_workers')}
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max={typeof group.count === 'number' ? group.count : undefined}
              step="1"
              placeholder="e.g. 2"
              value={group.otWorkers}
              onKeyDown={handleKeyDown}
              onChange={(e) => handleOtWorkersChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none tabular-nums"
            />
          </div>

          {/* OT Hours */}
          <div className="space-y-1">
            <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {t('wage.ot_hours')}
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              placeholder="e.g. 2.0"
              value={group.otHours}
              onKeyDown={handleKeyDown}
              onChange={(e) => handleOtHoursChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none tabular-nums"
            />
          </div>
        </div>
      </div>

      {/* Group Financial Summary Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span>Base: {formatINR(totals.calculatedGroupBase, false)}</span>
          {totals.calculatedGroupOt > 0 && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              + OT: {formatINR(totals.calculatedGroupOt, false)}
            </span>
          )}
        </div>

        <div className="font-bold text-sm text-slate-900 dark:text-emerald-400 tabular-nums">
          {formatINR(totals.calculatedGroupTotal, true)}
        </div>
      </div>
    </div>
  );
};
