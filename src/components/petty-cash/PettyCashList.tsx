import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Receipt, Banknote, Smartphone } from 'lucide-react';
import { PettyExpense } from '../../types';
import { formatINR } from '../../utils/formatters';
import { db } from '../../db';

interface PettyCashListProps {
  expenses: PettyExpense[];
}

export const PettyCashList: React.FC<PettyCashListProps> = ({ expenses }) => {
  const { t } = useTranslation();

  const totalExpense = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this expense record?')) {
      await db.pettyExpenses.delete(id);
    }
  };

  return (
    <div className="space-y-3 pb-28">
      {/* Day Expense Total Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-white shadow-sm">
        <div>
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
            {t('expense.daily_expense_total')}
          </span>
          <span className="text-xl font-extrabold text-white tabular-nums">
            {formatINR(totalExpense, true)}
          </span>
        </div>
        <div className="text-right text-xs text-slate-400">
          <span>{expenses.length} Records</span>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500 dark:text-slate-400 space-y-2">
          <Receipt className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-xs font-medium">No site expenses recorded for this date.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {item.description}
                  </span>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {item.category.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    {item.paymentMode === 'cash' ? (
                      <Banknote className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Smartphone className="w-3 h-3 text-blue-500" />
                    )}
                    <span className="capitalize">{item.paymentMode}</span>
                  </span>
                  {item.vendorName && <span>• {item.vendorName}</span>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-extrabold text-slate-900 dark:text-amber-400 tabular-nums">
                  {formatINR(item.amount, true)}
                </span>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
