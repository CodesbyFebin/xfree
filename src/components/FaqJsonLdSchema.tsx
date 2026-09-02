import React, { useEffect } from "react";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqJsonLdSchemaProps {
  faqs: FaqItem[];
  toolTitle?: string;
}

/**
 * Pure helper function to generate valid JSON-LD FAQ schema object.
 */
export function generateFaqJsonLdSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };
}

/**
 * React Component that dynamically injects JSON-LD FAQ Schema script into document.head
 */
export const FaqJsonLdSchema: React.FC<FaqJsonLdSchemaProps> = ({ faqs, toolTitle }) => {
  useEffect(() => {
    if (!faqs || faqs.length === 0) return;

    const schemaData = generateFaqJsonLdSchema(faqs);
    const scriptId = `faq-schema-${toolTitle ? toolTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "active-tool"}`;

    // Remove existing script if present
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.remove();
    }

    // Create and inject new script tag into head
    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    script.innerHTML = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      const tag = document.getElementById(scriptId);
      if (tag) {
        tag.remove();
      }
    };
  }, [faqs, toolTitle]);

  return null;
};
