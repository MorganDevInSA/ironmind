'use client';

import { useEffect } from 'react';
import { useOnlineStore } from '@/stores/online-store';

export function OnlineListener() {
  const setOnline = useOnlineStore((s) => s.setOnline);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }

    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  return null;
}
