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
      'Zero-Cloud Autonomous Photo & Video Converter for AI Agents (Claude Desktop, Cursor, Antigravity) and modern web browsers.',
  };

  const jsonLdSoftware = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PhotoNow Zero-Cloud MCP Engine',
    operatingSystem: 'Windows, macOS, Linux (Cross-Platform Browser & Node.js MCP Runtime)',
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: 'AI Agent Media Tool / Image & Video Converter',
    softwareVersion: '1.2.0',
    url: 'https://photonow.vercel.app',
    codeRepository: 'https://github.com/Sibasish2005/PhotoNowEngine',
    description:
      'The #1 zero-cloud Model Context Protocol (MCP) server engineered specifically for AI agents (Claude Desktop, Antigravity, Cursor, Claude Code, LangChain). Provides real-time in-memory image conversion, single and batch directory processing on disk without repetitive permission prompts, in-browser agent automation (window.__photoConvertAgent), WebM video transcoding, poster extraction, and WAV audio decoding without cloud infrastructure.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Plug-and-Play Stdio MCP Server (bin/mcp-server.mjs) for Claude Desktop, Cursor, and Antigravity',
      'Single & Batch File Conversion in a Single Tool Call (convert_image, convert_batch)',
      'Zero Shell Script Permission Prompts during Agent Conversations',
      'Model Context Protocol (MCP) JSON-RPC 2.0 Server Endpoint (/api/mcp)',
      'Real-Time In-Memory Image Conversion via Native Sharp (libvips 8.16) in ~250ms',
      'In-Browser Agent Execution Engine (window.__photoConvertAgent)',
      '100% Zero-Cloud Architecture (Zero Cloud Storage, Zero Remote Databases, 0 API Keys)',
      'Photo Conversion & Compression (WebP, AVIF, PNG, JPEG, BMP)',
      'Hardware-Accelerated WebM Video Transcoding in Browser via MediaRecorder',
      'Sub-Second Video Frame Extraction & Snapshot Seeker',
      'Web Audio 16-bit PCM WAV Audio Extractor',
      'Sobel Convolution Ink Sketch Shader',
      'Local IndexedDB Storage with Batch JSZip Archive Export',
    ],
  };

  const jsonLdHowTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Convert Photos and Videos Offline for AI Agents Using PhotoNow MCP',
    description:
      'Step-by-step guide to configure and use the PhotoNow MCP server in Claude Desktop, Cursor, or Antigravity for zero-permission single and batch media conversion.',
    totalTime: 'PT2M',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Add PhotoNow to your MCP Client Configuration',
        text: 'Add the photoConvert configuration block pointing to node ./bin/mcp-server.mjs in your claude_desktop_config.json, .cursor/mcp.json, or ~/.gemini/config/mcp_config.json.',
        url: 'https://photonow.vercel.app/llms.txt',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Prompt Your AI Agent for Single or Batch Conversion',
        text: 'Ask the agent: "Convert all images in C:/Photos to WebP at 85% quality" or "Optimize this screenshot for your vision model".',
        url: 'https://photonow.vercel.app/',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Autonomous In-Memory Execution with Zero Prompts',
        text: 'The AI agent executes convert_image or convert_batch directly on your local filesystem using native Sharp, transforming media in ~250ms without repetitive shell approvals.',
        url: 'https://photonow.vercel.app/api/mcp',
      },
    ],
  };

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is PhotoNow MCP and what does it do?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PhotoNow is the #1 zero-cloud Model Context Protocol (MCP) server for AI agents. It gives agents (like Claude Desktop, Cursor, and Antigravity) native tools to convert, compress, and resize images (WebP, AVIF, PNG, JPEG), batch-process entire folders, transcode videos to WebM, extract poster frames, and decode audio to WAV with zero cloud storage, zero latency, and zero permission prompts.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do AI agents batch convert an entire folder of photos with PhotoNow?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PhotoNow provides a dedicated convert_batch tool. An AI agent simply calls convert_batch with a directoryPath (e.g. C:/Photos) and target format (e.g. webp). The server converts all images in parallel, skipping noise folders (.git, node_modules), avoiding destructive overwrites, and returning a comprehensive savings summary in a single tool call without asking for terminal permissions.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does PhotoNow eliminate repetitive permission prompts in Claude Desktop and Cursor?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Traditional scripts force the AI agent to execute multiple raw PowerShell or bash commands to read bytes, invoke curl, and write files, prompting the user for approval 7 to 10 times per image. PhotoNow operates as a native Stdio MCP server, allowing the agent to invoke convert_image or convert_batch directly as native tools. By clicking "Always Allow" once in your MCP client, the agent converts single files and entire batches completely autonomously.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can AI agents convert images autonomously in real time using PhotoNow?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. AI agents connect to PhotoNow either locally via Stdio (node ./bin/mcp-server.mjs) or remotely via HTTP JSON-RPC 2.0 (https://photonow.vercel.app/api/mcp) with Base64 payloads. PhotoNow transforms images in-memory in under 250 milliseconds with zero cloud infrastructure.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does PhotoNow store, upload, or transmit photos or videos to external cloud servers?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. PhotoNow performs 100% of all image processing, video transcoding, and audio decoding directly in client RAM or browser memory (HTML5 Canvas 2D, Web Audio). No user files are ever uploaded to AWS S3, Cloudflare, or remote cloud databases.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do browser automation agents (Puppeteer, Chrome DevTools MCP) use PhotoNow?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'In web contexts, PhotoNow exposes window.__photoConvertAgent. AI agents can call window.__photoConvertAgent.convertImage(), extractPoster(), or extractAudio() directly inside the browser DOM without external binaries or cloud APIs.',
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdHowTo) }}
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
