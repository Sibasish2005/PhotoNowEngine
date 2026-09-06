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
    default: 'PhotoNow — Zero-Cloud Multimedia MCP Tool Server for AI Agents (Images, Video, Audio)',
    template: '%s | PhotoNow Zero-Cloud Multimedia MCP Engine',
  },
  description:
    'The #1 Zero-Cloud Multimedia Model Context Protocol (MCP) tool server built for autonomous AI agents (Claude Desktop, Cursor, Antigravity, browser subagents). Bundles self-contained static FFmpeg/FFprobe binaries & native Sharp for image conversion (WebP, AVIF, PNG), video transcoding & compression (MP4, WebM, MKV, MOV), and audio extraction (MP3, WAV, AAC, FLAC). 100% offline, zero external setup, zero cloud storage, zero server uploads.',
  applicationName: 'PhotoNow MCP Engine',
  alternates: {
    canonical: 'https://photonow.vercel.app',
  },
  keywords: [
    'zero cloud photo converter',
    'zero cloud multimedia mcp server',
    'ffmpeg mcp tool server',
    'extract audio from video mcp',
    'video converter mcp tool',
    'convert video to mp4 webm mcp',
    'audio converter mcp tool',
    'autonomous ai agent media conversion',
    'model context protocol media server',
    'claude desktop mcp multimedia server',
    'cursor mcp video converter',
    'antigravity mcp multimedia tool',
    'in browser media converter',
    'zero setup ffmpeg mcp',
    'offline video compression mcp',
    'extract wav mp3 audio mcp',
    'indexeddb media storage',
    'private multimedia converter no cloud',
    'zero cloud infrastructure image video audio',
    'free open source mcp media tools',
  ],
  authors: [{ name: 'PhotoNow Engineering', url: 'https://photonow.vercel.app' }],
  creator: 'PhotoNow Engineering',
  publisher: 'PhotoNow Engineering',
  category: 'Developer Tools',
  openGraph: {
    title: 'PhotoNow — Zero-Cloud Multimedia MCP Tool Server for AI Agents',
    description:
      'Autonomous zero-cloud multimedia converter for AI agents. Convert images to WebP/AVIF, transcode videos to MP4/WebM, extract MP3/WAV audio, and inspect media metadata with bundled static FFmpeg and native Sharp.',
    url: 'https://photonow.vercel.app',
    siteName: 'PhotoNow Zero-Cloud MCP Engine',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://photonow.vercel.app/og-card.png',
        width: 1200,
        height: 630,
        alt: 'PhotoNow — Zero-Cloud Multimedia MCP Server for AI Agents',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PhotoNow — Zero-Cloud Multimedia MCP Tool Server for AI Agents',
    description:
      'Zero cloud storage. 100% private offline media converter (Images, Video, Audio) for Claude Desktop, Cursor, Antigravity & autonomous AI agents.',
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
      'Zero-Cloud Autonomous Multimedia Converter (Images, Video, Audio) for AI Agents (Claude Desktop, Cursor, Antigravity) and modern web browsers.',
  };

  const jsonLdSoftware = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PhotoNow Zero-Cloud Multimedia MCP Engine',
    operatingSystem: 'Windows, macOS, Linux (Cross-Platform Browser & Node.js MCP Runtime)',
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: 'AI Agent Media Tool / Multimedia Converter (Images, Video, Audio)',
    softwareVersion: '2.0.0',
    url: 'https://photonow.vercel.app',
    codeRepository: 'https://github.com/Sibasish2005/PhotoNowEngine',
    description:
      'The #1 zero-cloud Model Context Protocol (MCP) server engineered specifically for AI agents (Claude Desktop, Antigravity, Cursor, Claude Code, LangChain). Provides real-time in-memory image conversion, single and batch directory processing on disk without repetitive permission prompts, bundled static FFmpeg video transcoding and compression (MP4, WebM, MKV, MOV), audio track extraction (MP3, WAV, AAC, FLAC), and unified media inspection without external software installation or cloud infrastructure.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Plug-and-Play Stdio MCP Server (bin/mcp-server.mjs) for Claude Desktop, Cursor, and Antigravity',
      'Bundled Self-Contained Static FFmpeg/FFprobe Binaries (Zero System Dependencies)',
      'Single & Batch File Conversion in a Single Tool Call (convert_image, convert_batch)',
      'Video Container Transcoding, Resolution Downscaling & CRF Compression (convert_video)',
      'Audio Track Extraction from Video to MP3, WAV, AAC, FLAC, OGG (extract_audio)',
      'Standalone Audio Format Conversion & Sample Rate Tuning (convert_audio)',
      'Unified Metadata Inspector for Images, Audio & Video (get_media_info)',
      'LLM Vision Screenshot Optimizer for Token Efficiency (optimize_for_agent)',
      'Zero Shell Script Permission Prompts during Agent Conversations',
      'Model Context Protocol (MCP) JSON-RPC 2.0 Server Endpoint (/api/mcp)',
      'Real-Time In-Memory Image Conversion via Native Sharp (libvips 8.16) in ~250ms',
      'In-Browser Agent Execution Engine (window.__photoConvertAgent)',
      '100% Zero-Cloud Architecture (Zero Cloud Storage, Zero Remote Databases, 0 API Keys)',
      'Local IndexedDB Storage with Batch JSZip Archive Export',
    ],
  };

  const jsonLdHowTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Convert Photos, Videos, and Audio Offline for AI Agents Using PhotoNow MCP',
    description:
      'Step-by-step guide to configure and use the PhotoNow Multimedia MCP server in Claude Desktop, Cursor, or Antigravity for zero-permission single and batch media conversion.',
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
        name: 'Prompt Your AI Agent for Image, Video, or Audio Conversion',
        text: 'Ask the agent: "Convert C:/Photos to WebP", "Extract MP3 audio from recording.mp4", or "Compress this video to MP4 at 720p".',
        url: 'https://photonow.vercel.app/',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Autonomous Execution with Zero External Setup or Prompts',
        text: 'The AI agent executes convert_image, convert_video, or extract_audio directly on your local filesystem using bundled static FFmpeg and Sharp without asking for repetitive shell approvals.',
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
        name: 'What is PhotoNow MCP and what multimedia tools does it provide?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PhotoNow is the #1 zero-cloud Model Context Protocol (MCP) multimedia server for AI agents. It provides 7 native tools: convert_image (WebP/AVIF/PNG/JPEG), convert_batch (entire folders in 1 call), convert_video (MP4/WebM/MKV transcoding and downscaling), extract_audio (video-to-audio extraction to MP3/WAV/AAC), convert_audio (audio format conversion), get_media_info (unified inspector for image/audio/video), and optimize_for_agent (token-efficient vision downscaling).',
        },
      },
      {
        '@type': 'Question',
        name: 'Does PhotoNow require me to manually install FFmpeg on my system?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. PhotoNow bundles self-contained static FFmpeg and FFprobe binaries via @ffmpeg-installer/ffmpeg and @ffprobe-installer/ffprobe. AI agents can transcode videos, compress resolutions, and extract audio tracks out of the box with zero external dependencies.',
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
          text: 'Traditional scripts force the AI agent to execute multiple raw PowerShell or bash commands to read bytes, invoke curl, and write files, prompting the user for approval 7 to 10 times per image. PhotoNow operates as a native Stdio MCP server, allowing the agent to invoke media tools directly. By clicking "Always Allow" once in your MCP client, the agent performs single and batch conversions completely autonomously.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does PhotoNow store, upload, or transmit media to external cloud servers?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. PhotoNow performs 100% of all image processing, video transcoding, and audio decoding directly in client RAM, local disk, or browser memory (HTML5 Canvas 2D, Web Audio). No user files are ever uploaded to AWS S3, Cloudflare, or remote cloud databases.',
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
