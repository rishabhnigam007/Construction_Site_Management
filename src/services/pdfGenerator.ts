import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Site, HeadcountEntry, PettyExpense, NamedWorker, WorkerAttendance } from '../types';
import { formatPDFCurrency, formatDateDMY } from '../utils/formatters';
import { calculateRateGroupTotals } from '../utils/wageCalculator';

interface GenerateReportOptions {
  site: Site | undefined;
  startDate: string;
  endDate: string;
  headcountEntries: HeadcountEntry[];
  expenses: PettyExpense[];
  shiftHours?: number;
}

interface GenerateMusterRollOptions {
  site: Site | undefined;
  date: string;
  workers: NamedWorker[];
  attendanceList: WorkerAttendance[];
  shiftHours?: number;
}

export function generateLabourReportPDF({
  site,
  startDate,
  endDate,
  headcountEntries,
  expenses,
  shiftHours = 8,
}: GenerateReportOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const siteTitle = site ? site.name : 'Construction Site';
  const siteLocation = site?.location || '';
  const dateRangeText =
    startDate === endDate
      ? formatDateDMY(startDate, true)
      : `${formatDateDMY(startDate, true)} to ${formatDateDMY(endDate, true)}`;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(siteTitle, 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  if (siteLocation) {
    doc.text(`Location: ${siteLocation}`, 14, 18);
  }
  doc.text(`Billing Period: ${dateRangeText}`, 14, 24);

  // App Branding Badge
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text('LABOUR MANAGER PRO • OFFICIAL SITE LEDGER', 135, 12);

  // Financial Summary KPI Cards
  const totalLabourCost = headcountEntries.reduce((acc, curr) => acc + curr.totalWageAmount, 0);
  const totalExpenseCost = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const grandTotalCost = totalLabourCost + totalExpenseCost;
  const totalWorkerDays = headcountEntries.reduce((acc, curr) => acc + curr.totalWorkers, 0);

  let currentY = 38;

  // KPI Row
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 58, 18, 2, 2, 'FD');
  doc.roundedRect(76, currentY, 58, 18, 2, 2, 'FD');
  doc.roundedRect(138, currentY, 58, 18, 2, 2, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL LABOUR WAGES', 18, currentY + 6);
  doc.text('TOTAL SITE KHARCHA', 80, currentY + 6);
  doc.text('GRAND TOTAL BILL', 142, currentY + 6);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(formatPDFCurrency(totalLabourCost, true), 18, currentY + 13);
  doc.text(formatPDFCurrency(totalExpenseCost, true), 80, currentY + 13);

  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(formatPDFCurrency(grandTotalCost, true), 142, currentY + 13);

  currentY += 26;

  // Table 1: Daily Wage Breakdown
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`1. Daily Labour Wage Breakdown (${totalWorkerDays} Total Worker Days)`, 14, currentY);
  currentY += 4;

  const wageTableRows: (string | number)[][] = [];
  headcountEntries.forEach((entry) => {
    entry.groups.forEach((grp, gIdx) => {
      const totals = calculateRateGroupTotals(grp, shiftHours);
      const groupTotal =
        typeof grp.calculatedGroupTotal === 'number' && grp.calculatedGroupTotal > 0
          ? grp.calculatedGroupTotal
          : totals.calculatedGroupTotal;

      const baseWage =
        typeof grp.calculatedGroupBase === 'number' && grp.calculatedGroupBase > 0
          ? grp.calculatedGroupBase
          : totals.calculatedGroupBase;

      const otWage =
        typeof grp.calculatedGroupOt === 'number' && grp.calculatedGroupOt > 0
          ? grp.calculatedGroupOt
          : totals.calculatedGroupOt;

      const otSummary =
        typeof grp.otWorkers === 'number' && grp.otWorkers > 0
          ? `${grp.otWorkers} OT × ${grp.otHours || 0}h (Rs. ${otWage})`
          : '-';

      wageTableRows.push([
        gIdx === 0 ? formatDateDMY(entry.date, true) : '',
        grp.workerType === 'mesan' ? 'Mesan (Mistri)' : 'Helper (Mazdoor)',
        grp.count,
        `Rs. ${grp.dayRate}`,
        `Rs. ${baseWage}`,
        otSummary,
        `Rs. ${groupTotal}`,
      ]);
    });
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Date (DD/MM/YYYY)', 'Labour Type', 'Count', 'Day Rate', 'Base Wage', 'Overtime (OT)', 'Group Total']],
    body: wageTableRows.length > 0 ? wageTableRows : [['No wage records found in range', '', '', '', '', '', '']],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' }, // Date
      1: { cellWidth: 32, halign: 'left' },   // Labour Type
      2: { cellWidth: 14, halign: 'center' }, // Count
      3: { cellWidth: 20, halign: 'right' },  // Day Rate
      4: { cellWidth: 22, halign: 'right' },  // Base Wage
      5: { cellWidth: 42, halign: 'left' },   // Overtime (OT)
      6: { cellWidth: 26, halign: 'right' },  // Group Total
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // @ts-ignore
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Table 2: Site Expenses
  if (expenses.length > 0) {
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Site Petty Cash Expenses', 14, currentY);
    currentY += 4;

    const expenseTableRows = expenses.map((exp) => [
      formatDateDMY(exp.date, true),
      exp.category.replace('_', ' ').toUpperCase(),
      exp.description,
      exp.paymentMode.toUpperCase(),
      `Rs. ${exp.amount}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Date (DD/MM/YYYY)', 'Category', 'Description', 'Mode', 'Amount']],
      body: expenseTableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 28, halign: 'center' },
        1: { cellWidth: 34, halign: 'left' },
        2: { cellWidth: 66, halign: 'left' },
        3: { cellWidth: 24, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' },
      },
    });
  }

  return doc;
}

/**
 * Generates a standalone Muster Roll & Manager Attendance PDF report
 */
export function generateMusterRollPDF({
  site,
  date,
  workers,
  attendanceList,
}: GenerateMusterRollOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const siteTitle = site ? site.name : 'Construction Site';
  const formattedDate = formatDateDMY(date, true); // DD/MM/YYYY format

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(`STAFF & WORKER MUSTER ROLL`, 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Site: ${siteTitle} • Date: ${formattedDate}`, 14, 19);
  doc.text(`Official Attendance & Manager Wage Verification Sheet`, 14, 25);

  // Financial Summary KPI Cards
  const totalWage = attendanceList.reduce((acc, curr) => acc + (curr.calculatedWage || 0), 0);
  const presentCount = attendanceList.filter((a) => a.status === 'full' || a.status === 'half').length;

  let currentY = 36;

  // KPI Row
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 88, 16, 2, 2, 'FD');
  doc.roundedRect(108, currentY, 88, 16, 2, 2, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESENT HEADCOUNT', 18, currentY + 5);
  doc.text('TOTAL WAGE PAYABLE', 112, currentY + 5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(`${presentCount} of ${workers.length} Present`, 18, currentY + 12);

  doc.setTextColor(5, 150, 105);
  doc.text(formatPDFCurrency(totalWage, true), 112, currentY + 12);

  currentY += 24;

  // Build Table
  const attendanceMap = new Map<string, WorkerAttendance>();
  attendanceList.forEach((a) => attendanceMap.set(a.workerId, a));

  const tableRows = workers.map((w, idx) => {
    const att = attendanceMap.get(w.id);
    const statusText =
      att?.status === 'full'
        ? 'Present (Full)'
        : att?.status === 'half'
        ? 'Half Day (HD)'
        : 'Absent';
    const dayRate = att?.dayRate || w.defaultDayRate;
    const otHours = att?.otHours || 0;
    const earned = att?.calculatedWage ?? (att?.status === 'full' ? dayRate : att?.status === 'half' ? dayRate * 0.5 : 0);

    return [
      idx + 1,
      w.name,
      w.role.toUpperCase(),
      w.phone || '-',
      statusText,
      `Rs. ${dayRate}`,
      otHours > 0 ? `${otHours}h` : '-',
      `Rs. ${earned}`,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Name', 'Role / Trade', 'Phone', 'Attendance', 'Daily Rate', 'OT', 'Earned Wage']],
    body: tableRows.length > 0 ? tableRows : [['-', 'No registered workers', '', '', '', '', '', '']],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' }, // #
      1: { cellWidth: 36, halign: 'left' },   // Name
      2: { cellWidth: 30, halign: 'left' },   // Role
      3: { cellWidth: 24, halign: 'center' }, // Phone
      4: { cellWidth: 28, halign: 'center' }, // Attendance
      5: { cellWidth: 22, halign: 'right' },  // Daily Rate
      6: { cellWidth: 12, halign: 'center' }, // OT
      7: { cellWidth: 20, halign: 'right' },  // Earned Wage
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  return doc;
}
