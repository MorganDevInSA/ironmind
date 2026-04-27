'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { brandAssets } from '@/lib/constants/brand-assets';
import { useUIStore } from '@/stores';

export type IronmindLogoVariant = 'sidebar-expanded' | 'sidebar-collapsed' | 'auth' | 'topbar';

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
  const theme = useUIStore((s) => s.theme);

  /** App chrome (sidebar + sticky top bar) uses the combined lockup like `/login`; theme shields remain on register (`auth`). */
  const useCombinedMark =
    variant === 'sidebar-expanded' || variant === 'sidebar-collapsed' || variant === 'topbar';

  const src = useCombinedMark
    ? brandAssets.logoCombined
    : theme === 'hot-pink'
      ? brandAssets.logoFemale
      : brandAssets.logoMale;

  const variantClass =
    variant === 'sidebar-expanded'
      ? 'max-h-14 h-auto w-auto max-w-[min(100%,8.75rem)] object-contain object-center'
      : variant === 'sidebar-collapsed'
        ? 'h-[3rem] w-auto max-w-[3.5rem] object-contain object-center'
        : variant === 'topbar'
          ? 'h-12 w-auto max-w-[6.25rem] object-contain object-center'
          : 'mx-auto h-auto max-h-24 w-auto max-w-[min(100%,280px)] object-contain object-center';

  const sizes =
    variant === 'auth'
      ? '(max-width: 640px) 85vw, 280px'
      : variant === 'topbar'
        ? '(max-width: 480px) 72px, 96px'
        : variant === 'sidebar-expanded'
          ? '(max-width: 240px) 112px, 132px'
          : '48px';

  const intrinsicW = useCombinedMark ? 1536 : 300;
  const intrinsicH = useCombinedMark ? 1024 : 301;

  return (
    <span className="inline-flex items-center justify-center shrink-0 [&>img]:max-h-full">
      <Image
        key={src}
        src={src}
        alt="IRONMIND"
        width={intrinsicW}
        height={intrinsicH}
        sizes={sizes}
        priority={priority}
        className={cn(variantClass, className)}
      />
    </span>
  );
}
