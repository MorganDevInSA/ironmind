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
import { IronmindLogo } from '@/components/brand/ironmind-logo';

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
const idleText = 'text-[color:var(--text-detail)]';
const hoverText = 'group-hover:text-[color:var(--text-0)]';

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
      {/* Logo — canonical PNG wordmark */}
      <div
        className={cn(
          'flex items-center justify-center w-full shrink-0',
          sidebarOpen ? 'h-[4.75rem] px-3' : 'h-[4.75rem] px-0'
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center justify-center rounded-lg outline-none ring-offset-2 ring-offset-[#0d0d0d] focus-visible:ring-2 focus-visible:ring-[#DC2626]/55',
            sidebarOpen ? 'w-full justify-start pl-1' : 'w-full'
          )}
        >
          <IronmindLogo
            variant={sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}
            priority
          />
          <span className="sr-only">IRONMIND — home</span>
        </Link>
      </div>

      {/* Toggle Button */}
      <button
        type="button"
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3 top-[5rem] w-6 h-6 rounded-full z-50',
          'flex items-center justify-center',
          'bg-[color:var(--chrome-bg-toggle)] border border-[color:var(--chrome-border)]',
          'text-[color:var(--text-1)] hover:text-[#DC2626] hover:border-[rgba(220,38,38,0.35)]',
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
                    isActive ? activeText : cn(idleText, 'group-hover:text-[color:var(--text-0)]')
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
