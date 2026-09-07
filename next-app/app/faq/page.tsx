import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TOOLS } from '@/lib/data/tools';

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions | XFree',
  description: 'Answers to common questions about XFree tools, privacy, pricing, and usage.',
};

const faqs = [
  {
    question: 'Are XFree tools really free?',
    answer: 'Yes, 100% free with no hidden limits, no signup required, and no watermarks on outputs.',
  },
  {
    question: 'How do the tools work?',
    answer: 'All tools execute entirely in your browser using JavaScript. No data is sent to external servers.',
  },
  {
    question: 'Is my data safe?',
    answer: 'Absolutely. Your data never leaves your browser. Close the tab and all data is gone from memory.',
  },
  {
    question: 'Do I need to install anything?',
    answer: 'No. All tools work directly in your browser. No desktop apps, browser extensions, or signups.',
  },
  {
    question: 'What browsers are supported?',
    answer: 'All modern browsers: Chrome, Firefox, Safari, Edge, and Brave. We recommend the latest version.',
  },
  {
    question: 'Can I use tools offline?',
    answer: 'Once a tool page is loaded, most functionality works offline since everything runs client-side.',
  },
  {
    question: 'How often are tools updated?',
    answer: 'Tools are regularly maintained and updated to follow latest web standards and browser policies.',
  },
  {
    question: 'Can I suggest a new tool?',
    answer: 'Yes! Use the contact form to submit tool requests. We review all suggestions.',
  },
];

export default function FaqPage() {
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
          <header className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono">Frequently Asked Questions</h1>
            <p className="text-cyber-muted max-w-xl mx-auto">
              Everything you need to know about XFree tools.
            </p>
          </header>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="cyber-card p-6">
                <h3 className="text-white font-semibold mb-2">{faq.question}</h3>
                <p className="text-cyber-muted text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="cyber-card p-8 text-center space-y-4 border-cyber-cyan/30">
            <h2 className="text-xl font-bold text-white">Still have questions?</h2>
            <p className="text-cyber-muted text-sm">
              Contact us and we will get back to you as soon as possible.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyber-glow text-cyber-bg font-bold text-sm hover:bg-cyber-glow/90 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
