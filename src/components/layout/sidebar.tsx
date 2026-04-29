'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  Activity,
  User,
  Settings,
  Pill,
  Download,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '@/stores';
import { PEEK_CAPTION_PANEL_SKIN } from '@/lib/constants/peek-caption';
import { cn } from '@/lib/utils';
import { IronmindLogo } from '@/components/brand/ironmind-logo';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    hint: 'Density, schedule, and trend window at a glance.',
  },
  {
    href: '/recovery',
    label: 'Recovery',
    icon: Activity,
    hint: 'Sleep, readiness, and daily recovery signals.',
  },
  {
    href: '/nutrition',
    label: 'Nutrition',
    icon: Utensils,
    hint: 'Day-type targets, meals, and coach notes for today.',
  },
  {
    href: '/training',
    label: 'Training',
    icon: Dumbbell,
    hint: 'Start workouts, programs, and history.',
  },
  {
    href: '/supplements',
    label: 'Supplements',
    icon: Pill,
    hint: 'Protocol windows, timing, and compliance.',
  },
  {
    href: '/physique',
    label: 'Physique',
    icon: User,
    hint: 'Check-ins, weight, and measurement trends.',
  },
  {
    href: '/export',
    label: 'Export',
    icon: Download,
    hint: 'Markdown summary for coaches and LLMs.',
  },
  {
    href: '/guide',
    label: 'User Guide',
    icon: BookOpen,
    hint: 'Onboarding, architecture, and product tour.',
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    hint: 'Theme, profile, import, and account.',
  },
] as const;

/** All nav labels/icons use theme accent; active row gets weight + glow via classes */
const accentIcon = 'text-[color:var(--accent-light)]';
const accentLabel = 'text-[color:var(--accent-light)]';

type CollapsedNavPeek = {
  left: number;
  top: number;
  label: string;
  hint: string;
};

function collapsedPeekFromRow(el: HTMLElement, label: string, hint: string): CollapsedNavPeek {
  const r = el.getBoundingClientRect();
  return {
    left: r.right + 8,
    top: r.top + r.height / 2,
    label,
    hint,
  };
}

const PEEK_HIDE_DELAY_MS = 100;

export function Sidebar() {
  const pathname = usePathname();
  /** Narrow subscription — `dashboardTrendSelectedDate` (and other keys) must not re-render the rail or hover peeks vanish mid-hover. */
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const [collapsedPeek, setCollapsedPeek] = useState<CollapsedNavPeek | null>(null);
  const peekHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPeekHide = useCallback(() => {
    if (peekHideTimeoutRef.current != null) {
      clearTimeout(peekHideTimeoutRef.current);
      peekHideTimeoutRef.current = null;
    }
  }, []);

  const schedulePeekHide = useCallback(() => {
    if (peekHideTimeoutRef.current != null) clearTimeout(peekHideTimeoutRef.current);
    peekHideTimeoutRef.current = setTimeout(() => {
      peekHideTimeoutRef.current = null;
      setCollapsedPeek(null);
    }, PEEK_HIDE_DELAY_MS);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      cancelPeekHide();
      setCollapsedPeek(null);
    }
  }, [sidebarOpen, cancelPeekHide]);

  useEffect(() => () => cancelPeekHide(), [cancelPeekHide]);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-full flex-col overflow-x-visible transition-[width] duration-300 ease-out',
        'bg-[color:var(--chrome-bg)]',
        sidebarOpen ? 'w-64' : 'w-24',
      )}
    >
      {/* Logo — fixed size and position regardless of sidebar state */}
      <div className="flex w-full shrink-0 h-[5.5rem] items-center justify-center px-2 pt-0.5">
        <Link
          href="/guide"
          className="flex items-center justify-center rounded-lg outline-none ring-offset-2 ring-offset-[color:var(--bg-1)] focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/55"
        >
          <IronmindLogo variant="sidebar-expanded" priority />
          <span className="sr-only">IRONMIND — User Guide</span>
        </Link>
      </div>

      {/* Toggle — no hover flyout (avoids stacking over nav rail tooltips). */}
      <div className="absolute -right-3 z-50 top-[5.75rem]">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className={cn(
            'w-6 h-6 rounded-full',
            'flex items-center justify-center',
            'bg-[color:var(--chrome-bg-toggle)] border border-[color:var(--chrome-border)]',
            'text-[color:var(--text-1)] hover:text-[color:var(--accent)] hover:border-[color:color-mix(in_srgb,var(--accent)_35%,transparent)]',
            'shadow-[0_4px_12px_rgba(0,0,0,0.4)]',
            'transition-all duration-200 hover:scale-110',
          )}
        >
          {sidebarOpen ? (
            <ChevronLeft size={12} aria-hidden="true" />
          ) : (
            <ChevronRight size={12} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Collapsed-rail hover/focus peeks portaled to body so they are not clipped by nav overflow
          or painted under the main column (sibling paint order). */}
      {!sidebarOpen &&
        collapsedPeek &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            aria-hidden
            className={cn(
              PEEK_CAPTION_PANEL_SKIN,
              'sidebar-rail-peek-panel',
              'pointer-events-none fixed z-[160] -translate-y-1/2 text-center',
            )}
            style={{ left: collapsedPeek.left, top: collapsedPeek.top }}
          >
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)]">
              {collapsedPeek.label}
            </span>
            <span className="mt-1 block text-xs leading-snug text-[color:var(--text-detail)] break-words">
              {collapsedPeek.hint}
            </span>
          </div>,
          document.body,
        )}

      <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto py-3 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <div
              key={item.href}
              className={cn(
                'group/navrow relative min-w-0',
                sidebarOpen ? 'w-full' : 'flex w-full justify-center',
              )}
            >
              <Link
                href={item.href}
                data-active={isActive}
                data-rail={sidebarOpen ? undefined : 'collapsed'}
                aria-current={isActive ? 'page' : undefined}
                aria-label={sidebarOpen ? undefined : `${item.label}. ${item.hint}`}
                onMouseEnter={(e) => {
                  if (sidebarOpen) return;
                  cancelPeekHide();
                  setCollapsedPeek(collapsedPeekFromRow(e.currentTarget, item.label, item.hint));
                }}
                onMouseLeave={(e) => {
                  if (sidebarOpen) return;
                  const rel = e.relatedTarget as Node | null;
                  if (!(e.currentTarget as HTMLElement).contains(rel)) schedulePeekHide();
                }}
                onFocus={(e) => {
                  if (sidebarOpen) return;
                  cancelPeekHide();
                  setCollapsedPeek(collapsedPeekFromRow(e.currentTarget, item.label, item.hint));
                }}
                onBlur={(e) => {
                  if (sidebarOpen) return;
                  const rel = e.relatedTarget as Node | null;
                  if (!e.currentTarget.parentElement?.contains(rel)) schedulePeekHide();
                }}
                className={cn('nav-item', sidebarOpen && 'justify-center', isActive && 'active')}
              >
                <span
                  className={cn(
                    'flex shrink-0 items-center justify-center [&>svg]:block [&>svg]:shrink-0',
                    sidebarOpen ? 'size-5' : 'size-[18px]',
                  )}
                >
                  <Icon
                    size={sidebarOpen ? 20 : 18}
                    className={cn(
                      'transition-colors duration-[220ms]',
                      accentIcon,
                      isActive &&
                        'drop-shadow-[0_0_8px_color-mix(in_srgb,var(--accent)_50%,transparent)]',
                      !isActive && 'opacity-90 group-hover/navrow:opacity-100',
                    )}
                  />
                </span>
                {sidebarOpen && (
                  <span
                    className={cn(
                      'min-w-0 max-w-full text-center text-sm leading-snug tracking-wide break-words transition-colors duration-[220ms]',
                      accentLabel,
                      isActive
                        ? 'font-semibold'
                        : 'font-medium opacity-90 group-hover/navrow:opacity-100',
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="h-8 shrink-0 bg-gradient-to-t from-[color:var(--chrome-bg)] to-transparent pointer-events-none" />
    </aside>
  );
}
