import * as XLSX from 'xlsx';
import { Site, HeadcountEntry, PettyExpense } from '../types';
import { calculateRateGroupTotals } from '../utils/wageCalculator';
import { formatDateDMY } from '../utils/formatters';
import { saveAndShareExcel } from '../utils/fileDownloader';

export interface ExportExcelOptions {
  site: Site | undefined;
  startDate: string;
  endDate: string;
  headcountEntries: HeadcountEntry[];
  expenses?: PettyExpense[];
  shiftHours?: number;
}


export interface AttendanceMatrixData {
  rates: number[];
  rows: {
    date: string;
    formattedDate: string;
    rates: number[];
    counts: number[];
    dailyAmount: number;
  }[];
  totalAmount: number;
}

/**
 * Computes matrix data for on-screen preview and Excel export
 */
export function buildAttendanceMatrixData(
  headcountEntries: HeadcountEntry[],
  shiftHours = 8
): AttendanceMatrixData {
  // Discover all unique day rates from entries
  const rateSet = new Set<number>();
  headcountEntries.forEach((entry) => {
    entry.groups.forEach((grp) => {
      if (typeof grp.dayRate === 'number' && grp.dayRate > 0) {
        rateSet.add(grp.dayRate);
      }
    });
  });

  // If no rates entered yet, default to standard contractor rates
  let rates = Array.from(rateSet).sort((a, b) => b - a);
  if (rates.length === 0) {
    rates = [900, 850, 800, 600, 550];
  }

  // Group entries by date
  const dateMap = new Map<string, HeadcountEntry[]>();
  headcountEntries.forEach((entry) => {
    const list = dateMap.get(entry.date) || [];
    list.push(entry);
    dateMap.set(entry.date, list);
  });

  const sortedDates = Array.from(dateMap.keys()).sort();

  let grandTotal = 0;

  const rows = sortedDates.map((dateStr) => {
    const dayEntries = dateMap.get(dateStr) || [];
    const countsMap = new Map<number, number>();
    rates.forEach((r) => countsMap.set(r, 0));

    let dayTotalWage = 0;

    dayEntries.forEach((entry) => {
      entry.groups.forEach((grp) => {
        const rate = typeof grp.dayRate === 'number' ? grp.dayRate : 0;
        const count = typeof grp.count === 'number' ? grp.count : 0;
        if (rate > 0 && count > 0) {
          countsMap.set(rate, (countsMap.get(rate) || 0) + count);
        }

        const totals = calculateRateGroupTotals(grp, shiftHours);
        const groupTotal =
          typeof grp.calculatedGroupTotal === 'number' && grp.calculatedGroupTotal > 0
            ? grp.calculatedGroupTotal
            : totals.calculatedGroupTotal;

        dayTotalWage += groupTotal;
      });
    });

    grandTotal += dayTotalWage;

    return {
      date: dateStr,
      formattedDate: formatDateDMY(dateStr, true), // '17/10/2025'
      rates: [...rates],
      counts: rates.map((r) => countsMap.get(r) || 0),
      dailyAmount: dayTotalWage,
    };
  });

  return {
    rates,
    rows,
    totalAmount: grandTotal,
  };
}

export async function exportToExcelFile({
  site,
  startDate,
  endDate,
  headcountEntries,
  expenses = [],
  shiftHours = 8,
}: ExportExcelOptions): Promise<void> {
  const wb = XLSX.utils.book_new();


  // 1. Build Attendance Matrix Sheet (Exact contractor layout matching Image 2)
  const matrix = buildAttendanceMatrixData(headcountEntries, shiftHours);
  const { rates, rows, totalAmount } = matrix;
  const N = rates.length;

  const matrixSheetData: (string | number)[][] = [];

  // Header Row 1: Left cols empty, Right cols: Rates, Rightmost: 'Amount'
  const headerRow: (string | number)[] = [
    '', // Date col
    ...rates.map(() => ''), // Left rates block header empty
    ...rates, // Right count block header: [900, 850, 800, 600, 550]
    'Amount',
  ];
  matrixSheetData.push(headerRow);

  // Data Rows: Date | Rates Block | Counts Block | Daily Amount
  rows.forEach((row) => {
    const dataRow: (string | number)[] = [
      row.formattedDate,
      ...rates, // Left rate columns: e.g. 900, 850, 800, 600, 550
      ...row.counts, // Worker counts for each rate: e.g. 1, 1, 0, 2, 5
      row.dailyAmount, // Daily total amount: e.g. 5700
    ];
    matrixSheetData.push(dataRow);
  });

  // Summary Row: 'Total Amount' | blank... | Grand Total
  const totalRow: (string | number)[] = [
    'Total Amount',
    ...Array(N * 2).fill(''),
    totalAmount,
  ];
  matrixSheetData.push(totalRow);

  const wsMatrix = XLSX.utils.aoa_to_sheet(matrixSheetData);

  // Set column widths
  wsMatrix['!cols'] = [
    { wch: 14 }, // Date / Total Amount
    ...rates.map(() => ({ wch: 8 })), // Rate columns
    ...rates.map(() => ({ wch: 8 })), // Count columns
    { wch: 14 }, // Amount column
  ];

  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Attendance_Matrix');

  // 2. Sheet 2: Itemized Wages Breakdown
  const wageData = headcountEntries.flatMap((entry) =>
    entry.groups.map((grp) => {
      const totals = calculateRateGroupTotals(grp, shiftHours);
      const groupTotal =
        typeof grp.calculatedGroupTotal === 'number' && grp.calculatedGroupTotal > 0
          ? grp.calculatedGroupTotal
          : totals.calculatedGroupTotal;

      const otRate =
        typeof grp.calculatedOtRate === 'number' && grp.calculatedOtRate > 0
          ? grp.calculatedOtRate
          : totals.calculatedOtRate;

      const baseWage =
        typeof grp.calculatedGroupBase === 'number' && grp.calculatedGroupBase > 0
          ? grp.calculatedGroupBase
          : totals.calculatedGroupBase;

      const otWage =
        typeof grp.calculatedGroupOt === 'number' && grp.calculatedGroupOt > 0
          ? grp.calculatedGroupOt
          : totals.calculatedGroupOt;

      return {
        Date: formatDateDMY(entry.date, true),
        Site: site?.name || 'Site',
        'Labour Type': grp.workerType === 'mesan' ? 'Mesan' : 'Helper',
        'Worker Count': grp.count,
        'Day Rate (INR)': grp.dayRate,
        'Base Wage (INR)': baseWage,
        'OT Workers': grp.otWorkers || 0,
        'OT Hours': grp.otHours || 0,
        'OT Hourly Rate': otRate,
        'OT Wage (INR)': otWage,
        'Total Group Wage (INR)': groupTotal,
        Notes: entry.notes || '',
      };
    })
  );

  if (wageData.length > 0) {
    const wsWages = XLSX.utils.json_to_sheet(wageData);
    XLSX.utils.book_append_sheet(wb, wsWages, 'Daily_Wages_Itemized');
  }

  // 3. Sheet 3: Site Expenses (if any)
  if (expenses && expenses.length > 0) {
    const expenseData = expenses.map((exp) => ({
      Date: formatDateDMY(exp.date, true),
      Site: site?.name || 'Site',
      Category: exp.category,
      Description: exp.description,
      'Payment Mode': exp.paymentMode.toUpperCase(),
      'Amount (INR)': exp.amount,
      Vendor: exp.vendorName || '',
    }));

    const wsExpenses = XLSX.utils.json_to_sheet(expenseData);
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Site_Expenses');
  }

  // Generate and download / share natively
  const siteSlug = (site?.name || 'Site').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Attendance_Matrix_${siteSlug}_${startDate}_to_${endDate}.xlsx`;
  await saveAndShareExcel(wb, filename);
}

