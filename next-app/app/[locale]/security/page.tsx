import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Security | XFree',
  description: 'Security practices and information about XFree free browser-based tools.',
};

export default function SecurityPage() {
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto py-10 px-4 space-y-10">
          <header className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono">Security</h1>
            <p className="text-cyber-muted max-w-2xl mx-auto">
              How we keep XFree secure for all users.
            </p>
          </header>

          <div className="cyber-card p-8 space-y-6">
            <h2 className="text-xl font-bold text-white">Our Security Approach</h2>
            <div className="space-y-4 text-cyber-muted text-sm">
              <p>
                XFree is built with security as a core principle. Since all tool processing happens 
                client-side in the browser, the attack surface is significantly reduced compared 
                to server-side processing.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="cyber-card p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Client-Side Processing</h3>
              <p className="text-cyber-muted text-sm">
                Most tools process data entirely in your browser. No server receives your data, 
                reducing exposure to network attacks.
              </p>
            </div>

            <div className="cyber-card p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">HTTPS Only</h3>
              <p className="text-cyber-muted text-sm">
                All XFree traffic is encrypted via HTTPS. We use modern TLS versions 
                and strong cipher suites.
              </p>
            </div>

            <div className="cyber-card p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">No Data Storage</h3>
              <p className="text-cyber-muted text-sm">
                We do not store tool inputs, outputs, or user data on our servers. 
                Your data exists only in your browser session.
              </p>
            </div>

            <div className="cyber-card p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Minimal Dependencies</h3>
              <p className="text-cyber-muted text-sm">
                We keep third-party JavaScript to a minimum to reduce potential 
                supply chain vulnerabilities.
              </p>
            </div>
          </div>

          <div className="cyber-card p-8 space-y-4">
            <h2 className="text-xl font-bold text-white">AI Tool Security</h2>
            <p className="text-cyber-muted text-sm">
              For AI-powered features, input data is transmitted to our AI backend. 
              These tools are clearly marked with privacy notices. Data is processed 
              according to our AI provider&apos;s security practices and is not stored 
              after processing.
            </p>
          </div>

          <div className="cyber-card p-8 space-y-4 border-amber-500/30">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-amber-400">⚠️</span> Responsible Disclosure
            </h2>
            <p className="text-cyber-muted text-sm">
              If you discover a security vulnerability, please contact us through our 
              contact form. We appreciate responsible disclosure and will work to 
              address issues promptly.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
