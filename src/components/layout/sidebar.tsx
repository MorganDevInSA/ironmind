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
  Pill,
  Download,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';
import { IronmindLogo } from '@/components/brand/ironmind-logo';

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/training',     label: 'Training',     icon: Dumbbell },
  { href: '/nutrition',    label: 'Nutrition',    icon: Utensils },
  { href: '/supplements',  label: 'Supplements',  icon: Pill },
  { href: '/recovery',     label: 'Recovery',     icon: Activity },
  { href: '/physique',     label: 'Physique',     icon: User },
  { href: '/export',       label: 'Export',       icon: Download },
  { href: '/settings',     label: 'Settings',     icon: Settings },
  { href: '/guide',        label: 'User Guide',   icon: BookOpen },
];

/** All nav labels/icons use theme accent; active row gets weight + glow via classes */
const accentIcon = 'text-[color:var(--accent-light)]';
const accentLabel = 'text-[color:var(--accent-light)]';

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-40 flex flex-col transition-[width] duration-300 ease-out',
        'bg-[color:var(--chrome-bg)]',
        sidebarOpen ? 'w-60' : 'w-[72px]'
      )}
    >
      {/* Logo — fixed size and position regardless of sidebar state */}
      <div className="flex w-full shrink-0 h-[5.5rem] items-center justify-center px-2">
        <Link
          href="/guide"
          className="flex items-center justify-center rounded-lg outline-none ring-offset-2 ring-offset-[#0d0d0d] focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/55"
        >
          <IronmindLogo variant="sidebar-expanded" priority />
          <span className="sr-only">IRONMIND — User Guide</span>
        </Link>
      </div>

      {/* Toggle Button */}
      <button
        type="button"
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3 w-6 h-6 rounded-full z-50 top-[5.75rem]',
          'flex items-center justify-center',
          'bg-[color:var(--chrome-bg-toggle)] border border-[color:var(--chrome-border)]',
          'text-[color:var(--text-1)] hover:text-[color:var(--accent)] hover:border-[color:color-mix(in_srgb,var(--accent)_35%,transparent)]',
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
                  accentIcon,
                  isActive &&
                    'drop-shadow-[0_0_8px_color-mix(in_srgb,var(--accent)_50%,transparent)]',
                  !isActive && 'opacity-90 group-hover:opacity-100'
                )}
              />
              {sidebarOpen && (
                <span
                  className={cn(
                    'text-sm tracking-wide transition-colors duration-[220ms] truncate',
                    accentLabel,
                    isActive ? 'font-semibold' : 'font-medium opacity-90 group-hover:opacity-100'
                  )}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="h-8 shrink-0 bg-gradient-to-t from-[color:var(--chrome-bg)] to-transparent pointer-events-none" />
    </aside>
  );
}
