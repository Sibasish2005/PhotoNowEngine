# How to Work with PhotoNow: Complete Web UI & MCP Guide

> **A Complete Practical Guide to Using PhotoNow as an Interactive Web Workbench and as an Agentic Model Context Protocol (MCP) Server.**

---

## 1. Quick Overview: Two Ways to Use PhotoNow

PhotoNow gives you two complementary ways to optimize web media and supercharge performance:

```
                                  ┌───────────────────────────┐
                                  │      PHOTONOW ENGINE      │
                                  └─────────────┬─────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
   ┌───────────────────────────┐                                 ┌───────────────────────────┐
   │     1. WEB WORKBENCH      │                                 │     2. AI AGENTS (MCP)    │
   │  Interactive visual GUI   │                                 │ Autonomous tool server    │
   │  for human developers     │                                 │ for Claude/Cursor/Codex   │
   └───────────────────────────┘                                 └───────────────────────────┘
```

1. **Interactive Web UI**: Visual dashboards, 5-axis score gauges, dead asset triage, side-by-side before/after comparison sliders, and one-click autonomous mission buttons.
2. **AI Agent MCP Server**: 29 specialized tools exposed via JSON-RPC 2.0 (stdio and HTTP) allowing AI agents (Claude Desktop, Cursor, Antigravity) to audit codebases, parse `<Image>` tags, detect dead assets, formulate unified diffs, and patch source files safely.

---

## Part 1: How to Work with the Web Companion UI

### Running the Web UI

* **Local Machine (Recommended for full source patching & local folders)**:
  ```bash
  npm run dev
  ```
  Open `http://localhost:3000` in your browser.
* **Hosted Cloud Version**:
  Visit [https://photonow.vercel.app/](https://photonow.vercel.app/)

---

### How to Navigate Local Files in the Web UI

Because web browsers enforce security sandboxes, a website hosted on the cloud cannot silently read files from your computer's `C:\` drive without your interaction.

Here is how you navigate files depending on your mode:

1. **When running locally (`http://localhost:3000`)**:
   - The Next.js server runs on your machine and has direct filesystem access.
   - In the **`Project / Directory Target:`** box, type any folder path:
     - `.` (current project root)
     - `./public` (public static assets)
     - `tests/fixtures/nextjs_project` (or click **`[Demo Fixture]`**)
     - `C:/Users/username/Projects/my-app` (any external project on your computer)
2. **When using the hosted cloud version (`photonow.vercel.app`)**:
   - Click **`[Demo Fixture]`** to test against the realistic built-in Next.js demo fixture.
   - Or go to **`[4. TEST URL]`** and enter any live website or local dev server URL (`http://localhost:3000` or `https://my-site.com`).

---

### Step-by-Step Walkthrough of the 7 Performance Sub-Tabs

Open the **`[PERFORMANCE]`** tab in the top navigation header:

#### 1. `[1. MEDIA AUDIT]` (5-Axis Health Score)
* **Goal**: Measure your media quality and find bottlenecks.
* **How to use**:
  1. Set your target directory (e.g., `tests/fixtures/nextjs_project` or `.`).
  2. Click **`[RUN MEDIA AUDIT NOW ➔]`**.
  3. View the **PhotoNow Score (0–100)** broken down into:
     - Format Efficiency (25 pts)
     - Image Sizing (25 pts)
     - Compression (20 pts)
     - Responsive Readiness (15 pts)
     - SVG Efficiency (15 pts)
  4. Review categorized issues: `OVERSIZED_IMAGE`, `INEFFICIENT_FORMAT`, `DUPLICATE_ASSET`, `POTENTIAL_LCP_ASSET`.

#### 2. `[2. ASSET GRAPH & UNUSED]` (Dead Asset Triage)
* **Goal**: Find unreferenced images wasting space, and identify shared images used across multiple pages.
* **How to use**:
  1. Click **`[2. ASSET GRAPH & UNUSED]`**.
  2. Inspect the **Unused Assets** list classified by safety tier:
     - `[SAFE]`: 0 references across all `.tsx`, `.jsx`, `.html`, `.css`, and config files. Safe to archive or delete!
     - `[LIKELY]`: No direct references found, but matches dynamic patterns (e.g. `icon-${name}.png`).
     - `[UNCERTAIN]`: Ambiguous references.
  3. Inspect **Shared Assets Across Routes**: Assets used in multiple pages where aggressive downscaling might affect other layouts.

#### 3. `[3. BUDGETS]` (Performance Budget Guard)
* **Goal**: Enforce performance limits for page weight, hero image size, and LCP.
* **How to use**:
  1. Click **`[3. BUDGETS]`**.
  2. Click **`[EVALUATE BUDGET]`**.
  3. Check pass/fail status for:
     - Total Page Media Payload (<500 KB)
     - Single Hero Asset Size (<150 KB)
     - LCP Latency (<2.5s)
     - Modern Format Adoption (>80%)

#### 4. `[4. TEST URL]` (Live Website & Dev Server Auditor)
* **Goal**: Audit any live URL or local dev server (`http://localhost:3000`).
* **How to use**:
  1. Enter a URL (e.g., `http://localhost:3000` or `https://news.ycombinator.com`).
  2. Click **`[RUN AUDIT]`**.
  3. Inspect the total payload, **LCP candidate identification**, and **simulated 4G mobile transfer latency**.

#### 5. `[5. PLAN]` (Optimization Planner)
* **Goal**: Formulate non-destructive optimization action items.
* **How to use**:
  1. Click **`[GENERATE OPTIMIZATION PLAN]`**.
  2. Inspect generated actions (WebP/AVIF conversions, downscaling to 1920px max dimension).
  3. Review estimated savings before executing.

#### 6. `[6. BEFORE/AFTER]` (Visual Fidelity Diff Slider)
* **Goal**: Verify visual quality before committing changes.
* **How to use**:
  1. Select an image from the dropdown.
  2. Drag the split slider across the image to compare the original image against the compressed output.
  3. Inspect edge sharpness, compression artifacts, and exact byte drop.

#### 7. `[⚡ AUTONOMOUS MISSION]` (1-Click Autonomous Loop)
* **Goal**: Run the complete 10-step optimization loop (`DISCOVER ➔ UNDERSTAND ➔ ANALYZE ➔ MEASURE ➔ DIAGNOSE ➔ PLAN ➔ PATCH ➔ OPTIMIZE ➔ VERIFY ➔ REPORT`).
* **How to use**:
  1. Click **`[1. RUN DRY-RUN PREVIEW]`** for a safe simulation without modifying files.
  2. Click **`[2. EXECUTE FULL AUTONOMOUS MISSION]`** to apply optimizations, patch source code `<Image>` tags, and generate an atomic rollback manifest.

---

### Ingesting Media in the Offline Media Studio

If you simply want to convert images, extract audio, or transcode video:

1. **`[PHOTO CONVERT]`**:
   - Drag & drop photos into the dashed box (or click to browse).
   - Choose target format (`WEBP`, `AVIF`, `PNG`, `JPEG`, `BMP`).
   - Toggle **Monochrome Ink Sketch** for the hand-drawn comic shader.
   - Adjust quality and scale, then click **`CONVERT NOW ➔`**.
2. **`[VIDEO & AUDIO]`**:
   - Drag & drop video files (`.mp4`, `.mov`, `.webm`, `.mkv`).
   - Choose **Transcode Video**, **Extract Audio (WAV/MP3)**, or **Capture Poster Frame**.
3. **`[STORAGE]`**:
   - View your conversions stored offline in browser **IndexedDB**.
   - Download individual files or click **`[DOWNLOAD ALL (.ZIP)]`**.

---

## Part 2: How to Work with PhotoNow as an AI Agent (MCP)

PhotoNow is built from the ground up for **AI Coding Agents**. It exposes **29 specialized MCP tools** over JSON-RPC 2.0.

### Step 1: Connect PhotoNow to Your AI Assistant

#### Option A: Claude Desktop
Add this to your `claude_desktop_config.json` (on Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "photoNow": {
      "command": "node",
      "args": [
        "C:/Users/sibas/OneDrive/Desktop/Projects/photoNow/bin/mcp-server.mjs"
      ]
    }
  }
}
```

#### Option B: Google Antigravity
Add this to your `C:\Users\sibas\.gemini\antigravity-ide\mcp_config.json`:

```json
{
  "mcpServers": {
    "photoNow": {
      "command": "node",
      "args": [
        "C:/Users/sibas/OneDrive/Desktop/Projects/photoNow/bin/mcp-server.mjs"
      ]
    }
  }
}
```

#### Option C: Remote / Cloud HTTP JSON-RPC
If your agent supports HTTP SSE / JSON-RPC transports:

```json
{
  "mcpServers": {
    "photoNow": {
      "url": "https://photonow.vercel.app/api/mcp",
      "transport": "http"
    }
  }
}
```

---

### Complete 29-Tool MCP Reference Catalog

#### Layer 1: Multimedia Processing Foundation (8 Tools)
| Tool | What It Does |
| :--- | :--- |
| `convert_image` | Converts, resizes, rotates, or applies ink sketch filter to an image. |
| `convert_batch` | Batch folder image conversion with recursion filters. |
| `convert_video` | Transcodes video to WebM or MP4 with bitrate and resolution scaling. |
| `extract_audio` | Extracts audio track from video to 16-bit uncompressed WAV or MP3. |
| `convert_audio` | Transcodes audio between WAV, MP3, AAC, FLAC, and OGG. |
| `extract_poster_frame` | Captures a poster snapshot frame from video at an exact timestamp. |
| `get_media_info` | Unified metadata inspector for images, video, and audio files. |
| `optimize_for_agent` | Downscales UI screenshots to compact WebP for vision LLMs. |

#### Layer 2: Website Performance Intelligence (12 Tools)
| Tool | What It Does |
| :--- | :--- |
| `analyze_media` | Single asset diagnostic scan with issue classification and potential savings. |
| `analyze_web_assets` | Project-wide media scan, 5-axis score, and top bottlenecks. |
| `find_oversized_assets` | Locates images whose dimensions or file sizes exceed web thresholds. |
| `find_inefficient_formats` | Discovers photographic PNGs, legacy JPEGs, and uncompressed GIFs. |
| `find_duplicate_assets` | Identifies exact and perceptual duplicate assets (>93% similarity via dHash). |
| `find_responsive_opportunities` | Discovers large images lacking responsive breakpoint variants. |
| `test_web_performance` | Audits a web project directory or local URL, estimates 4G transfer, finds LCP candidates. |
| `get_web_performance_summary` | Retrieves compact summary of a previous audit using `testId`. |
| `compare_web_performance` | Compares before-and-after performance metrics across two test runs. |
| `generate_optimization_plan` | Builds an action plan (`planId`) with impact ratings and estimated byte savings. |
| `optimize_web_assets` | Executes an optimization plan with safe non-destructive defaults. |
| `verify_optimization` | Measures post-optimization metrics, verifies savings, and generates offline reports. |

#### Layer 3: Agentic Performance Engineering (9 Master Tools)
| Tool | What It Does |
| :--- | :--- |
| `inspect_project` | Scans project structure, framework, routes, media roots, and source references. |
| `get_asset_usage` | Returns full reference chain (`Route ➔ Component ➔ SourceFile`) and LCP status for an asset. |
| `find_unused_assets` | Detects dead/unreferenced assets categorized by safety tier (`SAFE`, `LIKELY`, `UNCERTAIN`). |
| `check_performance_budget` | Evaluates project against performance budgets (page bytes, hero bytes, LCP). |
| `verify_runtime_performance` | Verifies runtime metrics (`OBSERVED` via browser or `SIMULATED` fallback). |
| `generate_source_patch` | Generates unified diffs to update source code (`<img>` ➔ `<Image>`, `.png` ➔ `.webp`). |
| `apply_source_patch` | Safely applies source patch with automated backups and rollback manifest generation. |
| `rollback_operation` | Atomically rolls back modified source files and assets using operation manifest. |
| `optimize_project` | Autonomous end-to-end mission executing the complete 10-step optimization loop. |

---

### Practical Agent Prompts & Workflows

Once connected in your AI assistant, you can give your agent high-level instructions:

#### Workflow 1: "Audit My Project's Performance"
> **Prompt**: *"Use PhotoNow to inspect this project. Check our media score, find any images hurting our Largest Contentful Paint (LCP), and summarize the top 3 bottlenecks."*

**What the agent does**:
1. Calls `inspect_project({ projectPath: "." })`.
2. Calls `analyze_web_assets({ directoryPath: "." })`.
3. Calls `test_web_performance({ localPath: "." })`.
4. Returns a compact summary with exact byte savings and LCP candidate.

---

#### Workflow 2: "Find and Safely Remove Dead Images"
> **Prompt**: *"Check our public directory for dead or unused images. Only list assets that are 100% SAFE to remove."*

**What the agent does**:
1. Calls `find_unused_assets({ projectPath: "." })`.
2. Filters by `confidence === 'SAFE'`.
3. Reports the exact paths and recovered disk space.

---

#### Workflow 3: "Run an Autonomous Optimization Mission (Dry-Run)"
> **Prompt**: *"Run an autonomous optimization mission on tests/fixtures/nextjs_project in dry-run mode. Show me the unified diffs and projected bandwidth savings."*

**What the agent does**:
1. Calls `optimize_project({ projectPath: "tests/fixtures/nextjs_project", dryRun: true })`.
2. Calls `generate_source_patch({ projectPath: "tests/fixtures/nextjs_project" })`.
3. Returns the unified diffs showing `<Image src="/hero_banner.png" ...>` ➔ `<Image src="/hero_banner.avif" ...>`.

---

#### Workflow 4: "Execute Optimization and Patch Code"
> **Prompt**: *"Execute the optimization mission on my project. Convert photographic PNGs to WebP/AVIF, patch the source code, and verify that the performance budget passes."*

**What the agent does**:
1. Calls `optimize_project({ projectPath: ".", dryRun: false, applySourcePatches: true })`.
2. Original files are backed up automatically to `.photonow/backups/[operationId]/`.
3. Transcodes media and updates source code references.
4. Calls `check_performance_budget({ targetPath: "." })`.
5. If anything is amiss, the agent can call `rollback_operation({ operationId: "..." })` to revert in 1 second.

---

## Part 3: Architecture & Safety Guarantees

PhotoNow is engineered specifically to prevent developer headaches:

1. **Strict Non-Destructive Defaults**: Optimizations never blindly destroy original assets. Default output goes to `.photonow/optimized/`.
2. **Atomic Backups**: Source patching always creates pre-patch copies in `.photonow/backups/[operationId]/` before modifying a single line of code.
3. **Decodability Checks**: Every transformed image is passed back through Sharp’s native image decoder. If an output file is unreadable or corrupted, it is aborted immediately.
4. **Token Economy**: Responses default to `compact` (< 200 tokens) with deterministic `nextAction` state machine chaining, preventing AI context window exhaustion.

---

## Part 4: Running Verification Tests

To verify that both the MCP Server and the UI Backend are functioning properly on your system, run:

```bash
# 1. Run all unit tests for agentic intelligence (7 suites)
node tests/unit/test-agentic-intelligence.mjs

# 2. Run end-to-end autonomous mission tests (dry-run, patching, rollback)
node tests/test-autonomous-mission.mjs

# 3. Test all 29 tools over stdio MCP JSON-RPC 2.0
node tests/test-mcp-server.mjs

# 4. Run defensive security & usability tests (11/11 tests)
node tests/test-usability-security.mjs

# 5. Run performance benchmark suite
node tests/benchmark.mjs
```

All 5 test suites will output **100% PASSING** with 0 errors!
