'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  Activity,
  MoreHorizontal,
  Pill,
  User,
  Download,
  Settings,
  BookOpen,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const primaryItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/training', label: 'Train', icon: Dumbbell },
  { href: '/nutrition', label: 'Nutrition', icon: Utensils },
  { href: '/recovery', label: 'Recovery', icon: Activity },
];

const moreItems = [
  { href: '/supplements', label: 'Supplements', icon: Pill },
  { href: '/physique', label: 'Physique', icon: User },
  { href: '/export', label: 'Export', icon: Download },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/guide', label: 'User Guide', icon: BookOpen },
];

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = moreItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="More navigation"
        >
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />
          <div className="mobile-more-sheet absolute left-0 right-0 p-3">
            <div className="glass-panel-strong p-2 mx-auto max-w-sm">
              <div className="flex items-center justify-between px-3 py-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)]">
                  More
                </span>
                <button
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[color:var(--text-2)] hover:text-[color:var(--text-0)] hover:bg-[color:var(--surface-track)] transition-colors"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                      isActive
                        ? 'text-[color:var(--accent-light)] bg-[rgba(22,16,16,0.55)]'
                        : 'text-[color:var(--text-detail)] hover:text-[color:var(--text-0)] hover:bg-[rgba(22,16,16,0.6)]',
                    )}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
          'mobile-nav-bar flex items-start',
          'bg-[color:var(--chrome-bg)] backdrop-blur-xl',
          'border-t border-[color:var(--chrome-border)]',
          'shadow-[0_-8px_24px_rgba(0,0,0,0.3)]',
        )}
      >
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex-1 flex min-h-16 flex-col items-center justify-center gap-1',
                'transition-all duration-200',
                isActive
                  ? 'text-[color:var(--accent-light)]'
                  : 'text-[color:var(--text-detail)] hover:text-[color:var(--text-0)]',
              )}
            >
              <Icon
                size={20}
                aria-hidden="true"
                className={cn(
                  isActive &&
                    'drop-shadow-[0_0_6px_color-mix(in_srgb,var(--accent)_55%,transparent)]',
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-wide',
                  isActive
                    ? 'text-[color:var(--accent-light)]'
                    : 'text-[color:var(--text-detail)] opacity-95',
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-0 w-6 h-0.5 rounded-t-full bg-[color:var(--accent)] [filter:drop-shadow(0_0_4px_color-mix(in_srgb,var(--accent)_60%,transparent))]"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen((o) => !o)}
          aria-label="More navigation options"
          aria-expanded={moreOpen}
          className={cn(
            'relative flex-1 flex min-h-16 flex-col items-center justify-center gap-1',
            'transition-all duration-200',
            isMoreActive || moreOpen
              ? 'text-[color:var(--accent-light)]'
              : 'text-[color:var(--text-detail)] hover:text-[color:var(--text-0)]',
          )}
        >
          <MoreHorizontal
            size={20}
            aria-hidden="true"
            className={cn(
              (isMoreActive || moreOpen) &&
                'drop-shadow-[0_0_6px_color-mix(in_srgb,var(--accent)_55%,transparent)]',
            )}
          />
          <span
            className={cn(
              'text-[10px] font-semibold uppercase tracking-wide',
              isMoreActive || moreOpen
                ? 'text-[color:var(--accent-light)]'
                : 'text-[color:var(--text-detail)] opacity-95',
            )}
          >
            More
          </span>
          {isMoreActive && !moreOpen && (
            <span
              className="absolute bottom-0 w-6 h-0.5 rounded-t-full bg-[color:var(--accent)] [filter:drop-shadow(0_0_4px_color-mix(in_srgb,var(--accent)_60%,transparent))]"
              aria-hidden="true"
            />
          )}
        </button>
      </nav>
    </>
  );
}
