# PhotoNow MCP Engine 🖋️🤖🎞️

> **The #1 Offline Photo, Video & Web Performance Model Context Protocol (MCP) Tool Server Built Specifically for AI Agents (Claude Desktop, Google Antigravity, Cursor, and LLM Swarms) — with a Zero-Cloud Human Companion Workbench.**

[![Live Production](https://img.shields.io/badge/Live-photonow.vercel.app-black?style=flat-square&logo=vercel)](https://photonow.vercel.app/)
[![MCP Server](https://img.shields.io/badge/Protocol-MCP%20JSON--RPC%202.0%20(29%20Tools)-black?style=flat-square)](https://photonow.vercel.app/api/mcp)
[![AI Discovery](https://img.shields.io/badge/AI%20Discovery-llms.txt%20%2F%20llms--full.txt-black?style=flat-square)](https://photonow.vercel.app/llms.txt)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Storage](https://img.shields.io/badge/Storage-IndexedDB-black?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local%20%2F%20Zero%20Cloud-black?style=flat-square)](#zero-cloud-privacy)
[![License: MIT](https://img.shields.io/badge/License-MIT-black?style=flat-square)](./LICENSE)
[![Build & Usage Guide](https://img.shields.io/badge/Guide-Build%20%26%20Usage-black?style=flat-square)](./BUILD_FROM_SCRATCH_GUIDE.md)
[![Architecture & Specs](https://img.shields.io/badge/Architecture-Master%20Blueprint-black?style=flat-square)](./ARCHITECTURE.md)

---

## Overview

**PhotoNow Engine** (`https://photonow.vercel.app/`) is an autonomous, browser-native media transformation and website performance intelligence Model Context Protocol (MCP) server engineered primarily for **AI Agents** and autonomous coding assistants.

Autonomous agents frequently encounter tasks requiring media downscaling, format optimization for multimodal context windows, video frame extraction, asset dependency tracking, dead code elimination, and Core Web Vitals optimization. Conventional solutions force agents to execute bulky CLI tools (like ImageMagick or FFmpeg) or pay for remote cloud APIs.

PhotoNow solves this by exposing a **high-speed, 100% offline, zero-cloud MCP JSON-RPC 2.0 interface (`/api/mcp` and Stdio `bin/mcp-server.mjs`)** backed by native Node.js (Sharp, static FFmpeg) and browser Canvas 2D, MediaRecorder, and Web Audio APIs.

### Primary Purpose: Built for AI Agents
- **Autonomous 29-Tool Dispatch**: AI agents connect over standard Stdio or HTTP JSON-RPC 2.0 to execute 29 tools across 6 specialized domains:
  1. **Multimedia Processing Foundation** (`convert_image`, `convert_video`, `extract_poster_frame`, `extract_audio`, `convert_audio`, `convert_batch`, `get_media_info`, `optimize_for_agent`).
  2. **Asset Diagnostic Intelligence** (`analyze_media`, `analyze_web_assets`, `find_oversized_assets`, `find_inefficient_formats`).
  3. **Optimization Planning & Execution** (`find_duplicate_assets`, `find_responsive_opportunities`, `generate_optimization_plan`, `optimize_web_assets`).
  4. **Performance Measurement & Verification** (`test_web_performance`, `get_web_performance_summary`, `compare_web_performance`, `verify_optimization`).
  5. **Asset Dependency Graph & Dead Asset Pruning** (`inspect_project`, `get_asset_usage`, `find_unused_assets`).
  6. **Safe AST Source Patching & Autonomous Mission** (`check_performance_budget`, `verify_runtime_performance`, `generate_source_patch`, `apply_source_patch`, `rollback_operation`, `optimize_project`).
- **Token Economy Contract**: Guarantees deterministic, compact payloads under **200 tokens** by default, with structured progressive disclosure (`compact`, `standard`, `detailed`, `raw`) to prevent context window saturation.
- **Enterprise Defense & Zero-Cloud Privacy**: Built-in sliding-window IP rate limiting, path traversal guards, atomic backup isolation, and decodability verification.
- **Human Companion Workbench & MCP Developer Hub**: Includes an artist-style hand-drawn monochrome interactive GUI (`#F2F2F0` paper, `#0A0A0A` ink) featuring the **`[MCP PERFORMANCE HUB]`** with client setup configs, an interactive JSON-RPC playground, and prompt generator.

---

## Core Pillars & Philosophy

### 1. Zero Cloud Privacy
Every transformation runs through client-side browser APIs:
- **HTML5 Canvas 2D & OffscreenCanvas**: Image rasterization, Sobel edge-detection ink shaders, format re-encoding.
- **HTML5 Video & MediaStream / MediaRecorder**: Hardware-accelerated WebM video transcoding with configurable bitrates.
- **Web Audio API (`AudioContext`)**: Decoding audio streams directly from video files into 16-bit uncompressed PCM WAV containers.
- **IndexedDB**: Local binary blob persistence up to browser disk limits with no third-party telemetry.

### 2. Hand-Drawn Monochromatic Aesthetic
- Styled after an artist's physical ink sketchbook.
- Hand-drawn wobbly box borders (`border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;`).
- Custom Sobel convolution ink-sketch shader that converts regular photos into comic-style crosshatched pen drawings.
- Typography powered by Google Fonts: **Permanent Marker** for bold headlines and **Space Mono** for technical data.

### 3. Agentic & MCP-Native
- **Natural Language Parsing**: Type commands like *"Extract audio from this video as WAV"* or *"Turn this photo into an ink sketch WebP at 80% quality"*.
- **Standardized MCP Server**: Exposes tools `convert_image`, `convert_video`, `extract_poster_frame`, `extract_audio`, and `list_storage_conversions` over JSON-RPC 2.0.

---

## How the Product Works

```
                     ┌──────────────────────────────────────────┐
                     │            User Input Source             │
                     │  (Drag & Drop, File Picker, or Agent)    │
                     └────────────────────┬─────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
      ┌─────────────────────────┐                     ┌─────────────────────────┐
      │   Image Processing      │                     │    Video Processing     │
      │   (HTML5 Canvas 2D)     │                     │ (MediaRecorder / Audio) │
      ├─────────────────────────┤                     ├─────────────────────────┤
      │ • Downscaling / Rotate  │                     │ • WebM Transcoding      │
      │ • Sobel Ink Filter      │                     │ • Poster Extraction     │
      │ • WebP/AVIF/PNG/JPG/BMP │                     │ • 16-bit PCM WAV Audio  │
      └───────────┬─────────────┘                     └───────────┬─────────────┘
                  │                                               │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                       ┌─────────────────────────────────────┐
                       │     Browser IndexedDB Storage       │
                       │    ("photoConvert_DB" Database)     │
                       └──────────────────┬──────────────────┘
                                          │
                 ┌────────────────────────┼────────────────────────┐
                 ▼                        ▼                        ▼
      ┌────────────────────┐   ┌─────────────────────┐   ┌───────────────────┐
      │  Instant Previews  │   │   ZIP Bundle Export │   │   MCP JSON-RPC    │
      │  & Direct Download │   │       (JSZip)       │   │  Agent Automation │
      └────────────────────┘   └─────────────────────┘   └───────────────────┘
```

1. **Client Ingestion**: Files selected by the user are held as browser `File` / `Blob` objects. No upload requests are initiated.
2. **In-Memory Transformation**:
   - Images are loaded into `HTMLImageElement` and drawn to a dynamic `<canvas>`. Filters (Sobel edge detection, grayscale, inversion) and geometry transforms (rotation, resizing) are calculated pixel-by-pixel.
   - Videos are loaded into an `<video>` element. Timestamps are sought for frame capture, or frames are piped to `canvas.captureStream()` and encoded through `MediaRecorder`. Audio tracks are decoded through `AudioContext.decodeAudioData()`.
3. **Local Storage Indexing**: Converted binary blobs are stored into an IndexedDB database (`photoConvert_DB`) along with original names, target MIME types, compression delta, and creation timestamps.
4. **Export & Sharing**: Items can be previewed immediately, downloaded individually, or compiled into a single `.zip` archive via `JSZip`.

---

## Step-by-Step Usage Guide

### 1. Photo Conversion
1. Open the **`[PHOTO CONVERT]`** tab from the top header navigation.
2. Drag and drop any image file (or multiple images for batch processing) into the hand-drawn dashed dropzone, or click anywhere inside to browse your device.
   * *Supported formats:* PNG, JPEG, WebP, AVIF, BMP, GIF, SVG.
3. Configure conversion parameters:
   - **Target Format**: Choose between `WEBP`, `PNG`, `JPEG`, `AVIF`, or `BMP`.
   - **Quality Slider**: Set output compression from `10%` to `100%` (lossless).
   - **Max Dimension (Scale)**: Keep original size, or constrain to `1920px`, `1280px`, `800px`, or `400px` (aspect ratio is locked automatically).
   - **Rotation**: Rotate `0°`, `90°`, `180°`, or `270°` clockwise.
   - **Monochrome Ink Sketch**: Toggle the custom Sobel edge-detection shader to transmute photos into pen-and-paper art.
   - **Grayscale / Invert**: Apply luminance filters or inverted negative filters.
4. Click **`CONVERT NOW ➔`**.
5. View conversion statistics (original size, converted size, bandwidth saved) and download converted images individually or proceed to Storage.

---

### 2. Video Conversion & Transcoding
1. Switch to the **`[VIDEO CONVERT]`** tab.
2. Select or drop a video file (`.mp4`, `.webm`, `.mov`).
3. Choose one of three specialized video pipelines:
   - **A. Capture Poster Frame (Snapshot)**:
     - Scrub the video player or drag the slider to the desired timestamp (in seconds).
     - Select poster format (`WEBP`, `JPEG`, `PNG`) and quality.
     - Click **`CAPTURE FRAME ➔`** to extract a frame.
   - **B. Extract Soundtrack (Audio WAV)**:
     - Select **`EXTRACT AUDIO`**.
     - Click **`EXTRACT WAV AUDIO ➔`**.
     - PhotoNow decodes the audio track via `AudioContext` and constructs an uncompressed 16-bit PCM `.wav` file.
   - **C. Transcode to WebM**:
     - Select **`TRANSCODE WEBM`**.
     - Pick resolution scaling (`100%`, `75%`, or `50%`), target bitrate (e.g. `2.5 Mbps` default), and choose whether to mute the audio track.
     - Click **`START TRANSCODING ➔`**.
     - An animated progress bar tracks playback recording until the WebM container is generated.

---

### 3. Customized Conversion Bar
1. Navigate to the **`[CUSTOMIZED]`** tab.
2. Choose or drop any media file (image or video).
3. Type an instruction in plain English, or click one of the pre-built quick presets:
   - *"Convert image to WebP 80% quality with max 1200px width"*
   - *"Apply monochrome ink sketch filter to photo and save as PNG"*
   - *"Extract poster frame from video at 1.0 second as WebP"*
   - *"Extract video soundtrack as uncompressed 16-bit WAV"*
   - *"Compress video to WebM at 50% scale with muted audio"*
4. Click **`EXECUTE AGENTIC PIPELINE ➔`**.
5. Watch the agent parse the intent, produce an execution plan, dispatch the internal MCP tool, commit the result to IndexedDB, and render the output.

---

### 4. Browser Local Storage & ZIP Export
1. Click **`[STORAGE: N]`** in the top navigation bar.
2. Inspect your storage dashboard:
   - **Total Stored Assets count**.
   - **Payload Occupied** in browser memory.
   - **Bandwidth Saved** calculated by comparing input vs output sizes.
3. Filter your assets by `ALL`, `IMAGES`, `VIDEOS`, or `AUDIO`.
4. Preview assets directly in the grid.
5. Click **`[DOWNLOAD ZIP BUNDLE]`** to package all stored files into a single `photonow_bundle.zip` archive using `JSZip`.
6. Use **`[CLEAR ALL STORAGE]`** or individual delete icons to clean up your local database whenever needed.

---

### 5. Connecting External Agents via MCP Server
PhotoNow includes a built-in Model Context Protocol (MCP) server adhering to the JSON-RPC 2.0 specification at `/api/mcp`.

#### Zero-Cloud Autonomous AI Agent Architecture
PhotoNow is designed with **ZERO cloud infrastructure** (no AWS S3, no remote cloud databases, no external paid APIs). Conversions happen either inside the **user's/agent's browser** or **ephemerally in-memory (RAM)**.

1. **Pathway A: Autonomous AI Agent via MCP (`convert_image`)**
   - When an AI agent (Claude Desktop, Cursor) calls `convert_image` and passes `imageBase64`, the conversion executes **100% in-memory (RAM)** using the local native engine.
   - Zero bytes are stored in the cloud.
   - The agent receives the converted Base64 data URI directly in the JSON-RPC response and writes the converted file to your local disk.

2. **Pathway B: Browser Automation Agents (`window.__photoConvertAgent`)**
   - AI agents controlling a browser (Chrome DevTools MCP, Puppeteer, Playwright, Claude Computer Use) can execute conversions directly inside the browser DOM via:
     ```javascript
     const res = await window.__photoConvertAgent.convertImage({
       base64: "data:image/png;base64,...",
       format: "webp",
       quality: 0.85
     });
     console.log(res.base64); // Converted image data URI
     ```
   - All conversions run locally using the browser's hardware-accelerated Canvas context and IndexedDB.

#### Quick Configuration for Claude Desktop, Antigravity, or Cursor:
Add this entry to your `mcp_config.json`:

```json
{
  "mcpServers": {
    "photoConvert": {
      "url": "https://photonow.vercel.app/api/mcp",
      "transport": "http",
      "description": "Zero-Cloud In-Browser & In-Memory Photo & Video Converter"
    }
  }
}
```

#### Native Stdio MCP Server (Images, Video, Audio)
PhotoNow provides a standalone zero-setup Stdio MCP server powered by native Sharp and self-contained static FFmpeg/FFprobe binaries (`@ffmpeg-installer/ffmpeg`, `@ffprobe-installer/ffprobe`). AI agents can read and write files directly on disk, performing conversions, audio extractions, video downscaling, and batch processing without repetitive shell approval prompts:

```json
{
  "mcpServers": {
    "photoConvert": {
      "command": "node",
      "args": [
        "c:/path/to/photoConvert/bin/mcp-server.mjs"
      ]
    }
  }
}
```

#### Available Native MCP Tools (29 Tools across 6 Functional Domains):

PhotoNow exposes 29 native Model Context Protocol tools over both Stdio (`bin/mcp-server.mjs`) and HTTP (`/api/mcp`):

**1. Multimedia Processing Foundation (8 Tools)**:
- `convert_image`: Single image conversion to WebP, PNG, JPEG, AVIF with quality, rotation, and resizing.
- `convert_batch`: Converts an entire folder or file list in a single call without multi-turn prompts.
- `extract_audio`: Extracts audio tracks from video files (.mp4, .mov, .mkv, .webm) to MP3, WAV, AAC, FLAC, OGG.
- `convert_video`: Transcodes, compresses, and downscales video containers with CRF quality control.
- `convert_audio`: Converts standalone audio between MP3, WAV, AAC, M4A, FLAC, and OGG.
- `extract_poster_frame`: Captures a poster snapshot frame from video at an exact timestamp.
- `get_media_info`: Unified inspector for images, video, and audio files (dimensions, codecs, bitrates, duration).
- `optimize_for_agent`: Compresses high-resolution screenshots into token-efficient WebP for LLM vision models.

**2. Asset Diagnostic Intelligence (4 Tools)**:
- `analyze_media`: In-depth diagnostic scan of a single media file with issue classification and potential savings.
- `analyze_web_assets`: Scans a web project directory, classifies all media bottlenecks, and computes 5-axis score.
- `find_oversized_assets`: Locates images whose dimensions or file sizes exceed web thresholds.
- `find_inefficient_formats`: Discovers images using uncompressed or legacy formats (photographic PNGs, uncompressed JPEGs).

**3. Optimization Planning & Execution (4 Tools)**:
- `find_duplicate_assets`: Identifies exact and perceptual duplicate assets (>93% similarity via 64-bit dHash).
- `find_responsive_opportunities`: Discovers large images lacking responsive breakpoint variants.
- `generate_optimization_plan`: Builds an action plan (`planId`) with impact ratings and estimated byte savings.
- `optimize_web_assets`: Executes an optimization plan with safe non-destructive defaults and decode validation.

**4. Performance Measurement & Verification (4 Tools)**:
- `test_web_performance`: Audits a web project directory or local URL, estimates 4G transfer, and finds LCP candidates.
- `get_web_performance_summary`: Retrieves cached audit or test results using `testId`.
- `compare_web_performance`: Compares before-and-after performance metrics across two test IDs or directories.
- `verify_optimization`: Measures post-optimization metrics, verifies savings, and generates offline reports.

**5. Asset Dependency Graph & Dead Asset Pruning (3 Tools)**:
- `inspect_project`: Scans project structure, framework, routes, media roots, and source references.
- `get_asset_usage`: Returns full reference chain (`Route -> Component -> SourceFile`) and LCP status for an asset.
- `find_unused_assets`: Detects dead/unreferenced assets categorized by safety tier (`SAFE`, `LIKELY`, `UNCERTAIN`).

**6. Safe AST Source Patching & Autonomous Mission (6 Tools)**:
- `check_performance_budget`: Evaluates project against performance budgets (page bytes, image bytes, hero bytes, LCP).
- `verify_runtime_performance`: Verifies runtime metrics (`OBSERVED` via browser or `SIMULATED` fallback).
- `generate_source_patch`: Generates unified diffs to update source code (`<img>` -> `<Image>`, `.png` -> `.webp`).
- `apply_source_patch`: Safely applies source patch with automated backups and rollback manifest generation.
- `rollback_operation`: Atomically rolls back modified source files and assets using operation manifest.
- `optimize_project`: Autonomous end-to-end mission executing the complete 10-step optimization lifecycle.

#### Developer MCP Hub (`[MCP PERFORMANCE HUB]`) & Playground
1. Click **`[MCP PERFORMANCE HUB]`** in the navigation header.
2. View ready-to-use client JSON configurations for **Claude Desktop**, **Cursor**, **Google Antigravity**, and **Windsurf**.
3. Use the **Interactive JSON-RPC Playground** to test live RPC methods (`tools/list`, `tools/call`, `initialize`) against `/api/mcp`.
4. Use the **Prompt Generator** to copy pre-formulated prompts with exact parameter bindings for every one of the 29 tools.
5. **Local Execution & Fork Disclaimer**: Because deep performance engineering requires direct filesystem access (reading source code, parsing ASTs, scanning media assets, writing optimized variants, and generating git baselines), the 21 Performance & Agentic tools operate over Stdio MCP on your local machine. Fork this repository and run it locally (`npm run dev` or `npm run mcp`) to give your AI assistant zero-latency, zero-cloud access to all 29 tools!

#### LLM & Answer Engine Discovery (`llms.txt`)
PhotoNow provides machine-readable discovery files adhering to the `/llms.txt` standard for Answer Engines, AI crawlers, and LLMs:
- **`https://photonow.vercel.app/llms.txt`**: Complete 29-tool catalog, client configs, practical prompt recipes, and verification matrix.
- **`https://photonow.vercel.app/llms-full.txt`**: Machine-readable specification with full JSON input/output schemas for all 29 tools, parameter types, safety tiers, and token budget contracts.

---

## Supported Formats & Capabilities

| Media Category | Input Formats | Target Output Formats | Available Manipulations |
| :--- | :--- | :--- | :--- |
| **Photos / Images** | PNG, JPG, JPEG, WebP, AVIF, BMP, GIF, SVG, TIFF | `WebP`, `PNG`, `JPEG`, `AVIF`, `BMP` | Resizing, 90°/180°/270° Rotation, Sobel Ink Sketch Shader, Grayscale, Invert, Quality Compression |
| **Video Files** | MP4, WebM, MOV, MKV, AVI, FLV, WMV | `MP4`, `WebM`, `MKV`, `MOV` | CRF Compression, Preset Speed Tuning, Resolution Scale (divisible by 2), Audio Strip (Mute) |
| **Video Snapshots** | MP4, WebM, MOV, MKV | `WebP`, `JPEG`, `PNG` | Sub-second timeline scrubbing, frame extraction |
| **Audio Extraction** | MP4, WebM, MOV, MKV, AVI | `MP3`, `WAV`, `AAC`, `M4A`, `FLAC`, `OGG` | Multi-channel audio extraction, bitrate configuration, mono/stereo |
| **Audio Conversion**| MP3, WAV, AAC, M4A, FLAC, OGG | `MP3`, `WAV`, `AAC`, `M4A`, `FLAC`, `OGG` | Bitrate tuning, sample rate conversion (44.1kHz, 48kHz) |

---

## Tech Stack

- **Framework**: [Next.js 16 (Turbopack, App Router)](https://nextjs.org/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS Variables + Hand-drawn design system (Zero CSS runtime overhead)
- **Local Server Engine**: Native Sharp (libvips 8.16) + Bundled Static FFmpeg/FFprobe (`fluent-ffmpeg`, `@ffmpeg-installer/ffmpeg`, `@ffprobe-installer/ffprobe`)
- **Browser Media Pipeline**: Native HTML5 Canvas 2D, MediaStream (`captureStream`), MediaRecorder API, Web Audio API (`AudioContext`)
- **Local Persistence**: Browser IndexedDB (`photoConvert_DB`)
- **Packaging**: [JSZip](https://stuk.github.io/jszip/)
- **Protocol**: Model Context Protocol (MCP) JSON-RPC 2.0 specification (Stdio + HTTP)

---

## Getting Started

### Prerequisites
- Node.js `v18.17+` or `v20+`
- Modern browser with Canvas2D and Web Audio support (Chrome, Edge, Firefox, Safari)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Sibasish2005/PhotoNowEngine.git
   cd PhotoNowEngine
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Launch the Workbench**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Development & Test Scripts

```bash
# Development & Production
npm run dev            # Starts Next.js development server with Turbopack (http://localhost:3000)
npm run build          # Compiles production-ready bundle
npm run start          # Runs the production server
npm run mcp            # Runs the Stdio MCP server directly (JSON-RPC 2.0)
npm run mcp:sync       # Synchronizes JSON schemas between Stdio and HTTP interfaces

# Automated Verification & Test Suites (100% Pass Rate)
npm test               # Runs standard suite: Unit + Security + Catalog + Mission
npm run test:unit      # 7-suite unit tests for core agentic intelligence pillars
npm run test:security  # 15/15 adversarial security penetration & edge-case checks
npm run test:mcp       # 29-tool Stdio JSON-RPC 2.0 verification suite
npm run test:http      # HTTP JSON-RPC 2.0 endpoint verification (/api/mcp)
npm run test:sandbox   # External project sandbox verification (15/15 stages)
npm run test:mission   # End-to-end autonomous mission, dry-run, patching & rollback
npm run test:benchmark # Cold vs warm cached project scan performance benchmarks
```

---

## Legal, Privacy & Compliance

- **[Privacy Policy](https://photonow.vercel.app/privacy)**: 100% in-browser and local disk processing. Zero server uploads, zero cloud storage, zero tracking cookies, and zero AI model training.
- **[Terms of Service & Acceptable Use](https://photonow.vercel.app/terms)**: Governing terms for interactive web users and autonomous AI agent MCP connections. Users retain 100% full copyright and ownership of all media.
- **[Trademarks & Legal Notice](https://photonow.vercel.app/legal)**: Nominative fair use disclosures, commercial independence disclaimers, and DMCA takedown procedures.

---

## License

This project is licensed under the **[MIT License](./LICENSE)**. Copyright &copy; 2026 Sibasish Chakraborti.

Bundled third-party binaries and dependencies maintain their respective open-source licenses:
- **FFmpeg & FFprobe**: LGPL v2.1+ / GPL v3.0 (`@ffmpeg-installer/ffmpeg`, `@ffprobe-installer/ffprobe`)
- **Sharp & libvips**: Apache-2.0 / LGPL v3.0+
- **fluent-ffmpeg**: MIT
- **JSZip**: MIT
- **Model Context Protocol SDK**: MIT

