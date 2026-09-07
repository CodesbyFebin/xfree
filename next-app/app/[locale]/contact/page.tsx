import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { buildAlternates } from '@/lib/canonical';
import type { Locale } from '@/i18n/routing';
import { ContactForm } from './ContactForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Contact Support & Feedback | XFree',
    description: 'Have a tool request, bug report, or partnership inquiry? Reach out to the XFree team directly.',
    alternates: buildAlternates('/contact', locale),
  };
}

export default function ContactPage() {
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black text-cyber-text tracking-tight font-mono">Contact Support & Feedback</h1>
            <p className="text-cyber-muted text-sm sm:text-base">
              Have a tool request, bug report, or partnership inquiry? Reach out directly.
            </p>
          </div>

          <ContactForm />
        </div>
      </main>

      <Footer />
    </>
  );
}
