# Code Style & Engineering Standards (CODE_STYLE.md)
## Labour Manager Pro (लेबर मैनेजर प्रो)

**Standard:** Modern Strict TypeScript + React 18/19 + Tailwind CSS v4 + Oxlint  
**Goal:** Maintain mathematical precision, flawless offline reactivity, zero-lint warnings, and clean bilingual architecture.

---

## 1. TypeScript Conventions & Type Safety

### 1.1. Strict Typing
- All files must be TypeScript (`.ts` or `.tsx`).
- `any` is strictly prohibited. Use explicit interfaces or typed generics.
- Enable and maintain strict compiler checks in `tsconfig.json`.

### 1.2. Form Input vs Domain Model Types
In mobile input forms, numeric fields can be temporarily blank while the user types. Always model these form states using `number | ''`:

```typescript
// ✅ Correct: Form state allows empty string during editing
export interface RateGroupFormState {
  id: string;
  workerType: 'mesan' | 'helper' | 'carpenter' | 'bar_bender' | 'other';
  count: number | '';
  dayRate: number | '';
  otWorkers: number | '';
  otHours: number | '';
}

// ✅ Correct: Pure calculation sanitizer converts to strict number
export function sanitizeNumber(val: number | '' | undefined): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : Math.max(0, val);
  }
  return 0;
}
```

### 1.3. Interface vs Type Alias
- Use `interface` for domain data models and React component props.
- Use `type` for unions, intersections, and primitive type aliases.

```typescript
// Interfaces for data entities
export interface NamedWorker {
  id: string;
  name: string;
  role: WorkerRole;
  defaultDayRate: number;
}

// Type aliases for finite unions
export type WorkerRole = 'mesan' | 'helper' | 'carpenter' | 'bar_bender' | 'plumber' | 'electrician' | 'painter';
export type PaymentMode = 'cash' | 'upi';
```

---

## 2. React Component Architecture

### 2.1. Component Structure & Typing
- Always type component props with an explicit interface named `[ComponentName]Props` or `Props`.
- Structure components in the following order:
  1. Imports (React, third-party libraries, icons, local components, services/utils, types)
  2. Component Props Interface
  3. Component Definition
  4. Hooks (`useTranslation`, `useLiveQuery`, `useState`, `useMemo`, `useCallback`)
  5. Helper event handlers
  6. Return JSX

```tsx
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { RateGroup } from '../../types';
import { formatINR } from '../../utils/formatters';

interface RateGroupCardProps {
  group: RateGroup;
  index: number;
  onUpdate: (updated: RateGroup) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export const RateGroupCard: React.FC<RateGroupCardProps> = ({
  group,
  index,
  onUpdate,
  onRemove,
  canRemove,
}) => {
  const { t } = useTranslation();
  // Implementation...
};
```

### 2.2. Reactive Database Queries with `useLiveQuery`
- Do NOT pull Dexie data with `useEffect` + `setState`.
- ALWAYS use `useLiveQuery` from `dexie-react-hooks` to ensure instantaneous, zero-lag reactivity across views.

```tsx
// ✅ Correct: Reactive database binding
const workers = useLiveQuery(
  () => db.namedWorkers.where('siteId').equals(activeSiteId).toArray(),
  [activeSiteId]
);
```

---

## 3. Tailwind CSS & Styling Conventions

### 3.1. Design Tokens & Semantic Classes
- Use semantic theme classes instead of arbitrary raw hex codes in markup:
  - `bg-background`, `text-foreground`
  - `bg-card`, `text-card-foreground`, `border-border`
  - `bg-primary`, `text-primary-foreground` (Emerald CTA)
  - `bg-accent`, `text-accent-foreground` (Soft emerald highlights)
  - `text-destructive`, `bg-destructive/10` (Delete actions)

### 3.2. Numeric & Currency Displays
- ALWAYS apply the `.tabular-nums` class to any element containing currency amounts, quantities, hours, or rates.

```tsx
<span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
  {formatINR(group.calculatedGroupTotal)}
</span>
```

### 3.3. Touch Targets & Mobile Utilities
- Interactive elements must have a minimum size of `min-h-[44px]` or `min-h-[48px]`.
- Use `safe-area-top` on headers and `safe-area-bottom` on bottom docks.

---

## 4. Internationalization (i18n) Rules

1. **No Raw English Strings:** Every text label, button, placeholder, and error message in TSX must use `t('section.key')`.
2. **Key Consistency:** Mirror all translation keys between [`src/i18n/en.json`](file:///e:/sonu/src/i18n/en.json) and [`src/i18n/hi.json`](file:///e:/sonu/src/i18n/hi.json).
3. **Construction Terminology Standards:**
   - Mason $\rightarrow$ **Mesan (मिस्त्री)**
   - Helper $\rightarrow$ **Helper (मजदूर)**
   - Attendance $\rightarrow$ **Haajri (हाजिरी)**
   - Daily Wage $\rightarrow$ **Dainik Majdoori (दैनिक मजदूरी)**
   - Petty Cash $\rightarrow$ **Site Kharcha (साइट खर्चा)**
   - Total Amount $\rightarrow$ **Kul Rakam (कुल रकम)**

---

## 5. File & Naming Conventions

| Entity | Convention | Example |
| :--- | :--- | :--- |
| **React Components** | `PascalCase.tsx` | `HeadcountEntryForm.tsx`, `RateGroupCard.tsx` |
| **Services & Helpers** | `camelCase.ts` | `pdfGenerator.ts`, `wageCalculator.ts` |
| **Type Definitions** | `index.ts` / `[name].ts` | `src/types/index.ts` |
| **Constants** | `UPPER_SNAKE_CASE` | `DEFAULT_SHIFT_HOURS = 9` |
| **Translation Keys** | `camelCase` hierarchy | `dailyWage.mesansSection`, `common.save` |

---

## 6. Linting & Quality Verification

- **Linter:** `oxlint` configured in `.oxlintrc.json` for lightning-fast Rust-based static analysis.
- **Verification Commands:**
  ```bash
  # Check types and build web assets
  npm run build

  # Run static analysis linter
  npm run lint
  ```
