import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Copy,
  Check,
  Share2,
  FileSpreadsheet,
  X,
  Plus,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { RateGroup, Site, HeadcountEntry } from '../../types';
import { formatINR, formatDateDMY } from '../../utils/formatters';
import {
  formatDailyAttendanceWhatsApp,
  openWhatsAppWithMessage,
  copyTextToClipboard,
} from '../../utils/whatsappFormatter';
import { exportToExcelFile } from '../../services/excelExporter';

interface EntrySubmittedModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: Site | undefined;
  date: string;
  groups: RateGroup[];
  shiftHours?: number;
  totalWorkers: number;
  totalWageAmount: number;
  onNewEntry?: () => void;
  onViewHistory?: () => void;
}

export const EntrySubmittedModal: React.FC<EntrySubmittedModalProps> = ({
  isOpen,
  onClose,
  site,
  date,
  groups,
  shiftHours = 8,
  totalWorkers,
  totalWageAmount,
  onNewEntry,
  onViewHistory,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [showMatrixPreview, setShowMatrixPreview] = useState(false);

  if (!isOpen) return null;

  const siteName = site?.name || 'Site';
  const whatsappText = formatDailyAttendanceWhatsApp({
    date,
    siteName,
    groups,
    shiftHours,
  });

  const handleCopy = async () => {
    const success = await copyTextToClipboard(whatsappText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    openWhatsAppWithMessage(whatsappText);
  };

  const handleExportExcel = async () => {
    const tempEntry: HeadcountEntry = {
      id: `temp_${Date.now()}`,
      siteId: site?.id || 'site_default_01',
      date,
      groups,
      totalWorkers,
      totalMesans: groups.filter((g) => g.workerType === 'mesan').reduce((s, g) => s + Number(g.count || 0), 0),
      totalHelpers: groups.filter((g) => g.workerType === 'helper').reduce((s, g) => s + Number(g.count || 0), 0),
      totalWageAmount,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await exportToExcelFile({
      site,
      startDate: date,
      endDate: date,
      headcountEntries: [tempEntry],
      shiftHours,
    });
  };


  // Matrix preview values
  const uniqueRates = Array.from(
    new Set(groups.map((g) => (typeof g.dayRate === 'number' ? g.dayRate : 0)).filter((r) => r > 0))
  ).sort((a, b) => b - a);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-emerald-500/40 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>Entry Submitted Successfully!</span>
              </h3>
              <p className="text-[11px] text-emerald-400 font-medium">
                {formatDateDMY(date, false)} • {siteName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Day Total Wage Badge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Day Wage
              </span>
              <div className="text-xl font-black text-emerald-400 tabular-nums">
                {formatINR(totalWageAmount, true)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Workers
              </span>
              <div className="text-sm font-extrabold text-white">
                {totalWorkers} Workers
              </div>
            </div>
          </div>

          {/* Section 1: WhatsApp Report Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                WhatsApp Report Text
              </span>
              <span className="text-[10px] text-slate-400 font-mono">OT: Day Rate ÷ {shiftHours}</span>
            </div>

            {/* WhatsApp Chat Preview Card */}
            <div className="bg-[#0b141a] border border-[#202c33] rounded-2xl overflow-hidden shadow-inner">
              <div className="bg-[#1f2c34] px-3 py-1.5 flex items-center justify-between text-[11px] text-[#aebac1] border-b border-[#2a3942]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-emerald-400">WhatsApp Preview</span>
                </div>
                <span className="text-[10px] text-slate-400">Ready to Send</span>
              </div>

              <div className="p-3.5 bg-[#0b141a] font-mono text-xs text-[#e9edef] whitespace-pre-wrap leading-relaxed select-all">
                {whatsappText}
              </div>
            </div>

            {/* WhatsApp Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Send to WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-300" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: Excel Matrix Report */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                Excel Report Format
              </span>

              <button
                type="button"
                onClick={() => setShowMatrixPreview(!showMatrixPreview)}
                className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                <span>{showMatrixPreview ? 'Hide Matrix' : 'Preview Matrix'}</span>
                {showMatrixPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Matrix Row Preview Table */}
            {showMatrixPreview && (
              <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-xl p-2 animate-fadeIn">
                <table className="w-full text-center border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-1 text-left">Date</th>
                      {uniqueRates.map((r) => (
                        <th key={`hdr-rate-${r}`} className="p-1 border-l border-slate-800 text-slate-500">
                          {r}
                        </th>
                      ))}
                      {uniqueRates.map((r) => (
                        <th key={`hdr-cnt-${r}`} className="p-1 border-l border-slate-800 text-amber-400 font-bold">
                          {r}
                        </th>
                      ))}
                      <th className="p-1 border-l border-slate-800 text-emerald-400 font-bold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-white font-mono">
                      <td className="p-1 text-left text-slate-300">{formatDateDMY(date, true)}</td>
                      {uniqueRates.map((r) => (
                        <td key={`r-val-${r}`} className="p-1 border-l border-slate-800 text-slate-400">
                          {r}
                        </td>
                      ))}
                      {uniqueRates.map((r) => {
                        const cnt = groups
                          .filter((g) => g.dayRate === r)
                          .reduce((s, g) => s + Number(g.count || 0), 0);
                        return (
                          <td key={`c-val-${r}`} className="p-1 border-l border-slate-800 font-bold text-amber-300">
                            {cnt}
                          </td>
                        );
                      })}
                      <td className="p-1 border-l border-slate-800 font-extrabold text-emerald-400">
                        {totalWageAmount}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <button
              type="button"
              onClick={handleExportExcel}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-blue-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              <span>Download Excel Report (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-950 border-t border-slate-800 p-3 flex items-center gap-2">
          {onNewEntry && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNewEntry();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ New Entry</span>
            </button>
          )}

          {onViewHistory && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewHistory();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <span>View Saved Records</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
