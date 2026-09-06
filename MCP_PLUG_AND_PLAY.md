# PhotoNow MCP: Zero-Permission Plug & Use Setup

> **No more approving 10 permission prompts just to convert photos.**

Previously, AI agents had to execute multiple raw PowerShell/shell commands (`Get-Content`, `Invoke-RestMethod`, byte converters, disk writers) to convert an image, triggering a confirmation prompt for every single operation.

With the **PhotoNow Native Stdio MCP Server**, the agent interacts with **native tools** (`convert_image`, `convert_batch`, `get_media_info`, `optimize_for_agent`) directly on your local filesystem using ultra-fast native `sharp` (libvips).

---

## 1. Zero-Permission Setup by Client

### A. Antigravity IDE
The server is already configured in your global MCP config: `~/.gemini/config/mcp_config.json`.

```json
{
  "mcpServers": {
    "photoConvert": {
      "command": "node",
      "args": [
        "c:/Users/sibas/OneDrive/Desktop/Projects/photoConvert/bin/mcp-server.mjs"
      ]
    }
  }
}
```
**Result**: In any Antigravity conversation, simply ask:
> *"Convert `c:/path/to/image.png` to WebP"*
> *"Batch convert all photos in `c:/path/to/my-folder` to WebP at 85% quality"*

The agent calls the tool directly — **zero shell scripts, zero repetitive prompts**.

---

### B. Claude Desktop
Add this to your Claude Desktop configuration file:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "photoConvert": {
      "command": "node",
      "args": [
        "c:/Users/sibas/OneDrive/Desktop/Projects/photoConvert/bin/mcp-server.mjs"
      ]
    }
  }
}
```

> [!TIP]
> **Prompt-Free Experience in Claude Desktop**:
> When Claude Desktop first calls `convert_image` or `convert_batch`, click **"Always Allow"** for `photoConvert`. From then on, Claude will convert single images and entire directories without ever interrupting you!

---

### C. Cursor IDE
1. Open Cursor Settings -> **Features** -> **MCP**.
2. Click **+ Add New MCP Server**.
3. Fill in:
   - **Name**: `photoConvert`
   - **Type**: `command`
   - **Command**: `node c:/Users/sibas/OneDrive/Desktop/Projects/photoConvert/bin/mcp-server.mjs`

Alternatively, add it directly to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "photoConvert": {
      "command": "node",
      "args": [
        "c:/Users/sibas/OneDrive/Desktop/Projects/photoConvert/bin/mcp-server.mjs"
      ]
    }
  }
}
```

---

### D. Claude Code (CLI)
Run in terminal:
```bash
claude mcp add photoConvert node c:/Users/sibas/OneDrive/Desktop/Projects/photoConvert/bin/mcp-server.mjs
```

---

## 2. Tools Available to the Agent (7 Multimedia Tools)

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `convert_image` | `inputPath`, `outputPath?`, `format?`, `quality?`, `maxWidth?`, `maxHeight?`, `rotate?`, `grayscale?` | Converts a single image on disk with optional resizing and compression. |
| `convert_batch` | `directoryPath` or `inputPaths`, `outputDir?`, `format?`, `quality?`, `recursive?` | **Converts an entire folder in a single tool call.** |
| `extract_audio` | `inputPath`, `outputFormat?`, `outputPath?`, `bitrate?`, `channels?` | **Extracts audio tracks from videos** (.mp4, .mov, .mkv, .webm) to MP3, WAV, AAC, FLAC, OGG. |
| `convert_video` | `inputPath`, `format?`, `outputPath?`, `preset?`, `crf?`, `maxWidth?`, `maxHeight?`, `muteAudio?` | **Transcodes & compresses video** containers and codecs with CRF quality control. |
| `convert_audio` | `inputPath`, `format?`, `outputPath?`, `bitrate?`, `sampleRate?` | **Converts standalone audio** between MP3, WAV, AAC, M4A, FLAC, and OGG. |
| `get_media_info` | `filePath` | **Unified metadata inspector** for images (Sharp), video & audio (FFprobe). |
| `optimize_for_agent`| `inputPath`, `outputPath?`, `maxDimension?` | Compresses heavy screenshots down to token-friendly WebP for LLM vision context windows. |

---

## 3. Example Prompts You Can Give Any Agent

- **Audio Extraction**:
  > *"Extract the audio from `c:/Users/me/Videos/interview.mp4` as MP3 at 192k"*
- **Video Transcode & Compression**:
  > *"Convert `c:/Users/me/Videos/screen_recording.mov` to MP4 with CRF 24 and max width 1280"*
- **Standalone Audio Conversion**:
  > *"Convert `c:/Users/me/Music/podcast.wav` to MP3 at 128k"*
- **Media Inspection**:
  > *"Inspect `c:/Users/me/Videos/clip.webm` and tell me its duration, resolution, fps, and codecs"*
- **Single Image Conversion**:
  > *"Convert `c:/Users/me/Pictures/banner.png` to WebP at 80% quality"*
- **Batch Image Conversion**:
  > *"Convert all images in `c:/Users/me/Downloads/receipts` to WebP and save them in a new `optimized` subfolder"*
- **Resolution Downscale**:
  > *"Resize `c:/photos/4k_photo.jpg` to max width 1920 and convert to AVIF"*
- **LLM Token Optimization**:
  > *"Optimize this screenshot for your vision model: `c:/screenshots/bug.png`"*

---

## 4. Verifying Your Setup Anytime

Run the built-in automated test suite:
```bash
npm test
```
All 7 multimedia tools (images, video, and audio) and security boundaries are exercised and verified automatically.
