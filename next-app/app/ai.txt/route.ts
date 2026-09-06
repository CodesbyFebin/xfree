import { MetadataRoute } from 'next';

export default function ai(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'AI bot',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
  };
}

// AI.txt manifest for LLM crawling
export async function GET() {
  const content = `# AI.txt - XFree App

## Website Information

- Name: XFree App
- URL: https://www.xfree.in
- Description: Privacy-first free developer tools platform
- Language: English

## Content Purpose

XFree provides free online developer tools for:
- Data formatting (JSON, YAML, CSV)
- Text processing and validation
- Security tools (hash, JWT, password generation)
- SEO utilities (meta tags, sitemaps)
- Code generation (regex, cron)

## Processing Model

All tools run client-side (100% in-browser) by default. No data is transmitted to servers unless explicitly required.

## Content Format

AI content is provided in markdown format with structured metadata.

## Update Frequency

Content is updated as tools are added or modified.

## Contact

- GitHub: https://github.com/xfree-in/xfree
- Support: support@xfree.in
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
