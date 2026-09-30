import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Download,
  Upload,
  Languages,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HardHat,
  Cloud,
  CloudRain,
  RefreshCw,
  Mail,
  UserCheck,
  FileJson,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { AppSettings } from '../../types';
import { exportFullDatabaseBackup, restoreDatabaseFromJson } from '../../services/backupService';
import {
  getSavedGoogleAccount,
  connectGoogleAccount,
  disconnectGoogleAccount,
  uploadBackupToGoogleDrive,
  fetchGoogleDriveBackupInfo,
  restoreBackupFromGoogleDrive,
  GoogleAccountProfile,
  GoogleDriveBackupInfo,
} from '../../services/googleDriveBackup';
import { formatDateDisplay } from '../../utils/formatters';
import { changeAppLanguage } from '../../i18n';
import { db } from '../../db';

interface SettingsViewProps {
  settings: AppSettings | undefined;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings }) => {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [backupTab, setBackupTab] = useState<'google_drive' | 'local_storage'>(
    settings?.backupDestination || 'google_drive'
  );

  const [googleAccount, setGoogleAccount] = useState<GoogleAccountProfile | null>(null);
  const [gdriveInfo, setGdriveInfo] = useState<GoogleDriveBackupInfo | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnectingModalOpen, setIsConnectingModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  const currentShiftHours = settings?.standardShiftHours || 8;
  const isAutoBackup = settings?.autoGoogleBackup ?? true;

  // Load Google account details
  useEffect(() => {
    async function loadAccount() {
      const acc = await getSavedGoogleAccount();
      setGoogleAccount(acc);
      if (acc) {
        const info = await fetchGoogleDriveBackupInfo();
        setGdriveInfo(info);
      }
    }
    loadAccount();
  }, [settings]);

  const handleConnectGoogle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const email = emailInput.trim() || 'thekedaar.official@gmail.com';
      const profile = await connectGoogleAccount(email);
      setGoogleAccount(profile);
      setIsConnectingModalOpen(false);
      setEmailInput('');

      // Auto take first initial cloud backup
      const res = await uploadBackupToGoogleDrive();
      const info = await fetchGoogleDriveBackupInfo();
      setGdriveInfo(info);

      setStatusMsg({
        type: 'success',
        text: `Connected ${profile.email} & backed up successfully!`,
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to connect Google Account' });
    }
  };

  const handleDisconnectGoogle = async () => {
    if (window.confirm('Disconnect Google Account? Cloud backups will pause until reconnected.')) {
      await disconnectGoogleAccount();
      setGoogleAccount(null);
      setGdriveInfo(null);
      setStatusMsg({ type: 'success', text: 'Google Account disconnected.' });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleGoogleBackupNow = async () => {
    setIsSyncing(true);
    try {
      const res = await uploadBackupToGoogleDrive();
      const info = await fetchGoogleDriveBackupInfo();
      setGdriveInfo(info);
      setStatusMsg({
        type: 'success',
        text: t('backup.cloud_backup_success'),
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to back up to Google Drive.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleRestoreNow = async () => {
    if (!window.confirm(t('backup.restore_warning'))) {
      return;
    }

    setIsSyncing(true);
    try {
      await restoreBackupFromGoogleDrive();
      setStatusMsg({
        type: 'success',
        text: t('backup.cloud_restore_success'),
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to restore from Google Drive.' });
      setIsSyncing(false);
    }
  };

  const handleToggleAutoBackup = async () => {
    const nextVal = !isAutoBackup;
    await db.settings.update('global_settings', { autoGoogleBackup: nextVal });
    setStatusMsg({
      type: 'success',
      text: nextVal ? 'Auto-backup enabled on wage save' : 'Auto-backup disabled',
    });
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleExportBackup = async () => {
    try {
      const filename = await exportFullDatabaseBackup();
      setStatusMsg({
        type: 'success',
        text: `Backup exported successfully: ${filename}`,
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Failed to export backup.' });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(t('backup.restore_warning'))) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        if (text) {
          await restoreDatabaseFromJson(text);
          setStatusMsg({ type: 'success', text: t('backup.restore_success') });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Failed to restore backup file.' });
    }
  };

  const handleLanguageChange = (lang: 'en' | 'hi') => {
    changeAppLanguage(lang);
    db.settings.update('global_settings', { language: lang });
  };

  const handleShiftHoursChange = async (hours: number) => {
    await db.settings.update('global_settings', { standardShiftHours: hours });
    setStatusMsg({
      type: 'success',
      text: `Default shift updated to ${hours} Hours (OT = Day Rate ÷ ${hours})`,
    });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* App Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-slate-950 font-black shadow-md">
          <HardHat className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-extrabold text-sm text-white">{t('app.title')}</h3>
          <p className="text-[11px] text-slate-400">{t('app.tagline')} • v2.2.0</p>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMsg && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold animate-fadeIn ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* WhatsApp-Style Cloud Backup Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                {t('backup.title')}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                WhatsApp-style Cloud & Local Safety
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher: Google Drive (Default) vs Local Storage */}
        <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => {
              setBackupTab('google_drive');
              db.settings.update('global_settings', { backupDestination: 'google_drive' });
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              backupTab === 'google_drive'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>{t('backup.google_drive_tab')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBackupTab('local_storage');
              db.settings.update('global_settings', { backupDestination: 'local_storage' });
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              backupTab === 'local_storage'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>{t('backup.local_storage_tab')}</span>
          </button>
        </div>

        {/* 1. GOOGLE DRIVE CLOUD BACKUP TAB (DEFAULT) */}
        {backupTab === 'google_drive' && (
          <div className="space-y-3.5">
            {googleAccount ? (
              // Connected Google Account Card
              <div className="bg-emerald-50/70 dark:bg-slate-800/60 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-sm uppercase">
                      {googleAccount.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {googleAccount.name}
                        </span>
                        <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded font-semibold">
                          Connected
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {googleAccount.email}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDisconnectGoogle}
                    className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 underline"
                  >
                    {t('backup.change_account')}
                  </button>
                </div>

                {/* Cloud Backup Status Row */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl p-2.5 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wide">
                      {t('backup.last_gdrive_backup')}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {gdriveInfo?.timestamp
                        ? new Date(gdriveInfo.timestamp).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'No backup yet'}
                    </span>
                  </div>

                  {gdriveInfo?.sizeBytes && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      {Math.round(gdriveInfo.sizeBytes / 1024)} KB
                    </span>
                  )}
                </div>

                {/* Cloud Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleGoogleBackupNow}
                    disabled={isSyncing}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                  >
                    <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                    <span>{isSyncing ? 'Backing up...' : t('backup.backup_now_gdrive')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGoogleRestoreNow}
                    disabled={isSyncing}
                    className="py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-slate-100 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{t('backup.restore_now_gdrive')}</span>
                  </button>
                </div>

                {/* Auto Backup Toggle */}
                <div className="pt-2 border-t border-emerald-200/60 dark:border-slate-700 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {t('backup.auto_backup_label')}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      {t('backup.auto_backup_desc')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleAutoBackup}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                      isAutoBackup ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        isAutoBackup ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ) : (
              // Connect Gmail Account Callout
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <Mail className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                    {t('backup.google_account')}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Connect your Gmail account to enable automatic cloud backups. When reinstalling the app or switching phones, you can restore everything with 1 click.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsConnectingModalOpen(true)}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 mx-auto transition-all active:scale-98"
                >
                  <Mail className="w-4 h-4" />
                  <span>{t('backup.connect_google')}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. LOCAL FILE BACKUP TAB */}
        {backupTab === 'local_storage' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('backup.backup_desc')}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>{t('backup.export_backup')}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{t('backup.restore_backup')}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* Preferences Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-4">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
          App Preferences
        </h4>

        {/* Language Selection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Languages className="w-4 h-4 text-slate-400" />
            <span>Language (भाषा)</span>
          </div>

          <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                i18n.language === 'en'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageChange('hi')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                i18n.language === 'hi'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Shift Hours Setting */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Standard Shift Hours</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Formula: OT Rate = Day Rate ÷ Shift Hours (Default: 8h)
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => handleShiftHoursChange(8)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                currentShiftHours === 8
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              8h (÷8)
            </button>
            <button
              onClick={() => handleShiftHoursChange(9)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                currentShiftHours === 9
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              9h (÷9)
            </button>
          </div>
        </div>
      </div>

      {/* Connect Gmail Modal */}
      {isConnectingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Connect Gmail Account
                </h3>
                <p className="text-[11px] text-slate-500">
                  For automated 1-click Google Drive backups
                </p>
              </div>
            </div>

            <form onSubmit={handleConnectGoogle} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Gmail / Google Account Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rajesh.thekedaar@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-600" />
                <span>
                  Your database will be securely mirrored to your Google Drive account, allowing instant 1-click restore whenever you reinstall.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConnectingModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                >
                  Connect & Backup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
