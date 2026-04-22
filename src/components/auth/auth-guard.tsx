'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { logout, onAuthChange } from '@/lib/firebase';
import { useAuthStore, useUIStore } from '@/stores';
import { queryKeys } from '@/lib/constants';
import { isUserSeeded } from '@/services';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { setUser, setLoading, isAuthenticated } = useAuthStore();
  const { resetUIPreferences } = useUIStore();

  useEffect(() => {
    setLoading(true);

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const signedInWithPassword = firebaseUser.providerData.some(
          (provider) => provider.providerId === 'password'
        );
        if (signedInWithPassword && !firebaseUser.emailVerified) {
          await logout();
          setUser(null);
          router.replace('/login');
          setLoading(false);
          return;
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });

        // On first login, redirect to onboarding instead of auto-seeding
        try {
          const seeded = await queryClient.fetchQuery({
            queryKey: queryKeys(firebaseUser.uid).profile.isSeeded(),
            queryFn: () => isUserSeeded(firebaseUser.uid),
          });
          if (!seeded && !pathname.startsWith('/onboarding')) {
            router.replace('/onboarding');
          }
        } catch (e) {
          const isOffline =
            (e as { code?: string })?.code === 'unavailable' ||
            String(e).includes('offline') ||
            String(e).includes('UNAVAILABLE');
          if (isOffline) {
            console.warn('⚠ Firestore offline — cannot check seed status. Proceeding without redirect.');
          } else {
            console.error('Seed check error:', e);
          }
        }
      } else {
        queryClient.clear();
        resetUIPreferences();
        setUser(null);
        router.push('/login');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname, queryClient, setUser, setLoading, resetUIPreferences]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-[color:var(--text-2)] text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
