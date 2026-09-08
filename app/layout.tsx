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
    default: 'PhotoNow — Zero-Cloud Multimedia & Performance MCP Server for AI Agents (29 Tools)',
    template: '%s | PhotoNow Zero-Cloud MCP Performance Engine',
  },
  description:
    'The #1 Zero-Cloud Multimedia & Website Performance Model Context Protocol (MCP) server built for autonomous AI agents (Claude Desktop, Cursor, Google Antigravity, Windsurf). Bundles 29 native tools: offline FFmpeg/Sharp media conversion, 5-axis web performance auditing, Asset Dependency Graph, AST source code patching, atomic rollbacks, and autonomous missions. 100% offline, zero permission prompts, zero cloud storage.',
  applicationName: 'PhotoNow MCP Engine',
  alternates: {
    canonical: 'https://photonow.vercel.app',
  },
  keywords: [
    'zero cloud multimedia mcp server',
    'website performance mcp server',
    'asset dependency graph mcp',
    'ast source code patch mcp',
    'atomic rollback mcp tool',
    'nextjs image optimization mcp',
    'web performance budget mcp',
    'autonomous performance engineering agent',
    '29 tools mcp server',
    'ffmpeg mcp tool server',
    'extract audio from video mcp',
    'convert video to mp4 webm mcp',
    'claude desktop mcp multimedia server',
    'cursor mcp performance optimizer',
    'antigravity mcp media tool',
    'in browser media converter',
    'offline lcp optimization mcp',
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
    title: 'PhotoNow — Zero-Cloud Multimedia & Performance MCP Server for AI Agents (29 Tools)',
    description:
      'Autonomous zero-cloud multimedia and performance engineering server for AI agents. 29 native tools: convert images to WebP/AVIF, transcode videos, extract audio, audit web assets, trace asset graphs, patch source code, and run autonomous optimization missions.',
    url: 'https://photonow.vercel.app',
    siteName: 'PhotoNow Zero-Cloud MCP Engine',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://photonow.vercel.app/og-card.png',
        width: 1200,
        height: 630,
        alt: 'PhotoNow — Zero-Cloud Multimedia & Performance MCP Server for AI Agents',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PhotoNow — Zero-Cloud Multimedia & Performance MCP Server for AI Agents (29 Tools)',
    description:
      'Zero cloud storage. 100% private offline media converter & website performance engine (29 tools) for Claude Desktop, Cursor, Antigravity & autonomous AI agents.',
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
      'Zero-Cloud Autonomous Multimedia & Website Performance Engineering Server (29 Tools) for AI Agents (Claude Desktop, Cursor, Antigravity) and modern web developers.',
  };

  const jsonLdSoftware = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PhotoNow Zero-Cloud Multimedia & Performance MCP Engine',
    operatingSystem: 'Windows, macOS, Linux (Cross-Platform Node.js Stdio & Browser MCP Runtime)',
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: 'AI Agent Multimedia & Website Performance Engineering MCP Server',
    softwareVersion: '2.0.0',
    url: 'https://photonow.vercel.app',
    codeRepository: 'https://github.com/Sibasish2005/PhotoNowEngine',
    description:
      'The #1 zero-cloud Model Context Protocol (MCP) server engineered for AI coding agents (Claude Desktop, Cursor, Google Antigravity, Windsurf). Bundles 29 tools across 6 functional domains: Multimedia Foundation (Sharp & FFmpeg offline transforms), Performance Auditing (5-axis bottleneck classification), Asset Graph & AST (Next.js/React component references and dead asset pruning), Safe Source Patching (unified diffs and atomic rollback), Performance Budgets & Git Regression Guards, and Autonomous End-to-End Missions under a <200 token budget contract.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      '29-Tool Native Stdio MCP Server (bin/mcp-server.mjs) for Claude Desktop, Cursor, and Antigravity',
      'Autonomous High-Level Optimization Mission (optimize_project) with <200 Token Budget Contract',
      'AST Source Code Patch Generator & Applicator with Unified Diffs (generate_source_patch, apply_source_patch)',
      '1-Click Cryptographic Atomic Rollback Engine (rollback_operation)',
      'Project Architecture & Route Tree Discovery (inspect_project)',
      'Asset Dependency Graph Engine (get_asset_usage, find_unused_assets)',
      '5-Axis Website Media Scorer & Bottleneck Classifier (analyze_web_assets)',
      'Web Performance Budget Evaluator (check_performance_budget)',
      'Git Commit Regression Guard & Branch Baselines',
      'Separated OBSERVED vs SIMULATED Runtime Verifier (verify_runtime_performance)',
      'Bundled Static FFmpeg/FFprobe Binaries (Zero System Dependencies)',
      'Batch Directory Conversion (convert_batch)',
      'Single Image Converter with Sobel Ink Filters (convert_image)',
      'Video Transcoder & Resolution Compressor (convert_video)',
      'Audio Extraction to MP3, WAV, AAC, FLAC (extract_audio)',
      'Standalone Audio Converter (convert_audio)',
      'Unified Media Inspector (get_media_info)',
      'LLM Vision Context Window Downscaler (optimize_for_agent)',
      'Interactive Web Companion Developer MCP Hub (components/McpDeveloperHub.tsx)',
      '100% Zero-Cloud Privacy (Zero Remote Servers, Zero Telemetry Leaks)',
    ],
  };

  const jsonLdHowTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Automate Website Performance and Media Conversions Using PhotoNow MCP',
    description:
      'Step-by-step guide to configure the PhotoNow MCP server in Claude Desktop, Cursor, or Antigravity for autonomous website optimization, source code patching, and media conversions.',
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
        name: 'Prompt Your AI Agent with Real Optimization Tasks',
        text: 'Ask the agent: "Optimize all images in my Next.js project and patch the source files safely", "Inspect project architecture and find dead assets", or "Convert video to WebM and extract poster frame".',
        url: 'https://photonow.vercel.app/',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Autonomous Execution with Zero Permission Prompts & Atomic Rollback',
        text: 'The AI agent inspects your repository AST, generates unified diffs, optimizes media into non-destructive folders, applies source code patches with automated backups, and verifies runtime performance.',
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
        name: 'What is PhotoNow MCP and what tools does it provide to AI agents?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PhotoNow is the #1 zero-cloud Model Context Protocol (MCP) server for AI coding agents. It provides 29 native tools across 6 domains: Multimedia Foundation (convert_image, convert_batch, convert_video, extract_audio, convert_audio, extract_poster_frame, get_media_info, optimize_for_agent), Performance Auditing (analyze_media, analyze_web_assets, find_oversized_assets, find_inefficient_formats, find_duplicate_assets, find_responsive_opportunities, test_web_performance, get_web_performance_summary, compare_web_performance), Performance Booster (generate_optimization_plan, optimize_web_assets, verify_optimization), Asset Graph & AST (inspect_project, get_asset_usage, find_unused_assets), Execution & Patching (check_performance_budget, verify_runtime_performance, generate_source_patch, apply_source_patch, rollback_operation), and Autonomous Mission (optimize_project).',
        },
      },
      {
        '@type': 'Question',
        name: 'How does PhotoNow safely patch Next.js and web application source code?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PhotoNow parses source code ASTs to identify <Image>, <img>, and CSS references. When optimizing assets, generate_source_patch formulates unified diffs. When apply_source_patch is called with confirmApply=true, it creates an exact timestamped backup in .photonow/backups/[operationId]/ before modifying files. If anything goes wrong, calling rollback_operation with the operationId instantly reverts all source files and assets to their exact original states.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does PhotoNow protect AI agent context windows from token blowups?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PhotoNow employs a Token Economy & Progressive Disclosure engine. Heavy diagnostics (thousands of image coordinates, perceptual hashes, and AST graphs) are processed locally on your machine. The MCP tools return compact, actionable intelligence (<200 tokens for full autonomous missions) with recommended next actions, preventing LLM context truncation while saving extensive details in local JSON/Markdown reports.',
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
        name: 'Does PhotoNow store, upload, or transmit media to external cloud servers?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. PhotoNow performs 100% of all image processing, video transcoding, and audio decoding directly in client RAM, local disk, or browser memory. No user files or repository source codes are ever uploaded to AWS S3, Cloudflare, or remote cloud databases.',
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
