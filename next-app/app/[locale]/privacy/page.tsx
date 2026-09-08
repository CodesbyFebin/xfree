import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/i18n/navigation';
import { buildAlternates } from '@/lib/canonical';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Privacy Policy | XFree',
    description: 'XFree privacy policy - how we handle your data when using our free browser-based tools.',
    alternates: buildAlternates('/privacy', locale),
  };
}

export default function PrivacyPage() {
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
          <header className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-black text-cyber-text font-mono">Privacy Policy</h1>
            <p className="text-cyber-muted">Last updated: September 2026</p>
          </header>

          <div className="cyber-card p-8 space-y-6 text-cyber-muted text-sm leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-cyber-text">Data Processing</h2>
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
              <h2 className="text-xl font-bold text-cyber-text">Cookies</h2>
              <p>
                XFree.in may use essential cookies for site functionality. We do not use tracking cookies
                or advertising cookies. We do not track your tool usage across sessions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-cyber-text">Third-Party Services</h2>
              <p>
                Our site may display non-intrusive advertisements through Google AdSense or similar services.
                These services may set their own cookies according to their privacy policies. XFree.in does not
                share your personal data with advertisers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-cyber-text">Client-Side Tools, With Three Disclosed Exceptions</h2>
              <p>
                Almost every tool on XFree runs entirely in Local Mode: your input never leaves your
                device. Three tools are the exception - IP Lookup, DNS Lookup, and WHOIS Lookup - because
                looking up an IP address, DNS record, or domain registration inherently requires querying
                a service that holds that data; no browser-only implementation of these is possible.
              </p>
              <p>
                For those three tools only: the value you enter is sent to XFree&apos;s own server, which
                queries a public lookup service (ipwho.is for IP lookups, Cloudflare&apos;s DNS-over-HTTPS
                resolver for DNS lookups, RDAP via rdap.org for WHOIS lookups) and returns the result. XFree
                does not log or store these queries. Each of these three tool pages states this plainly
                before you use it - not assumed or buried in this policy. If any future tool needs to send
                data off-device, the same disclosure standard applies: stated on that tool&apos;s own page,
                not just here.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-cyber-text">Contact Form Submissions</h2>
              <p>
                If you use the <Link href="/contact" className="text-cyber-glow hover:underline">contact form</Link>, the email address and message you provide are used only to respond to your inquiry. We do not add contact-form submitters to a marketing list.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-cyber-text">Data Retention</h2>
              <p>
                We do not maintain any server-side storage of tool inputs or outputs. When you close
                your browser tab, all data is permanently deleted from memory.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-cyber-text">Your Rights</h2>
              <p>
                Since tool processing happens locally and we don&apos;t collect tool-input data, there is
                nothing to request deletion of on that front. For data you did provide us directly (a contact
                form submission), you may ask us to review, correct, or delete it at any time.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-cyber-text">Changes to This Policy</h2>
              <p>
                If this policy changes in a way that affects how your data is handled, the &quot;Last
                updated&quot; date above will change and, for significant changes, we&apos;ll note it
                on the <Link href="/roadmap" className="text-cyber-glow hover:underline">roadmap</Link> page.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-cyber-text">Contact</h2>
              <p>
                For privacy concerns or data-related questions, please reach out through our{' '}
                <Link href="/contact" className="text-cyber-glow hover:underline">contact form</Link>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
