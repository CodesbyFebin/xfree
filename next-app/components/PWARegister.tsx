'use client';

import { usePWA } from '@/hooks/usePWA';

// Mounted once in the root layout so navigator.serviceWorker.register()
// actually runs. Without this, usePWA() existed but was never called
// anywhere - the service worker in public/sw.js never activated, so the
// site's PWA install/offline support described on /xfree-app didn't
// actually work despite the hook being fully implemented.
export function PWARegister() {
  usePWA();
  return null;
}
