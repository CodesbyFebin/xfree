import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | XFree',
  description: 'XFree privacy policy - how we handle your data when using our free browser-based tools.',
};

export default function PrivacyPage() {
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
          <header className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono">Privacy Policy</h1>
            <p className="text-cyber-muted">Last updated: September 2026</p>
          </header>

          <div className="cyber-card p-8 space-y-6 text-cyber-muted text-sm leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Data Processing</h2>
              <p>
                XFree.in processes all tool inputs entirely within your browser using client-side JavaScript. 
                Your data never leaves your device unless you explicitly choose to copy and share it.
              </p>
              <p>
                When you use a tool like JSON Formatter, Regex Tester, or Hash Generator, the processing 
                happens locally in your browser tab. We do not have access to, collect, store, or log 
                any of the content you process.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Cookies</h2>
              <p>
                XFree.in may use essential cookies for site functionality. We do not use tracking cookies 
                or advertising cookies. We do not track your tool usage across sessions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Third-Party Services</h2>
              <p>
                Our site may display non-intrusive advertisements through Google AdSense or similar services. 
                These services may set their own cookies according to their privacy policies. XFree.in does not 
                share your personal data with advertisers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">AI Tools</h2>
              <p>
                For AI-powered features, input data may be transmitted to our AI backend (Google Gemini) 
                for processing. This is clearly indicated on each AI tool with a privacy notice. 
                Non-AI tools never transmit your data externally.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Data Retention</h2>
              <p>
                We do not maintain any server-side storage of tool inputs or outputs. When you close 
                your browser tab, all data is permanently deleted from memory.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Contact</h2>
              <p>
                For privacy concerns or data-related questions, please contact us through our 
                contact form.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
