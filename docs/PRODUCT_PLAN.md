# Labour Manager Pro (लेबर मैनेजर प्रो) — Product Requirements & Specifications

**App Name:** Labour Manager Pro  
**Target Platform:** 100% Offline Android App (React 18 + Vite + TypeScript + Dexie IndexedDB + Capacitor 6)  
**Target Users:** Construction Site Managers, Civil Engineers, Site Supervisors & Thekedaars (Labour Contractors)  
**Standard Shift:** **9 Hours Standard Workday** (Configurable to 8h/9h/10h)  
**Design Theme:** "Daylight Ledger" (High-contrast emerald-green `#10B981`, slate `#0F172A`, light gray `#F8FAFC`, dark mode support)

---

## 1. Executive Vision & Core Value
**Labour Manager Pro** is a rugged, 100% offline mobile ledger built for the practical realities of construction sites in India. Site managers operate in noisy, low-connectivity, dusty environments where they must record daily labour headcounts across different rate variations, individual overtime, named worker attendance, and petty site expenses in seconds.

**Zero backend, zero mandatory login, zero cloud required.** All data persists safely on the device in local IndexedDB storage, with instant 1-tap WhatsApp PDF reports, multi-sheet Excel workbooks, and complete JSON backup/restore capabilities.

---

## 2. Core Feature Modules

### 2.1. Unified Single-Screen Daily Wage Ledger (Headcount Mode)
- **All-in-One Multi-Rate Screen:** Manage multiple rate variations for both **Mesans (मिस्त्री)** and **Helpers (मजदूर)** on the **exact same view** without switching back and forth.
  - *Example Mesans Section:* 2 Mesans @ ₹850 + 2 Mesans @ ₹900 (each with independent OT hours).
  - *Example Helpers Section:* 4 Helpers @ ₹500 + 2 Helpers @ ₹550 (each with independent OT hours).
- **Per-Group Overtime Calculation:**
  $$\text{Hourly OT Rate} = \frac{\text{Day Rate}}{\text{Shift Hours (Default: 9)}}$$
  - Group @ ₹850 $\rightarrow$ $\text{OT Rate} = ₹850 / 9 = \mathbf{₹94.44/hr}$
  - Group @ ₹900 $\rightarrow$ $\text{OT Rate} = ₹900 / 9 = \mathbf{₹100.00/hr}$
  - Group @ ₹500 $\rightarrow$ $\text{OT Rate} = ₹500 / 9 = \mathbf{₹55.56/hr}$
  - Group @ ₹550 $\rightarrow$ $\text{OT Rate} = ₹550 / 9 = \mathbf{₹61.11/hr}$
- **Partial Overtime Support:** Dedicated "OT Workers" field (e.g. 4 of 6 helpers did 2h OT); $\text{OT Wage} = \text{otWorkers} \times \text{otHours} \times (\text{rate} / 9)$.
- **Defensive Clamping:** OT workers can never exceed the group count.
- **Section Subtotals & Grand Summary:**
  - Real-time subtotal for all Mesans (Count & ₹ Amount).
  - Real-time subtotal for all Helpers (Count & ₹ Amount).
  - Grand day wage total and total worker count.
- **Saved Records History:** Expandable cards showing complete base wage and OT breakdowns with delete/manage actions.

### 2.2. Named Worker Muster Roll (Roster Mode)
- Master list of workers with names, mobile numbers, roles (Mesan, Helper, Carpenter, Plumber, etc.), and default rates.
- 1-Tap Attendance buttons: `[ Present (P) ]` | `[ Half-Day (HD) ]` | `[ Absent (A) ]`.
- OT hours stepper with `[-]` and `[+]` tactile buttons.
- Quick bulk action: *"Mark All Remaining as Present"*.

### 2.3. Site Kharcha (Petty Cash Expenses)
- Fast expense logging for site supplies (Cement, Sand, Tea/Snacks, Diesel/Fuel, Tools/Hardware, Transport, Materials, Other).
- Amount (₹) & Description input with `[ Cash ]` / `[ UPI ]` payment mode tags.
- Running daily expense burn rate alongside labour wage totals.

### 2.4. Reports & WhatsApp Export Hub
- Date Range Selector: `Today` | `This Week (7 Days)` | `This Month (30 Days)` | `Custom Range`.
- Summary Metric Cards: Total Labour Wages, Total OT Hours, Total Site Kharcha, Grand Total Site Cost.
- **🟢 1-Tap WhatsApp Share:** Client-side generated A4 PDF bills with company/site headers that open directly in Android WhatsApp share sheet.
- **📊 Multi-Sheet Excel (.xlsx) Exporter:**
  - `Sheet 1 (Daily_Wages)`: Date, Site, Labour Type, Count, Day Rate, Base Wage, OT Workers, OT Hours, OT Hourly Rate, OT Wage, Total Group Wage.
  - `Sheet 2 (Site_Expenses)`: Date, Category, Description, Mode, Amount, Vendor.

### 2.5. Bilingual UI & Offline Data Protection
- Instant toggle between **English** and **हिन्दी (Hindi / Hinglish)** with Indian construction terminology (*मिस्त्री, मजदूर, हाजिरी, साइट खर्चा, कुल रकम*).
- 1-Tap JSON Backup & Restore for phone storage / Google Drive.
- `navigator.storage.persist()` guard against OS cache clearing.

---

## 3. Mathematical Wage Formulas

$$\text{Hourly Overtime Rate} = \frac{\text{Day Rate}}{\text{Shift Hours (Default: 9)}}$$
$$\text{Group Base Wage} = \text{Count} \times \text{Day Rate}$$
$$\text{Group OT Wage} = \text{OT Workers} \times \text{OT Hours} \times \left(\frac{\text{Day Rate}}{9}\right)$$
$$\text{Group Total} = \text{Group Base Wage} + \text{Group OT Wage}$$
$$\text{Day Total} = \sum \text{Group Totals for Date}$$

### Concrete Example:
- **Mesan Group 1:** 2 Mesans @ ₹850, 1 did 2h OT:
  - Base: $2 \times 850 = ₹1,700.00$
  - OT: $1 \times 2 \times (850 / 9) = 1 \times 2 \times 94.44 = ₹188.89$
  - Group Total: **₹1,888.89**
- **Mesan Group 2:** 2 Mesans @ ₹900, 2 did 1.5h OT:
  - Base: $2 \times 900 = ₹1,800.00$
  - OT: $2 \times 1.5 \times (900 / 9) = 2 \times 1.5 \times 100.00 = ₹300.00$
  - Group Total: **₹2,100.00**
- **Helper Group 1:** 4 Helpers @ ₹500, 2 did 2h OT:
  - Base: $4 \times 500 = ₹2,000.00$
  - OT: $2 \times 2 \times (500 / 9) = 2 \times 2 \times 55.56 = ₹222.22$
  - Group Total: **₹2,222.22**
- **Helper Group 2:** 2 Helpers @ ₹550, 0 OT:
  - Base: $2 \times 550 = ₹1,100.00$
  - Group Total: **₹1,100.00**

**Grand Combined Total:** $10 \text{ Workers} \rightarrow \mathbf{₹7,311.11}$
