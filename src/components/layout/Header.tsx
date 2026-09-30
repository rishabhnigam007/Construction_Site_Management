import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, ChevronLeft, ChevronRight, Languages, ShieldCheck } from 'lucide-react';
import { formatDateDisplay, addDaysToDateString, getTodayString } from '../../utils/formatters';
import { Site } from '../../types';
import { changeAppLanguage } from '../../i18n';

interface HeaderProps {
  activeSite: Site | undefined;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onOpenSiteModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSite,
  selectedDate,
  onSelectDate,
  onOpenSiteModal,
}) => {
  const { t, i18n } = useTranslation();
  const isToday = selectedDate === getTodayString();

  const handlePrevDay = () => onSelectDate(addDaysToDateString(selectedDate, -1));
  const handleNextDay = () => onSelectDate(addDaysToDateString(selectedDate, 1));
  const handleToday = () => onSelectDate(getTodayString());

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    changeAppLanguage(nextLang);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-ledger border-b border-slate-800 safe-area-top">
      {/* Top Banner: Site Selector & Language / Offline Badges */}
      <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-slate-800/80">
        {/* Active Site Pill Button */}
        <button
          onClick={onOpenSiteModal}
          className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700/90 active:scale-98 transition-all px-2.5 py-1 rounded-lg border border-slate-700 max-w-[65%]"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-emerald flex-shrink-0" />
          <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-100 truncate text-left">
            {activeSite ? activeSite.name : t('site.select_site')}
          </span>
          <span className="text-[10px] text-slate-400 ml-0.5">▼</span>
        </button>

        {/* Right Action Icons: Language Toggle & Offline Indicator */}
        <div className="flex items-center gap-1.5">
          {/* Offline Pill Badge */}
          <div className="hidden sm:flex items-center gap-1 bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-[10px] font-medium px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{t('app.offline_badge')}</span>
          </div>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            title="Toggle Language / भाषा बदलें"
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xs font-semibold text-emerald-400 px-2 py-1 rounded-lg border border-slate-700"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            <span>{i18n.language === 'en' ? 'हिन्दी' : 'ENG'}</span>
          </button>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="px-3 py-2 flex items-center justify-between bg-slate-900/95">
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/90 rounded-lg border border-slate-700 hover:border-emerald-500/60 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <input
              type="date"
              min="2000-01-01"
              max="2099-12-31"
              value={selectedDate}
              onChange={(e) => e.target.value && onSelectDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-100 cursor-pointer focus:outline-none [color-scheme:dark]"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-300">
            {formatDateDisplay(selectedDate)}
          </span>
          {!isToday && (
            <button
              onClick={handleToday}
              className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/40 px-2 py-0.5 rounded-md transition-colors"
            >
              {t('reports.today')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
