import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function OfflinePage() {
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <div className="text-6xl mb-6">📡</div>
          <h1 className="text-3xl font-bold text-white font-mono mb-4">You&apos;re Offline</h1>
          <p className="text-cyber-muted mb-8">
            XFree tools that don&apos;t require AI processing will continue to work offline.
            Some features may be unavailable until you reconnect.
          </p>

          <div className="cyber-card p-6 text-left mb-8">
            <h2 className="text-lg font-bold text-cyber-glow font-mono mb-4">Available Offline:</h2>
            <ul className="space-y-2 text-sm text-cyber-muted">
              <li>✓ JSON Formatter &amp; Minifier</li>
              <li>✓ Base64 Encoder/Decoder</li>
              <li>✓ URL Encoder/Decoder</li>
              <li>✓ Hash Generator (SHA family)</li>
              <li>✓ Regex Tester</li>
              <li>✓ UUID Generator</li>
              <li>✓ Password Generator</li>
              <li>✓ Cron Expression Generator</li>
            </ul>
          </div>

          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-lg bg-cyber-glow text-black font-mono font-bold hover:bg-cyber-glow/90 transition-colors"
          >
            Try Again
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
