'use client';

import { usePWA } from '@/hooks/usePWA';

export function InstallButton() {
  const { isInstallable, isInstalled, install } = usePWA();

  if (isInstalled) {
    return (
      <p className="text-sm text-emerald-400 font-mono">✓ XFree is already installed on this device.</p>
    );
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <button
      onClick={install}
      className="cyber-btn cyber-btn-filled text-sm px-8 py-3.5 rounded inline-flex items-center gap-2"
    >
      <span>Install XFree Now</span>
    </button>
  );
}
