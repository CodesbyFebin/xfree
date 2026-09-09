import { MetadataRoute } from 'next';

// Every user-agent below is real and currently documented by its vendor
// (see the structured-data-seo skill's references/ai-crawlers.md, and
// each vendor's own published crawler docs) - kept in sync with the root
// Vite app's src/utils/generateSitemap.ts generateRobotsTxt(). Two real
// crawlers were checked and deliberately left out:
//   - Brave Search publishes no distinct robots.txt user-agent the way
//     Google/Bing/OpenAI do, so it's covered by the wildcard '*' rule
//     below rather than a named block that would have to guess a token.
//   - DuckDuckGo's own crawler (DuckDuckBot) is listed, but DuckDuckGo's
//     main web results come from Bing's index, which Googlebot/Bingbot
//     already cover.
// All AI-crawler entries are wide open (including the training-only ones
// - GPTBot, ClaudeBot, CCBot, Bytespider) per an explicit instruction to
// allow everything; a site that wants search/answer indexing but not
// model-training reuse would instead disallow the training-only bots
// while keeping their paired live-fetch/search bot allowed (e.g. GPTBot
// disallowed, ChatGPT-User/OAI-SearchBot allowed).
const SEARCH_AGENTS = ['Googlebot', 'Bingbot', 'DuckDuckBot', 'YandexBot', 'Baiduspider'];
const AI_ANSWER_AGENTS = ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'Claude-User', 'Claude-SearchBot'];
const AI_TRAINING_AGENTS = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bytespider', 'Amazonbot'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/app.xfree.in/'],
      },
      ...[...SEARCH_AGENTS, ...AI_ANSWER_AGENTS, ...AI_TRAINING_AGENTS].map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: ['/api/'],
      })),
    ],
    sitemap: 'https://www.xfree.in/sitemap.xml',
  };
}
