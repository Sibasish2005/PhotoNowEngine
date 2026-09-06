# PhotoNow Engine 🖋️🎞️

> **Hand-drawn, offline-first client-side photo & video converter workbench with persistent browser storage and an autonomous Model Context Protocol (MCP) agent server.**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-black?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Storage](https://img.shields.io/badge/Storage-IndexedDB-black?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![MCP](https://img.shields.io/badge/Protocol-MCP%20JSON--RPC%202.0-black?style=flat-square)](https://modelcontextprotocol.io/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local%20%2F%20Zero%20Cloud-black?style=flat-square)](#zero-cloud-privacy)

---

## Overview

**PhotoNow Engine** is a high-performance, browser-native media processing workstation wrapped in a distinctive hand-drawn, monochrome ink-on-paper aesthetic (`#F2F2F0` paper, `#0A0A0A` ink). 

Unlike conventional converters that upload your personal media to remote cloud servers, PhotoNow executes **100% of all image encoding, video transcoding, audio extraction, and storage directly inside your browser memory**. Your files never touch any external server.

Beyond manual conversion tools, PhotoNow features:
- **Autonomous Agentic Command Bar**: Convert media using natural language prompts parsed directly in-browser into executable multi-step plans.
- **Model Context Protocol (MCP) JSON-RPC Server**: Standardized `/api/mcp` endpoint allowing AI coding agents (Antigravity, Claude Desktop, Cursor) to automate media conversions and storage queries.
- **Persistent IndexedDB Storage**: Retain converted media locally across page refreshes with zero cloud tracking, bandwidth savings metrics, and single-click ZIP bundle packaging.

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

### 3. Agentic AI Conversion Bar
1. Navigate to the **`[AGENTIC AI]`** tab.
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

#### Quick Configuration for Claude Desktop, Antigravity, or Cursor:
Add this entry to your `mcp_config.json`:

```json
{
  "mcpServers": {
    "photoConvert": {
      "url": "http://localhost:3000/api/mcp",
      "transport": "http",
      "description": "Hand-Drawn Client-Side Photo & Video Converter with Local Storage persistence"
    }
  }
}
```

#### Interactive MCP Playground
1. Click **`[MCP SERVER]`** in the navigation header.
2. Test RPC methods (`tools/list`, `tools/call`, `initialize`) against `/api/mcp`.
3. Inspect live JSON-RPC request and response payloads directly in the interface.

---

## Supported Formats & Capabilities

| Media Category | Input Formats | Target Output Formats | Available Manipulations |
| :--- | :--- | :--- | :--- |
| **Photos / Images** | PNG, JPG, JPEG, WebP, AVIF, BMP, GIF, SVG | `WebP`, `PNG`, `JPEG`, `AVIF`, `BMP` | Resizing, 90°/180°/270° Rotation, Sobel Ink Sketch Shader, Grayscale, Invert, Quality Compression |
| **Video Files** | MP4, WebM, MOV, OGG | `WebM (VP9/VP8)` | Resolution Scale (100%, 75%, 50%), Custom Bitrate, Audio Strip (Mute) |
| **Video Snapshots** | MP4, WebM, MOV, OGG | `WebP`, `JPEG`, `PNG` | Sub-second timeline scrubbing, frame extraction |
| **Audio Extraction** | MP4, WebM, MOV, OGG | `WAV (16-bit PCM RIFF)` | Multi-channel audio decoding, sample rate preservation |

---

## Tech Stack

- **Framework**: [Next.js 16 (Turbopack, App Router)](https://nextjs.org/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS Variables + Hand-drawn design system (Zero CSS runtime overhead)
- **Image Pipeline**: Native HTML5 Canvas 2D API + OffscreenCanvas
- **Video & Audio Pipeline**: HTMLMediaElement, MediaStream (`captureStream`), MediaRecorder API, Web Audio API (`AudioContext`)
- **Local Persistence**: Browser IndexedDB (`photoConvert_DB`)
- **Packaging**: [JSZip](https://stuk.github.io/jszip/)
- **Protocol**: Model Context Protocol (MCP) JSON-RPC 2.0 specification

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

## Development Scripts

```bash
npm run dev     # Starts Next.js development server with Turbopack
npm run build   # Compiles production-ready bundle
npm run start   # Runs the production server
npm run lint    # Runs ESLint checks
```

---

## License

MIT License. Crafted for creative engineers and privacy-conscious users who care about speed, offline autonomy, and timeless aesthetics.
