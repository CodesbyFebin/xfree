'use client';

import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;
    if (message.trim().length < 10) {
      setStatus('error');
      setErrorMessage('Message must be at least 10 characters.');
      return;
    }
    setStatus('submitting');
    setErrorMessage('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() || undefined, message: message.trim(), website }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStatus('error');
        setErrorMessage(body?.error === 'rate_limited' ? "You've sent too many messages recently. Try again later." : 'Could not send. Please try again.');
        return;
      }
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  };

  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">Contact Support & Feedback</h1>
            <p className="text-cyber-muted text-sm sm:text-base">
              Have a tool request, bug report, or partnership inquiry? Reach out directly.
            </p>
          </div>

          <div className="cyber-card p-8">
            {status === 'success' ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-xl font-bold text-white">Message sent</h3>
                <p className="text-cyber-muted text-xs">Thanks — we will review it and follow up if you left an email.</p>
                <button
                  onClick={() => { setStatus('idle'); setMessage(''); setEmail(''); }}
                  className="px-4 py-2 bg-cyber-surface text-cyber-muted rounded-xl text-xs hover:bg-cyber-border cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                <div className="space-y-1">
                  <label className="text-xs font-bold text-cyber-muted">Your email (optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 bg-cyber-bg border border-cyber-border rounded-xl text-white text-xs focus:outline-none focus:border-cyber-glow"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-cyber-muted">Your message *</label>
                  <textarea
                    required
                    rows={5}
                    minLength={10}
                    maxLength={4000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the tool feature, bug, or feedback..."
                    className="w-full px-4 py-2.5 bg-cyber-bg border border-cyber-border rounded-xl text-white text-xs focus:outline-none focus:border-cyber-glow resize-none"
                  />
                </div>
                {status === 'error' && (
                  <div className="flex items-start gap-2 text-xs text-red-300 bg-red-950/40 border border-red-900 p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full py-3 bg-cyber-glow hover:bg-cyber-glow/90 disabled:opacity-50 disabled:cursor-not-allowed text-cyber-bg font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>{status === 'submitting' ? 'Sending...' : 'Send message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
