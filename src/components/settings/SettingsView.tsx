import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { AppSettings } from '../../types';
import { exportFullDatabaseBackup, restoreDatabaseFromJson } from '../../services/backupService';
import { changeAppLanguage } from '../../i18n';
import { db } from '../../db';

interface SettingsViewProps {
  settings: AppSettings | undefined;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings }) => {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const currentShiftHours = settings?.standardShiftHours || 8;

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
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-slate-950 font-black">
          <HardHat className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-extrabold text-sm text-white">{t('app.title')}</h3>
          <p className="text-[11px] text-slate-400">{t('app.tagline')} • v1.0.0</p>
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

      {/* Backup & Restore Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
            {t('backup.title')}
          </h4>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('backup.backup_desc')}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExportBackup}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Restore Backup</span>
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

      {/* Preferences Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
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
              Formula: OT Rate = Day Rate ÷ Shift Hours
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
    </div>
  );
};
