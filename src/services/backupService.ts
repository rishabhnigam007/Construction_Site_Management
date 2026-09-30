import { db } from '../db';
import { getTodayString } from '../utils/formatters';
import { saveAndShareJson } from '../utils/fileDownloader';

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

export async function getDatabaseBackupJsonString(): Promise<{ jsonString: string; backupData: BackupData; sizeBytes: number }> {
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

  const backupData: BackupData = {
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

  const jsonString = JSON.stringify(backupData, null, 2);
  const sizeBytes = new Blob([jsonString]).size;
  return { jsonString, backupData, sizeBytes };
}

export async function exportFullDatabaseBackup(): Promise<string> {
  const { jsonString } = await getDatabaseBackupJsonString();
  const filename = `LabourManager_Pro_Backup_${getTodayString()}.json`;
  return await saveAndShareJson(jsonString, filename);
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
