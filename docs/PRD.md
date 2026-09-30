# Product Requirements Document (PRD)
## Labour Manager Pro (लेबर मैनेजर प्रो)

**Version:** 2.2.0  
**Status:** Completed & Production Ready  
**Platform:** 100% Offline Mobile Web App & Android APK (React + Vite + TypeScript + Dexie IndexedDB + Capacitor 6)  
**Standard Workday Shift:** **8 Hours Standard** ($\text{Hourly OT Rate} = \lfloor\text{Day Rate} / 8\rfloor$)

---

## 1. What is Labour Manager Pro? (परिचय)

Labour Manager Pro is an easy-to-use, **100% offline mobile ledger** designed specifically for Indian construction sites, civil contractors (Thekedaars), and site supervisors. 

It solves the everyday problems of managing site workers:
- **No Internet Required:** Works anywhere, even in basements or remote plots with zero network.
- **Multiple Rates on Same Day:** Add different rates for skilled and junior workers in one go (e.g., Mesans @ ₹850 and @ ₹900; Helpers @ ₹550 and @ ₹600).
- **Accurate Overtime (OT):** Automated 8-hour shift overtime calculations without pocket-notebook errors.
- **Site Petty Cash (साइट खर्चा):** Track daily cash/UPI expenses (cement, sand, fuel, tea/snacks, transport) alongside wages.
- **Instant Professional Sharing:** Share daily reports on WhatsApp, export full Monthly Attendance Matrix Excel sheets (`.xlsx`), and generate PDF bills with one tap.

---

## 2. Key Features & How They Work (मुख्य सुविधाएँ)

### 2.1. Daily Wages Tab (दैनिक मजदूरी)
- **Single-Screen Headcount Entry:**
  - View and record **Mesans (मिस्त्री)** and **Helpers (मजदूर)** on the same screen.
  - Add multiple rate groups per category (e.g., Mesan Group 1 @ ₹850, Mesan Group 2 @ ₹900).
  - Dynamic placeholders guide entry:
    - Mesan Group 1: `e.g. 850` | Group 2: `e.g. 900`
    - Helper Group 1: `e.g. 550` | Group 2: `e.g. 600`
- **Overtime (OT) Calculation:**
  - Standard Shift: **8 Hours**.
  - Hourly OT Rate = $\text{Day Rate} / 8$.
  - Partial OT Support: If 4 out of 6 workers did OT, enter `OT Workers = 4` and `OT Hours = 2.0`.
  - Auto-Clamping: Prevents entering more OT workers than total workers in that group.
- **Date Restriction Rules:**
  - **Today:** Full access to create new wage entries or edit existing ones.
  - **Past or Future Dates:** The app automatically shows **Saved Records**. Creating a new entry is restricted to Today to prevent date mistakes. A clear banner provides a 1-tap button to *"Switch to Today & Fill Entry"*.
  - **Edit Saved Entries:** Any existing saved entry on any date can be edited directly via the `✏️ Edit` button.
- **Instant Summary Modal:**
  - Once saved, a confirmation popup appears with confetti animation.
  - Directly copy or share the **WhatsApp Formatted Report** or download the **Excel Matrix Workbook**.

---

### 2.2. Named Worker Muster Roll & Staff Attendance (हाजिरी रजिस्टर)
- **Worker Directory:** Maintain worker names, trade roles (Mesan, Helper, Supervisor, Manager), phone numbers, and daily rates.
- **1-Tap Attendance Marking:**
  - `[ Present (P) ]` = 100% Day Rate + Overtime.
  - `[ Half-Day (HD) ]` = 50% Day Rate + Overtime.
  - `[ Absent (A) ]` = ₹0.
- **Overtime Stepper:** Easily increment OT hours with `[-]` and `[+]` buttons (0.5h steps).
- **Manager / Staff Attendance Mode:** Mark staff attendance separately and export standalone **Muster Roll PDF reports** without mixing with daily headcount wages.

---

### 2.3. Site Kharcha / Petty Cash (साइट खर्चा)
- **Fast Expense Logger:** Record amount (₹), category, description, and payment mode (`Cash` or `UPI`).
- **Standard Site Categories:** Fuel/Petrol, Cement & Sand, Food/Tea, Tools & Hardware, Transport, Materials, Other.
- **Daily Burn Rate:** Real-time summary showing total daily wage expense + total daily kharcha.

---

### 2.4. Reports, WhatsApp Sharing & Exports (रिपोर्ट्स और बिलिंग)
- **WhatsApp Formatted Summary:**
  - Formatted text summary ready to send to clients or group chats:
    - Headcount breakdown with Base wages & Overtime.
    - Site Kharcha itemization.
    - Combined Grand Total.
- **Monthly Attendance Matrix Excel Exporter (`.xlsx`):**
  - Exports a professional spreadsheet with:
    - **Sheet 1 (`Attendance_Matrix`):** Worker Name, Role, Day 1 to Day 31 columns (`P`, `HD`, `A`, `P+2h`), Total Days, Total OT Hours, Daily Rate, and Total Payable.
    - **Sheet 2 (`Daily_Wages`):** Itemized daily rate groups breakdown.
    - **Sheet 3 (`Site_Expenses`):** Date-wise site kharcha list.
- **Client PDF Bills & Invoices:**
  - Clean A4 PDF report with site name, location, billing period, KPI cards, and structured tables.
  - All currency formatted as `Rs. XX,XXX.00` with clean margins and column widths.
- **Date Range Filters:** Quickly view data for `Today`, `This Week (7 Days)`, `This Month (30 Days)`, or `Custom Date Range`.

---

### 2.5. Multi-Site Management & Site Name Editing
- **Create & Switch Sites:** Support for multiple ongoing construction sites (e.g., "ITC Mourya", "Sector 62 Villa").
- **Edit Site Details:** Easily edit site name and location anytime from the site selector modal without having to delete or recreate.

---

### 2.6. Bilingual Language Support & Offline Backup
- **English & हिन्दी (Hindi):** Toggle anytime from the top bar. All terms use real construction vernacular (*मिस्त्री, मजदूर, हाजिरी, साइट खर्चा*).
- **1-Tap JSON Backup & Restore:** Save your complete database to your phone storage and restore it anytime with zero data loss.

---

## 3. Calculation Formulas (गणना के नियम)

$$\text{Hourly OT Rate} = \lfloor\text{Day Rate} / 8\rfloor$$

$$\text{Group Base Wage} = \text{Workers Count} \times \text{Day Rate}$$

$$\text{Group OT Wage} = \min(\text{OT Workers}, \text{Count}) \times \text{OT Hours} \times \text{Hourly OT Rate}$$

$$\text{Group Total} = \text{Group Base Wage} + \text{Group OT Wage}$$

$$\text{Grand Daily Wage} = \sum \text{Group Totals}$$

$$\text{Grand Site Total} = \text{Grand Daily Wage} + \text{Total Site Kharcha}$$

---

## 4. Reference Verification Example

| Group | Count | Day Rate | OT Workers | OT Hours | Hourly OT Rate | Base Wage | OT Wage | Group Total |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Mesan Group 1** | 2 | ₹850 | 1 | 1.0h | $850 / 8 = ₹106$ | $2 \times 850 = ₹1,700$ | $1 \times 1.0 \times 106 = ₹106$ | **₹1,806** |
| **Helper Group 1** | 2 | ₹600 | 2 | 1.0h | $600 / 8 = ₹75$ | $2 \times 600 = ₹1,200$ | $2 \times 1.0 \times 75 = ₹150$ | **₹1,350** |
| **Helper Group 2** | 6 | ₹550 | 2 | 1.0h | $550 / 8 = ₹68$ | $6 \times 550 = ₹3,300$ | $2 \times 1.0 \times 68 = ₹136$ | **₹3,436** |
| **Total** | **10** | — | **5** | — | — | **₹6,200** | **₹392** | **₹6,592** |
