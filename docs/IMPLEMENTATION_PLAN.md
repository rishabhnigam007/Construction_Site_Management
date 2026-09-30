# Labour Manager Pro — Step-by-Step Implementation & Execution Plan
## लेबर मैनेजर प्रो — कार्यान्वयन योजना एवं स्थिति

**Workspace Root:** `e:/sonu`  
**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS v4, Dexie.js (IndexedDB), jsPDF, SheetJS, i18next, Capacitor 6  
**Standard Shift:** **8 Hours Default Workday** ($\text{OT Rate} = \lfloor\text{Day Rate} / 8\rfloor$)

---

## 1. Project Directory Structure

```
e:/sonu/
├── docs/                            # Project Documentation Hub
│   ├── README.md                    # Central index & quick start
│   ├── PRD.md                       # Product Requirements Document
│   ├── ARCHITECTURE.md              # Technical architecture & DB design
│   ├── DESIGN_SYSTEM.md             # Daylight Ledger UI & color tokens
│   ├── TESTING.md                   # Math verification & test suites
│   ├── CODE_STYLE.md                # TypeScript & React coding standards
│   ├── SECURITY.md                  # 100% offline security & privacy model
│   ├── AGENTS.md                    # Developer & AI playbook
│   └── IMPLEMENTATION_PLAN.md       # This execution roadmap
├── src/
│   ├── components/
│   │   ├── daily-wage/              # HeadcountEntryForm, RateGroupCard, DailyWageHistoryList, EntrySubmittedModal
│   │   ├── layout/                  # Header, BottomNav, SiteSelectorModal
│   │   ├── petty-cash/              # PettyCashForm, PettyCashList
│   │   ├── reports/                 # ReportsView
│   │   ├── roster/                  # WorkerAttendanceList, WorkerFormModal
│   │   └── settings/                # SettingsView
│   ├── db/                          # Dexie database, reactive hooks, seed initializer
│   ├── i18n/                        # English & Hindi translation dictionaries
│   ├── services/                    # PDF generator (Billing & Muster Roll), Excel exporter (Attendance Matrix), Backup engine
│   ├── types/                       # TypeScript interfaces & domain models
│   ├── utils/                       # Wage calculator (÷8), INR & PDF formatters, WhatsApp formatter
│   ├── App.tsx                      # Master app orchestrator
│   └── index.css                    # Daylight ledger theme styles
├── capacitor.config.ts              # Capacitor Android configuration
├── tailwind.config.js               # Theme tokens
└── package.json                     # Project dependencies
```

---

## 2. Implementation Status & Feature Deliverables (कार्य प्रगति)

### ✅ Phase 1: Foundation & Deterministic 8-Hour Math Engine
- [x] Initialized React 18 + Vite + TypeScript project.
- [x] Configured Tailwind CSS v4 with "Daylight Ledger" clean light theme tokens.
- [x] Standard **8 hours workday** calculation ($\text{OT Rate} = \lfloor\text{Day Rate} / 8\rfloor$).
- [x] Defensive OT worker auto-clamping and strict numeric sanitization.

### ✅ Phase 2: Offline IndexedDB Relational Storage
- [x] Dexie.js database (`LabourManagerProDB`) with tables: `sites`, `contractors`, `headcountEntries`, `namedWorkers`, `workerAttendance`, `pettyExpenses`, `settings`.
- [x] Added `requestPersistentStorage()` guard to prevent Android OS cache evictions.
- [x] Reactive live query hooks in [`src/db/hooks.ts`](file:///e:/sonu/src/db/hooks.ts).

### ✅ Phase 3: Unified Multi-Rate Daily Wage Ledger & Editing
- [x] Single-screen entry form displaying both **Mesan** and **Helper** rate groups simultaneously.
- [x] Dynamic contextual placeholders (`e.g. 850`, `e.g. 900` for Mesan; `e.g. 550`, `e.g. 600` for Helper).
- [x] Dynamic Add Button labels matching the next group placeholder rate.
- [x] Full **Edit Wage Entry** support: edit Mistri or Helper rates, worker counts, and OT anytime from saved records.
- [x] Instant **EntrySubmittedModal** showing live WhatsApp report text, 1-tap copy/share, and Matrix Excel export.

### ✅ Phase 4: Date Restriction Guard on Daily Wages
- [x] New wage entry creation restricted strictly to **Today's date**.
- [x] Selecting a past or future calendar date automatically opens **Saved Records** mode.
- [x] Attempting to create a new entry on past/future dates displays a clean **Date Restricted** banner with a 1-tap *"Switch to Today & Fill Entry"* button.
- [x] Editing an existing saved entry is permitted on any date.

### ✅ Phase 5: Daylight Theme & UI Polish
- [x] Replaced dark translucent grey blocks with clean, daylight-friendly containers:
  - Mesan section: `bg-emerald-50/70` with emerald accents.
  - Helper section: `bg-blue-50/70` with blue accents.
  - Overtime box: `bg-amber-50/70` with amber border and OT rate badge.
  - Rate group cards: Crisp white cards with clear borders.

### ✅ Phase 6: Site Management & Unrestricted Calendar Navigation
- [x] Full **Edit Site Name & Details** option in `SiteSelectorModal` (rename sites, update location).
- [x] Unrestricted calendar navigation: jump to any past month/year or future date without limits (`2000-01-01` to `2099-12-31`).

### ✅ Phase 7: Named Worker, Staff & Manager Muster Roll
- [x] Full staff directory including Site Manager, Supervisor, Mesan, Helper, and specialized trades.
- [x] Edit worker/manager name, designation, and daily rate anytime.
- [x] 1-Tap attendance marking (`[Present]`, `[Half-day]`, `[Absent]`) and OT steppers.
- [x] Standalone **Manager & Worker Muster Roll PDF Export** without linking to client billing documents.

### ✅ Phase 8: Export Hub (WhatsApp Text, Matrix Excel & PDF Bills)
- [x] **WhatsApp Text Formatter** matching contractor attendance layout (`DD/M/YYYY`, site attendance, rate groups, OT calculations, kharcha).
- [x] **Attendance Matrix Excel Export** (`.xlsx`) with full 1–31 date columns, attendance flags (`P`, `HD`, `A`, `P+2h`), rates, and earned wages.
- [x] **PDF Bill Generator:**
  - Resolved `¹` font encoding issue by using `formatPDFCurrency` with `Rs.`.
  - Added explicit table `columnStyles` with `overflow: 'linebreak'` to prevent OT text clipping.
  - Uniform **`DD/MM/YYYY`** date standard.

---

## 3. Mathematical Verification Matrix

| Input Scenario | Mathematical Formula | Calculated Output |
| :--- | :--- | :--- |
| **Mesan Group 1:** 1 Mesan @ ₹850, 0 OT | $1 \times 850$ | Base: ₹850 $\rightarrow$ **₹850** |
| **Helper Group 1:** 2 Helpers @ ₹600, 0 OT | $2 \times 600$ | Base: ₹1,200 $\rightarrow$ **₹1,200** |
| **Helper Group 2:** 4 Helpers @ ₹550, 1 does 1h OT | $4 \times 550 + 1 \times 1 \times \lfloor 550 / 8 \rfloor$ | Base: ₹2,200 + OT: ₹68 $\rightarrow$ **₹2,268** |
| **Helper Group 3:** 4 Helpers @ ₹550, 3 do 1h OT | $4 \times 550 + 3 \times 1 \times \lfloor 550 / 8 \rfloor$ | Base: ₹2,200 + OT: ₹204 $\rightarrow$ **₹2,404** |
| **Matrix Grand Total (11 Days)** | $\sum (\text{Daily Amounts})$ | **Verified: ₹40,350.00 ✅** |
