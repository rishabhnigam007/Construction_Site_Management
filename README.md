# Labour Manager Pro (लेबर मैनेजर प्रो)

> **100% Offline Construction Wage Ledger & Site Manager for Android**

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20Web-blue.svg)
![Offline First](https://img.shields.io/badge/storage-IndexedDB%20100%25%20Offline-emerald.svg)

---

## 🏗️ Overview

**Labour Manager Pro** is a rugged, offline-first mobile application purpose-built for construction site managers, civil supervisors, and labour contractors (Thekedaars). It eliminates manual diary calculations, prevents calculation disputes, and enables 1-tap WhatsApp sharing and Excel Matrix report exports.

---

## ⚡ Key Capabilities

- **⚡ Fast Headcount Wage Ledger:** Record multiple rate groups in one entry (e.g. *1 Mesan @ ₹850 + 2 Helpers @ ₹600 + 4 Helpers @ ₹550*).
- **✏️ Edit Mistri & Helper Rates:** Full inline editing of saved wage entries with live recalculation of base wages and overtime.
- **⏱️ Standard 8-Hour OT Calculation:** Automatic hourly overtime rate calculation ($\text{Hourly OT} = \lfloor\text{Day Rate} / 8\rfloor$) matching contractor accounting standards.
- **🏢 Site Name & Location Editing:** Rename sites, update addresses, and manage client names anytime.
- **📅 Unrestricted Calendar Selection:** Access all past months/years and future dates without restriction.
- **👥 Staff & Manager Attendance:** Dedicated roster for site managers, mentors, supervisors, and workers with standalone Muster Roll PDF exports.
- **💬 Exact WhatsApp Text Format:** Instant 1-tap WhatsApp attendance report generator matching site contractor layouts.
- **📊 Attendance Matrix Excel (.xlsx) Export:** Dual-block matrix table showing distinct wage rates, daily worker headcounts, and total amounts.
- **📄 Official PDF Bills:** 7-column contractor bills with standardized **`DD/MM/YYYY`** date formats (e.g. `30/09/2026`).
- **🌐 Bilingual UI:** Instant switch between **English** and **हिन्दी (Hindi / Hinglish)**.
- **🛡️ 100% Offline with Backup:** IndexedDB storage with 1-click JSON backup export/restore.

---

## 📐 Mathematical Wage Formulas

$$\text{Hourly Overtime Rate} = \left\lfloor\frac{\text{Day Rate}}{8}\right\rfloor$$
$$\text{Group Base Wage} = \text{Count} \times \text{Day Rate}$$
$$\text{Group OT Wage} = \text{OT Workers} \times \text{OT Hours} \times \left\lfloor\frac{\text{Day Rate}}{8}\right\rfloor$$
$$\text{Group Total} = \text{Group Base Wage} + \text{Group OT Wage}$$
$$\text{Day Total} = \sum \text{Group Totals for Date}$$

---

## 🚀 How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Build production bundle
npm run build
```

Open **`http://localhost:5173/`** in your browser.

---

## 📱 How to Run as Android App (Capacitor)

```bash
# 1. Build web assets
npm run build

# 2. Add Android native project (one-time)
npx cap add android

# 3. Sync web assets into Android Studio
npx cap sync android

# 4. Open project in Android Studio
npx cap open android
```

In **Android Studio**, connect your Android phone (or launch emulator) and click the green **▶ Run** button.

---

## 📚 Project Documentation

Explore the complete documentation in the [`docs/`](docs/README.md) directory:

- 📄 [Product Requirements Document (PRD)](docs/PRD.md)
- 🤖 [Agent Guidelines & Engineering Playbook](docs/AGENTS.md)
- 🎨 [Design System & Daylight Ledger Specs](docs/DESIGN_SYSTEM.md)
- 🏗️ [Technical Architecture & DB Schemas](docs/ARCHITECTURE.md)
- 🛡️ [Security & Offline Privacy Model](docs/SECURITY.md)
- 📐 [Code Style & Engineering Conventions](docs/CODE_STYLE.md)
- 🧪 [Testing & Verification Strategy](docs/TESTING.md)
- 📚 [Docs Central Index](docs/README.md)
