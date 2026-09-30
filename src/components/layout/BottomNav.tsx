import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, Users, Receipt, FileText, Settings } from 'lucide-react';
import { TabType } from '../../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();

  const navItems = [
    { id: 'daily-wage' as TabType, label: t('nav.daily_wages'), icon: Calculator },
    { id: 'roster' as TabType, label: t('nav.roster'), icon: Users },
    { id: 'petty-cash' as TabType, label: t('nav.expenses'), icon: Receipt },
    { id: 'reports' as TabType, label: t('nav.reports'), icon: FileText },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900 border-t border-slate-800 text-slate-400 safe-area-bottom shadow-lg">
      <div className="grid grid-cols-5 h-14 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 relative transition-all ${
                isActive ? 'text-emerald-400 font-bold' : 'hover:text-slate-200 active:scale-95'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-emerald-400 rounded-b-full shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.75]'}`} />
              <span className="text-[10px] leading-tight truncate px-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
