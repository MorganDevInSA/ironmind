---
name: ironmind-states
description: Implement loading, error, and empty state patterns for IRONMIND. Use when building any page or component that fetches data. Ensures consistent UX across the app with proper skeleton loaders, error cards, and empty state messaging.
---

# IRONMIND UI State Patterns

Every data-driven component needs three states: loading, error, and empty.

---

## Loading States

### Skeleton Loader (Full Card)

Use for cards and panels while data loads:

```tsx
function SkeletonCard() {
  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="skeleton w-1/3 h-3 rounded" />
      <div className="skeleton w-full h-10 rounded" />
      <div className="skeleton w-2/3 h-3 rounded" />
    </div>
  );
}
```

### Skeleton Loader (Metric Card)

```tsx
function SkeletonMetricCard() {
  return (
    <div className="glass-panel p-5 space-y-3">
      <div className="flex justify-between items-center">
        <div className="skeleton w-24 h-2.5 rounded" />
        <div className="skeleton w-16 h-5 rounded-full" />
      </div>
      <div className="skeleton w-20 h-9 rounded" />
      <div className="skeleton w-32 h-3 rounded" />
    </div>
  );
}
```

### Skeleton Loader (Table Row)

```tsx
function SkeletonTableRow() {
  return (
    <tr className="border-b border-[color:var(--panel-border)]">
      <td className="p-4"><div className="skeleton w-32 h-4 rounded" /></td>
      <td className="p-4"><div className="skeleton w-16 h-4 rounded" /></td>
      <td className="p-4"><div className="skeleton w-20 h-4 rounded" /></td>
    </tr>
  );
}
```

### Skeleton Loader (List)

```tsx
function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-panel p-4 flex items-center gap-4">
          <div className="skeleton w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton w-1/2 h-4 rounded" />
            <div className="skeleton w-1/3 h-3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Spinner (Inline)

For buttons and small loading indicators:

```tsx
<div className="spinner" />

// Or inline with size control
<div className="spinner w-4 h-4" />
```

### Full Page Loading

```tsx
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="spinner w-8 h-8 mx-auto" />
        <p className="text-[color:var(--text-2)] text-sm">Loading...</p>
      </div>
    </div>
  );
}
```

### Loading Guidelines

- Skeleton should match the shape of real content
- Minimum 200ms display to prevent flash
- Use `.skeleton` class from globals.css (already theme-aware)
- Never show a blank page while loading

---

## Error States

### Error Card (Standard)

```tsx
import { AlertCircle, RefreshCw } from 'lucide-react';

function ErrorCard({ 
  message = 'Failed to load data', 
  onRetry 
}: { 
  message?: string; 
  onRetry?: () => void;
}) {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-[color:color-mix(in_srgb,var(--bad)_12%,transparent)]">
          <AlertCircle className="w-5 h-5 text-[color:var(--bad)]" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-[color:var(--text-0)] mb-1">
            Something went wrong
          </h3>
          <p className="text-sm text-[color:var(--text-1)] mb-4">
            {message}
          </p>
          {onRetry && (
            <button onClick={onRetry} className="btn-secondary text-sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Error Card (Compact)

For inline or small errors:

```tsx
function ErrorInline({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg 
      bg-[color:color-mix(in_srgb,var(--bad)_8%,transparent)]
      border border-[color:color-mix(in_srgb,var(--bad)_25%,transparent)]">
      <AlertCircle className="w-4 h-4 text-[color:var(--bad)] shrink-0" />
      <span className="text-sm text-[color:var(--bad)]">{message}</span>
    </div>
  );
}
```

### Full Page Error

```tsx
function PageError({ 
  title = 'Unable to load page',
  message = 'Please try again or contact support if the problem persists.',
  onRetry
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full 
          bg-[color:color-mix(in_srgb,var(--bad)_12%,transparent)]
          flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-[color:var(--bad)]" />
        </div>
        <h2 className="text-xl font-semibold text-[color:var(--text-0)] mb-2">
          {title}
        </h2>
        <p className="text-[color:var(--text-1)] mb-6">
          {message}
        </p>
        {onRetry && (
          <button onClick={onRetry} className="btn-primary">
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
```

### Error Guidelines

- Always show a retry action when possible
- Include helpful context (what failed, what to do)
- Never show raw error messages to users
- Log actual errors to console with domain prefix: `console.error('[domain] error:', error)`

---

## Empty States

### Empty State (Standard)

```tsx
import { Inbox, Plus } from 'lucide-react';
import Link from 'next/link';

function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  actionLabel,
  actionHref,
  onAction,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="glass-panel p-8 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full 
        bg-[color:var(--surface-well)]
        flex items-center justify-center">
        <Icon className="w-7 h-7 text-[color:var(--text-2)]" />
      </div>
      <h3 className="text-lg font-semibold text-[color:var(--text-0)] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[color:var(--text-1)] mb-6 max-w-sm mx-auto">
        {message}
      </p>
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <Link href={actionHref} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Link>
        ) : (
          <button onClick={onAction} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}
```

### Empty State Examples

```tsx
// No workouts
<EmptyState
  icon={Dumbbell}
  title="No workouts yet"
  message="Start tracking your training to see progress over time."
  actionLabel="Log Workout"
  actionHref="/training/workout"
/>

// No nutrition data
<EmptyState
  icon={Utensils}
  title="No meals logged"
  message="Track your nutrition to stay on target with your goals."
  actionLabel="Add Meal"
  onAction={() => setShowAddModal(true)}
/>

// Empty search results
<EmptyState
  icon={Search}
  title="No results found"
  message="Try adjusting your search or filters."
/>

// Empty table
<EmptyState
  icon={FileText}
  title="No entries"
  message="Data will appear here once you start logging."
/>
```

### Empty Guidelines

- Always include helpful guidance
- Provide a CTA when the user can add data
- Use appropriate icons (Lucide icon library)
- Keep messaging action-oriented

---

## Combined Pattern

Standard page structure with all three states:

```tsx
export default function MyPage() {
  const { data, isLoading, error, refetch } = useMyData();

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonMetricCard />
        <SkeletonMetricCard />
        <SkeletonList count={3} />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <PageError
        title="Unable to load data"
        message="We couldn't fetch your information. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  // Empty
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Nothing here yet"
        message="Get started by adding your first entry."
        actionLabel="Add Entry"
        actionHref="/add"
      />
    );
  }

  // Content
  return (
    <div>
      {/* Render actual data */}
    </div>
  );
}
```

---

## Button Loading State

For mutations and form submissions:

```tsx
function SubmitButton({ 
  isLoading, 
  children 
}: { 
  isLoading: boolean; 
  children: React.ReactNode;
}) {
  return (
    <button 
      type="submit" 
      disabled={isLoading}
      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <div className="spinner w-4 h-4 mr-2" />
          Saving...
        </>
      ) : (
        children
      )}
    </button>
  );
}
```
