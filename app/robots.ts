import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://photonow.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/llms.txt'],
        disallow: ['/api/'],
      },
      {
        // Explicitly welcome AI and AEO crawlers to index our MCP documentation & llms.txt
        userAgent: ['GPTBot', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'],
        allow: ['/', '/llms.txt'],
        disallow: [],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
