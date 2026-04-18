'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  Activity,
  User,
  Settings,
  FileText,
  Pill,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/training',     label: 'Training',     icon: Dumbbell },
  { href: '/nutrition',    label: 'Nutrition',    icon: Utensils },
  { href: '/supplements',  label: 'Supplements',  icon: Pill },
  { href: '/recovery',     label: 'Recovery',     icon: Activity },
  { href: '/physique',     label: 'Physique',     icon: User },
  { href: '/coaching',     label: 'Coaching',     icon: FileText },
  { href: '/settings',     label: 'Settings',     icon: Settings },
];

const activeText = 'text-[#EF4444]';
const idleText = 'text-[#8A8A8A]';
const hoverText = 'group-hover:text-[#C8C8C8]';

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-40 flex flex-col transition-[width] duration-300 ease-out',
        'bg-[#2e2e2e] backdrop-blur-xl',
        sidebarOpen ? 'w-60' : 'w-[72px]'
      )}
    >
      {/* Vertical accent: starts below TopBar (h-14) so it meets the header bottom border — moves with sidebar width */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute right-0 top-14 bottom-0 z-[5] w-[3px]',
          'bg-[rgba(220,38,38,0.45)] hidden lg:block'
        )}
      />
      {/* Logo — centered crimson wordmark */}
      <div
        className={cn(
          'flex items-center justify-center w-full shrink-0',
          sidebarOpen ? 'h-[4.75rem] px-4' : 'h-[4.75rem] px-0'
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            'font-heading font-bold lowercase tracking-[0.14em] text-[#DC2626] text-center leading-none',
            sidebarOpen ? 'text-2xl md:text-[1.75rem]' : 'text-3xl tracking-tight'
          )}
        >
          {sidebarOpen ? 'ironmind' : 'i'}
        </Link>
      </div>

      {/* Toggle Button */}
      <button
        type="button"
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3 top-[5rem] w-6 h-6 rounded-full z-50',
          'flex items-center justify-center',
          'bg-[#1a1a1a] border border-[rgba(220,38,38,0.40)]',
          'text-[#DC2626] hover:border-[rgba(239,68,68,0.55)]',
          'shadow-[0_4px_12px_rgba(0,0,0,0.4)]',
          'transition-all duration-200 hover:scale-110'
        )}
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={isActive}
              className={cn(
                'nav-item group',
                !sidebarOpen && 'justify-center max-w-none px-0',
                isActive && 'active'
              )}
            >
              <Icon
                size={20}
                className={cn(
                  'shrink-0 transition-colors duration-[220ms]',
                  isActive ? activeText : cn(idleText, hoverText)
                )}
              />
              {sidebarOpen && (
                <span
                  className={cn(
                    'text-sm font-semibold tracking-wide transition-colors duration-[220ms] truncate',
                    isActive ? activeText : cn(idleText, 'group-hover:text-[#E8E8E8]')
                  )}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="h-8 shrink-0 bg-gradient-to-t from-[#2e2e2e] to-transparent pointer-events-none" />
    </aside>
  );
}
