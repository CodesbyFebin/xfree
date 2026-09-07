import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'How It Works | XFree',
  description: 'Learn how XFree browser-based tools process your data locally for privacy-first execution.',
};

export default function HowItWorksPage() {
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto py-10 px-4 space-y-10">
          <header className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono">How XFree Works</h1>
            <p className="text-cyber-muted max-w-2xl mx-auto">
              Privacy-first architecture where all tool processing happens in your browser.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="cyber-card p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyber-glow/10 border border-cyber-glow/20 flex items-center justify-center">
                <span className="text-2xl">1</span>
              </div>
              <h3 className="text-lg font-bold text-white">You Load the Page</h3>
              <p className="text-cyber-muted text-sm">
                The tool page loads in your browser along with all necessary JavaScript code.
              </p>
            </div>

            <div className="cyber-card p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyber-glow/10 border border-cyber-glow/20 flex items-center justify-center">
                <span className="text-2xl">2</span>
              </div>
              <h3 className="text-lg font-bold text-white">You Enter Data</h3>
              <p className="text-cyber-muted text-sm">
                Input is typed or pasted directly into the browser interface.
              </p>
            </div>

            <div className="cyber-card p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyber-glow/10 border border-cyber-glow/20 flex items-center justify-center">
                <span className="text-2xl">3</span>
              </div>
              <h3 className="text-lg font-bold text-white">Local Processing</h3>
              <p className="text-cyber-muted text-sm">
                JavaScript processes your data entirely within the browser sandbox.
              </p>
            </div>

            <div className="cyber-card p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyber-glow/10 border border-cyber-glow/20 flex items-center justify-center">
                <span className="text-2xl">4</span>
              </div>
              <h3 className="text-lg font-bold text-white">Instant Results</h3>
              <p className="text-cyber-muted text-sm">
                Output appears immediately without server communication.
              </p>
            </div>
          </div>

          <div className="cyber-card p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Local vs Cloud Processing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-bold text-emerald-400">Local Mode (Default)</h3>
                <ul className="space-y-2 text-cyber-muted text-sm">
                  <li>✓ All processing in browser JavaScript</li>
                  <li>✓ Zero data transmission</li>
                  <li>✓ Works offline after initial load</li>
                  <li>✓ Complete privacy</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-bold text-cyan-400">AI Mode (Optional)</h3>
                <ul className="space-y-2 text-cyber-muted text-sm">
                  <li>✓ Data sent to Google Gemini API</li>
                  <li>✓ Clearly labeled with privacy notice</li>
                  <li>✓ Powers complex AI features</li>
                  <li>✓ Requires explicit user action</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="cyber-card p-8 space-y-4 border-cyber-cyan/30">
            <h2 className="text-xl font-bold text-white">Security Notes</h2>
            <p className="text-cyber-muted text-sm">
              Even in Local Mode, we recommend:
            </p>
            <ul className="list-disc list-inside space-y-1 text-cyber-muted text-sm">
              <li>Close browser tabs when done processing sensitive data</li>
              <li>Clear browser cache periodically</li>
              <li>Do not process truly confidential data on shared computers</li>
              <li>For highly sensitive data, use an air-gapped device</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
