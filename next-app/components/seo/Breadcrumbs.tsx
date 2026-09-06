import Link from 'next/link';
import { generateBreadcrumbSchema } from '@/lib/schema';

export interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const schema = generateBreadcrumbSchema(items);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label="Breadcrumb" className={`mb-4 ${className}`}>
        <ol className="flex items-center gap-2 text-sm font-mono">
          <li>
            <Link href="/" className="text-cyber-muted hover:text-cyber-glow transition-colors">
              Home
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="text-cyber-dim">/</span>
              {index === items.length - 1 ? (
                <span className="text-cyber-glow" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link href={item.href} className="text-cyber-muted hover:text-cyber-glow transition-colors">
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
