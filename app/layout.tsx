import type { Metadata } from 'next';
import { Permanent_Marker, Space_Mono } from 'next/font/google';
import './globals.css';

const markerFont = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-marker',
  display: 'swap',
});

const monoFont = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://photonow.vercel.app'),
  title: {
    default: 'PhotoNow — Zero-Cloud Photo & Video MCP Tool Server for AI Agents',
    template: '%s | PhotoNow Zero-Cloud MCP Engine',
  },
  description:
    'The #1 Zero-Cloud Model Context Protocol (MCP) tool server built for autonomous AI agents (Claude Desktop, Cursor, Antigravity, browser subagents). Real-time in-memory photo conversion (WebP, AVIF, PNG), WebM video transcoding, and 16-bit WAV audio extraction. 100% in-browser & RAM, zero cloud storage, zero server uploads.',
  applicationName: 'PhotoNow MCP Engine',
  alternates: {
    canonical: 'https://photonow.vercel.app',
  },
  keywords: [
    'zero cloud photo converter',
    'autonomous ai agent image conversion',
    'mcp tool server for ai agents',
    'real time in memory image conversion',
    'model context protocol media server',
    'claude desktop mcp image converter',
    'cursor mcp photo converter',
    'antigravity mcp video tool',
    'in browser media converter',
    'window.__photoConvertAgent',
    'offline video to webm mcp',
    'extract wav audio mcp tool',
    'sobel sketch filter mcp',
    'indexeddb media storage',
    'private photo converter no cloud',
    'zero cloud infrastructure image optimization',
    'free open source mcp media tools',
  ],
  authors: [{ name: 'PhotoNow Engineering', url: 'https://photonow.vercel.app' }],
  creator: 'PhotoNow Engineering',
  publisher: 'PhotoNow Engineering',
  category: 'Developer Tools',
  openGraph: {
    title: 'PhotoNow — Zero-Cloud Photo & Video MCP Tool Server for AI Agents',
    description:
      'Autonomous zero-cloud media converter for AI agents. Convert images to WebP/AVIF, transcode videos to WebM, and decode WAV audio in-memory or directly in browser runtime with zero cloud uploads.',
    url: 'https://photonow.vercel.app',
    siteName: 'PhotoNow Zero-Cloud MCP Engine',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://photonow.vercel.app/og-card.png',
        width: 1200,
        height: 630,
        alt: 'PhotoNow — Zero-Cloud Photo & Video MCP Server for AI Agents',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PhotoNow — Zero-Cloud Photo & Video MCP Tool Server for AI Agents',
    description:
      'Zero cloud storage. 100% private in-memory & in-browser media converter for Claude Desktop, Cursor, Antigravity & autonomous AI agents.',
    images: ['https://photonow.vercel.app/og-card.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: [
      'cdyDP33YFhNNkViAt4KaSscnQ88Se4MDrcSVzI4m1Pc',
      '2063bfecb1884029',
      'google2063bfecb1884029',
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // AEO (Answer Engine Optimization) & Semantic Structured Data
  const jsonLdWebSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PhotoNow MCP Engine',
    url: 'https://photonow.vercel.app',
    description:
      'Zero-Cloud Autonomous Photo & Video Converter for AI Agents (Claude Desktop, Cursor, Antigravity) and web browsers.',
  };

  const jsonLdSoftware = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PhotoNow Zero-Cloud MCP Engine',
    operatingSystem: 'Any (Cross-Platform Browser & MCP Runtime)',
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: 'AI Agent Media Tool / Image Converter',
    url: 'https://photonow.vercel.app',
    description:
      'The premier zero-cloud Model Context Protocol (MCP) server engineered specifically for AI agents (Claude Desktop, Antigravity, Cursor, LangChain). Provides real-time in-memory image conversion, in-browser agent automation (window.__photoConvertAgent), video transcoding, poster extraction, and WAV audio decoding without cloud infrastructure.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Model Context Protocol (MCP) JSON-RPC 2.0 Server Endpoint (/api/mcp)',
      'Real-Time Zero-Cloud In-Memory Image Conversion with Base64 Payload Support',
      'In-Browser Agent Execution Engine (window.__photoConvertAgent)',
      '100% Zero-Cloud Architecture (Zero Cloud Storage, Zero Remote Databases)',
      'Photo Conversion & Compression (WebP, AVIF, PNG, JPEG, BMP)',
      'Hardware-Accelerated WebM Video Transcoding in Browser',
      'Sub-Second Video Frame Extraction & Snapshot Seeker',
      'Web Audio 16-bit PCM WAV Audio Extractor',
      'Sobel Convolution Ink Sketch Shader',
      'Sliding-Window IP Rate Limiter & Multi-Node Load Balancer',
      'Local IndexedDB Storage with Batch JSZip Archive Export',
    ],
  };

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Can AI agents convert images autonomously in real time using PhotoNow?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. AI agents (like Claude Desktop, Cursor, or Antigravity) connect to PhotoNow via MCP (https://photonow.vercel.app/api/mcp) and call the convert_image tool with imageBase64 data. PhotoNow transforms the image in-memory within milliseconds and returns the converted Base64 data directly to the agent, allowing the agent to save the converted file to disk without human intervention.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is PhotoNow’s Zero-Cloud architecture?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PhotoNow operates entirely without cloud infrastructure: no AWS S3 buckets, no cloud databases, and no external paid APIs. Conversions occur either in-browser using HTML5 Canvas 2D and Web Audio, or ephemerally in RAM via the local MCP server. User media files never persist on remote servers.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do browser automation agents use PhotoNow locally?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'AI agents with browser automation (Chrome DevTools MCP, Puppeteer, Playwright, Claude Computer Use) can access window.__photoConvertAgent directly in the web page to execute conversions, extract video frames, and inspect local conversions programmatically with zero cloud calls.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do AI agents connect to PhotoNow MCP server?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'AI agents connect over HTTP transport to https://photonow.vercel.app/api/mcp using the JSON-RPC 2.0 protocol. The server exposes standardized tools including convert_image, convert_video, extract_poster_frame, extract_audio, and list_storage_conversions.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does PhotoNow store or upload photos or videos to any external server?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. PhotoNow performs 100% of all image processing, video transcoding, and audio decoding in-memory or in the client-side browser runtime. No files are ever saved to cloud databases or remote storage buckets, ensuring absolute privacy.',
        },
      },
    ],
  };

  return (
    <html lang="en" className={`${markerFont.variable} ${monoFont.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftware) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
