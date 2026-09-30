import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, UserPlus, HardHat, Users, Wrench, ShieldCheck, UserCheck, Briefcase } from 'lucide-react';
import { WorkerCategory, NamedWorker } from '../../types';
import { db } from '../../db';

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  workerToEdit?: NamedWorker | null;
}

export const AddWorkerModal: React.FC<AddWorkerModalProps> = ({
  isOpen,
  onClose,
  siteId,
  workerToEdit,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<WorkerCategory>('mesan');
  const [defaultRate, setDefaultRate] = useState<number | ''>(850);

  useEffect(() => {
    if (workerToEdit) {
      setName(workerToEdit.name || '');
      setPhone(workerToEdit.phone || '');
      setRole(workerToEdit.role || 'mesan');
      setDefaultRate(workerToEdit.defaultDayRate || 850);
    } else {
      setName('');
      setPhone('');
      setRole('mesan');
      setDefaultRate(850);
    }
  }, [workerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !defaultRate) return;

    if (workerToEdit) {
      // Update existing worker
      await db.namedWorkers.update(workerToEdit.id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        role,
        defaultDayRate: Number(defaultRate),
      });

      // Also update any attendance record for this worker on active site
      const attRecords = await db.workerAttendance.where('workerId').equals(workerToEdit.id).toArray();
      for (const rec of attRecords) {
        await db.workerAttendance.update(rec.id, {
          workerName: name.trim(),
          workerRole: role,
          dayRate: Number(defaultRate),
        });
      }
    } else {
      // Add new worker
      const newWorker: NamedWorker = {
        id: `worker_${Date.now()}`,
        siteId,
        name: name.trim(),
        phone: phone.trim() || undefined,
        role,
        defaultDayRate: Number(defaultRate),
        status: 'active',
        createdAt: Date.now(),
      };
      await db.namedWorkers.add(newWorker);
    }

    setName('');
    setPhone('');
    setDefaultRate(850);
    onClose();
  };

  const roleOptions: { id: WorkerCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'manager', label: 'Site Manager', icon: <Briefcase className="w-4 h-4 text-emerald-400" /> },
    { id: 'supervisor', label: 'Supervisor', icon: <UserCheck className="w-4 h-4 text-cyan-400" /> },
    { id: 'mesan', label: 'Mesan (Mistri)', icon: <HardHat className="w-4 h-4 text-amber-400" /> },
    { id: 'helper', label: 'Helper (Mazdoor)', icon: <Users className="w-4 h-4 text-blue-400" /> },
    { id: 'carpenter', label: 'Carpenter', icon: <Wrench className="w-4 h-4 text-orange-400" /> },
    { id: 'bar_bender', label: 'Bar Bender', icon: <ShieldCheck className="w-4 h-4 text-rose-400" /> },
    { id: 'plumber', label: 'Plumber', icon: <Wrench className="w-4 h-4 text-indigo-400" /> },
    { id: 'electrician', label: 'Electrician', icon: <Wrench className="w-4 h-4 text-yellow-400" /> },
    { id: 'painter', label: 'Painter', icon: <Wrench className="w-4 h-4 text-purple-400" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">
              {workerToEdit ? 'Edit Worker / Manager Details' : t('roster.add_worker')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Name (Worker / Manager) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar / Anil Verma (Manager)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Mobile Number (Optional)
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Designation / Trade Role *
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-950/40 rounded-xl border border-slate-800">
              {roleOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRole(opt.id)}
                  className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                    role === opt.id
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.icon}
                  <span className="truncate w-full text-center">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Daily Wage / Rate (₹ / Day) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="any"
              placeholder="e.g. 850 or 1500"
              value={defaultRate}
              onChange={(e) => setDefaultRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 tabular-nums"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 font-semibold text-xs text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-slate-950 shadow-md transition-all active:scale-98"
            >
              {workerToEdit ? 'Save Changes' : t('roster.add_worker')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
