# Agent Guidelines & Engineering Playbook (AGENTS.md)
## Labour Manager Pro (लेबर मैनेजर प्रो)

**Target Audience:** AI Coding Assistants, LLMs, Subagents, and Engineers working on this codebase.  
**Workspace Root:** `e:/sonu`  
**Core Technologies:** React 18/19, Vite, TypeScript, Tailwind CSS v4, Dexie.js (IndexedDB), jsPDF, SheetJS (XLSX), i18next, Capacitor 6.

---

## 1. Non-Negotiable System Invariants (अपरिवर्तनीय नियम)

1. **Standard 8-Hour Shift Math:**
   - The default standard shift is **8 Hours** ($\text{Hourly OT Rate} = \lfloor\text{Day Rate} / 8\rfloor$).
   - Overtime formula:
     $$\text{Group OT Wage} = \min(\text{OT Workers}, \text{Count}) \times \text{OT Hours} \times \lfloor\text{Day Rate} / 8\rfloor$$
   - **Defensive Clamping:** `otWorkers` must NEVER exceed `count`.
2. **Date Restriction Rules for Daily Wages:**
   - **Today's Date:** Full active creation and editing of wage entries.
   - **Past / Future Dates:** View-only mode for Saved Records. Direct creation of new entries is restricted to Today with a helpful prompt button to *"Switch to Today & Fill Entry"*.
   - **Editing Saved Records:** The `✏️ Edit` action in Saved Records is allowed for any date to fix past errors.
3. **100% Offline Autonomy:**
   - Zero external APIs, tracking, or cloud databases. Everything lives in Dexie.js IndexedDB.
4. **PDF Font Safety:**
   - Standard PDF fonts (Helvetica) cannot render Unicode Rupee `₹` (`\u20B9`).
   - ALWAYS use `formatPDFCurrency` (which prints `Rs.`) and set explicit `columnStyles` with `overflow: 'linebreak'`.
5. **Exact WhatsApp & Excel Matrix Output:**
   - WhatsApp message layout must match contractor requirements via [`src/utils/whatsappFormatter.ts`](file:///e:/sonu/src/utils/whatsappFormatter.ts).
   - Excel export must generate the 1–31 day Attendance Matrix sheet via [`src/services/excelExporter.ts`](file:///e:/sonu/src/services/excelExporter.ts).
6. **Bilingual Parity:**
   - Every string must be mapped in both [`src/i18n/en.json`](file:///e:/sonu/src/i18n/en.json) and [`src/i18n/hi.json`](file:///e:/sonu/src/i18n/hi.json).
7. **Daylight Theme Tokens:**
   - Mesan section uses `bg-emerald-50/70` with emerald accents.
   - Helper section uses `bg-blue-50/70` with blue accents.
   - OT box uses `bg-amber-50/70`.
   - Never introduce dark translucent grey blocks (`bg-slate-900/40`) over daylight containers.

---

## 2. Codebase Map

```
e:/sonu/
├── docs/                                # Documentation Hub
│   ├── README.md                        # Central index
│   ├── PRD.md                           # Product requirements & user stories
│   ├── ARCHITECTURE.md                  # System architecture & DB models
│   ├── DESIGN_SYSTEM.md                 # UI design system & tokens
│   ├── TESTING.md                       # Verification matrix & QA steps
│   ├── CODE_STYLE.md                    # Coding conventions
│   ├── SECURITY.md                      # Offline security model
│   ├── IMPLEMENTATION_PLAN.md           # Roadmap & completed milestones
│   └── AGENTS.md                        # This playbook
├── src/
│   ├── components/
│   │   ├── daily-wage/                  # HeadcountEntryForm, RateGroupCard, DailyWageHistoryList, EntrySubmittedModal
│   │   ├── layout/                      # Header, BottomNav, SiteSelectorModal
│   │   ├── petty-cash/                  # PettyCashForm, PettyCashList
│   │   ├── reports/                     # ReportsView
│   │   ├── roster/                      # WorkerAttendanceList, WorkerFormModal
│   │   └── settings/                    # SettingsView
│   ├── db/                              # Dexie database, hooks, and seed data
│   ├── services/                        # PDF generator, Excel exporter, Backup service
│   ├── utils/                           # Wage calculator, WhatsApp formatter, Formatters
│   ├── i18n/                            # English and Hindi translation dictionaries
│   ├── App.tsx                          # Master app layout & router
│   └── main.tsx                         # Entry point
```

---

## 3. Pre-Flight Verification Checklist

Before reporting completion on any task:
- [ ] Run `npm run build` — must pass with **0 TypeScript and Vite errors**.
- [ ] Run `npm run lint` — verify no linting regressions.
- [ ] Verify wage calculations against [`docs/TESTING.md`](file:///e:/sonu/docs/TESTING.md).
- [ ] Ensure date formatting uses `DD/MM/YYYY`.
