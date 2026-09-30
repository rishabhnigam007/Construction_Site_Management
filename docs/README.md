# Labour Manager Pro — Documentation Hub
## लेबर मैनेजर प्रो — Project Guide & Documentation Index

Welcome to the documentation hub for **Labour Manager Pro** (`e:/sonu`). This directory contains clear, simple, and up-to-date guides covering the application's features, architecture, math formulas, design system, and testing steps.

---

## 📚 Documentation Index (दस्तावेज़ सूची)

| Document | What It Explains | Key Topics |
| :--- | :--- | :--- |
| 📄 **[PRD.md](file:///e:/sonu/docs/PRD.md)** | **Product Requirements Document** | All features, 8-hour shift calculation rules, user personas, export formats, and workflows. |
| 🏗️ **[ARCHITECTURE.md](file:///e:/sonu/docs/ARCHITECTURE.md)** | **Technical Architecture** | App structure, Dexie IndexedDB database, calculation services, WhatsApp/Excel/PDF export pipelines. |
| 🧪 **[TESTING.md](file:///e:/sonu/docs/TESTING.md)** | **Testing & Verification** | Calculation test cases, manual testing steps for all screens, and verification checklists. |
| 🎨 **[DESIGN_SYSTEM.md](file:///e:/sonu/docs/DESIGN_SYSTEM.md)** | **UI Design System** | Clean daylight theme, color tokens (Emerald/Blue/Amber/Slate), typography, and touch ergonomics. |
| 📐 **[CODE_STYLE.md](file:///e:/sonu/docs/CODE_STYLE.md)** | **Code Standards & Guidelines** | TypeScript rules, component guidelines, formatting rules, and i18n conventions. |
| 🛡️ **[SECURITY.md](file:///e:/sonu/docs/SECURITY.md)** | **Offline Security & Privacy** | 100% offline data storage, JSON backup/restore safety, and zero data loss guard. |
| 🤖 **[AGENTS.md](file:///e:/sonu/docs/AGENTS.md)** | **Developer & Agent Playbook** | Core rules, architectural patterns, common task recipes, and verification checklists. |
| 🚀 **[IMPLEMENTATION_PLAN.md](file:///e:/sonu/docs/IMPLEMENTATION_PLAN.md)** | **Roadmap & Phase Summary** | Completed features, recent validation improvements, and upcoming phase goals. |

---

## ⚡ Core Rules & Invariants (मुख्य नियम)

1. **8 Hours Standard Workday:** 
   $$\text{Hourly OT Rate} = \lfloor\text{Day Rate} / 8\rfloor$$
2. **Defensive Overtime Clamping:**
   $$\text{OT Workers} \le \text{Total Workers in that Group}$$
3. **Date Restrictions for Daily Wages:**
   * **Today:** Full access to create new wage entries and edit.
   * **Past / Future Dates:** View-only mode for Saved Records. Brand new entries are restricted to Today to prevent accidental entries on wrong dates.
   * **Editing Saved Records:** You can click `✏️ Edit` on any saved record from any date to fix mistakes.
4. **100% Offline Autonomy:**
   * Runs completely inside your browser / Android device.
   * No internet connection, server, or login needed.
5. **Exact Output Formats:**
   * **WhatsApp Text Summary:** Ready to copy or share with clear breakdown.
   * **Attendance Matrix Excel (.xlsx):** Full 1–31 date columns with P/HD/A attendance, OT hours, rates, and wages.
   * **Client PDF Bills:** Clean formatted PDF with `Rs.` (no symbol errors) and aligned tables.
6. **Date Standard:** All dates display and export in standard **`DD/MM/YYYY`** format.

---

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Build production bundle (Validates TypeScript)
npm run build

# 4. Sync web assets to Android shell (Capacitor)
npx cap sync android
```
