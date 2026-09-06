import { TOOLS } from '@/lib/data/tools';
import { PILLARS } from '@/lib/data/pillars';

export async function GET() {
  const content = `# XFree App - Privacy-First Developer Tools

XFree is the ultimate free online app for developers offering privacy-first micro-tools. All tools run 100% client-side with no signup required.

## About XFree

XFree provides browser-based developer tools that process data locally on your device. No data is transmitted to external servers unless clearly disclosed.

## Core Features

- **Privacy-First**: All tool processing happens locally in your browser
- **No Signup Required**: Instant access to all tools
- **100% Free**: Open-source under MIT License
- **Offline Capable**: Save tool pages for offline use

## Available Tools

${TOOLS.filter(t => t.indexable).map(tool => `- ${tool.title}: ${tool.shortDescription}`).join('\n')}

## Tool Categories

${PILLARS.map(p => `- ${p.name}: ${p.description}`).join('\n')}

## Legal

- Privacy Policy: https://www.xfree.in/privacy
- Terms of Service: https://www.xfree.in/terms
- Security: https://www.xfree.in/security

## Contact

- GitHub: https://github.com/xfree-in/xfree
- Twitter: https://twitter.com/xfreein
- Support: support@xfree.in

---

Updated: ${new Date().toISOString()}
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
