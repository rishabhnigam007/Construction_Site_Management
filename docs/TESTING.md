# Testing & Verification Guide (TESTING.md)
## Labour Manager Pro (लेबर मैनेजर प्रो)

**Standard Workday Shift:** **8 Hours Standard** ($\text{Hourly OT Rate} = \lfloor\text{Day Rate} / 8\rfloor$)

---

## 1. Math Verification Test Cases (गणित सत्यापन)

All calculations in [`src/utils/wageCalculator.ts`](file:///e:/sonu/src/utils/wageCalculator.ts) follow these verified reference test cases:

### Test Case 1: Single Group Overtime (8 Hours Standard)
* **Input:** 2 Mesans @ ₹850/day. 1 worker did 1 hour OT.
* **Formulas:**
  * $\text{OT Rate} = 850 / 8 = \mathbf{₹106/hr}$
  * $\text{Base Wage} = 2 \times ₹850 = \mathbf{₹1,700}$
  * $\text{OT Wage} = 1 \times 1\text{h} \times ₹106 = \mathbf{₹106}$
  * $\text{Group Total} = ₹1,700 + ₹106 = \mathbf{₹1,806}$
* **Expected Result:** ✅ PASS

### Test Case 2: Helper Group Overtime
* **Input:** 2 Helpers @ ₹600/day. 2 workers did 1 hour OT.
* **Formulas:**
  * $\text{OT Rate} = 600 / 8 = \mathbf{₹75/hr}$
  * $\text{Base Wage} = 2 \times ₹600 = \mathbf{₹1,200}$
  * $\text{OT Wage} = 2 \times 1\text{h} \times ₹75 = \mathbf{₹150}$
  * $\text{Group Total} = ₹1,200 + ₹150 = \mathbf{₹1,350}$
* **Expected Result:** ✅ PASS

### Test Case 3: Defensive OT Clamping
* **Input:** 4 Helpers @ ₹550/day. User types 6 OT workers (exceeds group count) and 2 hours OT.
* **Clamping Action:**
  * Auto-clamps OT workers to $\min(6, 4) = \mathbf{4}$ workers.
  * $\text{OT Rate} = 550 / 8 = \mathbf{₹68/hr}$
  * $\text{Base Wage} = 4 \times ₹550 = \mathbf{₹2,200}$
  * $\text{OT Wage} = 4 \times 2\text{h} \times ₹68 = \mathbf{₹544}$
  * $\text{Group Total} = ₹2,200 + ₹544 = \mathbf{₹2,744}$
* **Expected Result:** ✅ PASS

---

## 2. Manual Testing Checklist (स्टेप-बाय-स्टेप टेस्टिंग)

### Suite 1: Daily Wage Entry & Dynamic Placeholders
1. Open the **Daily Wages** tab.
2. In the **Mesan** section:
   - Check Group 1 placeholder: shows `e.g. 850`.
   - Click `+ Add Another Mesan Rate Group (e.g. @ ₹900)`.
   - Check Group 2 placeholder: shows `e.g. 900`.
3. In the **Helper** section:
   - Check Group 1 placeholder: shows `e.g. 550`.
   - Click `+ Add Another Helper Rate Group (e.g. @ ₹600)`.
   - Check Group 2 placeholder: shows `e.g. 600`.
4. Enter worker counts and day rates, then click **Save Entry**.
5. Verify the **Success Modal** appears with:
   - Confetti animation.
   - WhatsApp Formatted Summary button (`Share on WhatsApp`).
   - Attendance Matrix Excel button (`Download Matrix Excel (.xlsx)`).

---

### Suite 2: Date Restriction Testing
1. In the top-left calendar picker, choose a **past date** (e.g. yesterday).
2. Verify the screen automatically shows **Saved Records**.
3. Click `+ New Wage Entry (Today Only)`.
4. Verify the **Date Restricted** banner appears:
   - Explains that new entries can only be entered for Today.
   - Shows button **"Switch to Today & Fill Entry"**.
   - Shows button **"View Saved Records"**.
5. Click **"Switch to Today & Fill Entry"** and verify you are immediately brought back to today's date with active inputs.

---

### Suite 3: Edit Saved Wage Entry
1. In the **Daily Wages** tab, switch to **Saved Records**.
2. Click the `✏️ Edit` button on any saved record card.
3. Verify the form opens in **Editing Wage Entry** mode with previous values pre-filled.
4. Modify a rate or worker count and click **Update Wage Entry**.
5. Verify the updated totals appear immediately in the saved list.

---

### Suite 4: Edit Site Name & Location
1. Click the top Site pill button (e.g. `ITC Mourya ▼`).
2. In the Site Selector modal, click the `✏️ Edit` button next to the site.
3. Update the site name or location (e.g., change "Sector 37" to "Sector 45").
4. Click **Update Site Details**.
5. Verify the updated name reflects instantly in the top bar and reports.

---

### Suite 5: Reports & PDF Billing Export
1. Go to the **Reports** tab.
2. Select `This Month (30 Days)` filter.
3. Verify KPI cards show Total Labour Wages, Total Site Kharcha, and Grand Total.
4. Click **Download / Share PDF**.
5. Verify the generated PDF:
   - Contains clean `Rs. 16,522.00` amounts without superscript `¹` errors.
   - Overtime column text is well-spaced and does not collide with column lines.
   - Dates are formatted as `DD/MM/YYYY`.

---

### Suite 6: Attendance Matrix Excel Export
1. On the **Reports** tab, click **Export Excel (.xlsx)**.
2. Open the downloaded file.
3. Verify:
   - **`Attendance_Matrix` Sheet:** Shows columns 1 to 31 with `P`, `HD`, `A`, or `P+2h`, along with Daily Rates and Total Payable.
   - **`Daily_Wages` Sheet:** Itemized breakdown of all headcount rate groups.
   - **`Site_Expenses` Sheet:** Itemized list of petty cash expenses.

---

## 3. Build & Quality Verification Commands

```bash
# Verify TypeScript types and production build
npm run build

# Run linter
npm run lint
```
