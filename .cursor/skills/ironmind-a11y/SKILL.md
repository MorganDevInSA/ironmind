---
name: ironmind-a11y
description: Implement accessibility patterns for IRONMIND. Use when building interactive components, forms, modals, or any UI that needs keyboard navigation, screen reader support, or focus management.
---

# IRONMIND Accessibility Patterns

Every interactive element must be accessible via keyboard, screen reader, and assistive technology.

---

## Focus Management

### Focus Visible Ring

Global style in `globals.css`:

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

This automatically applies to all focusable elements. Do not override with `outline-none` without providing an alternative.

### Custom Focus Ring (When Needed)

```tsx
<button className="
  focus:outline-none
  focus-visible:ring-2
  focus-visible:ring-[color:var(--accent)]
  focus-visible:ring-offset-2
  focus-visible:ring-offset-[color:var(--bg-1)]
">
```

### Focus Within (Container Focus)

For cards or groups that should show focus when any child is focused:

```tsx
<div
  className="
  rounded-[14px] border border-[color:var(--panel-border)]
  focus-within:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]
  focus-within:ring-2
  focus-within:ring-[color:color-mix(in_srgb,var(--accent)_20%,transparent)]
"
>
  <input className="bg-transparent focus:outline-none" />
</div>
```

---

## Keyboard Navigation

### Skip Link

Add at the top of the layout for screen reader users:

```tsx
// In app layout
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
    focus:z-50 focus:btn-primary"
>
  Skip to main content
</a>

// Target
<main id="main-content" tabIndex={-1}>
```

### Arrow Key Navigation (Custom Listbox)

```tsx
function useArrowNavigation<T extends HTMLElement>(
  itemCount: number,
  onSelect: (index: number) => void,
) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, itemCount - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect(activeIndex);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(itemCount - 1);
        break;
    }
  };

  return { activeIndex, handleKeyDown };
}
```

### Tab Panel Navigation

```tsx
function TabPanel() {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Overview', 'Details', 'History'];

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveTab((index + 1) % tabs.length);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveTab((index - 1 + tabs.length) % tabs.length);
    }
  };

  return (
    <div>
      <div role="tablist" className="flex gap-2">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === i}
            aria-controls={`panel-${i}`}
            tabIndex={activeTab === i ? 0 : -1}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onClick={() => setActiveTab(i)}
            className={`tab-button ${activeTab === i ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={tab}
          id={`panel-${i}`}
          role="tabpanel"
          aria-labelledby={tab}
          hidden={activeTab !== i}
          tabIndex={0}
        >
          {/* Panel content */}
        </div>
      ))}
    </div>
  );
}
```

---

## Data tables

- Use real `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` — not div grids posing as tables.
- **`scope`:** Use `scope="col"` on column headers. For row-label cells (e.g. dates), `scope="row"` on a `<th>` is ideal; if global styles style every `th` like a small-caps header (see `.data-table th` in `globals.css`), either add **`tbody th`** overrides to match body cells or keep a `<td>` for the first column and rely on clear column headers plus nearby descriptive copy.
- **Caption:** Add a visually hidden caption when the table’s purpose is not obvious from surrounding headings: `<caption className="sr-only">…</caption>`.
- **Scroll containers:** Wrapping a wide table in `overflow-x-auto` is fine; ensure focusable controls inside remain reachable and the sticky first column keeps a solid background so text does not overlap when scrolling.

Reference: [`src/app/(app)/physique/page.tsx`](<../../../src/app/(app)/physique/page.tsx>) (History).

---

## Modal Accessibility

### Focus Trap

When a modal opens:

1. Focus moves to the modal
2. Tab cycles within the modal only
3. Escape closes the modal
4. Focus returns to trigger on close

```tsx
import { useEffect, useRef } from 'react';

function Modal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousActiveElement.current = document.activeElement;
      // Focus modal
      modalRef.current?.focus();
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore focus
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative glass-panel-strong p-6 max-w-lg w-full mx-4
          focus:outline-none"
      >
        {children}
      </div>
    </div>
  );
}
```

### Modal with Title

```tsx
<Modal isOpen={isOpen} onClose={onClose}>
  <h2 id="modal-title" className="text-xl font-semibold mb-4">
    Confirm Action
  </h2>
  <p id="modal-description" className="text-[color:var(--text-1)] mb-6">
    Are you sure you want to proceed?
  </p>
  <div className="flex gap-3 justify-end">
    <button onClick={onClose} className="btn-secondary">
      Cancel
    </button>
    <button onClick={handleConfirm} className="btn-primary">
      Confirm
    </button>
  </div>
</Modal>
```

---

## Form Accessibility

### Label Association

Always associate labels with inputs:

```tsx
// Visible label
<div className="space-y-1">
  <label
    htmlFor="weight"
    className="data-label"
  >
    BODY WEIGHT
  </label>
  <input
    id="weight"
    type="number"
    className="..."
  />
</div>

// Hidden label (icon-only input)
<div>
  <label htmlFor="search" className="sr-only">Search</label>
  <input
    id="search"
    type="search"
    placeholder="Search..."
    className="..."
  />
</div>
```

### Error Messages

Connect errors to inputs with `aria-describedby`:

```tsx
function FormField({ id, label, error }: { id: string; label: string; error?: string }) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="data-label">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`
          w-full px-4 py-3 rounded-lg bg-[color:var(--bg-2)]
          border ${error ? 'border-[color:var(--bad)]' : 'border-[color:var(--panel-border)]'}
        `}
      />
      {error && (
        <p id={errorId} className="text-sm text-[color:var(--bad)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Required Fields

```tsx
<label htmlFor="name">
  Name <span aria-hidden="true" className="text-[color:var(--bad)]">*</span>
  <span className="sr-only">(required)</span>
</label>
<input id="name" required aria-required="true" />
```

---

## Screen Reader Utilities

### Visually Hidden (sr-only)

For content that should be read but not seen:

```tsx
// Built into Tailwind
<span className="sr-only">Close menu</span>

// Or custom
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Live Regions

Announce dynamic content changes:

```tsx
// Polite (waits for pause in speech)
<div aria-live="polite" aria-atomic="true">
  {successMessage}
</div>

// Assertive (interrupts)
<div aria-live="assertive" role="alert">
  {errorMessage}
</div>

// Status messages
<div role="status" aria-live="polite">
  Loading... {progress}% complete
</div>
```

### Accessible Icons

```tsx
// Decorative icon (no announcement)
<ChevronRight className="w-4 h-4" aria-hidden="true" />

// Meaningful icon
<button aria-label="Close dialog">
  <X className="w-5 h-5" aria-hidden="true" />
</button>

// Icon with visible text (icon is decorative)
<button>
  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
  Add Workout
</button>
```

---

## Heading Hierarchy

Maintain logical heading structure:

```tsx
// Page structure
<main>
  <h1>Dashboard</h1> {/* One h1 per page */}
  <section>
    <h2>Today's Progress</h2> {/* Major sections */}
    <div>...</div>
  </section>
  <section>
    <h2>Weekly Summary</h2>
    <h3>Training</h3> {/* Subsections */}
    <h3>Nutrition</h3>
  </section>
</main>
```

Never skip heading levels (h1 → h3 without h2).

---

## Color Contrast

### Minimum Requirements

- **Normal text**: 4.5:1 contrast ratio
- **Large text** (18px+ or 14px+ bold): 3:1 contrast ratio
- **UI components** (borders, icons): 3:1 contrast ratio

### IRONMIND Palette Contrast (on `#080808`)

| Token      | Hex       | Contrast | Pass          |
| ---------- | --------- | -------- | ------------- |
| `--text-0` | `#F0F0F0` | 17.4:1   | ✅ AAA        |
| `--text-1` | `#9A9A9A` | 7.0:1    | ✅ AAA        |
| `--text-2` | `#5E5E5E` | 3.3:1    | ✅ Large only |
| `--accent` | `#DC2626` | 4.6:1    | ✅ AA         |
| `--good`   | `#22C55E` | 7.3:1    | ✅ AAA        |
| `--warn`   | `#F59E0B` | 8.5:1    | ✅ AAA        |

### Don't Rely on Color Alone

Always pair color with another indicator:

```tsx
// Bad: Color only
<span className={status === 'error' ? 'text-red-500' : 'text-green-500'}>
  {status}
</span>

// Good: Color + icon + text
<span className="flex items-center gap-2">
  {status === 'error' ? (
    <>
      <XCircle className="w-4 h-4 text-[color:var(--bad)]" aria-hidden="true" />
      <span className="text-[color:var(--bad)]">Failed</span>
    </>
  ) : (
    <>
      <CheckCircle className="w-4 h-4 text-[color:var(--good)]" aria-hidden="true" />
      <span className="text-[color:var(--good)]">Success</span>
    </>
  )}
</span>
```

---

## Touch Targets

Minimum touch target size: **44×44px** on mobile.

```tsx
// Small icon button — expand hit area
<button className="p-3 -m-3">
  <X className="w-5 h-5" />
</button>

// Or use min dimensions
<button className="min-w-[44px] min-h-[44px] flex items-center justify-center">
  <X className="w-5 h-5" />
</button>
```

---

## Shell: alerts bell (`TopBar`)

- **Toggle:** Bell control is a `<button>` with **`aria-expanded`** matching the panel and an **`aria-label`** that includes the **active** count (e.g. `Alerts, 2 active`).
- **Panel:** When open, provide a **Close** control with `aria-label="Close alerts"`; trap focus only if you upgrade to a true modal — today the panel is a lightweight popover.
- **Rows:** Each alert is a **full-width `<button>`** (keyboard activatable). Clicking dismisses for the **session** only — document that in copy if users confuse it with “fixing” the underlying issue.
- **Decorative chrome:** Pulse dot and numeric badge can stay **`aria-hidden`** when the label already conveys count; avoid duplicate announcements.

---

## Testing Checklist

- [ ] Tab through page — focus order is logical
- [ ] All interactive elements have visible focus ring
- [ ] Escape closes modals/dropdowns
- [ ] Screen reader announces page title, headings, buttons
- [ ] Form errors are announced and associated with fields
- [ ] Images have alt text (or `aria-hidden` if decorative)
- [ ] Color is not the only means of conveying information
- [ ] Touch targets are at least 44×44px on mobile
