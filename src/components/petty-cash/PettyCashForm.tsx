import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Receipt, Plus, Tag, Banknote, Smartphone } from 'lucide-react';
import { ExpenseCategory, PettyExpense } from '../../types';
import { db } from '../../db';

interface PettyCashFormProps {
  siteId: string;
  selectedDate: string;
  onExpenseAdded?: () => void;
}

export const PettyCashForm: React.FC<PettyCashFormProps> = ({
  siteId,
  selectedDate,
  onExpenseAdded,
}) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState<ExpenseCategory>('cement_sand');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
  const [vendorName, setVendorName] = useState('');

  const categories: { id: ExpenseCategory; label: string }[] = [
    { id: 'cement_sand', label: 'Cement / Sand' },
    { id: 'snacks_tea', label: 'Tea / Snacks' },
    { id: 'fuel', label: 'Fuel / Diesel' },
    { id: 'tools', label: 'Tools / Hardware' },
    { id: 'transport', label: 'Transport / Fare' },
    { id: 'materials', label: 'Raw Material' },
    { id: 'other', label: 'Other Misc' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0 || !description.trim()) return;

    const newExpense: PettyExpense = {
      id: `expense_${Date.now()}`,
      siteId,
      date: selectedDate,
      category,
      description: description.trim(),
      amount: Number(amount),
      paymentMode,
      vendorName: vendorName.trim() || undefined,
      createdAt: Date.now(),
    };

    await db.pettyExpenses.add(newExpense);
    setDescription('');
    setAmount('');
    setVendorName('');
    if (onExpenseAdded) onExpenseAdded();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Receipt className="w-4 h-4 text-emerald-500" />
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
          {t('expense.add_expense')}
        </h3>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              category === cat.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Amount & Mode */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {t('expense.amount')} *
            </label>
            <input
              type="number"
              inputMode="decimal"
              required
              min="1"
              step="any"
              placeholder="e.g. 1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {t('expense.payment_mode')}
            </label>
            <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setPaymentMode('cash')}
                className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  paymentMode === 'cash'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('upi')}
                className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  paymentMode === 'upi'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>UPI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            {t('expense.description')} *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 5 bags Birla cement, chai-samosa for workers"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('expense.save_expense')}</span>
        </button>
      </form>
    </div>
  );
};
