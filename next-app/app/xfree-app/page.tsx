import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'XFree App - Installable PWA | XFree',
  description: 'Install XFree as a Progressive Web App on your device for quick access to free developer and SEO tools.',
};

export default function XFreeAppPage() {
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto py-10 px-4 space-y-10">
          <header className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-glow/10 border border-cyber-glow/20 text-cyber-glow text-sm font-mono">
              📱 Installable App
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono">XFree PWA</h1>
            <p className="text-cyber-muted max-w-2xl mx-auto">
              Install XFree as a Progressive Web App on your device for offline-capable, quick-access tools.
            </p>
          </header>

          <div className="cyber-card p-8 space-y-6">
            <h2 className="text-xl font-bold text-white">What is a PWA?</h2>
            <p className="text-cyber-muted text-sm">
              A Progressive Web App is a website that can be installed on your device like a native app. 
              It appears in your app drawer, has an icon on your home screen, and can even work offline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="cyber-card p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Install on Desktop</h3>
              <ol className="list-decimal list-inside space-y-2 text-cyber-muted text-sm">
                <li>Open XFree in Chrome, Edge, or Firefox</li>
                <li>Click the install icon in the address bar</li>
                <li>Or click the menu → &quot;Install XFree&quot;</li>
              </ol>
            </div>

            <div className="cyber-card p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Install on Mobile</h3>
              <ol className="list-decimal list-inside space-y-2 text-cyber-muted text-sm">
                <li>Open XFree in Safari or Chrome</li>
                <li>Tap the Share button</li>
                <li>Select &quot;Add to Home Screen&quot;</li>
              </ol>
            </div>
          </div>

          <div className="cyber-card p-8 space-y-4">
            <h2 className="text-xl font-bold text-white">Benefits of the PWA</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-emerald-400">✓</span>
                <div>
                  <h3 className="font-semibold text-white text-sm">Offline Support</h3>
                  <p className="text-cyber-muted text-xs">Use tools even without internet</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400">✓</span>
                <div>
                  <h3 className="font-semibold text-white text-sm">Quick Access</h3>
                  <p className="text-cyber-muted text-xs">Launch from home screen instantly</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400">✓</span>
                <div>
                  <h3 className="font-semibold text-white text-sm">App-Like Experience</h3>
                  <p className="text-cyber-muted text-xs">Full-screen, immersive interface</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400">✓</span>
                <div>
                  <h3 className="font-semibold text-white text-sm">Auto Updates</h3>
                  <p className="text-cyber-muted text-xs">Always have the latest version</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyber-glow text-cyber-bg font-bold text-sm hover:bg-cyber-glow/90 transition-colors"
            >
              Go to XFree App
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
