import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './index';
import { HeadcountEntry, Site, PettyExpense, NamedWorker, WorkerAttendance, AppSettings } from '../types';

export function useAppSettings(): AppSettings | undefined {
  return useLiveQuery(() => db.settings.get('global_settings'));
}

export function useSites(): Site[] {
  return useLiveQuery(() => db.sites.toArray()) || [];
}

export function useActiveSite(activeSiteId?: string): Site | undefined {
  return useLiveQuery(() => {
    if (!activeSiteId) return undefined;
    return db.sites.get(activeSiteId);
  }, [activeSiteId]);
}

export function useDailyHeadcount(siteId?: string, date?: string): HeadcountEntry[] {
  return useLiveQuery(() => {
    if (!siteId || !date) return [];
    return db.headcountEntries.where({ siteId, date }).toArray();
  }, [siteId, date]) || [];
}

export function useDailyExpenses(siteId?: string, date?: string): PettyExpense[] {
  return useLiveQuery(() => {
    if (!siteId || !date) return [];
    return db.pettyExpenses.where({ siteId, date }).toArray();
  }, [siteId, date]) || [];
}

export function useNamedWorkers(siteId?: string): NamedWorker[] {
  return useLiveQuery(() => {
    if (!siteId) return [];
    return db.namedWorkers.where({ siteId }).toArray();
  }, [siteId]) || [];
}

export function useWorkerAttendance(siteId?: string, date?: string): WorkerAttendance[] {
  return useLiveQuery(() => {
    if (!siteId || !date) return [];
    return db.workerAttendance.where({ siteId, date }).toArray();
  }, [siteId, date]) || [];
}
