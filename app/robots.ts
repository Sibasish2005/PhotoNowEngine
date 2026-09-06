import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://photonow.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/llms.txt', '/legal', '/privacy', '/terms'],
        disallow: ['/api/mcp/worker'],
      },
      {
        // Explicitly welcome Answer Engine Optimization (AEO) & AI Search Agents
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-Web',
          'anthropic-ai',
          'PerplexityBot',
          'Google-Extended',
          'GoogleOther',
          'Applebot-Extended',
          'Meta-ExternalAgent',
          'cohere-ai',
          'Bytespider',
          'CCBot',
        ],
        allow: ['/', '/llms.txt', '/api/mcp'],
        disallow: [],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
