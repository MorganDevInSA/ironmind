'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

/** Transparent wordmark: `public/ironmind_transparent_1_reverted.png` (300×301, RGBA) */
export const IRONMIND_LOGO_SRC = '/ironmind_transparent_1_reverted.png';

const BASE = {
  src: IRONMIND_LOGO_SRC,
  alt: 'IRONMIND',
  width: 300,
  height: 301,
} as const;

export type IronmindLogoVariant =
  | 'sidebar-expanded'
  | 'sidebar-collapsed'
  | 'auth'
  | 'topbar';

/** Keep object-position neutral — mixed object-* utilities only apply one axis and can frame empty canvas. */
export function IronmindLogo({
  variant,
  className,
  priority,
}: {
  variant: IronmindLogoVariant;
  className?: string;
  priority?: boolean;
}) {
  const variantClass =
    variant === 'sidebar-expanded'
      ? 'h-[3.125rem] w-auto max-w-[15rem] object-contain object-center'
      : variant === 'sidebar-collapsed'
        ? 'h-10 w-10 object-contain object-center'
        : variant === 'topbar'
          ? 'h-8 w-auto max-w-[6.25rem] object-contain object-center'
          : 'mx-auto h-auto max-h-24 w-auto max-w-[min(100%,280px)] object-contain object-center';

  const sizes =
    variant === 'auth'
      ? '(max-width: 640px) 85vw, 280px'
      : variant === 'topbar'
        ? '96px'
        : variant === 'sidebar-expanded'
          ? '240px'
          : '40px';

  return (
    <span className="inline-flex items-center justify-center shrink-0 [&>img]:max-h-full">
      <Image
        {...BASE}
        sizes={sizes}
        priority={priority}
        className={cn(variantClass, className)}
      />
    </span>
  );
}
