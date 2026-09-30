/**
 * Formats a number into Indian Rupee currency string (e.g. ₹ 1,23,450 or ₹ 850.00)
 */
export function formatINR(amount: number | undefined | null, showDecimals = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹ 0';
  }

  const rounded = Number(amount.toFixed(2));
  const parts = rounded.toString().split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] || '00';

  // Indian numbering format (commas after 3 digits, then every 2 digits)
  const isNegative = integerPart.startsWith('-');
  if (isNegative) integerPart = integerPart.substring(1);

  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const sign = isNegative ? '-' : '';

  if (!showDecimals || (decimalPart === '00' && !showDecimals)) {
    return `${sign}₹ ${formattedInteger || '0'}`;
  }

  return `${sign}₹ ${formattedInteger || '0'}.${decimalPart.padEnd(2, '0')}`;
}

/**
 * Formats a number into PDF-compatible currency string (Rs. 1,23,450.00) without Unicode symbols
 * to prevent superscript 1 rendering bugs in standard PDF Helvetica fonts.
 */
export function formatPDFCurrency(amount: number | undefined | null, showDecimals = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return showDecimals ? 'Rs. 0.00' : 'Rs. 0';
  }

  const rounded = Number(amount.toFixed(2));
  const parts = rounded.toString().split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] || '00';

  const isNegative = integerPart.startsWith('-');
  if (isNegative) integerPart = integerPart.substring(1);

  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const sign = isNegative ? '-' : '';

  if (!showDecimals || (decimalPart === '00' && !showDecimals)) {
    return `${sign}Rs. ${formattedInteger || '0'}`;
  }

  return `${sign}Rs. ${formattedInteger || '0'}.${decimalPart.padEnd(2, '0')}`;
}


/**
 * Formats a date string 'YYYY-MM-DD' into readable display format (e.g. "24 Sep 2026, Thursday")
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    weekday: 'short',
  });
}

/**
 * Returns today's date in 'YYYY-MM-DD' local format
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Offsets a date string 'YYYY-MM-DD' by delta days
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date string 'YYYY-MM-DD' into standard Indian format 'D/M/YYYY' or 'DD/MM/YYYY'
 * (e.g. '2026-03-25' -> '25/3/2026', or padZero=true -> '25/03/2026')
 */
export function formatDateDMY(dateStr: string, padZero = false): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = padZero ? parts[1].padStart(2, '0') : String(parseInt(parts[1], 10));
    const day = padZero ? parts[2].padStart(2, '0') : String(parseInt(parts[2], 10));
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

