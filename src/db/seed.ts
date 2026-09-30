import { db } from './index';
import { getTodayString } from '../utils/formatters';
import { Site, AppSettings } from '../types';

export const DEFAULT_SITE_ID = 'site_default_01';

export async function initializeDefaultData(): Promise<void> {
  const siteCount = await db.sites.count();
  const settingsCount = await db.settings.count();

  if (siteCount === 0) {
    const defaultSite: Site = {
      id: DEFAULT_SITE_ID,
      name: 'Main Construction Site (प्रोजेक्ट-1)',
      location: 'Site Location',
      clientName: 'Client / Owner',
      startDate: getTodayString(),
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.sites.add(defaultSite);
  }

  if (settingsCount === 0) {
    const defaultSettings: AppSettings = {
      id: 'global_settings',
      activeSiteId: DEFAULT_SITE_ID,
      language: 'en',
      theme: 'light',
      currencySymbol: '₹',
      standardShiftHours: 8,
    };
    await db.settings.add(defaultSettings);
  } else {
    // Ensure default is 8 hours if needed
    const existing = await db.settings.get('global_settings');
    if (existing && existing.standardShiftHours !== 8 && existing.standardShiftHours !== 9) {
      await db.settings.update('global_settings', { standardShiftHours: 8 });
    }
  }
}

