# Building PhotoNow Engine from Scratch
### The Complete Step-by-Step Engineering Roadmap for Next.js Developers

> **Target Audience**: Next.js developers (familiar with the App Router, TypeScript, React Server/Client Components, and Route Handlers) who want to build a high-performance, zero-cloud multimedia processing application and autonomous Model Context Protocol (MCP) tool server from an empty directory.

---

## Table of Contents

1. [Architectural Mental Model & System Duality](#1-architectural-mental-model--system-duality)
2. [Stage 1: Project Initialization, Dependencies & Bundler Configuration](#stage-1-project-initialization-dependencies--bundler-configuration)
3. [Stage 2: Hand-Drawn Monochrome Design System & Theming Tokens](#stage-2-hand-drawn-monochrome-design-system--theming-tokens)
4. [Stage 3: Data Contracts & Client-Side Storage Tier (IndexedDB)](#stage-3-data-contracts--client-side-storage-tier-indexeddb)
5. [Stage 4: In-Browser Image Transformation Engine & Custom Sobel Shader](#stage-4-in-browser-image-transformation-engine--custom-sobel-shader)
6. [Stage 5: In-Browser Video Transcoding & Web Audio WAV Extraction](#stage-5-in-browser-video-transcoding--web-audio-wav-extraction)
7. [Stage 6: Autonomous Stdio MCP Server for AI Agents (Claude, Cursor, Antigravity)](#stage-6-autonomous-stdio-mcp-server-for-ai-agents-claude-cursor-antigravity)
8. [Stage 7: HTTP MCP API Endpoint, Ephemeral Rate Limiting & Browser Bridge](#stage-7-http-mcp-api-endpoint-ephemeral-rate-limiting--browser-bridge)
9. [Stage 8: Interactive UI & Split-Screen Workbench Components](#stage-8-interactive-ui--split-screen-workbench-components)
10. [Stage 9: SEO, AEO (Answer Engine Optimization) & Legal Infrastructure](#stage-9-seo-aeo-answer-engine-optimization--legal-infrastructure)
11. [Stage 10: Automated Test Suites & Production Deployment](#stage-10-automated-test-suites--production-deployment)

---

## 1. Architectural Mental Model & System Duality

Most web developers who approach a media converter build a classic client-server model: the browser uploads files to AWS S3, a serverless lambda or worker server runs FFmpeg, and the transformed file is downloaded back. 

**PhotoNow radically diverges from that model**:
1. **Zero Cloud Infrastructure**: User photos, videos, and audio streams are processed **100% locally**. In the browser, this uses Canvas 2D, `MediaRecorder`, and the Web Audio API. On the desktop, this runs via bundled static binaries directly on the user's filesystem.
2. **Dual-Engine Architecture**:
   - **Engine A: Browser Client Workbench**: A hand-drawn monochrome interactive web application where human users drag-and-drop files, adjust visual filters, and export results.
   - **Engine B: Stdio & HTTP Model Context Protocol (MCP) Server**: A standard MCP server allowing autonomous AI coding assistants (Claude Desktop, Cursor, Google Antigravity, Claude Code) to perform batch conversions, video downscaling, and audio extraction with a single tool call without prompting the user for terminal permissions.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PhotoNow System Architecture                     │
├────────────────────────────────────┬────────────────────────────────────┤
│     Human Web Workbench (GUI)      │   Autonomous AI Agent (Stdio MCP)  │
│  - React 19 Client Components      │  - Node.js Stdio Process           │
│  - HTML5 Canvas 2D (Sobel Filter)  │  - Bundled Static FFmpeg & FFprobe │
│  - MediaRecorder (WebM Transcode)  │  - Native Sharp (libvips 8.16)     │
│  - Web Audio API (WAV Extraction)  │  - 7 Autonomous Tools              │
│  - Sandboxed IndexedDB Persistence │  - Single-Approval Zero Friction   │
└────────────────────────────────────┴────────────────────────────────────┘
```

---

## Stage 1: Project Initialization, Dependencies & Bundler Configuration

### 1. Initialize Next.js 16
Start by initializing a Next.js project with TypeScript, ESLint, and App Router:

```bash
npx create-next-app@latest photo-convert --typescript --eslint --app --src-dir=false --import-alias="@/*"
cd photo-convert
```

### 2. Install Project Dependencies
PhotoNow uses a curated set of native and bundled libraries:

```bash
# Server-side & Stdio MCP tooling
npm install sharp @ffmpeg-installer/ffmpeg @ffprobe-installer/ffprobe fluent-ffmpeg @modelcontextprotocol/sdk

# Client-side archiving
npm install jszip

# TypeScript type definitions
npm install -D @types/fluent-ffmpeg @types/jszip
```

### 3. Configure `package.json`
Add the executable binary command so users can launch the Stdio MCP server via `npx photo-convert-mcp` or `npm run mcp`:

```json
{
  "name": "photo-convert",
  "version": "0.1.0",
  "license": "MIT",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "mcp": "node ./bin/mcp-server.mjs",
    "test": "node ./tests/test-mcp-server.mjs && node ./tests/test-usability-security.mjs"
  },
  "bin": {
    "photo-convert-mcp": "./bin/mcp-server.mjs"
  }
}
```

### 4. Configure `next.config.ts`
Because we operate a zero-cloud media platform, we configure security headers to block iframe clickjacking, sniffing, and unneeded browser device permissions:

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## Stage 2: Hand-Drawn Monochrome Design System & Theming Tokens

Rather than using generic modern design templates, PhotoNow adopts a bespoke **hand-drawn monochrome engineering aesthetic** reminiscent of blueprint paper and India ink.

### 1. Define Design Tokens in `app/globals.css`
Set up CSS custom properties and wobble border radii:

```css
/* app/globals.css */
:root {
  --bg-paper: #F2F2F0;       /* Off-white paper background */
  --ink: #0A0A0A;            /* Carbon ink black */
  --ink-gray: #5A5A58;       /* Muted architectural pencil */
  --paper-tint: #E5E5E2;     /* Inset shadow & secondary panel */
  --ink-inverted: #F2F2F0;   /* White ink on black badge */
  --wobble-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
}

body {
  background-color: var(--bg-paper);
  color: var(--ink);
  font-family: var(--font-mono), monospace;
  margin: 0;
  padding: 0;
}

/* Hand-drawn borders */
.hand-box {
  border: 2px solid var(--ink);
  border-radius: var(--wobble-radius);
  background: var(--bg-paper);
  box-shadow: 3px 3px 0px var(--ink);
}

/* Tactile hand-drawn button */
.hand-btn {
  border: 2px solid var(--ink);
  border-radius: var(--wobble-radius);
  background: var(--bg-paper);
  color: var(--ink);
  font-family: var(--font-mono), monospace;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 2px 2px 0px var(--ink);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.hand-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0px var(--ink);
}

.hand-btn:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px var(--ink);
}

.hand-btn.primary {
  background: var(--ink);
  color: var(--ink-inverted);
}

.marker-font {
  font-family: var(--font-marker), cursive;
}
```

### 2. Configure Typography in `app/layout.tsx`
Load `Space_Mono` and `Permanent_Marker` via `next/font/google`:

```typescript
// app/layout.tsx
import { Permanent_Marker, Space_Mono } from 'next/font/google';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${markerFont.variable} ${monoFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

---

## Stage 3: Data Contracts & Client-Side Storage Tier (IndexedDB)

### 1. Define Core Interfaces (`lib/types.ts`)
Create type contracts shared across image converters, video transcoders, storage, and MCP tools:

```typescript
// lib/types.ts
export type ImageFormat = 'webp' | 'png' | 'jpeg' | 'avif' | 'bmp';
export type VideoFormat = 'webm' | 'poster' | 'audio-wav';

export interface ImageConvertOptions {
  format: ImageFormat;
  quality: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
  applySketchFilter?: boolean;
  applyGrayscale?: boolean;
  applyInvert?: boolean;
  rotate?: number; // 0, 90, 180, 270
}

export interface VideoConvertOptions {
  action: 'webm' | 'poster' | 'audio-wav';
  posterTime?: number; // seconds
  posterFormat?: 'webp' | 'jpeg' | 'png';
  posterQuality?: number;
  videoBitrate?: number; // bps e.g. 2000000
  videoScale?: number; // 1, 0.75, 0.5
  mute?: boolean;
}

export interface StoredConversion {
  id: string;
  originalName: string;
  convertedName: string;
  format: string;
  size: number;
  originalSize: number;
  createdAt: number;
  blob: Blob;
  previewUrl: string;
  type: 'image' | 'video' | 'audio';
  duration?: number;
}
```

### 2. Build the Raw IndexedDB Storage Tier (`lib/storage.ts`)
Avoid bloated storage libraries by utilizing the browser's native `indexedDB` API:

```typescript
// lib/storage.ts
import JSZip from 'jszip';
import { StoredConversion } from './types';

const DB_NAME = 'photoConvert_DB';
const STORE_NAME = 'conversions';
const DB_VERSION = 1;

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('IndexedDB unavailable on server'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveConversion(item: StoredConversion): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getConversions(): Promise<StoredConversion[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteConversion(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllConversions(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function exportAllToZip(): Promise<Blob> {
  const items = await getConversions();
  const zip = new JSZip();
  for (const item of items) {
    zip.file(item.convertedName, item.blob);
  }
  return zip.generateAsync({ type: 'blob' });
}
```

---

## Stage 4: In-Browser Image Transformation Engine & Custom Sobel Shader

The browser image conversion engine handles format re-encoding via Canvas 2D, aspect-ratio scaling, and a custom **Sobel convolution filter** to transform any photo into a hand-drawn ink sketch.

### 1. Build `lib/imageConverter.ts`
Implement proportional scaling, rotation, and canvas-to-blob conversion:

```typescript
// lib/imageConverter.ts
import { ImageConvertOptions, ImageFormat } from './types';

export function getMimeType(format: ImageFormat): string {
  switch (format) {
    case 'webp': return 'image/webp';
    case 'jpeg': return 'image/jpeg';
    case 'png':  return 'image/png';
    case 'avif': return 'image/avif';
    default:     return 'image/webp';
  }
}

export async function convertImage(
  file: File | Blob,
  options: ImageConvertOptions
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImage(file);
  let { width, height } = calculateDimensions(img.width, img.height, options.maxWidth, options.maxHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.drawImage(img, 0, 0, width, height);

  // Apply visual shaders if requested
  if (options.applySketchFilter) {
    applyInkSketchFilter(ctx, width, height);
  } else if (options.applyGrayscale) {
    applyGrayscaleFilter(ctx, width, height);
  }

  const mimeType = getMimeType(options.format);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
      mimeType,
      options.quality
    );
  });

  return { blob, width, height };
}
```

### 2. Implement the Custom Sobel Ink-Sketch Shader
The custom filter converts the raw RGBA pixels into luminance grayscale, calculates a 3x3 Sobel edge convolution, and binarizes into carbon ink (`#0A0A0A`) on paper (`#F2F2F0`):

```typescript
export function applyInkSketchFilter(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Calculate luminance grayscale
  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // 2. 3x3 Sobel Edge Detection Convolution
  const edges = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx =
        -1 * gray[idx - width - 1] + 1 * gray[idx - width + 1] +
        -2 * gray[idx - 1]         + 2 * gray[idx + 1] +
        -1 * gray[idx + width - 1] + 1 * gray[idx + width + 1];

      const gy =
        -1 * gray[idx - width - 1] - 2 * gray[idx - width] - 1 * gray[idx - width + 1] +
         1 * gray[idx + width - 1] + 2 * gray[idx + width] + 1 * gray[idx + width + 1];

      edges[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // 3. Composite into ink lines & crosshatch shadows
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const i = p * 4;
      const g = gray[p];
      const edge = edges[p];

      const isEdge = edge > 45;
      const isDarkShadow = g < 75;
      const isCrosshatch = g < 135 && (x + y) % 4 === 0;

      if (isEdge || isDarkShadow || isCrosshatch) {
        // Carbon ink black #0A0A0A
        data[i] = 10;
        data[i + 1] = 10;
        data[i + 2] = 10;
      } else {
        // Off-white paper #F2F2F0
        data[i] = 242;
        data[i + 1] = 242;
        data[i + 2] = 240;
      }
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
```

---

## Stage 5: In-Browser Video Transcoding & Web Audio WAV Extraction

In client-side video processing, we eliminate servers by relying on HTML5 `<video>`, `captureStream()`, and `MediaRecorder` for WebM video transcoding, and `AudioContext` for WAV extraction.

### 1. In-Browser Video Transcoding (`lib/videoConverter.ts`)
```typescript
// lib/videoConverter.ts
import { VideoConvertOptions } from './types';

export async function transcodeVideoToWebM(
  videoFile: File | Blob,
  options: VideoConvertOptions,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  const video = document.createElement('video');
  video.src = URL.createObjectURL(videoFile);
  video.muted = options.mute ?? false;
  await video.play();

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(video.videoWidth * (options.videoScale || 1));
  canvas.height = Math.round(video.videoHeight * (options.videoScale || 1));
  const ctx = canvas.getContext('2d')!;

  // Stream canvas frames into MediaRecorder
  const stream = canvas.captureStream(30); // 30 FPS
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: options.videoBitrate || 2000000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);

  return new Promise((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
    recorder.onerror = reject;

    recorder.start(100);
    const drawLoop = () => {
      if (video.ended || video.paused) {
        recorder.stop();
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (onProgress) {
        onProgress(Math.round((video.currentTime / video.duration) * 100));
      }
      requestAnimationFrame(drawLoop);
    };
    drawLoop();
  });
}
```

### 2. Extracting Video Audio to 16-Bit PCM WAV
Decode the video's audio track via `AudioContext.decodeAudioData()` and construct a binary 44-byte RIFF/WAV header using standard `DataView`:

```typescript
export async function extractAudioFromVideo(videoFile: File | Blob): Promise<Blob> {
  const arrayBuffer = await videoFile.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  return audioBufferToWavBlob(audioBuffer);
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  const samples = buffer.getChannelData(0); // Primary channel
  const dataSize = samples.length * (bitDepth / 8);
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  // RIFF Header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);           // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true);            // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);  // NumChannels
  view.setUint32(24, sampleRate, true);   // SampleRate
  view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
  view.setUint16(32, numChannels * 2, true);              // BlockAlign
  view.setUint16(34, bitDepth, true);                     // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write 16-bit PCM Audio Samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
```

---

## Stage 6: Autonomous Stdio MCP Server for AI Agents (Claude, Cursor, Antigravity)

When Claude Desktop, Cursor, or Google Antigravity run as coding agents, invoking shell commands (`curl`, `ffmpeg`, `magick`) prompts the user 5–10 times per file for terminal approval.

By bundling static `@ffmpeg-installer/ffmpeg`, `@ffprobe-installer/ffprobe`, and native `sharp`, PhotoNow implements an autonomous **Stdio Model Context Protocol (MCP)** server (`bin/mcp-server.mjs`) that allows agents to process single files or entire directories in **one click / one tool call**.

### 1. Initialize MCP Server (`bin/mcp-server.mjs`)
```javascript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffprobePath from '@ffprobe-installer/ffprobe';
import path from 'node:path';
import fs from 'node:fs/promises';

// Configure bundled static binaries
ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfprobePath(ffprobePath.path);

const server = new Server(
  { name: 'photo-convert-mcp', version: '2.0.0' },
  { capabilities: { tools: {} } }
);
```

### 2. Implement the 7 Autonomous MCP Tools
The server exposes 7 native tools:
1. `convert_image`: Fast single-file image transcoding via native Sharp.
2. `convert_batch`: Recursive directory converter with noise folder exclusion (`node_modules`, `.git`).
3. `extract_audio`: Extract audio track from video to MP3, WAV, AAC, FLAC, or OGG.
4. `convert_video`: Transcode video containers (MP4, WebM, MKV, MOV), downscale resolution, and apply CRF compression.
5. `convert_audio`: Standalone audio format transcoding and sample rate tuning.
6. `get_media_info`: Unified metadata inspector for images (Sharp), video, and audio (FFprobe).
7. `optimize_for_agent`: Downscale heavy screenshots to 1280px WebP to conserve LLM vision context tokens.

### 3. Implement Strict Security Guardrails
Protect the user's filesystem against malicious agent prompts:

```javascript
const FORBIDDEN_DIRS = ['.git', '.ssh', '.aws', 'system32', 'windows/system'];
const ALLOWED_EXTENSIONS = new Set([
  '.webp', '.png', '.jpg', '.jpeg', '.avif', '.bmp',
  '.mp4', '.webm', '.mkv', '.mov', '.mp3', '.wav', '.aac', '.flac', '.ogg'
]);

function validateSafePath(targetPath) {
  const resolved = path.resolve(targetPath);
  const ext = path.extname(resolved).toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`Security Exception: Extension ${ext} is not permitted.`);
  }

  for (const forbidden of FORBIDDEN_DIRS) {
    if (resolved.toLowerCase().includes(forbidden)) {
      throw new Error(`Security Exception: Access to ${forbidden} is blocked.`);
    }
  }

  return resolved;
}
```

### 4. Connect Transport & Start Listening
```javascript
const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## Stage 7: HTTP MCP API Endpoint, Ephemeral Rate Limiting & Browser Bridge

In addition to local Stdio, PhotoNow serves web-based agents and MCP clients over HTTP JSON-RPC 2.0.

### 1. Build the Sliding-Window IP Rate Limiter (`lib/rateLimiter.ts`)
To prevent denial-of-service without heavy Redis dependencies, we build an in-memory sliding window counter with a 60-second garbage collector:

```typescript
// lib/rateLimiter.ts
interface ClientRecord {
  timestamps: number[];
}

const clientMap = new Map<string, ClientRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds
const MAX_REQUESTS_PER_WINDOW = 60;     // 60 reqs/min

// Evict inactive client records every 60 seconds to prevent RAM leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of clientMap.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (record.timestamps.length === 0) clientMap.delete(ip);
    }
  }, RATE_LIMIT_WINDOW_MS);
}

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let record = clientMap.get(ip);
  if (!record) {
    record = { timestamps: [] };
    clientMap.set(ip, record);
  }

  record.timestamps = record.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (record.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  record.timestamps.push(now);
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.timestamps.length };
}
```

### 2. Build the HTTP MCP Route Handler (`app/api/mcp/route.ts`)
Implement standard JSON-RPC 2.0 handling with CORS support:

```typescript
// app/api/mcp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32000, message: 'Rate limit exceeded: 60 req/min' } },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const payload = await req.json();
  const { method, params, id } = payload;

  if (method === 'initialize') {
    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'photonow-mcp-engine', version: '2.0.0' },
      },
    });
  }

  if (method === 'tools/list') {
    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      result: { tools: MCP_TOOL_DEFINITIONS },
    });
  }

  // Handle tools/call accordingly...
}
```

### 3. Expose the In-Browser DOM Automation Bridge (`lib/browserAgentApi.ts`)
Expose `window.__photoConvertAgent` so web-based agents (Puppeteer, Playwright, Chrome DevTools subagents) can trigger conversions directly inside the browser tab:

```typescript
// lib/browserAgentApi.ts
import { convertImage } from './imageConverter';

export function initBrowserAgentApi() {
  if (typeof window === 'undefined') return;
  (window as any).__photoConvertAgent = {
    version: '2.0.0',
    convertImage: async (file: Blob, options: any) => convertImage(file, options),
  };
}
```

---

## Stage 8: Interactive UI & Split-Screen Workbench Components

Next.js App Router applications thrive with proper code splitting. We dynamically load client components to keep the initial server-rendered HTML payload small.

### 1. Main Page Split-Screen Layout (`app/page.tsx`)
Create the 40/60 split layout with tab state:

```typescript
// app/page.tsx
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { HeaderNav } from '@/components/HeaderNav';
import { LeftHeroIllustration } from '@/components/LeftHeroIllustration';
import { PhotoConverter } from '@/components/PhotoConverter';

const VideoConverter = dynamic(() => import('@/components/VideoConverter').then((m) => m.VideoConverter));
const StorageHistory = dynamic(() => import('@/components/StorageHistory').then((m) => m.StorageHistory));
const AgenticPanel = dynamic(() => import('@/components/AgenticPanel').then((m) => m.AgenticPanel));
const McpPlayground = dynamic(() => import('@/components/McpPlayground').then((m) => m.McpPlayground));

export default function Home() {
  const [activeTab, setActiveTab] = useState<'photo' | 'video' | 'storage' | 'agent' | 'mcp'>('photo');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HeaderNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <main style={{ display: 'flex', flexWrap: 'wrap', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* Left 40% Column: Hero, Diagrams & Educational Guides */}
        <div style={{ flex: '1 1 420px', padding: '24px' }}>
          <LeftHeroIllustration activeTab={activeTab} />
        </div>

        {/* Right 60% Column: Interactive Feature Panel */}
        <div style={{ flex: '2 1 600px', padding: '24px' }}>
          {activeTab === 'photo' && <PhotoConverter />}
          {activeTab === 'video' && <VideoConverter />}
          {activeTab === 'storage' && <StorageHistory />}
          {activeTab === 'agent' && <AgenticPanel />}
          {activeTab === 'mcp' && <McpPlayground />}
        </div>
      </main>
    </div>
  );
}
```

### 2. The Interactive Workbench Panels
- **`components/PhotoConverter.tsx`**: Drag-and-drop file uploader, format selection pills, quality slider, ink-sketch toggle, and live canvas preview.
- **`components/VideoConverter.tsx`**: Video timeline, poster timestamp slider, bitrate downscaling, and audio extraction trigger.
- **`components/StorageHistory.tsx`**: Sandboxed gallery listing items from `IndexedDB`, storage usage meters, and batch ZIP export.
- **`components/McpPlayground.tsx`**: Live in-browser agent test simulator that generates synthetic image/video assets and executes JSON-RPC 2.0 calls with live execution logs.
- **`components/AgenticPanel.tsx`**: Copyable configuration JSON snippets for Claude Desktop, Cursor, and Google Antigravity.

---

## Stage 9: SEO, AEO (Answer Engine Optimization) & Legal Infrastructure

### 1. Semantic JSON-LD Structured Data in `app/layout.tsx`
Add structured metadata schemas for Answer Engines (Perplexity, ChatGPT Search, Claude, Google AI Overviews):

```typescript
// app/layout.tsx
const jsonLdSoftware = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PhotoNow Zero-Cloud Multimedia MCP Engine',
  operatingSystem: 'Cross-Platform (Windows, macOS, Linux)',
  applicationCategory: 'DeveloperApplication',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: [
    'Zero-Cloud Local In-Memory Media Conversion',
    'Bundled Static FFmpeg & FFprobe (Zero System Dependencies)',
    'Model Context Protocol Stdio Server for Claude, Cursor, Antigravity',
    'Custom Sobel Ink-Sketch Convolution Filter',
    'Video Transcoding and Audio Extraction to WAV/MP3',
    'Local IndexedDB Sandbox with Batch ZIP Archive Export',
  ],
};
```

### 2. AI Discovery Files (`public/llms.txt` & `public/llms-full.txt`)
Provide concise and detailed machine-readable specifications describing the MCP server endpoints, tool schemas, and local run commands.

### 3. Legal & Compliance Pages
Ensure complete legal protection:
- **`/legal`**: Nominative fair use notices (FFmpeg, Sharp, Anthropic, Google, Cursor), commercial independence disclaimers, and formal DMCA notice procedures.
- **`/privacy`**: Zero-cloud privacy guarantees, ephemeral rate-limiting logging disclosures, and strict no-AI-training clauses.
- **`/terms`**: Terms of service governing both human workbench visitors and autonomous AI agent connections.
- **`LICENSE`**: Root MIT License file with complete third-party open-source software acknowledgements.

---

## Stage 10: Automated Test Suites & Production Deployment

### 1. Automated MCP Test Suite (`tests/test-mcp-server.mjs`)
Create an end-to-end integration test that boots the Stdio MCP server, creates synthetic test media, verifies all 7 tools, and checks byte reduction:

```javascript
// tests/test-mcp-server.mjs
import { spawn } from 'node:child_process';

const server = spawn('node', ['./bin/mcp-server.mjs'], { stdio: ['pipe', 'pipe', 'inherit'] });

function sendRpc(method, params = {}) {
  const payload = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }) + '\n';
  server.stdin.write(payload);
}

// 1. Initialize
sendRpc('initialize', { protocolVersion: '2024-11-05', capabilities: {} });

// 2. Test Tools: convert_image, convert_video, extract_audio, etc.
```

### 2. Security & Usability Suite (`tests/test-usability-security.mjs`)
Verify path sanitization, `.env` file overwrite protection, non-media extension rejection, and decompression bomb protection.

### 3. Run Automated Checks
```bash
# Run test suite
npm test

# Type-check TypeScript files
npx tsc --noEmit

# Production build check
npm run build
```

### 4. Deploying to Production (Vercel)
1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Vercel automatically detects Next.js, compiles the App Router bundle, and exposes the production workbench at `https://your-domain.vercel.app`.
4. AI agents can now connect locally via Stdio (`npx photo-convert-mcp` or `node ./bin/mcp-server.mjs`) or remotely via the HTTP endpoint (`/api/mcp`).

---

## Summary Checklist

| Stage | Milestone | Core Technologies Used |
|---|---|---|
| **Stage 1** | Project Setup & Config | Next.js 16, TypeScript, Sharp, FFmpeg Binaries |
| **Stage 2** | Design Tokens & Theme | CSS Custom Properties, Permanent Marker, Space Mono |
| **Stage 3** | Client Storage Layer | Native Browser IndexedDB, JSZip |
| **Stage 4** | Image & Sobel Shader | Canvas 2D, Uint8ClampedArray, Sobel Convolution |
| **Stage 5** | Video & Audio Engine | MediaRecorder (VP9/VP8), Web Audio API, RIFF WAV |
| **Stage 6** | Stdio MCP Tool Server | @modelcontextprotocol/sdk, Fluent-FFmpeg, Sharp |
| **Stage 7** | HTTP MCP & Rate Limit | JSON-RPC 2.0, In-Memory Sliding Window Counter |
| **Stage 8** | Workbench UI Panels | Dynamic Imports, Split-Screen Layout, Drag & Drop |
| **Stage 9** | SEO, AEO & Legal | JSON-LD, llms.txt, Privacy Policy, Terms, MIT License |
| **Stage 10**| Testing & Deployment | Node.js Test Harness, Vercel Production Build |

*Congratulations! You now understand how to build PhotoNow Engine from scratch as a Next.js engineer.*
