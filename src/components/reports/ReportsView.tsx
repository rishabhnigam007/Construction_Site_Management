import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Share2,
  Download,
  Calendar,
  Receipt,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  Copy,
  Check,
  Table,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Site, HeadcountEntry, PettyExpense } from '../../types';
import { formatINR, getTodayString, addDaysToDateString, formatDateDMY } from '../../utils/formatters';
import { generateLabourReportPDF } from '../../services/pdfGenerator';
import { exportToExcelFile, buildAttendanceMatrixData } from '../../services/excelExporter';
import {
  formatPeriodAttendanceWhatsApp,
  openWhatsAppWithMessage,
  copyTextToClipboard,
} from '../../utils/whatsappFormatter';
import { useAppSettings } from '../../db/hooks';
import { db } from '../../db';

interface ReportsViewProps {
  activeSite: Site | undefined;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ activeSite }) => {
  const { t } = useTranslation();
  const settings = useAppSettings();
  const shiftHours = settings?.standardShiftHours || 8;
  const today = getTodayString();

  const [dateRangeMode, setDateRangeMode] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('month');
  const [startDate, setStartDate] = useState(addDaysToDateString(today, -29));
  const [endDate, setEndDate] = useState(today);
  const [isExporting, setIsExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);
  const [showMatrixView, setShowMatrixView] = useState(true);

  // Filter range
  const handleRangeModeChange = (mode: 'today' | 'week' | 'month' | 'all' | 'custom') => {
    setDateRangeMode(mode);
    if (mode === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (mode === 'week') {
      setStartDate(addDaysToDateString(today, -6));
      setEndDate(today);
    } else if (mode === 'month') {
      setStartDate(addDaysToDateString(today, -29));
      setEndDate(today);
    } else if (mode === 'all') {
      setStartDate('2020-01-01');
      setEndDate(addDaysToDateString(today, 30));
    }
  };

  const [headcountEntries, setHeadcountEntries] = useState<HeadcountEntry[]>([]);
  const [expenses, setExpenses] = useState<PettyExpense[]>([]);

  // Fetch data for selected range
  React.useEffect(() => {
    if (!activeSite) return;

    const fetchData = async () => {
      const allEntries = await db.headcountEntries
        .where('siteId')
        .equals(activeSite.id)
        .toArray();
      const filteredEntries = allEntries.filter(
        (e) => e.date >= startDate && e.date <= endDate
      );

      const allExpenses = await db.pettyExpenses
        .where('siteId')
        .equals(activeSite.id)
        .toArray();
      const filteredExpenses = allExpenses.filter(
        (e) => e.date >= startDate && e.date <= endDate
      );

      setHeadcountEntries(filteredEntries);
      setExpenses(filteredExpenses);
    };

    fetchData();
  }, [activeSite, startDate, endDate]);

  const totalLabourCost = headcountEntries.reduce((acc, curr) => acc + curr.totalWageAmount, 0);
  const totalExpenseCost = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const grandTotalCost = totalLabourCost + totalExpenseCost;
  const totalWorkerDays = headcountEntries.reduce((acc, curr) => acc + curr.totalWorkers, 0);

  // Matrix computation
  const matrixData = buildAttendanceMatrixData(headcountEntries, shiftHours);

  // Period WhatsApp text
  const whatsappSummaryText = formatPeriodAttendanceWhatsApp(
    activeSite?.name || 'Site',
    startDate,
    endDate,
    headcountEntries,
    shiftHours
  );

  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      const doc = generateLabourReportPDF({
        site: activeSite,
        startDate,
        endDate,
        headcountEntries,
        expenses,
        shiftHours,
      });
      const siteSlug = (activeSite?.name || 'Site').replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`LabourReport_${siteSlug}_${startDate}_to_${endDate}.pdf`);
      setSuccessMsg('PDF Report downloaded successfully!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleWhatsAppShareText = () => {
    openWhatsAppWithMessage(whatsappSummaryText);
  };

  const handleCopyWhatsAppText = async () => {
    const success = await copyTextToClipboard(whatsappSummaryText);
    if (success) {
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2500);
    }
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      exportToExcelFile({
        site: activeSite,
        startDate,
        endDate,
        headcountEntries,
        expenses,
        shiftHours,
      });
      setSuccessMsg('Attendance Matrix (.xlsx) file exported successfully!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Date Range Selector Chips */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span>Select Billing Period</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            (Shift: {shiftHours}h standard)
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1">
          {(['today', 'week', 'month', 'all', 'custom'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleRangeModeChange(mode)}
              className={`py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                dateRangeMode === mode
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {mode === 'today'
                ? t('reports.today')
                : mode === 'week'
                ? 'Week'
                : mode === 'month'
                ? 'Month'
                : mode === 'all'
                ? 'All Time'
                : t('reports.custom')}
            </button>
          ))}
        </div>

        {dateRangeMode === 'custom' && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">From Date</label>
              <input
                type="date"
                min="2000-01-01"
                max="2099-12-31"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">To Date</label>
              <input
                type="date"
                min="2000-01-01"
                max="2099-12-31"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white [color-scheme:dark]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Total Labour Cost */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <span>Labour Wages</span>
          </div>
          <div className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
            {formatINR(totalLabourCost, true)}
          </div>
          <div className="text-[10px] text-slate-400">
            {totalWorkerDays} Worker Days Logged
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
            <Receipt className="w-3.5 h-3.5 text-amber-500" />
            <span>Site Kharcha</span>
          </div>
          <div className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
            {formatINR(totalExpenseCost, true)}
          </div>
          <div className="text-[10px] text-slate-400">
            {expenses.length} Petty Expense Items
          </div>
        </div>
      </div>

      {/* Grand Total Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-ledger space-y-1">
        <span className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider">
          {t('reports.grand_total')}
        </span>
        <div className="text-2xl font-black text-white tabular-nums">
          {formatINR(grandTotalCost, true)}
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2 pt-1">
          <span>{activeSite?.name}</span>
          <span>•</span>
          <span>{headcountEntries.length} Wage Entries ({formatDateDMY(startDate)} to {formatDateDMY(endDate)})</span>
        </div>
      </div>

      {/* SECTION: ATTENDANCE MATRIX (MATCHING IMAGE 2 EXACT FORMAT) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-emerald-500" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
              Attendance Matrix (Excel Format)
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-bold text-[11px] flex items-center gap-1 border border-blue-500/30 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export .xlsx</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMatrixView(!showMatrixView)}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              {showMatrixView ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showMatrixView && (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            {matrixData.rows.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium">
                No entries found in this date range. Record daily wages to view matrix.
              </div>
            ) : (
              <table className="w-full text-center border-collapse text-[11px] whitespace-nowrap">
                <thead>
                  {/* Top Header Row: Left cols blank, Right cols Rates, Rightmost: Amount */}
                  <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="p-2 text-left border-r border-slate-200 dark:border-slate-800">Date</th>
                    {matrixData.rates.map((r, i) => (
                      <th
                        key={`top-left-${r}-${i}`}
                        className="p-2 border-r border-slate-200 dark:border-slate-800 text-slate-400 font-normal"
                      >
                        {/* Blank or rate header */}
                      </th>
                    ))}
                    {matrixData.rates.map((r) => (
                      <th
                        key={`top-rate-${r}`}
                        className="p-2 border-r border-slate-200 dark:border-slate-800 text-amber-500 font-extrabold bg-amber-500/10"
                      >
                        {r}
                      </th>
                    ))}
                    <th className="p-2 text-emerald-500 font-extrabold bg-emerald-500/10">Amount</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {matrixData.rows.map((row) => (
                    <tr
                      key={row.date}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-2 text-left font-sans font-medium text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                        {row.formattedDate}
                      </td>
                      {/* Left Block: Rates */}
                      {matrixData.rates.map((r, i) => (
                        <td
                          key={`row-r-${row.date}-${r}-${i}`}
                          className="p-2 border-r border-slate-200 dark:border-slate-800 text-slate-400"
                        >
                          {r}
                        </td>
                      ))}
                      {/* Right Block: Worker Counts */}
                      {row.counts.map((cnt, i) => (
                        <td
                          key={`row-c-${row.date}-${i}`}
                          className={`p-2 border-r border-slate-200 dark:border-slate-800 font-bold ${
                            cnt > 0 ? 'text-amber-400 bg-amber-500/5' : 'text-slate-500'
                          }`}
                        >
                          {cnt}
                        </td>
                      ))}
                      {/* Daily Total Amount */}
                      <td className="p-2 font-extrabold text-emerald-500 dark:text-emerald-400 bg-emerald-500/5">
                        {row.dailyAmount}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Footer Total Row */}
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-950 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                    <td className="p-2.5 text-left font-extrabold border-r border-slate-200 dark:border-slate-800">
                      Total Amount
                    </td>
                    {matrixData.rates.map((_, i) => (
                      <td key={`tot-l-${i}`} className="p-2 border-r border-slate-200 dark:border-slate-800"></td>
                    ))}
                    {matrixData.rates.map((_, i) => (
                      <td key={`tot-r-${i}`} className="p-2 border-r border-slate-200 dark:border-slate-800"></td>
                    ))}
                    <td className="p-2.5 text-base font-black text-emerald-500 dark:text-emerald-400 tabular-nums bg-emerald-500/10">
                      {matrixData.totalAmount}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )}
      </div>

      {/* SECTION: WHATSAPP REPORT DRAWER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-500" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
              WhatsApp Attendance Report
            </h4>
          </div>

          <button
            type="button"
            onClick={() => setShowWhatsAppPreview(!showWhatsAppPreview)}
            className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>{showWhatsAppPreview ? 'Hide Text' : 'View Text'}</span>
            {showWhatsAppPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Formatted Text Preview */}
        {showWhatsAppPreview && (
          <div className="p-3 bg-[#0b141a] border border-[#202c33] rounded-xl font-mono text-xs text-[#e9edef] whitespace-pre-wrap leading-relaxed select-all">
            {whatsappSummaryText}
          </div>
        )}

        {/* WhatsApp Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleWhatsAppShareText}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </button>

          <button
            onClick={handleCopyWhatsAppText}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            {copiedWhatsApp ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-300" />
                <span>Copy WhatsApp Text</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Action Hub */}
      <div className="space-y-2 pt-1">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1 uppercase tracking-wider">
          Download Documents
        </h4>

        {/* Downloads Grid */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
