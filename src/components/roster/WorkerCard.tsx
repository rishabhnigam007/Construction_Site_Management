import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Plus,
  Minus,
  Phone,
  HardHat,
  Users,
  Wrench,
  Briefcase,
  UserCheck,
  Edit3,
  Trash2,
} from 'lucide-react';
import { NamedWorker, WorkerAttendance, AttendanceStatus } from '../../types';
import { calculateWorkerWage } from '../../utils/wageCalculator';
import { formatINR } from '../../utils/formatters';

interface WorkerCardProps {
  worker: NamedWorker;
  attendance: WorkerAttendance | undefined;
  onUpdateAttendance: (updated: Partial<WorkerAttendance>) => void;
  onEditWorker?: (worker: NamedWorker) => void;
  onDeleteWorker?: (workerId: string) => void;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({
  worker,
  attendance,
  onUpdateAttendance,
  onEditWorker,
  onDeleteWorker,
}) => {
  const { t } = useTranslation();

  const currentStatus: AttendanceStatus = attendance?.status || 'absent';
  const otHours = attendance?.otHours || 0;
  const dayRate = attendance?.dayRate || worker.defaultDayRate;
  const calculatedWage = calculateWorkerWage(currentStatus, dayRate, otHours);

  const handleStatusChange = (status: AttendanceStatus) => {
    onUpdateAttendance({
      status,
      dayRate,
      otHours,
      calculatedWage: calculateWorkerWage(status, dayRate, otHours),
    });
  };

  const handleOtChange = (delta: number) => {
    const newOt = Math.max(0, Number((otHours + delta).toFixed(1)));
    onUpdateAttendance({
      status: currentStatus,
      dayRate,
      otHours: newOt,
      calculatedWage: calculateWorkerWage(currentStatus, dayRate, newOt),
    });
  };

  const getRoleIcon = () => {
    switch (worker.role) {
      case 'manager':
        return <Briefcase className="w-4 h-4 text-emerald-400" />;
      case 'supervisor':
        return <UserCheck className="w-4 h-4 text-cyan-400" />;
      case 'mesan':
        return <HardHat className="w-4 h-4 text-amber-400" />;
      case 'helper':
        return <Users className="w-4 h-4 text-blue-400" />;
      default:
        return <Wrench className="w-4 h-4 text-orange-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm space-y-3">
      {/* Top row: Name, Role, Rate, Edit & Delete actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
            {getRoleIcon()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {worker.name}
              </h4>
              {worker.role === 'manager' && (
                <span className="text-[9px] uppercase font-black bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">
                  Manager
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="capitalize">{worker.role}</span>
              <span>•</span>
              <span className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                ₹{dayRate}/day
              </span>
              {worker.phone && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <Phone className="w-2.5 h-2.5" />
                    {worker.phone}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Day Earning Badge */}
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              {t('roster.day_wage')}
            </span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-emerald-400 tabular-nums">
              {formatINR(calculatedWage, true)}
            </span>
          </div>

          {/* Edit Worker Icon */}
          {onEditWorker && (
            <button
              type="button"
              onClick={() => onEditWorker(worker)}
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Edit Name, Designation & Daily Rate"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}

          {/* Delete Worker Icon */}
          {onDeleteWorker && (
            <button
              type="button"
              onClick={() => onDeleteWorker(worker.id)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Delete Worker"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Attendance 3-Way Selector */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
        <button
          type="button"
          onClick={() => handleStatusChange('full')}
          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
            currentStatus === 'full'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('roster.present')}
        </button>

        <button
          type="button"
          onClick={() => handleStatusChange('half')}
          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
            currentStatus === 'half'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('roster.half_day')}
        </button>

        <button
          type="button"
          onClick={() => handleStatusChange('absent')}
          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
            currentStatus === 'absent'
              ? 'bg-slate-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('roster.absent')}
        </button>
      </div>

      {/* OT Stepper Row */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('roster.ot')} {t('roster.hours')}:</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOtChange(-0.5)}
            disabled={otHours <= 0}
            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 active:scale-95"
          >
            <Minus className="w-3 h-3" />
          </button>

          <span className="w-12 text-center text-xs font-bold text-slate-900 dark:text-white tabular-nums">
            {otHours} {t('roster.hours')}
          </span>

          <button
            type="button"
            onClick={() => handleOtChange(0.5)}
            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
