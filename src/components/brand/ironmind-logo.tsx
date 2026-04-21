'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { brandAssets } from '@/lib/constants/brand-assets';
import { useUIStore } from '@/stores';

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
  const theme = useUIStore((s) => s.theme);

  const src =
    theme === 'hot-pink' ? brandAssets.logoFemale : brandAssets.logoMale;

  const variantClass =
    variant === 'sidebar-expanded'
      ? 'h-[8rem] w-[8rem] object-contain object-center'
      : variant === 'sidebar-collapsed'
        ? 'h-[3rem] w-[3rem] object-contain object-center'
        : variant === 'topbar'
          ? 'h-12 w-auto max-w-[6.25rem] object-contain object-center'
          : 'mx-auto h-auto max-h-24 w-auto max-w-[min(100%,280px)] object-contain object-center';

  const sizes =
    variant === 'auth'
      ? '(max-width: 640px) 85vw, 280px'
      : variant === 'topbar'
        ? '96px'
        : variant === 'sidebar-expanded'
          ? '104px'
          : '48px';

  return (
    <span className="inline-flex items-center justify-center shrink-0 [&>img]:max-h-full">
      <Image
        key={src}
        src={src}
        alt="IRONMIND"
        width={300}
        height={301}
        sizes={sizes}
        priority={priority}
        className={cn(variantClass, className)}
      />
    </span>
  );
}
