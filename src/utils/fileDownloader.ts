import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

/**
 * Saves and opens/shares a PDF document natively on Android / iOS
 * or falls back to standard browser download on desktop web.
 */
export async function saveAndSharePdf(doc: jsPDF, filename: string): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      // Extract base64 from jsPDF output
      const dataUri = doc.output('datauristring');
      const base64Data = dataUri.split(',')[1];

      // Save to native temporary cache directory
      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });

      // Trigger native Android Share Sheet / File Opener
      await Share.share({
        title: filename,
        text: `Labour Manager Pro - ${filename}`,
        url: savedFile.uri,
        dialogTitle: `Open / Share ${filename}`,
      });
    } else {
      // Standard browser download
      doc.save(filename);
    }
  } catch (err) {
    console.error('Failed to export PDF:', err);
    // Fallback attempt
    try {
      doc.save(filename);
    } catch {
      // ignore
    }
  }
}

/**
 * Saves and opens/shares an Excel (.xlsx) workbook natively on Android / iOS
 * or falls back to standard browser download on desktop web.
 */
export async function saveAndShareExcel(wb: XLSX.WorkBook, filename: string): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      // Generate base64 binary representation of Excel workbook
      const base64Data = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

      // Save to native temporary cache directory
      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });

      // Trigger native Android Share Sheet / File Opener
      await Share.share({
        title: filename,
        text: `Labour Manager Pro - ${filename}`,
        url: savedFile.uri,
        dialogTitle: `Open / Share ${filename}`,
      });
    } else {
      // Standard browser download
      XLSX.writeFile(wb, filename);
    }
  } catch (err) {
    console.error('Failed to export Excel file:', err);
    // Fallback attempt
    try {
      XLSX.writeFile(wb, filename);
    } catch {
      // ignore
    }
  }
}

/**
 * Saves and opens/shares a JSON backup file natively on Android / iOS
 * or falls back to standard browser download on desktop web.
 */
export async function saveAndShareJson(jsonString: string, filename: string): Promise<string> {
  try {
    if (Capacitor.isNativePlatform()) {
      // Base64 encode the JSON string safely
      const base64Data = btoa(unescape(encodeURIComponent(jsonString)));

      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: filename,
        text: `Labour Manager Pro Database Backup - ${filename}`,
        url: savedFile.uri,
        dialogTitle: `Save / Share ${filename}`,
      });

      return filename;
    } else {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return filename;
    }
  } catch (err) {
    console.error('Failed to save JSON file:', err);
    return filename;
  }
}
