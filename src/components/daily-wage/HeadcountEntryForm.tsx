import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import {
  HardHat,
  Users,
  Plus,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Layers,
  Edit2,
  X,
  Lock,
  Calendar,
} from 'lucide-react';
import { RateGroup, WorkerCategory, HeadcountEntry } from '../../types';
import { RateGroupCard } from './RateGroupCard';
import { EntrySubmittedModal } from './EntrySubmittedModal';
import {
  createBlankRateGroup,
  aggregateEntryTotals,
  calculateRateGroupTotals,
} from '../../utils/wageCalculator';
import { formatINR, getTodayString, formatDateDisplay, formatDateDMY } from '../../utils/formatters';
import { useActiveSite, useAppSettings } from '../../db/hooks';
import { uploadBackupToGoogleDrive } from '../../services/googleDriveBackup';
import { db } from '../../db';


interface HeadcountEntryFormProps {
  siteId: string;
  selectedDate: string;
  defaultShiftHours?: number;
  entryToEdit?: HeadcountEntry | null;
  onCancelEdit?: () => void;
  onEntrySaved?: () => void;
  onViewHistory?: () => void;
  onSelectToday?: () => void;
}

type ViewFilterMode = 'all' | 'mesan' | 'helper';

export const HeadcountEntryForm: React.FC<HeadcountEntryFormProps> = ({
  siteId,
  selectedDate,
  defaultShiftHours = 8,
  entryToEdit,
  onCancelEdit,
  onEntrySaved,
  onViewHistory,
  onSelectToday,
}) => {
  const { t } = useTranslation();
  const settings = useAppSettings();
  const activeSite = useActiveSite(siteId);
  const [viewFilter, setViewFilter] = useState<ViewFilterMode>('all');
  const shiftHours = settings?.standardShiftHours || defaultShiftHours || 8;
  const isToday = selectedDate === getTodayString();

  // Groups state initialized with default 1 Mesan and 1 Helper group
  const [groups, setGroups] = useState<RateGroup[]>([
    createBlankRateGroup('mesan', 'Mesan Group 1'),
    createBlankRateGroup('helper', 'Helper Group 1'),
  ]);

  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  // Submission success modal state
  const [submittedData, setSubmittedData] = useState<{
    date: string;
    groups: RateGroup[];
    totalWorkers: number;
    totalWageAmount: number;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load entryToEdit when provided
  useEffect(() => {
    if (entryToEdit) {
      setGroups(
        entryToEdit.groups.map((g) => {
          const totals = calculateRateGroupTotals(g, shiftHours);
          return {
            ...g,
            ...totals,
          };
        })
      );
      setNotes(entryToEdit.notes || '');
    } else {
      setGroups([
        createBlankRateGroup('mesan', 'Mesan Group 1'),
        createBlankRateGroup('helper', 'Helper Group 1'),
      ]);
      setNotes('');
    }
  }, [entryToEdit, shiftHours]);

  const mesanGroups = groups.filter((g) => g.workerType === 'mesan');
  const helperGroups = groups.filter((g) => g.workerType === 'helper');

  const handleGroupChange = (updatedGroup: RateGroup) => {
    const totals = calculateRateGroupTotals(updatedGroup, shiftHours);
    const enriched = {
      ...updatedGroup,
      ...totals,
    };
    setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? enriched : g)));
    setValidationError(null);
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const handleAddGroup = (workerType: WorkerCategory) => {
    const currentCount = groups.filter((g) => g.workerType === workerType).length;
    const title = `${workerType === 'mesan' ? 'Mesan' : 'Helper'} Group ${currentCount + 1}`;
    const newGroup = createBlankRateGroup(workerType, title);
    setGroups((prev) => [...prev, newGroup]);
  };

  // Section subtotals
  const mesanTotals = aggregateEntryTotals(mesanGroups, shiftHours);
  const helperTotals = aggregateEntryTotals(helperGroups, shiftHours);
  const { totalWorkers, totalMesans, totalHelpers, totalWageAmount } = aggregateEntryTotals(groups, shiftHours);

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate date restriction
    if (!isToday && !entryToEdit) {
      setValidationError('New wage entries can only be saved for today. Switch to today to create a new entry.');
      return;
    }

    // Validate: At least one group must have count > 0 and dayRate > 0
    const validGroups = groups.filter(
      (g) => typeof g.count === 'number' && g.count > 0 && typeof g.dayRate === 'number' && g.dayRate > 0
    );

    if (validGroups.length === 0) {
      setValidationError('Please enter at least one valid rate group with Worker Count & Day Rate.');
      return;
    }

    setIsSaving(true);
    try {
      const entryTotals = aggregateEntryTotals(validGroups, shiftHours);

      // Enrich all groups with their exact calculated breakdown
      const enrichedGroups: RateGroup[] = validGroups.map((g) => {
        const totals = calculateRateGroupTotals(g, shiftHours);
        return {
          ...g,
          calculatedOtRate: totals.calculatedOtRate,
          calculatedGroupBase: totals.calculatedGroupBase,
          calculatedGroupOt: totals.calculatedGroupOt,
          calculatedGroupTotal: totals.calculatedGroupTotal,
        };
      });

      if (entryToEdit) {
        // Update existing entry
        await db.headcountEntries.update(entryToEdit.id, {
          groups: enrichedGroups,
          totalWorkers: entryTotals.totalWorkers,
          totalMesans: entryTotals.totalMesans,
          totalHelpers: entryTotals.totalHelpers,
          totalWageAmount: entryTotals.totalWageAmount,
          notes: notes.trim() || undefined,
          updatedAt: Date.now(),
        });
      } else {
        // Create new entry
        const entryId = `entry_${Date.now()}`;
        const newEntry: HeadcountEntry = {
          id: entryId,
          siteId,
          date: selectedDate,
          groups: enrichedGroups,
          totalWorkers: entryTotals.totalWorkers,
          totalMesans: entryTotals.totalMesans,
          totalHelpers: entryTotals.totalHelpers,
          totalWageAmount: entryTotals.totalWageAmount,
          notes: notes.trim() || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await db.headcountEntries.add(newEntry);
      }

      // Trigger celebratory micro-animation
      try {
        confetti({
          particleCount: 45,
          spread: 65,
          origin: { y: 0.85 },
          colors: ['#10b981', '#34d399', '#f59e0b', '#3b82f6'],
        });
      } catch {
        // Fallback
      }

      setSubmittedData({
        date: entryToEdit ? entryToEdit.date : selectedDate,
        groups: enrichedGroups,
        totalWorkers: entryTotals.totalWorkers,
        totalWageAmount: entryTotals.totalWageAmount,
      });
      setIsModalOpen(true);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);

      // Reset form if creating new, or notify parent
      if (!entryToEdit) {
        setGroups([
          createBlankRateGroup('mesan', 'Mesan Group 1'),
          createBlankRateGroup('helper', 'Helper Group 1'),
        ]);
        setNotes('');
      }

      if (onEntrySaved) onEntrySaved();

      // Silent background cloud auto-backup if connected & enabled
      if (settings?.autoGoogleBackup && settings?.googleAccountEmail) {
        uploadBackupToGoogleDrive().catch(() => {});
      }
    } catch (err) {
      console.error('Failed to save entry:', err);
      setValidationError('Failed to save wage entry to local database.');

    } finally {
      setIsSaving(false);
    }
  };

  // If viewing past or future date and not editing an existing record, restrict creation
  if (!isToday && !entryToEdit) {
    return (
      <div className="space-y-4 pb-28">
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-5 shadow-sm text-center space-y-4 animate-fadeIn">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Date Restricted for New Entry
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              New daily wage entries can only be created for <strong>Today ({formatDateDisplay(getTodayString())})</strong>.
              You are currently viewing records for <strong>{formatDateDisplay(selectedDate)}</strong>.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2">
            <span className="font-semibold">Selected Calendar Date:</span>
            <span className="font-bold text-slate-900 dark:text-white bg-slate-200/80 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
              {formatDateDMY(selectedDate, true)}
            </span>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            {onSelectToday && (
              <button
                type="button"
                onClick={onSelectToday}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/30 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Calendar className="w-4 h-4" />
                <span>Switch to Today ({formatDateDMY(getTodayString(), true)}) & Fill Entry</span>
              </button>
            )}

            {onViewHistory && (
              <button
                type="button"
                onClick={onViewHistory}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 border border-slate-200 dark:border-slate-700"
              >
                <FileText className="w-4 h-4" />
                <span>View Saved Records for {formatDateDMY(selectedDate, true)}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28">
      {/* Edit Mode Banner */}
      {entryToEdit && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-2xl flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-bold block">Editing Wage Entry</span>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80">
                Update Mistri or Helper rates, worker counts, or OT below.
              </span>
            </div>
          </div>
          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px] font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      )}

      {/* Control Bar: View Filter Toggle */}
      <div className="space-y-2">
        <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            type="button"
            onClick={() => setViewFilter('all')}
            className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              viewFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All on One Screen</span>
          </button>

          <button
            type="button"
            onClick={() => setViewFilter('mesan')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              viewFilter === 'mesan'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>Mesan ({totalMesans})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewFilter('helper')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              viewFilter === 'helper'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Helper ({totalHelpers})</span>
          </button>
        </div>
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs animate-shake">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
          <span>{entryToEdit ? 'Entry updated successfully!' : t('wage.entry_saved')}</span>
        </div>
      )}

      {/* SECTION 1: MESAN (मिस्त्री / कारीगर) RATE GROUPS */}
      {(viewFilter === 'all' || viewFilter === 'mesan') && (
        <div className="space-y-3 bg-emerald-50/70 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl p-3.5 shadow-sm">
          {/* Section Header */}
          <div className="flex items-center justify-between border-b border-emerald-200/80 dark:border-emerald-900/40 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <HardHat className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-emerald-950 dark:text-emerald-100 uppercase tracking-wider flex items-center gap-2">
                  <span>{t('wage.mesan')}</span>
                  <span className="text-[10px] font-bold bg-emerald-200/90 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700/50">
                    {totalMesans} Workers
                  </span>
                </h3>
                <span className="text-[10px] text-emerald-700/90 dark:text-slate-400 font-medium">
                  Record daily rates & count for Mesans
                </span>
              </div>
            </div>

            <div className="text-right font-extrabold text-sm text-emerald-700 dark:text-emerald-400 tabular-nums">
              {formatINR(mesanTotals.totalWageAmount, true)}
            </div>
          </div>

          {/* Mesan Rate Group Cards */}
          <div className="space-y-3">
            {mesanGroups.map((group, index) => (
              <RateGroupCard
                key={group.id}
                group={group}
                index={index}
                totalGroupsInTab={mesanGroups.length}
                shiftHours={shiftHours}
                onChange={handleGroupChange}
                onDelete={handleDeleteGroup}
              />
            ))}

            {/* Add Another Mesan Group Button */}
            <button
              type="button"
              onClick={() => handleAddGroup('mesan')}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-emerald-400 dark:border-emerald-600 bg-white dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Mesan Rate Group (e.g. @ ₹{850 + mesanGroups.length * 50})</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: HELPER (मजदूर / बेलदार) RATE GROUPS */}
      {(viewFilter === 'all' || viewFilter === 'helper') && (
        <div className="space-y-3 bg-blue-50/70 dark:bg-slate-900 border border-blue-200 dark:border-blue-800/60 rounded-3xl p-3.5 shadow-sm">
          {/* Section Header */}
          <div className="flex items-center justify-between border-b border-blue-200/80 dark:border-blue-900/40 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-blue-950 dark:text-blue-100 uppercase tracking-wider flex items-center gap-2">
                  <span>{t('wage.helper')}</span>
                  <span className="text-[10px] font-bold bg-blue-200/90 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-700/50">
                    {totalHelpers} Workers
                  </span>
                </h3>
                <span className="text-[10px] text-blue-700/90 dark:text-slate-400 font-medium">
                  Record daily rates & count for Helpers
                </span>
              </div>
            </div>

            <div className="text-right font-extrabold text-sm text-blue-700 dark:text-blue-400 tabular-nums">
              {formatINR(helperTotals.totalWageAmount, true)}
            </div>
          </div>

          {/* Helper Rate Group Cards */}
          <div className="space-y-3">
            {helperGroups.map((group, index) => (
              <RateGroupCard
                key={group.id}
                group={group}
                index={index}
                totalGroupsInTab={helperGroups.length}
                shiftHours={shiftHours}
                onChange={handleGroupChange}
                onDelete={handleDeleteGroup}
              />
            ))}

            {/* Add Another Helper Group Button */}
            <button
              type="button"
              onClick={() => handleAddGroup('helper')}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-blue-400 dark:border-blue-600 bg-white dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Helper Rate Group (e.g. @ ₹{550 + helperGroups.length * 50})</span>
            </button>
          </div>
        </div>
      )}

      {/* Notes Field */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Notes / Remark (Optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. 2nd floor slab casting work, overtime due to rain delay"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none"
        />
      </div>

      {/* Sticky Bottom Wage Summary & Save Action */}
      <div className="fixed bottom-14 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-3 max-w-lg mx-auto shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <span>{t('wage.total_workers')}:</span>
              <span className="text-white font-bold">{totalWorkers}</span>
              <span className="text-[10px] text-slate-500">
                ({totalMesans} Mesans, {totalHelpers} Helpers)
              </span>
            </div>
            <div className="text-base font-extrabold text-emerald-400 tabular-nums">
              {formatINR(totalWageAmount, true)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveEntry}
            disabled={isSaving}
            className="flex-1 max-w-[200px] py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : entryToEdit ? 'Update Wage Entry' : t('wage.save_entry')}</span>
          </button>
        </div>
      </div>

      {/* Submission Success Modal with WhatsApp & Matrix Export */}
      {submittedData && (
        <EntrySubmittedModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            if (entryToEdit && onCancelEdit) onCancelEdit();
          }}
          site={activeSite}
          date={submittedData.date}
          groups={submittedData.groups}
          shiftHours={shiftHours}
          totalWorkers={submittedData.totalWorkers}
          totalWageAmount={submittedData.totalWageAmount}
          onNewEntry={() => {
            setIsModalOpen(false);
            if (entryToEdit && onCancelEdit) onCancelEdit();
            setGroups([
              createBlankRateGroup('mesan', 'Mesan Group 1'),
              createBlankRateGroup('helper', 'Helper Group 1'),
            ]);
            setNotes('');
          }}
          onViewHistory={() => {
            setIsModalOpen(false);
            if (entryToEdit && onCancelEdit) onCancelEdit();
            if (onViewHistory) onViewHistory();
          }}
        />
      )}
    </div>
  );
};
