export type WorkerCategory = 'manager' | 'supervisor' | 'mesan' | 'helper' | 'carpenter' | 'bar_bender' | 'plumber' | 'electrician' | 'painter' | 'other';

export interface Site {
  id: string;
  name: string;
  location: string;
  clientName?: string;
  startDate: string; // YYYY-MM-DD
  status: 'active' | 'completed' | 'archived';
  createdAt: number;
  updatedAt: number;
}

export interface Contractor {
  id: string;
  siteId: string;
  name: string;
  phone?: string;
  trade: string;
  defaultMesanRate?: number;
  defaultHelperRate?: number;
  createdAt: number;
}

export interface RateGroup {
  id: string;
  workerType: WorkerCategory;
  customTitle?: string;
  count: number | '';
  dayRate: number | '';
  otWorkers: number | '';
  otHours: number | '';
  calculatedOtRate: number;
  calculatedGroupBase: number;
  calculatedGroupOt: number;
  calculatedGroupTotal: number;
}

export interface HeadcountEntry {
  id: string;
  siteId: string;
  contractorId?: string;
  contractorName?: string;
  date: string; // YYYY-MM-DD
  groups: RateGroup[];
  totalWorkers: number;
  totalMesans: number;
  totalHelpers: number;
  totalWageAmount: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface NamedWorker {
  id: string;
  siteId: string;
  contractorId?: string;
  name: string;
  phone?: string;
  role: WorkerCategory;
  defaultDayRate: number;
  status: 'active' | 'inactive';
  createdAt: number;
}

export type AttendanceStatus = 'full' | 'half' | 'absent';

export interface WorkerAttendance {
  id: string;
  siteId: string;
  workerId: string;
  workerName: string;
  workerRole: WorkerCategory;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  dayRate: number;
  otHours: number;
  calculatedWage: number;
  paymentStatus: 'pending' | 'paid';
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type ExpenseCategory = 'cement_sand' | 'snacks_tea' | 'fuel' | 'tools' | 'transport' | 'materials' | 'other';

export interface PettyExpense {
  id: string;
  siteId: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMode: 'cash' | 'upi';
  vendorName?: string;
  createdAt: number;
}

export interface AppSettings {
  id: 'global_settings';
  activeSiteId: string;
  language: 'en' | 'hi';
  theme: 'light' | 'dark' | 'system';
  currencySymbol: string;
  standardShiftHours: number;
  lastBackupDate?: number;
  companyName?: string;
  managerName?: string;
  managerPhone?: string;
}

export type TabType = 'daily-wage' | 'roster' | 'petty-cash' | 'reports' | 'sites' | 'settings';
