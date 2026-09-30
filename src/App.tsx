import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TabType, HeadcountEntry } from './types';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { SiteSelectorModal } from './components/layout/SiteSelectorModal';
import { HeadcountEntryForm } from './components/daily-wage/HeadcountEntryForm';
import { DailyWageHistoryList } from './components/daily-wage/DailyWageHistoryList';
import { WorkerAttendanceList } from './components/roster/WorkerAttendanceList';
import { PettyCashForm } from './components/petty-cash/PettyCashForm';
import { PettyCashList } from './components/petty-cash/PettyCashList';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { getTodayString } from './utils/formatters';
import { initializeDefaultData } from './db/seed';
import { requestPersistentStorage, db } from './db';
import {
  useAppSettings,
  useSites,
  useActiveSite,
  useDailyHeadcount,
  useDailyExpenses,
  useNamedWorkers,
  useWorkerAttendance,
} from './db/hooks';

export function App() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [activeTab, setActiveTab] = useState<TabType>('daily-wage');
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [wageViewSubTab, setWageViewSubTab] = useState<'new_entry' | 'history'>('new_entry');
  const [editingWageEntry, setEditingWageEntry] = useState<HeadcountEntry | null>(null);

  const settings = useAppSettings();
  const sites = useSites();
  const activeSite = useActiveSite(settings?.activeSiteId);

  // Live database queries for current site & date
  const dailyHeadcount = useDailyHeadcount(settings?.activeSiteId, selectedDate);
  const dailyExpenses = useDailyExpenses(settings?.activeSiteId, selectedDate);
  const namedWorkers = useNamedWorkers(settings?.activeSiteId);
  const workerAttendance = useWorkerAttendance(settings?.activeSiteId, selectedDate);

  useEffect(() => {
    // Initialize default site and persist storage on app start
    initializeDefaultData();
    requestPersistentStorage();
  }, []);

  const handleSelectSite = async (siteId: string) => {
    await db.settings.update('global_settings', { activeSiteId: siteId });
  };

  const handleStartEditEntry = (entry: HeadcountEntry) => {
    setEditingWageEntry(entry);
    setWageViewSubTab('new_entry');
  };

  const handleCancelEditEntry = () => {
    setEditingWageEntry(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans max-w-lg mx-auto relative antialiased selection:bg-emerald-500 selection:text-slate-950 border-x border-slate-200 dark:border-slate-800 shadow-2xl">
      {/* Top Header */}
      <Header
        activeSite={activeSite}
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setEditingWageEntry(null);
          if (date !== getTodayString()) {
            setWageViewSubTab('history');
          }
        }}
        onOpenSiteModal={() => setIsSiteModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-3.5 overflow-y-auto">
        {/* Tab 1: Daily Wages (Headcount Mode) */}
        {activeTab === 'daily-wage' && (
          <div className="space-y-4">
            {/* Sub-tab Switcher: New Entry vs Saved History */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-sm">
              <button
                onClick={() => {
                  setEditingWageEntry(null);
                  setWageViewSubTab('new_entry');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  wageViewSubTab === 'new_entry'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {editingWageEntry
                  ? '✏️ Edit Wage Entry'
                  : selectedDate === getTodayString()
                  ? '+ New Wage Entry'
                  : '+ New Wage Entry (Today Only)'}
              </button>
              <button
                onClick={() => {
                  setEditingWageEntry(null);
                  setWageViewSubTab('history');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  wageViewSubTab === 'history'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Saved Records ({dailyHeadcount.length})
              </button>
            </div>

            {wageViewSubTab === 'new_entry' ? (
              <HeadcountEntryForm
                siteId={settings?.activeSiteId || 'site_default_01'}
                selectedDate={selectedDate}
                defaultShiftHours={settings?.standardShiftHours || 8}
                entryToEdit={editingWageEntry}
                onCancelEdit={handleCancelEditEntry}
                onEntrySaved={() => {
                  setEditingWageEntry(null);
                }}
                onViewHistory={() => {
                  setEditingWageEntry(null);
                  setWageViewSubTab('history');
                }}
                onSelectToday={() => {
                  setSelectedDate(getTodayString());
                  setEditingWageEntry(null);
                  setWageViewSubTab('new_entry');
                }}
              />
            ) : (
              <DailyWageHistoryList
                entries={dailyHeadcount}
                onEditEntry={handleStartEditEntry}
              />
            )}
          </div>
        )}

        {/* Tab 2: Named Worker Attendance (Muster Roll) */}
        {activeTab === 'roster' && (
          <WorkerAttendanceList
            siteId={settings?.activeSiteId || 'site_default_01'}
            selectedDate={selectedDate}
            workers={namedWorkers}
            attendanceList={workerAttendance}
          />
        )}

        {/* Tab 3: Site Kharcha (Petty Cash Expenses) */}
        {activeTab === 'petty-cash' && (
          <div className="space-y-4">
            <PettyCashForm
              siteId={settings?.activeSiteId || 'site_default_01'}
              selectedDate={selectedDate}
            />
            <PettyCashList expenses={dailyExpenses} />
          </div>
        )}

        {/* Tab 4: Reports & WhatsApp Bills */}
        {activeTab === 'reports' && <ReportsView activeSite={activeSite} />}

        {/* Tab 5: Settings & Backup */}
        {activeTab === 'settings' && <SettingsView settings={settings} />}
      </main>

      {/* Bottom Sticky Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Site Selector Modal */}
      <SiteSelectorModal
        isOpen={isSiteModalOpen}
        onClose={() => setIsSiteModalOpen(false)}
        sites={sites}
        activeSiteId={settings?.activeSiteId || ''}
        onSelectSite={handleSelectSite}
      />
    </div>
  );
}

export default App;
