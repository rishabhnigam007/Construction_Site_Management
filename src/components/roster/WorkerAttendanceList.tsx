import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, UserPlus, CheckCircle2, Download, FileText } from 'lucide-react';
import { NamedWorker, WorkerAttendance, Site } from '../../types';
import { WorkerCard } from './WorkerCard';
import { AddWorkerModal } from './AddWorkerModal';
import { formatINR, formatDateDMY } from '../../utils/formatters';
import { calculateWorkerWage } from '../../utils/wageCalculator';
import { generateMusterRollPDF } from '../../services/pdfGenerator';
import { saveAndSharePdf } from '../../utils/fileDownloader';
import { useActiveSite } from '../../db/hooks';
import { db } from '../../db';


interface WorkerAttendanceListProps {
  siteId: string;
  selectedDate: string;
  workers: NamedWorker[];
  attendanceList: WorkerAttendance[];
}

export const WorkerAttendanceList: React.FC<WorkerAttendanceListProps> = ({
  siteId,
  selectedDate,
  workers,
  attendanceList,
}) => {
  const { t } = useTranslation();
  const activeSite = useActiveSite(siteId);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<NamedWorker | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Map attendance by workerId
  const attendanceMap = new Map<string, WorkerAttendance>();
  attendanceList.forEach((att) => attendanceMap.set(att.workerId, att));

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateAttendance = async (worker: NamedWorker, updated: Partial<WorkerAttendance>) => {
    const existing = attendanceMap.get(worker.id);
    if (existing) {
      await db.workerAttendance.update(existing.id, {
        ...updated,
        updatedAt: Date.now(),
      });
    } else {
      const newAttendance: WorkerAttendance = {
        id: `att_${Date.now()}_${worker.id}`,
        siteId,
        workerId: worker.id,
        workerName: worker.name,
        workerRole: worker.role,
        date: selectedDate,
        status: updated.status || 'full',
        dayRate: updated.dayRate || worker.defaultDayRate,
        otHours: updated.otHours || 0,
        calculatedWage: updated.calculatedWage || worker.defaultDayRate,
        paymentStatus: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.workerAttendance.add(newAttendance);
    }
  };

  const handleMarkAllPresent = async () => {
    for (const worker of workers) {
      const existing = attendanceMap.get(worker.id);
      if (!existing || existing.status === 'absent') {
        const calculatedWage = calculateWorkerWage('full', worker.defaultDayRate, 0);
        if (existing) {
          await db.workerAttendance.update(existing.id, {
            status: 'full',
            calculatedWage,
            updatedAt: Date.now(),
          });
        } else {
          await db.workerAttendance.add({
            id: `att_${Date.now()}_${worker.id}`,
            siteId,
            workerId: worker.id,
            workerName: worker.name,
            workerRole: worker.role,
            date: selectedDate,
            status: 'full',
            dayRate: worker.defaultDayRate,
            otHours: 0,
            calculatedWage,
            paymentStatus: 'pending',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
    }
  };

  const handleDeleteWorker = async (workerId: string) => {
    if (window.confirm('Delete this worker from the directory? Past records will remain in database.')) {
      await db.namedWorkers.delete(workerId);
    }
  };

  const handleDownloadMusterPDF = async () => {
    try {
      const doc = generateMusterRollPDF({
        site: activeSite,
        date: selectedDate,
        workers,
        attendanceList,
      });
      const siteSlug = (activeSite?.name || 'Site').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Staff_MusterRoll_${siteSlug}_${selectedDate}.pdf`;
      await saveAndSharePdf(doc, filename);
      setStatusMsg('Staff Muster Roll PDF generated successfully!');
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err) {
      console.error('Failed to export Muster Roll PDF:', err);
    }
  };


  const totalWage = attendanceList.reduce((acc, curr) => acc + (curr.calculatedWage || 0), 0);
  const presentCount = attendanceList.filter((a) => a.status === 'full' || a.status === 'half').length;

  return (
    <div className="space-y-4 pb-28">
      {/* Top Banner: Roster Stats & Standalone Muster PDF Export */}
      <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-800/60 rounded-3xl p-4 text-white shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
              {t('roster.title')} ({formatDateDMY(selectedDate, true)})
            </span>
            <span className="text-2xl font-black text-white tabular-nums">
              {formatINR(totalWage, true)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 block">
              Present Today
            </span>
            <span className="text-sm font-bold text-emerald-300">
              {presentCount} / {workers.length} Present
            </span>
          </div>
        </div>

        {/* Dedicated Muster PDF Download Action */}
        <div className="pt-1 border-t border-emerald-900/40 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">
            Standalone Manager & Staff Attendance Report
          </span>
          <button
            onClick={handleDownloadMusterPDF}
            className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Muster PDF</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {statusMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Action Bar: Search & Add Worker */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('roster.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-emerald-500 shadow-sm"
          />
        </div>

        <button
          onClick={() => {
            setEditingWorker(null);
            setIsAddModalOpen(true);
          }}
          className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm flex-shrink-0"
          title={t('roster.add_worker')}
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Staff</span>
        </button>
      </div>

      {/* Quick Mark All Present Button */}
      {workers.length > 0 && (
        <button
          onClick={handleMarkAllPresent}
          className="w-full py-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{t('roster.mark_all_present')} ({workers.length} Staff)</span>
        </button>
      )}

      {/* Worker List */}
      <div className="space-y-3">
        {filteredWorkers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <UserPlus className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No Staff or Workers Registered
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Add site managers, supervisors, mistris, and helpers to take individual daily attendance and muster roll.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingWorker(null);
                setIsAddModalOpen(true);
              }}
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add First Staff / Worker</span>
            </button>
          </div>
        ) : (
          filteredWorkers.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              attendance={attendanceMap.get(worker.id)}
              onUpdateAttendance={(updated) => handleUpdateAttendance(worker, updated)}
              onEditWorker={(w) => {
                setEditingWorker(w);
                setIsAddModalOpen(true);
              }}
              onDeleteWorker={handleDeleteWorker}
            />
          ))
        )}
      </div>

      {/* Add / Edit Worker Modal */}
      <AddWorkerModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingWorker(null);
        }}
        siteId={siteId}
        workerToEdit={editingWorker}
      />
    </div>
  );
};
