/**
 * Shared accent “caption” peek shell: collapsed sidebar rail + plan-by-day strip.
 * Layout width: globals `.sidebar-rail-peek-panel` / `.plan-day-strip-peek-panel` (216px, −10% vs 240).
 * Border color/width live in `globals.css` on `.sidebar-rail-peek-panel` / `.plan-day-strip-peek-panel` (same as `.nav-item.active`).
 * Inner copy: uppercase title (`text-[10px]`) + hint (`text-xs mt-1 leading-snug`).
 */
export const PEEK_CAPTION_PANEL_SKIN =
  'rounded-lg ' +
  'bg-[color:color-mix(in_srgb,var(--panel-strong)_94%,black_6%)] backdrop-blur-sm ' +
  'px-3 py-2.5 shadow-[0_12px_32px_color-mix(in_srgb,black_55%,transparent),0_0_14px_color-mix(in_srgb,var(--accent)_9%,transparent),inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-1px_0_rgba(0,0,0,0.58)]';
