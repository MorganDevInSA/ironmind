'use client';

interface OnboardingProgressProps {
  steps: string[];
  current: number;
  onStepClick?: (index: number) => void;
}

export function OnboardingProgress({ steps, current, onStepClick }: OnboardingProgressProps) {
  const pct = (current / (steps.length - 1)) * 100;
  const last = steps.length - 1;

  return (
    <div className="sticky top-0 z-20 w-full bg-[rgba(8,8,8,0.95)] backdrop-blur-md border-b border-[rgba(65,50,50,0.30)] px-4 py-3">
      {/* Step labels — desktop */}
      <div className="hidden sm:flex items-center justify-between max-w-3xl mx-auto mb-2 gap-1">
        {steps.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => onStepClick?.(i)}
            aria-current={i === current ? 'step' : undefined}
            className={`text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors duration-200 rounded px-1 py-0.5 -my-0.5 cursor-pointer
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_55%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(8,8,8,0.98)]
              hover:text-[color:var(--accent-light)] ${
                i === current
                  ? 'text-[color:var(--accent-light)] underline underline-offset-4 decoration-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]'
                  : 'text-[color:var(--text-2)]'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Mobile: current step + tappable strip */}
      <div className="sm:hidden mb-2 space-y-2">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-light)]">
          {steps[current]} — {current + 1} / {steps.length}
        </p>
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          {steps.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => onStepClick?.(i)}
              aria-current={i === current ? 'step' : undefined}
              className={`shrink-0 rounded-md border px-2 py-1 text-[9px] font-semibold uppercase tracking-wide transition-colors cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_55%,transparent)]
                ${
                  i === current
                    ? 'border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] text-[color:var(--accent-light)]'
                    : 'border-[color:var(--chrome-border)] bg-[rgba(16,16,16,0.5)] text-[color:var(--text-2)] active:bg-[rgba(22,16,16,0.7)]'
                }`}
            >
              {label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar track */}
      <div className="relative h-[3px] max-w-3xl mx-auto bg-[rgba(65,50,50,0.40)] rounded-full overflow-visible">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-light)] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
        {/* Step dots — large tap targets */}
        {steps.map((label, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onStepClick?.(i)}
            aria-label={`Go to ${label}`}
            aria-current={i === current ? 'step' : undefined}
            className="absolute top-1/2 -translate-y-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full cursor-pointer
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_55%,transparent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[rgba(8,8,8,0.98)]"
            style={{ left: `${(i / last) * 100}%` }}
          >
            <span
              className={`pointer-events-none block h-2.5 w-2.5 rounded-full border-2 transition-all duration-300 ${
                i <= current
                  ? 'border-[color:var(--accent-light)] bg-[color:var(--accent)] shadow-[0_0_8px_color-mix(in_srgb,var(--accent)_50%,transparent)]'
                  : 'border-[color:var(--chrome-border)] bg-[color:var(--bg-2)]'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
