import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Locale, LOCALES, getDictionary } from '@/lib/i18n';

interface Props { params: { locale: string } | Promise<{ locale: string }>; }

async function resolveParams(params: Props['params']) {
  return params instanceof Promise ? await params : params;
}

export default async function NotFound({ params }: Props) {
  const { locale } = await resolveParams(params);
  const currentLocale = (locale && LOCALES.includes(locale as Locale)) ? locale : 'en';
  const dict = getDictionary(currentLocale as Locale);
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header dict={dict} locale={currentLocale as Locale} />
      <main id="main-content" className="pt-20 min-h-[80vh] flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-8xl font-black text-cyber-glow font-cyber mb-4 neon-green">404</div>
          <h1 className="text-2xl font-bold text-white mb-4">Page Not Found</h1>
          <p className="text-cyber-muted mb-8 max-w-md mx-auto">The page you are looking for does not exist or has been moved.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${currentLocale}`} className="cyber-btn cyber-btn-filled text-sm px-6 py-3 rounded"><span>Go to Homepage</span></Link>
            <Link href={`/${currentLocale}/pillars`} className="cyber-btn text-sm px-6 py-3 rounded"><span>Browse Pillars</span></Link>
          </div>
        </div>
      </main>
      <Footer dict={dict} locale={currentLocale as Locale} />
    </>
  );
}
