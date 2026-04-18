'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  Activity,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard',  label: 'Home',     icon: LayoutDashboard },
  { href: '/training',   label: 'Train',    icon: Dumbbell },
  { href: '/nutrition',  label: 'Nutrition', icon: Utensils },
  { href: '/recovery',   label: 'Recovery', icon: Activity },
  { href: '/more',       label: 'More',     icon: MoreHorizontal },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50 lg:hidden',
      'h-16 flex items-center',
      'bg-[color:var(--chrome-bg)] backdrop-blur-xl',
      'border-t border-[color:var(--chrome-border)]',
      'shadow-[0_-8px_24px_rgba(0,0,0,0.3)]'
    )}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex-1 flex flex-col items-center justify-center gap-1 h-full',
              'transition-all duration-200',
              isActive ? 'text-[#EF4444]' : 'text-[color:var(--text-detail)] hover:text-[color:var(--text-0)]'
            )}
          >
            <Icon
              size={20}
              className={cn(
                isActive && '[filter:drop-shadow(0_0_6px_rgba(220,38,38,0.45))]'
              )}
            />
            <span className={cn(
              'text-[10px] font-semibold uppercase tracking-wide',
              isActive ? 'text-[#EF4444]' : 'text-[color:var(--text-detail)] opacity-95'
            )}>
              {item.label}
            </span>
            {isActive && (
              <span className="absolute bottom-0 w-6 h-0.5 rounded-t-full bg-[#DC2626] [filter:drop-shadow(0_0_4px_rgba(220,38,38,0.6))]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
