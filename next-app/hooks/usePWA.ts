'use client';

import { useEffect, useState } from 'react';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  outcome: 'accepted' | 'dismissed' | null;
}

interface UsePWAReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  install: () => Promise<void>;
  offline: boolean;
}

export function usePWA(): UsePWAReturn {
  const [isInstallable, setIsInstallable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsInstalled(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true
    );

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as unknown as PWAInstallPrompt);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
    };

    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
    } catch {
    }
  };

  return { isInstallable, isInstalled, install, offline };
}
