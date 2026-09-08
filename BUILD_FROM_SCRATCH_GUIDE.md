# PhotoNow Master Blueprint: Architecture, Build & Usage Guide
### The Complete End-to-End Engineering Guide for Building & Using PhotoNow

> **Target Audience**: Software engineers, systems architects, and web developers who want to build, understand, or use a high-performance, local-first multimedia engine and autonomous 29-tool Model Context Protocol (MCP) server from scratch.

---

## Table of Contents

1. [Architectural Mental Model & System Duality](#1-architectural-mental-model--system-duality)
2. [Complete System Architecture & Flowchart](#2-complete-system-architecture--flowchart)
3. [Master Directory Structure](#3-master-directory-structure)
4. [Stage 1: Project Initialization & Configuration](#stage-1-project-initialization--configuration)
5. [Stage 2: Hand-Drawn Monochromatic Design System](#stage-2-hand-drawn-monochromatic-design-system)
6. [Stage 3: Browser Client Multimedia Foundation](#stage-3-browser-client-multimedia-foundation)
7. [Stage 4: Shared Performance Intelligence Core (`lib/engine/`)](#stage-4-shared-performance-intelligence-core)
8. [Stage 5: The 7 Agentic Intelligence Pillars](#stage-5-the-7-agentic-intelligence-pillars)
9. [Stage 6: Standalone Stdio & HTTP MCP Server (29 Tools)](#stage-6-standalone-stdio--http-mcp-server)
10. [Stage 7: Interactive Web Companion Workbench](#stage-7-interactive-web-companion-workbench)
11. [Stage 8: Complete Hands-On User Guide (UI & AI Agents)](#stage-8-complete-hands-on-user-guide)
12. [Stage 9: Automated Verification Test Suites & Benchmarks](#stage-9-automated-verification-test-suites)

---

## 1. Architectural Mental Model & System Duality

Most developers approaching media conversion and performance optimization build a traditional cloud SaaS model: files are uploaded to AWS S3 or Cloudinary, serverless workers execute CLI tools, and transformed images are served over an external CDN with recurring monthly costs.

**PhotoNow radically diverges from that model**:

1. **100% Local-First / Zero Cloud**: All processing happens entirely on the local machine using native Node.js (Sharp, static FFmpeg) and the modern browser runtime (HTML5 Canvas 2D, Web Audio API, `MediaRecorder`, IndexedDB). Zero API keys, zero cloud storage, zero telemetry.
2. **Dual-Engine Synergy**:
   - **Engine A: Human Companion Workbench**: An artist-style hand-drawn monochrome web application where developers can inspect visual scores, analyze dead assets, test live URLs, and visually verify before/after quality.
   - **Engine B: Autonomous AI Agent MCP Server**: A high-speed Model Context Protocol server exposing **29 native tools** over stdio and HTTP JSON-RPC 2.0. AI assistants (Claude Desktop, Google Antigravity, Cursor) can audit entire codebases, parse `<Image>` tags, formulate unified diffs, and execute safe rollbacks.
3. **Token Economy as a First-Class Citizen**: AI agents operate within strict context budgets. PhotoNow guarantees that diagnostic payloads use progressive disclosure (`compact`, `standard`, `detailed`, `raw`), cutting LLM token usage by **95.4%** (< 200 tokens default) while providing deterministic `nextAction` state machine chaining.
4. **Safe, Non-Destructive Source Patching**: All code and asset modifications strictly default to `dryRun: true`. Every modification requires explicit approval, creates timestamped backups in `.photonow/backups/`, and generates cryptographic manifests for instant atomic rollback.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHOTONOW SYSTEM DUALITY                         │
├───────────────────────────────────┬────────────────────────────────────┤
│     HUMAN COMPANION WORKBENCH     │     AUTONOMOUS AI AGENTS (MCP)     │
│  - Hand-Drawn Ink Aesthetic       │  - Stdio & HTTP JSON-RPC 2.0       │
│  - HTML5 Canvas 2D (Sobel Filter) │  - 29 Specialized Native Tools     │
│  - MediaRecorder (WebM Transcode) │  - AST & Regex <Image> Parser      │
│  - Web Audio API (WAV Audio)      │  - Asset Dependency Graph Engine   │
│  - Sandboxed IndexedDB Store      │  - Safe Source Patching & Rollback │
│  - 5-Axis Score & Visual Slider   │  - Token-Budgeted Output (<200 tkn)│
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 2. Complete System Architecture & Flowchart

```mermaid
flowchart TB
    subgraph Client_Layer["Client & Agent Interfaces"]
        AIAgent["AI Coding Assistants<br/>(Claude Desktop / Antigravity / Cursor)"]
        BrowserUser["Human Developer<br/>(Web Browser GUI)"]
    end

    subgraph Protocol_Gateway["Protocol & API Layer"]
        StdioServer["bin/mcp-server.mjs<br/>(Stdio JSON-RPC 2.0 - 29 Tools)"]
        HttpRoute["app/api/mcp/route.ts<br/>(HTTP JSON-RPC 2.0 Endpoint)"]
        RestRoute["app/api/performance/route.ts<br/>(REST Performance API)"]
        WebGUI["components/PerformanceWorkbench.tsx<br/>(Next.js Companion UI)"]
    end

    subgraph Token_Guard["Token Economy & Cache Layer"]
        TokenEconomy["lib/engine/tokenEconomy.mjs<br/>(Progressive Disclosure & Budget Guard)"]
        CacheStore["lib/engine/cache.mjs<br/>(In-Memory Plan & Test Cache)"]
    end

    subgraph Agentic_Layer["7 Agentic Intelligence Pillars"]
        Scanner["lib/engine/projectScanner.mjs<br/>(Framework & Route Discovery)"]
        SourceAST["lib/engine/sourceAnalyzer.mjs<br/>(AST & Source &lt;Image&gt; Parser)"]
        AssetGraph["lib/engine/assetGraph.mjs<br/>(Route ➔ Component ➔ Asset Graph)"]
        PatchGen["lib/engine/patchGenerator.mjs<br/>(Unified Diffs, Backups & Rollback)"]
        BrowserVerif["lib/engine/browserVerifier.mjs<br/>(OBSERVED vs SIMULATED Core)"]
        BudgetEngine["lib/engine/budget.mjs<br/>(Performance Budget Evaluator)"]
        Regression["lib/engine/regression.mjs<br/>(Git Baselines & PR Guard)"]
        MissionRunner["lib/engine/mission.mjs<br/>(Autonomous 10-Step Orchestrator)"]
    end

    subgraph Core_Engine["Shared Performance Engine Core"]
        Analyzer["lib/engine/analyzer.mjs<br/>(5-Axis Scorer & Bottleneck Classifier)"]
        PHash["lib/engine/perceptualHash.mjs<br/>(64-bit dHash & SHA-256 Deduplicator)"]
        Tester["lib/engine/performanceTester.mjs<br/>(Web Auditor & 4G/LCP Simulator)"]
        Booster["lib/engine/booster.mjs<br/>(Optimization Planner & Safe Transcoder)"]
        Reporter["lib/engine/reporting.mjs<br/>(Offline HTML, MD, JSON Reports)"]
    end

    subgraph Foundations["Local Execution Foundation"]
        SharpLib["Sharp (Native Node.js Image Engine)"]
        FFmpegLib["Static FFmpeg / FFprobe"]
        BrowserAPIs["HTML5 Canvas 2D & Web Audio API"]
        IndexedDBStore["IndexedDB (photoConvert_DB)"]
    end

    AIAgent --> StdioServer
    AIAgent --> HttpRoute
    BrowserUser --> WebGUI
    WebGUI --> RestRoute

    StdioServer --> TokenEconomy
    HttpRoute --> TokenEconomy
    RestRoute --> Core_Engine

    TokenEconomy --> MissionRunner
    MissionRunner --> Scanner
    MissionRunner --> SourceAST
    MissionRunner --> AssetGraph
    MissionRunner --> PatchGen
    MissionRunner --> BrowserVerif
    MissionRunner --> BudgetEngine
    MissionRunner --> Regression
    MissionRunner --> Core_Engine

    SourceAST --> AssetGraph
    AssetGraph --> PatchGen
    Core_Engine --> CacheStore
    Analyzer --> PHash
    Booster --> SharpLib
    Booster --> FFmpegLib
    WebGUI --> BrowserAPIs
    BrowserAPIs --> IndexedDBStore
```

---

## 3. Master Directory Structure

```
photoNow/
├── bin/
│   └── mcp-server.mjs                 # Standalone Stdio MCP server (29 tools)
├── app/
│   ├── api/
│   │   ├── mcp/
│   │   │   └── route.ts               # HTTP JSON-RPC 2.0 MCP endpoint
│   │   └── performance/
│   │       └── route.ts               # REST API for workbench GUI
│   ├── globals.css                    # Hand-drawn ink design tokens & animations
│   ├── layout.tsx                     # App layout, Google Fonts (Permanent Marker & Space Mono)
│   ├── page.tsx                       # Main split-screen workbench controller
│   ├── icon.svg                       # Vector SVG favicon
│   ├── apple-icon.png                 # Mobile touch icon
│   ├── robots.ts                      # SEO robots configuration
│   └── sitemap.ts                     # Automated sitemap generator
├── components/
│   ├── PerformanceWorkbench.tsx       # 7-subtab performance intelligence GUI
│   ├── PhotoConverter.tsx             # Canvas 2D image converter & Sobel shader
│   ├── VideoConverter.tsx             # Video player, WebM transcoder & audio extractor
│   ├── StorageHistory.tsx             # IndexedDB history manager & ZIP bundle exporter
│   ├── McpPlayground.tsx              # In-browser JSON-RPC test console
│   ├── HeaderNav.tsx                  # Sticky bracketed header navigation
│   ├── LeftHeroIllustration.tsx       # Left-column hand-drawn character illustration
│   ├── DoodleDecorations.tsx          # Right-edge tab strip & footer stamps
│   └── AgenticPanel.tsx               # Natural-language prompt simulation bar
├── lib/
│   ├── engine/                        # Core Engine Layer (Shared by stdio, HTTP, REST & UI)
│   │   ├── types.ts                   # TypeScript interfaces & domain models
│   │   ├── index.ts                   # Typed Next.js module re-exports
│   │   ├── index.mjs                  # Native ES module entry point
│   │   ├── tokenEconomy.mjs           # Progressive disclosure & token budgeting
│   │   ├── perceptualHash.mjs         # 64-bit dHash gradient difference & SHA-256
│   │   ├── cache.mjs                  # Local memory cache for plans & test snapshots
│   │   ├── analyzer.mjs               # 5-axis scorer & media bottleneck classifier
│   │   ├── performanceTester.mjs      # Web auditor, LCP candidate & 4G mobile latency
│   │   ├── booster.mjs                # Planner, safe Sharp transcoder & validator
│   │   ├── reporting.mjs              # Zero-dependency offline HTML/MD reporter
│   │   ├── projectScanner.mjs         # Framework, route tree & media root scanner
│   │   ├── sourceAnalyzer.mjs         # AST & regex <Image> tag and priority parser
│   │   ├── assetGraph.mjs             # Asset Dependency Graph & dead asset triage
│   │   ├── patchGenerator.mjs         # Unified diffs, backups & rollback engine
│   │   ├── browserVerifier.mjs        # OBSERVED vs SIMULATED runtime performance
│   │   ├── budget.mjs                 # Performance budget rule validator
│   │   ├── regression.mjs             # Git commit awareness & branch baselines
│   │   └── mission.mjs                # 10-step autonomous mission orchestrator
│   ├── imageConverter.ts              # Browser Canvas 2D client processing
│   ├── videoConverter.ts              # Browser MediaRecorder & Web Audio WAV decoder
│   ├── storage.ts                     # Browser IndexedDB raw database wrapper
│   ├── mcpTools.ts                    # MCP tool schema catalog & prompt lexer
│   ├── rateLimiter.ts                 # Sliding-window IP rate limiter
│   ├── loadBalancer.ts                # Request telemetry & cluster metrics
│   └── utils.ts                       # Shared byte formatting & path utilities
├── tests/
│   ├── unit/
│   │   └── test-agentic-intelligence.mjs # 7-suite unit tests for agentic pillars
│   ├── fixtures/                      # Realistic Next.js & Vite test sandboxes
│   ├── test-autonomous-mission.mjs    # End-to-end mission, dry-run & rollback tests
│   ├── test-mcp-server.mjs            # 29-tool verification over stdio JSON-RPC
│   ├── test-performance-engine.mjs   # Core performance engine verification
│   ├── test-usability-security.mjs    # 11/11 usability & security penetration tests
│   └── benchmark.mjs                  # Cold/warm scan benchmarks & memory profiling
├── package.json                       # Dependencies, npm scripts & binary link
├── tsconfig.json                      # TypeScript configuration
└── next.config.ts                     # Next.js security headers & build config
```

---

## Stage 1: Project Initialization & Configuration

### 1. Initialize Next.js 16 Project
Start from an empty directory:

```bash
mkdir photoNow
cd photoNow
npx create-next-app@latest ./ --typescript --eslint --app --src-dir=false --import-alias="@/*"
```

### 2. Configure Dependencies (`package.json`)
PhotoNow uses native, self-contained packages without external servers:

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
    "mcp:sync": "node ./tests/sync-mcp-schemas.mjs",
    "test": "node ./tests/unit/test-agentic-intelligence.mjs && node ./tests/test-autonomous-mission.mjs && node ./tests/test-performance-engine.mjs && node ./tests/test-mcp-server.mjs && node ./tests/test-usability-security.mjs",
    "test:unit": "node ./tests/unit/test-agentic-intelligence.mjs",
    "test:mission": "node ./tests/test-autonomous-mission.mjs",
    "test:benchmark": "node ./tests/benchmark.mjs"
  },
  "bin": {
    "photo-convert-mcp": "./bin/mcp-server.mjs"
  },
  "dependencies": {
    "@ffmpeg-installer/ffmpeg": "^1.1.0",
    "@ffprobe-installer/ffprobe": "^2.1.2",
    "@modelcontextprotocol/sdk": "^1.30.0",
    "fluent-ffmpeg": "^2.1.3",
    "jszip": "^3.10.1",
    "next": "16.3.4",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "sharp": "^0.35.4"
  },
  "devDependencies": {
    "@types/fluent-ffmpeg": "^2.1.28",
    "@types/jszip": "^3.4.0",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5"
  }
}
```

Run `npm install` to install all packages.

### 3. Build & TypeScript Configuration (`tsconfig.json` & `next.config.ts`)
Prevent Next.js from attempting to compile test fixtures and configure security headers:

**`tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "tests", ".photonow"]
}
```

---

## Stage 2: Hand-Drawn Monochromatic Design System

PhotoNow uses a distinctive artist-sketchbook aesthetic:
- **Palette**: Paper `#F2F2F0`, Deep Ink `#0A0A0A`, Inverted `#FFFFFF`.
- **Typography**: `Permanent Marker` for bold display headlines, `Space Mono` for tabular metrics and data.
- **Wobbly Borders**: Hand-drawn boxes using non-uniform border radiuses:
  `border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;`

### `app/globals.css` Tokens
```css
:root {
  --bg-paper: #F2F2F0;
  --ink: #0A0A0A;
  --ink-inverted: #FFFFFF;
  --ink-gray: #666666;
  --paper-tint: #ECECE8;
  --font-marker: 'Permanent Marker', cursive;
  --font-mono: 'Space Mono', monospace;
}

body {
  background-color: var(--bg-paper);
  color: var(--ink);
  font-family: var(--font-mono);
  margin: 0;
  padding: 0;
}

/* The Hand-Drawn Wobbly Border Class */
.hand-box {
  border: 2px solid var(--ink);
  border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
  background-color: var(--bg-paper);
  box-shadow: 2px 3px 0px var(--ink);
}

.hand-btn {
  border: 2px solid var(--ink);
  background: var(--bg-paper);
  color: var(--ink);
  cursor: pointer;
  font-family: var(--font-mono);
  font-weight: 700;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.hand-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 2px 2px 0px var(--ink);
}

.hand-btn:active {
  transform: translate(1px, 1px);
  box-shadow: 0px 0px 0px var(--ink);
}
```

---

## Stage 3: Browser Client Multimedia Foundation

### 1. Canvas 2D & Sobel Ink Shader (`lib/imageConverter.ts`)
Converts images in client browser memory using HTML5 Canvas. Includes an unweighted Sobel edge-detection filter:

```typescript
export async function convertImage(
  file: File | Blob,
  options: ImageConvertOptions
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Handle downscaling
      if (options.maxWidth && width > options.maxWidth) {
        height = Math.round((height * options.maxWidth) / width);
        width = options.maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context not available'));

      ctx.drawImage(img, 0, 0, width, height);

      // Apply Sobel Ink Shader if requested
      if (options.applySketchFilter) {
        applySobelInkShader(ctx, width, height);
      }

      const mimeType = `image/${options.format === 'jpg' ? 'jpeg' : options.format}`;
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Blob encoding failed'));
          resolve({ blob, width, height });
        },
        mimeType,
        options.quality
      );
    };

    img.onerror = reject;
    img.src = url;
  });
}
```

### 2. Video Transcoding & Web Audio WAV Extraction (`lib/videoConverter.ts`)
Uses `AudioContext` to decode audio channels into an uncompressed 16-bit PCM WAV container:

```typescript
export async function extractVideoAudioToWav(videoFile: File | Blob): Promise<Blob> {
  const arrayBuffer = await videoFile.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  // Encode 16-bit PCM WAV Header and Data
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = audioBuffer.length * blockAlign;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);

  // RIFF Chunk Descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Interleave channels into 16-bit signed integers
  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
```

---

## Stage 4: Shared Performance Intelligence Core (`lib/engine/`)

The shared engine powers the stdio MCP server, HTTP API, and web companion GUI:

### 1. Perceptual Difference Hashing (`lib/engine/perceptualHash.mjs`)
Uses Sharp to compute a 64-bit gradient difference hash (`dHash`):
1. Downsamples image to a 9×8 grayscale bitmap (72 pixels).
2. Compares each pixel to its horizontal neighbor: if `pixel[x] > pixel[x+1]`, bit is set to `1`.
3. Produces a 64-bit BigInt hash.
4. Calculates Hamming distance across asset pairs: similarity > 93% indicates duplicate assets under different filenames.

### 2. 5-Axis Performance Scorer (`lib/engine/analyzer.mjs`)
Scores project media health from 0 to 100 points:
- **Format Efficiency (25 pts)**: Percentage of modern WebP/AVIF/SVG adoption vs legacy PNG/JPEG.
- **Image Sizing (25 pts)**: Appropriateness of pixel dimensions relative to web viewports (flags images >1920px).
- **Compression Density (20 pts)**: Entropy and byte efficiency per square pixel.
- **Responsive Readiness (15 pts)**: Availability of multi-resolution variants for mobile devices.
- **SVG Cleanliness (15 pts)**: Clean vector graphics free of embedded base64 raster bloat.

### 3. Token Economy & Progressive Disclosure (`lib/engine/tokenEconomy.mjs`)
Guarantees AI agent responses never exceed token limits:
- `compact` (Default): Returns high-level score, potential savings, top 3 bottlenecks, and deterministic `nextAction`. Guaranteed **< 200 tokens**.
- `standard`: Adds categorized issue lists and potential savings.
- `detailed`: Full per-file records, dimensions, hashes, and timings.
- `tokenBudget`: Automatically truncates issue lists to strictly obey numerical token caps.

---

## Stage 5: The 7 Agentic Intelligence Pillars

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE 7 AGENTIC PILLARS                           │
├───────────────────────────────────┬────────────────────────────────────┤
│ 1. Project Scanner                │ Framework, routes, component tree  │
│ 2. Source Code Analyzer           │ <Image>, priority, rendered dims   │
│ 3. Asset Dependency Graph         │ Route ➔ Component ➔ Asset, dead    │
│ 4. Safe Source Patching           │ Unified diffs, backups, rollbacks  │
│ 5. Real Browser Verifier          │ OBSERVED vs SIMULATED separation   │
│ 6. Budgets & Git Guard            │ PR regression blocker & baselines  │
│ 7. Autonomous Mission Runner      │ 10-step orchestrator               │
└───────────────────────────────────┴────────────────────────────────────┘
```

### Pillar 1: Project Scanner (`lib/engine/projectScanner.mjs`)
Inspects the repository root, ignores `node_modules` and `.git`, and auto-detects frameworks:
- Next.js (App Router `app/**/page.tsx` or Pages Router `pages/**/*.js`)
- Vite / React (`src/App.tsx`, `index.html`)
- Nuxt, Astro, Gatsby, Hugo, Modern Web
- Resolves media roots: `public/`, `static/`, `src/assets/`.

### Pillar 2: Source Code Analyzer (`lib/engine/sourceAnalyzer.mjs`)
Performs static analysis across `.tsx`, `.jsx`, `.ts`, `.js`, `.html`, and `.css`:
- Extracts `<Image>`, `<img>`, `<picture>`, and CSS `url()` references.
- Parses `src`, `width`, `height`, `priority`, `loading="lazy"`, `sizes`, `alt`.
- Determines parent component and route hierarchy.
- Flags viewport-dominating hero images as **LCP Candidates**.

### Pillar 3: Asset Dependency Graph & Dead Asset Triage (`lib/engine/assetGraph.mjs`)
Maps `Route ➔ Component ➔ SourceFile ➔ Asset ➔ Variant`:
- **Asset Usage**: Exact reference counts and declaring locations.
- **Shared Assets**: Warns when an image is used across multiple routes.
- **Dead Asset Safety Tiers**:
  - `SAFE`: 0 references across all source files and configs. Safe to prune!
  - `LIKELY`: No direct references, but matches dynamic naming conventions.
  - `UNCERTAIN`: Ambiguous string interpolation.

### Pillar 4: Safe Source Patching & Automated Rollbacks (`lib/engine/patchGenerator.mjs`)
- **Strict Dry-Run Default**: Never touches disk unless explicitly approved (`dryRun: false`).
- **Unified Diffs**: Generates standard `diff -u` patches.
- **Atomic Backups**: Original source files are copied into `.photonow/backups/[operationId]/`.
- **Rollback Manifest**: Emits `.photonow/manifests/manifest_[operationId].json`. Calling `rollback_operation` restores files in 1 second.

### Pillar 5: Real Runtime Verification (`lib/engine/browserVerifier.mjs`)
Distinguishes real browser metrics from network math:
- `OBSERVED`: Real LCP, FCP, CLS measured via Chrome DevTools or live server.
- `SIMULATED`: Transparent mathematical fallback (1.6 Mbps download, 150ms RTT) when running headless in CI.

### Pillar 6: Performance Budgets & Git Regression Guard (`budget.mjs` & `regression.mjs`)
- Checks limits: Total media (<500 KB), single hero (<150 KB), LCP (<2.5s).
- Checks Git branch and commit hash (`git rev-parse HEAD`).
- Compares metrics against `.photonow/baselines/[branch].json` to block PR regressions.

### Pillar 7: Autonomous Mission Runner (`lib/engine/mission.mjs`)
Executes the full 10-step lifecycle in a single call:
`DISCOVER ➔ UNDERSTAND ➔ ANALYZE ➔ MEASURE ➔ DIAGNOSE ➔ PLAN ➔ PATCH ➔ OPTIMIZE ➔ VERIFY ➔ REPORT`.

---

## Stage 6: Standalone Stdio & HTTP MCP Server (29 Tools)

The MCP server connects to Claude Desktop, Cursor, and Antigravity over stdio JSON-RPC 2.0:

### Complete 29-Tool MCP Catalog

| Layer | Tool Name | Description |
| :--- | :--- | :--- |
| **Multimedia Foundation** | `convert_image` | Image conversion to WebP, PNG, JPEG, AVIF with quality, rotation, ink filters |
| *(Original 8 Tools)* | `convert_batch` | Batch folder image conversion with recursion filters |
| | `convert_video` | Video transcode / compress with FFmpeg |
| | `extract_audio` | Video to MP3/WAV audio extraction |
| | `convert_audio` | Audio format transcoding |
| | `extract_poster_frame` | Seek and capture clean video poster frame |
| | `get_media_info` | Unified metadata inspector (image, video, audio) |
| | `optimize_for_agent` | Downscale UI screenshots to compact WebP for vision LLMs |
| **Performance Intelligence**| `analyze_media` | Inspect single asset for performance bottlenecks |
| *(12 Media Tools)* | `analyze_web_assets` | Project-wide media scan, PhotoNow score, top issues |
| | `find_oversized_assets` | Filter assets exceeding dimensional/byte thresholds |
| | `find_inefficient_formats` | Identify photographic PNGs, legacy JPEGs, GIFs |
| | `find_duplicate_assets` | Perceptual dHash & SHA-256 duplicate clustering |
| | `find_responsive_opportunities`| Pinpoint high-res images lacking responsive srcset |
| | `test_web_performance` | Asset-centric web auditor, LCP candidate & score |
| | `get_web_performance_summary` | Retrieve compact summary of previous audit |
| | `compare_web_performance` | Compare before vs after audit snapshots |
| | `generate_optimization_plan` | Formulate actionable plan with `planId` and estimates |
| | `optimize_web_assets` | Safely execute plan with Sharp, validation, & idempotency |
| | `verify_optimization` | Verify measured reductions and generate local reports |
| **Agentic System Tools** | `inspect_project` | Scan framework, routes, component tree, media directories |
| *(9 Master Tools)* | `get_asset_usage` | Trace asset usage chain (`Route ➔ Component ➔ SourceFile`) and LCP status |
| | `find_unused_assets` | Detect dead assets categorized by safety tier (`SAFE`, `LIKELY`, `UNCERTAIN`) |
| | `check_performance_budget` | Evaluate against page bytes, image bytes, hero bytes, and LCP budgets |
| | `verify_runtime_performance` | Runtime performance metrics (`OBSERVED` via browser or `SIMULATED` fallback) |
| | `generate_source_patch` | Generate unified diffs updating image tags and file paths in source code |
| | `apply_source_patch` | Safely apply source patch with automatic backups and manifest generation |
| | `rollback_operation` | Atomically revert source files and assets to pre-patch state |
| | `optimize_project` | Autonomous end-to-end mission executing full 10-step lifecycle |

---

## Stage 7: Interactive Web Companion Workbench

The web companion GUI (`components/PerformanceWorkbench.tsx`) includes 7 interactive sub-tabs:

1. **`[1. MEDIA AUDIT]`**: Visual 5-axis score gauges, asset count, total media footprint, and prioritized bottleneck triage.
2. **`[2. ASSET GRAPH & UNUSED]`**: Complete graph visualizer showing routes, components, and dead assets (`SAFE`, `LIKELY`, `UNCERTAIN`).
3. **`[3. BUDGETS]`**: Core Web Vitals budget validator (PASS / WARN / FAIL).
4. **`[4. TEST URL]`**: Live website auditor measuring DOM media, LCP candidates, and simulated 4G mobile transfer times.
5. **`[5. PLAN]`**: Optimization plan inspector with estimated byte reductions.
6. **`[6. BEFORE/AFTER]`**: Interactive split-screen visual comparison slider to inspect image fidelity before committing changes.
7. **`[⚡ AUTONOMOUS MISSION]`**: 1-click execution of the full 10-step autonomous mission with dry-run preview and rollback tracking.

---

## Stage 8: Complete Hands-On User Guide (UI & AI Agents)

### A. How to Use the Web UI (`http://localhost:3000` or `photonow.vercel.app`)

* **Local Projects**: When running locally (`npm run dev`), type any folder path into the target bar:
  - `.` (current project root)
  - `./public`
  - `tests/fixtures/nextjs_project` (or click **`[Demo Fixture]`**)
* **Live Websites**: Go to **`[4. TEST URL]`**, enter any live URL (e.g. `https://my-site.com` or `http://localhost:3000`), and click **`[RUN AUDIT]`**.
* **Converting Photos/Videos**: Go to **`[PHOTO CONVERT]`** or **`[VIDEO & AUDIO]`**, drag & drop files from your desktop. Processing runs 100% locally in browser memory.

### B. How to Use with AI Agents (Claude Desktop, Cursor, Antigravity)

Add this entry to your MCP configuration:

```json
{
  "mcpServers": {
    "photoNow": {
      "command": "node",
      "args": [
        "c:/Users/sibas/OneDrive/Desktop/Projects/photoNow/bin/mcp-server.mjs"
      ]
    }
  }
}
```

#### Practical Prompt Recipes:

* *"Audit this repository with PhotoNow. Find any oversized images or formats hurting our LCP, and summarize the top bottlenecks."*
* *"Scan our public folder for dead images. Tell me which files are 100% SAFE to delete."*
* *"Run an autonomous optimization mission in dry-run mode and show me the unified diffs."*
* *"Apply the optimization plan, patch our Next.js <Image> tags to WebP, and verify that our performance budget passes."*

---

## Stage 9: Automated Verification Test Suites & Benchmarks

PhotoNow features an exhaustive test suite covering all layers:

```bash
# 1. Run all 7 unit test suites for agentic intelligence
node tests/unit/test-agentic-intelligence.mjs

# 2. Run end-to-end autonomous mission tests (dry-run, patching, rollback)
node tests/test-autonomous-mission.mjs

# 3. Test all 29 tools over stdio MCP JSON-RPC 2.0
node tests/test-mcp-server.mjs

# 4. Run core performance engine tests (8 suites)
node tests/test-performance-engine.mjs

# 5. Run defensive usability & security tests (11/11 tests)
node tests/test-usability-security.mjs

# 6. Run performance benchmark suite
node tests/benchmark.mjs
```

### Verified Benchmark Metrics
- **Cold Project Scan**: ~62.1ms (Next.js App Router fixture).
- **Warm Cached Scan**: ~8.2ms (**7.6x speedup** via internal cache).
- **Token Reduction**: **95.4%** reduction from raw diagnostic dump (~3,507 tokens) to compact summary (~160 tokens).
- **Autonomous Mission Output**: ~80 tokens (318 characters), well within the <200 token budget.
- **Production Build**: Next.js 16 (Turbopack) builds with **0 errors and 0 warnings**.
