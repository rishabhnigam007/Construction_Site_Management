import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  HardHat,
  Users,
  FileText,
  Calendar,
  Clock,
  Share2,
  FileSpreadsheet,
  Copy,
  Check,
  Edit2,
} from 'lucide-react';
import { HeadcountEntry } from '../../types';
import { formatINR } from '../../utils/formatters';
import { calculateRateGroupTotals } from '../../utils/wageCalculator';
import { useActiveSite, useAppSettings } from '../../db/hooks';
import { db } from '../../db';
import { EntrySubmittedModal } from './EntrySubmittedModal';
import {
  formatEntryListForDateWhatsApp,
  openWhatsAppWithMessage,
  copyTextToClipboard,
} from '../../utils/whatsappFormatter';
import { exportToExcelFile } from '../../services/excelExporter';

interface DailyWageHistoryListProps {
  entries: HeadcountEntry[];
  onEditEntry?: (entry: HeadcountEntry) => void;
}

export const DailyWageHistoryList: React.FC<DailyWageHistoryListProps> = ({ entries, onEditEntry }) => {
  const { t } = useTranslation();
  const settings = useAppSettings();
  const activeSite = useActiveSite(settings?.activeSiteId);
  const shiftHours = settings?.standardShiftHours || 8;

  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [selectedModalEntry, setSelectedModalEntry] = useState<HeadcountEntry | null>(null);
  const [copiedDay, setCopiedDay] = useState(false);

  if (!entries || entries.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 text-center text-slate-500 dark:text-slate-400 space-y-2">
        <Calendar className="w-8 h-8 mx-auto text-slate-400 stroke-[1.5]" />
        <p className="text-xs font-medium">{t('wage.no_entries_today')}</p>
      </div>
    );
  }

  const handleDelete = async (entryId: string) => {
    if (window.confirm(t('wage.delete_confirm'))) {
      await db.headcountEntries.delete(entryId);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedEntryId((prev) => (prev === id ? null : id));
  };

  const grandDayTotal = entries.reduce((acc, curr) => acc + curr.totalWageAmount, 0);
  const grandWorkersCount = entries.reduce((acc, curr) => acc + curr.totalWorkers, 0);
  const entryDate = entries[0]?.date || '';

  const handleShareDayWhatsApp = () => {
    const text = formatEntryListForDateWhatsApp(
      entryDate,
      activeSite?.name || 'Site',
      entries,
      shiftHours
    );
    openWhatsAppWithMessage(text);
  };

  const handleCopyDayWhatsApp = async () => {
    const text = formatEntryListForDateWhatsApp(
      entryDate,
      activeSite?.name || 'Site',
      entries,
      shiftHours
    );
    const success = await copyTextToClipboard(text);
    if (success) {
      setCopiedDay(true);
      setTimeout(() => setCopiedDay(false), 2500);
    }
  };

  const handleExportDayExcel = () => {
    exportToExcelFile({
      site: activeSite,
      startDate: entryDate,
      endDate: entryDate,
      headcountEntries: entries,
      shiftHours,
    });
  };

  return (
    <div className="space-y-3">
      {/* Day Overview Banner */}
      <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-800/60 rounded-3xl p-4 text-white shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
              {t('wage.day_total')}
            </span>
            <span className="text-2xl font-black text-white tabular-nums">
              {formatINR(grandDayTotal, true)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 block">
              {t('wage.total_workers')}
            </span>
            <span className="text-sm font-bold text-emerald-300">
              {grandWorkersCount} Workers
            </span>
          </div>
        </div>

        {/* Day Actions: WhatsApp Share + Copy + Matrix Excel */}
        <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-emerald-900/40 text-xs">
          <button
            onClick={handleShareDayWhatsApp}
            className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/60 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleCopyDayWhatsApp}
            className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
          >
            {copiedDay ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportDayExcel}
            className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
          {t('wage.entries_for_date')} ({entries.length})
        </h4>

        {entries.map((entry, idx) => {
          const isExpanded = expandedEntryId === entry.id;

          return (
            <div
              key={entry.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-2.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-2 cursor-pointer flex-1"
                  onClick={() => toggleExpand(entry.id)}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{entry.totalWorkers} Workers</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        ({entry.totalMesans} M, {entry.totalHelpers} H)
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatINR(entry.totalWageAmount, true)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Edit Entry Button */}
                  {onEditEntry && (
                    <button
                      onClick={() => onEditEntry(entry)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Mistri / Helper Rates & Workers"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* WhatsApp Preview trigger */}
                  <button
                    onClick={() => setSelectedModalEntry(entry)}
                    className="p-1.5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-colors"
                    title="View WhatsApp Report & Matrix"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => toggleExpand(entry.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expandable Group Breakdowns */}
              {isExpanded && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs animate-fadeIn">
                  {entry.notes && (
                    <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>{entry.notes}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    {entry.groups.map((grp, gIdx) => {
                      // Dynamically calculate accurate totals
                      const grpTotals = calculateRateGroupTotals(grp, shiftHours);
                      const finalGroupTotal =
                        typeof grp.calculatedGroupTotal === 'number' && grp.calculatedGroupTotal > 0
                          ? grp.calculatedGroupTotal
                          : grpTotals.calculatedGroupTotal;

                      const finalBaseWage =
                        typeof grp.calculatedGroupBase === 'number' && grp.calculatedGroupBase > 0
                          ? grp.calculatedGroupBase
                          : grpTotals.calculatedGroupBase;

                      const finalOtWage =
                        typeof grp.calculatedGroupOt === 'number' && grp.calculatedGroupOt > 0
                          ? grp.calculatedGroupOt
                          : grpTotals.calculatedGroupOt;

                      return (
                        <div
                          key={grp.id || gIdx}
                          className="bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {grp.workerType === 'mesan' ? (
                                <HardHat className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Users className="w-3.5 h-3.5 text-blue-500" />
                              )}
                              <span className="font-bold text-slate-800 dark:text-slate-100">
                                {grp.count} {grp.workerType === 'mesan' ? 'Mesan' : 'Helper'} × ₹{grp.dayRate}
                              </span>
                            </div>

                            <span className="font-extrabold text-sm text-slate-900 dark:text-emerald-400 tabular-nums">
                              {formatINR(finalGroupTotal, true)}
                            </span>
                          </div>

                          {/* Itemized Base vs OT calculation breakdown */}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                            <span>Base: {formatINR(finalBaseWage, false)}</span>
                            {typeof grp.otWorkers === 'number' && grp.otWorkers > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {grp.otWorkers} OT × {grp.otHours || 0}h (+{formatINR(finalOtWage, true)})
                              </span>
                            ) : (
                              <span>No OT</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Entry Modal for Individual Entry WhatsApp & Matrix Export */}
      {selectedModalEntry && (
        <EntrySubmittedModal
          isOpen={true}
          onClose={() => setSelectedModalEntry(null)}
          site={activeSite}
          date={selectedModalEntry.date}
          groups={selectedModalEntry.groups}
          shiftHours={shiftHours}
          totalWorkers={selectedModalEntry.totalWorkers}
          totalWageAmount={selectedModalEntry.totalWageAmount}
        />
      )}
    </div>
  );
};
