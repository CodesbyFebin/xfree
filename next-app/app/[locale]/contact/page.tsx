import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { buildCanonical } from '@/lib/canonical';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = buildCanonical('/contact', { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: 'Contact XFree — Get in Touch',
    description: 'Contact the XFree team for support, feedback, or partnership inquiries.',
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical("contact", { language: loc })])
      ),
    },
  };
}

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="cyber-card p-8">
        <h1 className="text-3xl font-black text-white mb-6">Contact</h1>
        <p className="text-cyber-muted mb-4">
          Have questions, feedback, or partnership inquiries? Reach out to the XFree team.
        </p>
        <div className="mt-8">
          <a href="mailto:hello@xfree.in" className="cyber-btn cyber-btn-filled px-6 py-3 rounded-lg text-sm">
            hello@xfree.in
          </a>
        </div>
      </div>
    </div>
  );
}
