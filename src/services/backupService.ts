import { db } from '../db';
import { getTodayString } from '../utils/formatters';

export interface BackupData {
  version: number;
  exportedAt: number;
  dateString: string;
  sites: any[];
  contractors: any[];
  headcountEntries: any[];
  namedWorkers: any[];
  workerAttendance: any[];
  pettyExpenses: any[];
  settings: any[];
}

export async function exportFullDatabaseBackup(): Promise<string> {
  const [
    sites,
    contractors,
    headcountEntries,
    namedWorkers,
    workerAttendance,
    pettyExpenses,
    settings,
  ] = await Promise.all([
    db.sites.toArray(),
    db.contractors.toArray(),
    db.headcountEntries.toArray(),
    db.namedWorkers.toArray(),
    db.workerAttendance.toArray(),
    db.pettyExpenses.toArray(),
    db.settings.toArray(),
  ]);

  const backup: BackupData = {
    version: 1,
    exportedAt: Date.now(),
    dateString: getTodayString(),
    sites,
    contractors,
    headcountEntries,
    namedWorkers,
    workerAttendance,
    pettyExpenses,
    settings,
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `LabourManager_Pro_Backup_${getTodayString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return a.download;
}

export async function restoreDatabaseFromJson(jsonString: string): Promise<boolean> {
  try {
    const data: BackupData = JSON.parse(jsonString);

    if (!data.version || !Array.isArray(data.sites)) {
      throw new Error('Invalid backup file structure.');
    }

    await db.transaction('rw', [
      db.sites,
      db.contractors,
      db.headcountEntries,
      db.namedWorkers,
      db.workerAttendance,
      db.pettyExpenses,
      db.settings,
    ], async () => {
      // Clear existing tables
      await Promise.all([
        db.sites.clear(),
        db.contractors.clear(),
        db.headcountEntries.clear(),
        db.namedWorkers.clear(),
        db.workerAttendance.clear(),
        db.pettyExpenses.clear(),
        db.settings.clear(),
      ]);

      // Bulk add restored data
      if (data.sites?.length) await db.sites.bulkAdd(data.sites);
      if (data.contractors?.length) await db.contractors.bulkAdd(data.contractors);
      if (data.headcountEntries?.length) await db.headcountEntries.bulkAdd(data.headcountEntries);
      if (data.namedWorkers?.length) await db.namedWorkers.bulkAdd(data.namedWorkers);
      if (data.workerAttendance?.length) await db.workerAttendance.bulkAdd(data.workerAttendance);
      if (data.pettyExpenses?.length) await db.pettyExpenses.bulkAdd(data.pettyExpenses);
      if (data.settings?.length) await db.settings.bulkAdd(data.settings);
    });

    return true;
  } catch (err) {
    console.error('Failed to restore backup:', err);
    throw err;
  }
}
