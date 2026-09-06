import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const workflows = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    workflows: [
      {
        id: 'seo-audit',
        name: 'SEO Audit Workflow',
        description: 'Complete SEO audit using multiple XFree tools',
        steps: [
          { tool: 'bulk-url-extractor', action: 'Extract URLs from raw HTML' },
          { tool: 'xml-sitemap-generator', action: 'Generate XML sitemap' },
          { tool: 'meta-tag-generator', action: 'Generate meta tags' },
        ],
        category: 'seo',
      },
      {
        id: 'data-format-conversion',
        name: 'Data Format Conversion',
        description: 'Convert between JSON, CSV, YAML, and XML formats',
        steps: [
          { tool: 'json-formatter', action: 'Format and validate JSON' },
          { tool: 'json-to-csv-converter', action: 'Convert to CSV' },
          { tool: 'yaml-validator', action: 'Validate and convert to YAML' },
        ],
        category: 'developer',
      },
      {
        id: 'security-check',
        name: 'Security Checklist',
        description: 'Validate tokens, hashes, and encoded data',
        steps: [
          { tool: 'jwt-decoder', action: 'Decode and validate JWT' },
          { tool: 'hash-generator', action: 'Generate SHA hashes' },
          { tool: 'base64-tool', action: 'Encode/decode Base64' },
        ],
        category: 'security',
      },
      {
        id: 'code-quality',
        name: 'Code Quality Check',
        description: 'Format and validate code snippets',
        steps: [
          { tool: 'json-formatter', action: 'Format JSON' },
          { tool: 'regex-tester', action: 'Test regex patterns' },
          { tool: 'sql-formatter', action: 'Format SQL queries' },
        ],
        category: 'developer',
      },
    ],
  };

  return new NextResponse(JSON.stringify(workflows, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
