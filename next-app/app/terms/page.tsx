import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service | XFree',
  description: 'Terms of service for using XFree free browser-based tools.',
};

export default function TermsPage() {
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
          <header className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono">Terms of Service</h1>
            <p className="text-cyber-muted">Last updated: September 2026</p>
          </header>

          <div className="cyber-card p-8 space-y-6 text-cyber-muted text-sm leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Acceptance of Terms</h2>
              <p>
                By using XFree.in, you agree to these terms. If you do not agree, please do not use our services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Service Description</h2>
              <p>
                XFree.in provides free browser-based tools for developers, SEO professionals, and general users. 
                All tools process data locally in your browser unless explicitly stated otherwise.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Acceptable Use</h2>
              <p>You agree to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use tools only for lawful purposes</li>
                <li>Not attempt to gain unauthorized access</li>
                <li>Not disrupt or interfere with our services</li>
                <li>Not use automated bots to overload our systems</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Disclaimer</h2>
              <p>
                XFree.in provides tools &quot;as is&quot; without warranties. While we strive for accuracy, 
                we do not guarantee error-free operation. Users should verify results for critical applications.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Limitation of Liability</h2>
              <p>
                XFree.in shall not be liable for any indirect, incidental, or consequential damages 
                arising from the use of our services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Changes to Terms</h2>
              <p>
                We may update these terms at any time. Continued use of the site constitutes acceptance 
                of any changes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Contact</h2>
              <p>
                Questions about these terms can be directed through our contact form.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
