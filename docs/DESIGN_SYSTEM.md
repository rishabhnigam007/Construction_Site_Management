# Design System & UI Specification (DESIGN_SYSTEM.md)
## "Daylight Ledger" — High-Contrast Mobile Interface

**Theme Name:** Daylight Ledger  
**Primary Goal:** Clean, High-Contrast, Outdoor-Optimized Mobile Experience for Construction Sites  
**Tech Implementation:** Tailwind CSS v4 + React 18/19

---

## 1. Core Visual Principles (डिज़ाइन के सिद्धांत)

1. **Sunlight Readability:** High-contrast crisp cards on a clean canvas (`bg-slate-100` / `bg-white`) ensure all numbers, rates, and buttons remain crystal-clear under direct sunlight.
2. **Color-Coded Trade Containers:**
   - **Mesan (मिस्त्री) Section:** Clean light emerald background (`bg-emerald-50/70`), emerald badge, solid icon header, and crisp white rate cards.
   - **Helper (मजदूर) Section:** Clean light blue background (`bg-blue-50/70`), blue badge, solid icon header, and crisp white rate cards.
   - **Overtime (OT) Inner Box:** Amber highlight (`bg-amber-50/70`) with amber border and instant hourly OT rate badge (`⚡ ₹106/hr`).
3. **Tabular Numeric Alignment:** All rates, worker counts, and totals use `.tabular-nums` so numbers stay neatly aligned without shifting.
4. **Touch Ergonomics:** Large $48\text{px}$ touch targets and clear active states ensure easy single-handed use on site.

---

## 2. Color Palette & Tokens

| Token / Color | Value / Class | Role & Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `bg-slate-100` / `dark:bg-slate-950` | Full screen clean background |
| **Surface Card** | `bg-white` / `dark:bg-slate-900` | Rate group cards, modals, input containers |
| **Mesan Container** | `bg-emerald-50/70` | Light emerald wrapper for all Mesan groups |
| **Helper Container** | `bg-blue-50/70` | Light blue wrapper for all Helper groups |
| **Overtime Box** | `bg-amber-50/70` | Amber tinted box for OT inputs |
| **Primary Brand** | `bg-emerald-600` | Primary action buttons (`Save Entry`, `Share`) |
| **Text Primary** | `text-slate-900` / `dark:text-white` | Headings, amounts, labels |
| **Text Secondary** | `text-slate-600` / `dark:text-slate-400` | Subtitles, help notes, placeholders |

---

## 3. Component Specs

### 3.1. RateGroupCard Component
- **Dynamic Contextual Placeholders:**
  - **Mesan Group 1:** Rate `e.g. 850` | Count `e.g. 2`
  - **Mesan Group 2:** Rate `e.g. 900` | Count `e.g. 3`
  - **Helper Group 1:** Rate `e.g. 550` | Count `e.g. 4`
  - **Helper Group 2:** Rate `e.g. 600` | Count `e.g. 6`
- **Dynamic Add Group Buttons:**
  - `+ Add Another Mesan Rate Group (e.g. @ ₹900)`
  - `+ Add Another Helper Rate Group (e.g. @ ₹600)`
- **Auto-Calculated Badges:**
  - Hourly OT Rate: $\lfloor\text{Day Rate} / 8\rfloor$
  - Base Wage Subtotal: $\text{Count} \times \text{Day Rate}$
  - OT Subtotal: $\text{OT Workers} \times \text{OT Hours} \times \text{OT Rate}$
  - Group Total: $\text{Base} + \text{OT}$

### 3.2. Date Restricted Guard Banner
- Displayed when viewing past or future dates in the Daily Wages form.
- Contains:
  - Amber lock icon badge.
  - Clear message: *"New daily wage entries can only be created for Today (DD/MM/YYYY)."*
  - **"Switch to Today & Fill Entry"** primary button.
  - **"View Saved Records"** secondary button.

### 3.3. Entry Submitted Modal (Post-Save)
- Pops up with confetti upon saving a wage entry.
- Direct quick actions:
  - 🟢 **Share on WhatsApp:** Copies/shares formatted contractor text summary.
  - 📊 **Download Matrix Excel (.xlsx):** Generates full 1–31 day attendance matrix.
  - ➕ **New Entry / View Saved Records.**

### 3.4. Top Header & Calendar Date Picker
- Shows active site name with instant edit option.
- Calendar date picker with fast Previous / Next day arrows and "Today" quick jump button.
- Bilingual toggle button (`[हिन्दी]` / `[ENG]`).

### 3.5. Bottom Navigation Bar
- 5 fixed tabs:
  1. ⚡ **Daily Wages (दैनिक मजदूरी)**
  2. 👥 **Muster Roll (हाजिरी)**
  3. 🧾 **Kharcha (साइट खर्चा)**
  4. 📊 **Reports (रिपोर्ट्स)**
  5. ⚙️ **Settings (सेटिंग्स)**
