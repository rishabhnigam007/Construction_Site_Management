import Dexie, { Table } from 'dexie';
import {
  Site,
  Contractor,
  HeadcountEntry,
  NamedWorker,
  WorkerAttendance,
  PettyExpense,
  AppSettings,
} from '../types';

export class LabourManagerDatabase extends Dexie {
  sites!: Table<Site, string>;
  contractors!: Table<Contractor, string>;
  headcountEntries!: Table<HeadcountEntry, string>;
  namedWorkers!: Table<NamedWorker, string>;
  workerAttendance!: Table<WorkerAttendance, string>;
  pettyExpenses!: Table<PettyExpense, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('LabourManagerProDB');

    this.version(1).stores({
      sites: 'id, name, status, createdAt',
      contractors: 'id, siteId, name, trade',
      headcountEntries: 'id, siteId, contractorId, date, [siteId+date]',
      namedWorkers: 'id, siteId, contractorId, role, status',
      workerAttendance: 'id, siteId, workerId, date, [siteId+date], [workerId+date]',
      pettyExpenses: 'id, siteId, date, category, [siteId+date]',
      settings: 'id',
    });
  }
}

export const db = new LabourManagerDatabase();

/**
 * Ensures persistent storage request to Android / Webview
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        return await navigator.storage.persist();
      }
      return true;
    } catch (err) {
      console.warn('Storage persistence request error:', err);
    }
  }
  return false;
}
