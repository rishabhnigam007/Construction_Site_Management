# Security & Privacy Model (SECURITY.md)
## Labour Manager Pro (लेबर मैनेजर प्रो)

**Security Architecture:** Offline-First, Zero-Cloud, Sandbox-Isolated Local Storage  
**Data Sensitivity:** Confidential Daily Wage Records, Worker Personally Identifiable Information (PII), and Project Financials

---

## 1. Security Philosophy & Privacy-by-Design

Labour Manager Pro operates on a strict **zero-trust, zero-cloud** security model. Unlike conventional SaaS construction platforms that upload employee rosters and financial payroll to multi-tenant cloud servers:

1. **Zero External Network Traffic:** The application never transmits wage data, employee names, mobile numbers, or expense receipts to any external API, tracking server, or cloud backend.
2. **Zero Third-Party Telemetry:** No analytics SDKs (e.g., Google Analytics, Mixpanel, Sentry) or advertising scripts are loaded in the application.
3. **Complete Device Ownership:** 100% of the database resides in the user's local device storage (IndexedDB inside the Android application sandbox).

---

## 2. Threat Model & Mitigations

| Threat Vector | Risk Level | Mitigation Strategy in Labour Manager Pro |
| :--- | :--- | :--- |
| **Cloud Data Breach / Leaks** | **None (N/A)** | No cloud database or backend API exists. Data cannot be intercepted in transit or compromised via server breach. |
| **Operating System Storage Eviction** | Medium | The app triggers `navigator.storage.persist()` on initialization to mark IndexedDB as persistent, preventing Android from clearing data during low-storage events. |
| **Cross-Site Scripting (XSS)** | Low | React's virtual DOM auto-escapes all user input strings. The codebase strictly prohibits `dangerouslySetInnerHTML` or `eval()`. |
| **Malformed / Corrupt Backup Import** | Medium | The JSON restore engine in [`src/services/backupService.ts`](file:///e:/sonu/src/services/backupService.ts) executes schema validation to verify table integrity before writing to Dexie. |
| **Arithmetic Injection & Numeric Overflow** | Low | Input fields are parsed via `Math.max(0, ...)` with defensive clamping to prevent `NaN`, negative hours, or runaway overtime calculations. |
| **Unauthorized Physical Device Access** | Medium | Users are encouraged to utilize standard Android OS screen locks (PIN, Pattern, Biometrics) and periodic 1-tap JSON backups. |

---

## 3. Data Storage & Sandbox Isolation

### 3.1. Android Native Sandbox
When running as an Android application via Capacitor 6:
- The IndexedDB database (`LabourManagerProDB`) is stored inside the app's private internal data directory (`/data/data/com.labourmanager.pro/app_webview/`).
- Android OS sandboxing prohibits other installed third-party apps from reading or altering Labour Manager Pro's internal database files.

### 3.2. Web Browser Same-Origin Policy
When accessed via a mobile browser:
- IndexedDB storage is bound to the exact origin (`protocol + domain + port`).
- No other website or cross-origin script can access the stored wage ledger.

---

## 4. Input Validation & Defensive Engineering

To ensure computational integrity and prevent arithmetic corruption:

```typescript
// Example: Defensive numeric sanitization in wageCalculator.ts
export function calculateGroupTotals(group: RateGroup, shiftHours: number = 9): RateGroup {
  const count = typeof group.count === 'number' ? Math.max(0, group.count) : 0;
  const dayRate = typeof group.dayRate === 'number' ? Math.max(0, group.dayRate) : 0;
  const otWorkersRaw = typeof group.otWorkers === 'number' ? Math.max(0, group.otWorkers) : 0;
  const otHours = typeof group.otHours === 'number' ? Math.max(0, group.otHours) : 0;

  // Defensive Clamping: OT workers can never exceed the total group count
  const otWorkers = Math.min(otWorkersRaw, count);

  const calculatedOtRate = shiftHours > 0 ? dayRate / shiftHours : 0;
  const calculatedGroupBase = count * dayRate;
  const calculatedGroupOt = otWorkers * otHours * calculatedOtRate;
  const calculatedGroupTotal = calculatedGroupBase + calculatedGroupOt;

  return {
    ...group,
    count,
    dayRate,
    otWorkers,
    otHours,
    calculatedOtRate,
    calculatedGroupBase,
    calculatedGroupOt,
    calculatedGroupTotal,
  };
}
```

---

## 5. Backup & Restore Security Protocol

### 5.1. Export Security
- Backup files exported from [`src/services/backupService.ts`](file:///e:/sonu/src/services/backupService.ts) contain:
  - Application version and timestamp metadata.
  - Complete tables: `sites`, `contractors`, `headcountEntries`, `namedWorkers`, `workerAttendance`, `pettyExpenses`, `settings`.
- Files are saved with standardized naming: `LabourManager_Backup_YYYY-MM-DD.json`.

### 5.2. Restore Validation Rules
Before any restore operation executes:
1. **File Type Verification:** Verifies the file is valid JSON.
2. **Schema Integrity:** Confirms required database keys exist (`sites`, `headcountEntries`, etc.).
3. **Explicit User Confirmation:** A modal confirmation dialog alerts the user that existing local data will be replaced.
4. **Atomic Transaction:** Dexie executes the restore in an atomic transaction to ensure no partial state is left if parsing fails.

---

## 6. Native Android Permission Model

Labour Manager Pro follows the principle of least privilege:
- **Internet Permission:** NOT required for core operations.
- **Storage Access:** Uses modern scoped storage for PDF/Excel document export.
- **Native Share:** Uses `@capacitor/share` to pass generated PDF blobs directly to WhatsApp without requesting broad external storage permissions.
