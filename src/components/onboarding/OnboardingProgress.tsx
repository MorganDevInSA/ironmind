interface OnboardingProgressProps {
  steps: string[];
  current: number;
}

export function OnboardingProgress({ steps, current }: OnboardingProgressProps) {
  const pct = (current / (steps.length - 1)) * 100;

  return (
    <div className="sticky top-0 z-20 w-full bg-[rgba(8,8,8,0.95)] backdrop-blur-md border-b border-[rgba(65,50,50,0.30)] px-4 py-3">
      {/* Step labels — desktop */}
      <div className="hidden sm:flex items-center justify-between max-w-3xl mx-auto mb-2">
        {steps.map((label, i) => (
          <span
            key={label}
            className={`text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors duration-200 ${
              i === current
                ? 'text-[#EF4444]'
                : i < current
                  ? 'text-[#5E5E5E]'
                  : 'text-[#3A3A3A]'
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Mobile: current step label */}
      <div className="sm:hidden text-center mb-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#EF4444]">
          {steps[current]} — {current + 1} / {steps.length}
        </span>
      </div>

      {/* Progress bar track */}
      <div className="relative h-[3px] max-w-3xl mx-auto bg-[rgba(65,50,50,0.40)] rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#DC2626] to-[#EF4444] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
        {/* Step dots */}
        {steps.map((_, i) => (
          <div
            key={i}
            className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
              i <= current
                ? 'bg-[#DC2626] border-[#EF4444] shadow-[0_0_8px_rgba(220,38,38,0.5)]'
                : 'bg-[#1a1a1a] border-[rgba(65,50,50,0.60)]'
            }`}
            style={{ left: `calc(${(i / (steps.length - 1)) * 100}% - 5px)` }}
          />
        ))}
      </div>
    </div>
  );
}
