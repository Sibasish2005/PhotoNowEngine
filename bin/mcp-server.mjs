#!/usr/bin/env node

/**
 * PhotoNow Standalone Multimedia MCP Server (Stdio Transport)
 *
 * Plug-and-play Model Context Protocol tool server for local media conversions:
 * Images (WebP, PNG, JPEG, AVIF), Video (MP4, WebM, MKV, MOV), and Audio (MP3, WAV, AAC, M4A, FLAC, OGG).
 * Works seamlessly with Antigravity IDE, Claude Desktop, Cursor, and other MCP clients.
 * Zero external setup: bundles self-contained static FFmpeg/FFprobe binaries & native Sharp.
 * Zero shell command approvals required by the user during agent conversations.
 *
 * Hardened with enterprise usability standards and defensive security guards.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

// PhotoNow Core Performance Intelligence & Optimization Engine
import { analyzeSingleMediaAsset, analyzeWebAssets } from '../lib/engine/analyzer.mjs';
import { testWebPerformance, comparePerformanceTests } from '../lib/engine/performanceTester.mjs';
import { generateOptimizationPlan, executeOptimizationPlan, verifyOptimization } from '../lib/engine/booster.mjs';
import { groupDuplicates } from '../lib/engine/perceptualHash.mjs';
import { formatMcpResponse } from '../lib/engine/tokenEconomy.mjs';
import { engineCache } from '../lib/engine/cache.mjs';
import { saveLocalReport } from '../lib/engine/reporting.mjs';
import { scanProjectStructure } from '../lib/engine/projectScanner.mjs';
import { scanProjectSourceReferences } from '../lib/engine/sourceAnalyzer.mjs';
import { buildAssetGraph } from '../lib/engine/assetGraph.mjs';
import { generateSourcePatch, applySourcePatch, rollbackOperation } from '../lib/engine/patchGenerator.mjs';
import { verifyRuntimePerformance } from '../lib/engine/browserVerifier.mjs';
import { evaluatePerformanceBudget, loadProjectBudget } from '../lib/engine/budget.mjs';
import { optimizeProject } from '../lib/engine/mission.mjs';

// Initialize bundled static binary paths for zero external setup
const ffmpegPath = ffmpegInstaller.path || ffmpegInstaller.default?.path;
const ffprobePath = ffprobeInstaller.path || ffprobeInstaller.default?.path;
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
if (ffprobePath) ffmpeg.setFfprobePath(ffprobePath);

// Initialize server
const server = new McpServer({
  name: 'photo-convert-mcp',
  version: '2.0.0',
});

// Supported input extensions
const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.tif', '.bmp', '.gif', '.svg'
]);
const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.webm', '.mkv', '.mov', '.avi', '.flv', '.wmv', '.m4v', '.3gp', '.ts'
]);
const AUDIO_EXTENSIONS = new Set([
  '.mp3', '.wav', '.aac', '.m4a', '.flac', '.ogg', '.wma', '.opus', '.aiff'
]);

// Allowed output extensions (strict whitelist to prevent arbitrary file overwrite)
const ALLOWED_OUTPUT_EXTENSIONS = new Set([
  // Images
  '.webp', '.png', '.jpg', '.jpeg', '.avif',
  // Video
  '.mp4', '.webm', '.mkv', '.mov',
  // Audio
  '.mp3', '.wav', '.aac', '.m4a', '.flac', '.ogg'
]);

// Directories to skip during batch scans
const IGNORED_DIRECTORIES = new Set([
  '.git', 'node_modules', '.next', 'dist', 'build', '.vscode', '.idea',
  'system volume information', '$recycle.bin', 'appdata', '.cache'
]);

// Maximum safety limits
const MAX_IMAGE_FILE_BYTES = 250 * 1024 * 1024; // 250 MB
const MAX_VIDEO_FILE_BYTES = 2048 * 1024 * 1024; // 2 GB
const MAX_INPUT_PIXELS = 100_000_000;           // 100 MegaPixels (~10,000 x 10,000 px)
const MAX_BATCH_FILES = 1000;                    // Maximum images in a single batch scan
const MAX_SCAN_DEPTH = 6;                        // Maximum folder recursion depth

/**
 * Clean and resolve file paths safely:
 * - Strips leading/trailing quotes (single & double) commonly output by LLMs
 * - Expands home directory (~) across platforms
 * - Resolves relative paths to absolute
 */
function resolvePath(filePath) {
  if (!filePath || typeof filePath !== 'string') return '';
  let cleaned = filePath.trim();
  // Strip surrounding quotes
  cleaned = cleaned.replace(/^["']+|["']+$/g, '').trim();
  if (cleaned.startsWith('~')) {
    cleaned = path.join(os.homedir(), cleaned.slice(1));
  }
  return path.resolve(cleaned);
}

/**
 * Security validator for destination output paths:
 * Prevents path traversal, arbitrary file writes (e.g. .exe, .bat, .json, .env),
 * and protection of sensitive system/user directories.
 */
function validateOutputPathSecurity(destinationPath) {
  const resolved = resolvePath(destinationPath);
  const ext = path.extname(resolved).toLowerCase();

  // 1. Strict extension check: MUST be an authorized media format
  if (!ALLOWED_OUTPUT_EXTENSIONS.has(ext)) {
    throw new Error(
      `Security violation: Output file must have an authorized media extension (${Array.from(ALLOWED_OUTPUT_EXTENSIONS).join(', ')}). Writing to '${ext || 'no-extension'}' is blocked.`
    );
  }

  // 2. Sensitive directory protection
  const normalized = resolved.toLowerCase().replace(/\\/g, '/');
  const sensitivePatterns = [
    '/.git/',
    '/.ssh/',
    '/.aws/',
    '/.gnupg/',
    '/node_modules/',
    '/windows/system32',
    '/etc/',
    '/bin/',
    '/sbin/',
    '/root/',
    '/var/',
    '/sys/',
    '/proc/',
  ];

  for (const pattern of sensitivePatterns) {
    if (normalized.includes(pattern) || normalized.startsWith(pattern.slice(1)) || normalized.endsWith(pattern.slice(0, -1))) {
      throw new Error(`Security violation: Writing to protected directory is strictly prohibited (${pattern}).`);
    }
  }

  // 3. Prevent overwriting hidden environment files (.env)
  const baseName = path.basename(resolved).toLowerCase();
  if (baseName.startsWith('.env')) {
    throw new Error('Security violation: Overwriting environment configuration files is strictly prohibited.');
  }

  return resolved;
}

/**
 * Format bytes into human-readable string
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Normalize quality parameter:
 * Supports both web standard decimal (0.1 - 1.0) and percentage integer (1 - 100).
 */
function normalizeQuality(rawQuality) {
  let q = Number(rawQuality);
  if (isNaN(q) || q <= 0) return 82;
  if (q <= 1.0) {
    return Math.round(q * 100);
  }
  return Math.min(Math.round(q), 100);
}

/**
 * Handle collision avoidance when overwrite = false
 */
function handleCollision(targetPath, overwrite) {
  if (overwrite || !fsSync.existsSync(targetPath)) {
    return targetPath;
  }
  const parsed = path.parse(targetPath);
  let counter = 1;
  let safePath = path.join(parsed.dir, `${parsed.name}_converted${parsed.ext}`);
  while (fsSync.existsSync(safePath)) {
    safePath = path.join(parsed.dir, `${parsed.name}_converted_${counter}${parsed.ext}`);
    counter++;
  }
  return safePath;
}

/**
 * Probe media file with ffprobe
 */
function probeMedia(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

/**
 * Perform conversion for a single image buffer/path to target output
 */
async function processSingleImage({
  inputBuffer,
  inputPath,
  outputPath,
  format = 'webp',
  quality = 82,
  maxWidth,
  maxHeight,
  rotate,
  grayscale = false,
  overwrite = false,
}) {
  const targetFormat = format.toLowerCase();
  const qualityNum = normalizeQuality(quality);

  let buffer = inputBuffer;
  let originalSizeBytes = 0;

  if (!buffer && inputPath) {
    const resolvedInput = resolvePath(inputPath);
    if (!fsSync.existsSync(resolvedInput)) {
      throw new Error(`Input file not found at: ${resolvedInput}`);
    }

    const stat = await fs.stat(resolvedInput);
    if (stat.isDirectory()) {
      throw new Error(
        `The path '${resolvedInput}' is a directory, not a single file. Please use the 'convert_batch' tool to convert directories.`
      );
    }

    if (stat.size > MAX_IMAGE_FILE_BYTES) {
      throw new Error(
        `File size (${formatBytes(stat.size)}) exceeds the maximum allowed limit of ${formatBytes(MAX_IMAGE_FILE_BYTES)}.`
      );
    }

    originalSizeBytes = stat.size;
    buffer = await fs.readFile(resolvedInput);
  } else if (buffer) {
    originalSizeBytes = buffer.length;
    if (originalSizeBytes > MAX_IMAGE_FILE_BYTES) {
      throw new Error(`Input buffer exceeds maximum allowed limit of ${formatBytes(MAX_IMAGE_FILE_BYTES)}.`);
    }
  }

  // Configure sharp pipeline with input pixel limits to prevent decompression bomb / DoS
  let pipeline = sharp(buffer, {
    limitInputPixels: MAX_INPUT_PIXELS,
    failOn: 'error',
  });

  const meta = await pipeline.metadata();

  // Rotation
  if (rotate === 90 || rotate === 180 || rotate === 270) {
    pipeline = pipeline.rotate(rotate);
  }

  // Downscale if requested
  if (maxWidth || maxHeight) {
    pipeline = pipeline.resize({
      width: maxWidth ? Math.min(Number(maxWidth), 16384) : undefined,
      height: maxHeight ? Math.min(Number(maxHeight), 16384) : undefined,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Grayscale
  if (grayscale) {
    pipeline = pipeline.grayscale();
  }

  // Target format settings
  let ext = `.${targetFormat}`;
  if (targetFormat === 'webp') {
    pipeline = pipeline.webp({ quality: qualityNum, effort: 4 });
  } else if (targetFormat === 'png') {
    pipeline = pipeline.png({ compressionLevel: 8 });
  } else if (targetFormat === 'jpeg' || targetFormat === 'jpg') {
    pipeline = pipeline.jpeg({ quality: qualityNum, mozjpeg: true });
    ext = '.jpg';
  } else if (targetFormat === 'avif') {
    pipeline = pipeline.avif({ quality: qualityNum, effort: 4 });
  } else {
    pipeline = pipeline.webp({ quality: qualityNum });
    ext = '.webp';
  }

  const outputBuffer = await pipeline.toBuffer();
  const outputSizeBytes = outputBuffer.length;
  const outMeta = await sharp(outputBuffer, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();

  // Determine output path
  let finalOutputPath = outputPath ? resolvePath(outputPath) : null;
  if (!finalOutputPath && inputPath) {
    const parsed = path.parse(resolvePath(inputPath));
    finalOutputPath = path.join(parsed.dir, `${parsed.name}${ext}`);
  }

  // Security validation on output path
  if (finalOutputPath) {
    validateOutputPathSecurity(finalOutputPath);
    finalOutputPath = handleCollision(finalOutputPath, overwrite);
    await fs.mkdir(path.dirname(finalOutputPath), { recursive: true });
    await fs.writeFile(finalOutputPath, outputBuffer);
  }

  const savedBytes = originalSizeBytes - outputSizeBytes;
  const percentSaved = originalSizeBytes > 0 ? ((savedBytes / originalSizeBytes) * 100).toFixed(1) : '0';

  return {
    success: true,
    inputPath: inputPath ? resolvePath(inputPath) : 'in-memory',
    outputPath: finalOutputPath,
    format: targetFormat,
    qualityApplied: qualityNum,
    originalSizeBytes,
    originalSizeFormatted: formatBytes(originalSizeBytes),
    convertedSizeBytes: outputSizeBytes,
    convertedSizeFormatted: formatBytes(outputSizeBytes),
    savedBytes,
    savedBytesFormatted: formatBytes(savedBytes),
    percentSaved: `${percentSaved}%`,
    dimensions: {
      width: outMeta.width || meta.width,
      height: outMeta.height || meta.height,
    },
  };
}

/**
 * Scan directory recursively or flat for image files with safety limits
 */
async function scanImages(dir, recursive = false, depth = 0) {
  if (depth > MAX_SCAN_DEPTH) return [];

  const results = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    return [];
  }

  for (const entry of entries) {
    if (results.length >= MAX_BATCH_FILES) break;

    const lowerName = entry.name.toLowerCase();
    if (IGNORED_DIRECTORIES.has(lowerName)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && recursive) {
      const sub = await scanImages(fullPath, recursive, depth + 1);
      results.push(...sub);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

/**
 * Perform video conversion, compression, and downscaling
 */
function processVideoConversion({
  inputPath,
  outputPath,
  format = 'mp4',
  preset = 'fast',
  crf = 23,
  maxWidth,
  maxHeight,
  muteAudio = false,
  overwrite = false,
}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const resolvedInput = resolvePath(inputPath);
    if (!fsSync.existsSync(resolvedInput)) {
      return reject(new Error(`Input file not found at: ${resolvedInput}`));
    }
    const stat = fsSync.statSync(resolvedInput);
    if (stat.isDirectory()) {
      return reject(new Error(`'${resolvedInput}' is a directory, not a video file.`));
    }
    if (stat.size > MAX_VIDEO_FILE_BYTES) {
      return reject(
        new Error(`Video file size (${formatBytes(stat.size)}) exceeds safety limit of ${formatBytes(MAX_VIDEO_FILE_BYTES)} burden.`)
      );
    }
    const originalSizeBytes = stat.size;

    let targetFormat = format.toLowerCase();
    let targetExt = `.${targetFormat}`;
    let finalOutputPath = outputPath ? resolvePath(outputPath) : null;
    if (!finalOutputPath) {
      const parsed = path.parse(resolvedInput);
      finalOutputPath = path.join(parsed.dir, `${parsed.name}${targetExt}`);
    }

    validateOutputPathSecurity(finalOutputPath);
    finalOutputPath = handleCollision(finalOutputPath, overwrite);
    fsSync.mkdirSync(path.dirname(finalOutputPath), { recursive: true });

    let command = ffmpeg(resolvedInput);

    if (targetFormat === 'mp4') {
      command.videoCodec('libx264');
      if (!muteAudio) command.audioCodec('aac');
      command.outputOptions(['-pix_fmt yuv420p', '-movflags +faststart']);
    } else if (targetFormat === 'webm') {
      command.videoCodec('libvpx-vp9');
      if (!muteAudio) command.audioCodec('libopus');
    } else if (targetFormat === 'mkv') {
      command.videoCodec('libx264');
      if (!muteAudio) command.audioCodec('aac');
    } else if (targetFormat === 'mov') {
      command.videoCodec('libx264');
      if (!muteAudio) command.audioCodec('aac');
      command.outputOptions(['-pix_fmt yuv420p']);
    }

    if (preset && ['ultrafast', 'fast', 'medium', 'slow'].includes(preset)) {
      command.outputOption(`-preset ${preset}`);
    }

    const clampedCrf = Math.max(18, Math.min(35, Number(crf) || 23));
    command.outputOption(`-crf ${clampedCrf}`);

    // Resolution downscale maintaining aspect ratio with even pixels
    if (maxWidth || maxHeight) {
      const w = maxWidth ? Math.min(Number(maxWidth), 7680) : -2;
      const h = maxHeight ? Math.min(Number(maxHeight), 4320) : -2;
      if (w > 0 && h > 0) {
        command.videoFilter(`scale='min(${w},iw)':'min(${h},ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`);
      } else if (w > 0) {
        command.videoFilter(`scale='min(${w},iw)':-2`);
      } else if (h > 0) {
        command.videoFilter(`scale=-2:'min(${h},ih)'`);
      }
    }

    if (muteAudio) {
      command.noAudio();
    }

    command
      .on('end', () => {
        try {
          const outStat = fsSync.statSync(finalOutputPath);
          const convertedSizeBytes = outStat.size;
          const savedBytes = originalSizeBytes - convertedSizeBytes;
          const percentSaved = originalSizeBytes > 0 ? ((savedBytes / originalSizeBytes) * 100).toFixed(1) : '0';
          const durationSeconds = (Date.now() - startTime) / 1000;

          resolve({
            success: true,
            inputPath: resolvedInput,
            outputPath: finalOutputPath,
            format: targetFormat,
            preset,
            crf: clampedCrf,
            audioMuted: muteAudio,
            originalSizeBytes,
            originalSizeFormatted: formatBytes(originalSizeBytes),
            convertedSizeBytes,
            convertedSizeFormatted: formatBytes(convertedSizeBytes),
            savedBytes,
            savedBytesFormatted: formatBytes(savedBytes),
            percentSaved: `${percentSaved}%`,
            duration: `${durationSeconds.toFixed(2)}s`,
          });
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        reject(new Error(`Video conversion failed: ${err.message}`));
      })
      .save(finalOutputPath);
  });
}

/**
 * Perform poster frame extraction from video
 */
function processPosterExtraction({
  inputPath,
  timestamp = 0.5,
  format = 'webp',
  outputPath,
  overwrite = false,
}) {
  return new Promise((resolve, reject) => {
    const resolvedInput = resolvePath(inputPath);
    if (!fsSync.existsSync(resolvedInput)) {
      return reject(new Error(`Input file not found at: ${resolvedInput}`));
    }
    const stat = fsSync.statSync(resolvedInput);
    if (stat.isDirectory()) {
      return reject(new Error(`'${resolvedInput}' is a directory, not a video file.`));
    }
    const fmt = format.toLowerCase();
    let finalOutputPath = outputPath ? resolvePath(outputPath) : null;
    if (!finalOutputPath) {
      const parsed = path.parse(resolvedInput);
      finalOutputPath = path.join(parsed.dir, `${parsed.name}_poster.${fmt}`);
    }
    validateOutputPathSecurity(finalOutputPath);
    finalOutputPath = handleCollision(finalOutputPath, overwrite);
    fsSync.mkdirSync(path.dirname(finalOutputPath), { recursive: true });

    ffmpeg(resolvedInput)
      .seekInput(Number(timestamp) || 0.5)
      .frames(1)
      .save(finalOutputPath)
      .on('end', () => {
        try {
          const outStat = fsSync.statSync(finalOutputPath);
          resolve({
            success: true,
            inputPath: resolvedInput,
            outputPath: finalOutputPath,
            timestamp: Number(timestamp) || 0.5,
            format: fmt,
            sizeBytes: outStat.size,
            sizeFormatted: formatBytes(outStat.size),
          });
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => reject(new Error(`Poster frame extraction failed: ${err.message}`)));
  });
}

/**
 * Perform audio extraction from video
 */
function processAudioExtraction({
  inputPath,
  outputFormat = 'mp3',
  outputPath,
  bitrate = '192k',
  channels = 2,
  overwrite = false,
}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const resolvedInput = resolvePath(inputPath);
    if (!fsSync.existsSync(resolvedInput)) {
      return reject(new Error(`Input file not found at: ${resolvedInput}`));
    }
    const stat = fsSync.statSync(resolvedInput);
    if (stat.isDirectory()) {
      return reject(new Error(`'${resolvedInput}' is a directory, not a video file.`));
    }
    const originalSizeBytes = stat.size;

    const fmt = outputFormat.toLowerCase();
    const targetExt = `.${fmt}`;
    let finalOutputPath = outputPath ? resolvePath(outputPath) : null;
    if (!finalOutputPath) {
      const parsed = path.parse(resolvedInput);
      finalOutputPath = path.join(parsed.dir, `${parsed.name}${targetExt}`);
    }

    validateOutputPathSecurity(finalOutputPath);
    finalOutputPath = handleCollision(finalOutputPath, overwrite);
    fsSync.mkdirSync(path.dirname(finalOutputPath), { recursive: true });

    let command = ffmpeg(resolvedInput).noVideo();

    if (fmt === 'mp3') {
      command.audioCodec('libmp3lame');
      if (bitrate) command.audioBitrate(bitrate);
    } else if (fmt === 'wav') {
      command.audioCodec('pcm_s16le');
    } else if (fmt === 'aac' || fmt === 'm4a') {
      command.audioCodec('aac');
      if (bitrate) command.audioBitrate(bitrate);
    } else if (fmt === 'flac') {
      command.audioCodec('flac');
    } else if (fmt === 'ogg') {
      command.audioCodec('libvorbis');
      if (bitrate) command.audioBitrate(bitrate);
    }

    if (channels) {
      command.audioChannels(Number(channels) === 1 ? 1 : 2);
    }

    command
      .on('end', () => {
        try {
          const outStat = fsSync.statSync(finalOutputPath);
          const convertedSizeBytes = outStat.size;
          const durationSeconds = (Date.now() - startTime) / 1000;

          resolve({
            success: true,
            inputPath: resolvedInput,
            outputPath: finalOutputPath,
            format: fmt,
            bitrate: fmt === 'wav' || fmt === 'flac' ? 'lossless' : bitrate,
            channels: Number(channels) === 1 ? 'mono' : 'stereo',
            originalSizeBytes,
            originalSizeFormatted: formatBytes(originalSizeBytes),
            convertedSizeBytes,
            convertedSizeFormatted: formatBytes(convertedSizeBytes),
            duration: `${durationSeconds.toFixed(2)}s`,
          });
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        reject(new Error(`Audio extraction failed: ${err.message}`));
      })
      .save(finalOutputPath);
  });
}

/**
 * Perform audio-to-audio conversion
 */
function processAudioConversion({
  inputPath,
  format = 'mp3',
  outputPath,
  bitrate = '192k',
  sampleRate,
  overwrite = false,
}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const resolvedInput = resolvePath(inputPath);
    if (!fsSync.existsSync(resolvedInput)) {
      return reject(new Error(`Input file not found at: ${resolvedInput}`));
    }
    const stat = fsSync.statSync(resolvedInput);
    if (stat.isDirectory()) {
      return reject(new Error(`'${resolvedInput}' is a directory, not an audio file.`));
    }
    const originalSizeBytes = stat.size;

    const fmt = format.toLowerCase();
    const targetExt = `.${fmt}`;
    let finalOutputPath = outputPath ? resolvePath(outputPath) : null;
    if (!finalOutputPath) {
      const parsed = path.parse(resolvedInput);
      finalOutputPath = path.join(parsed.dir, `${parsed.name}${targetExt}`);
    }

    validateOutputPathSecurity(finalOutputPath);
    finalOutputPath = handleCollision(finalOutputPath, overwrite);
    fsSync.mkdirSync(path.dirname(finalOutputPath), { recursive: true });

    let command = ffmpeg(resolvedInput).noVideo();

    if (fmt === 'mp3') {
      command.audioCodec('libmp3lame');
      if (bitrate) command.audioBitrate(bitrate);
    } else if (fmt === 'wav') {
      command.audioCodec('pcm_s16le');
    } else if (fmt === 'aac' || fmt === 'm4a') {
      command.audioCodec('aac');
      if (bitrate) command.audioBitrate(bitrate);
    } else if (fmt === 'flac') {
      command.audioCodec('flac');
    } else if (fmt === 'ogg') {
      command.audioCodec('libvorbis');
      if (bitrate) command.audioBitrate(bitrate);
    }

    if (sampleRate) {
      command.audioFrequency(Number(sampleRate));
    }

    command
      .on('end', () => {
        try {
          const outStat = fsSync.statSync(finalOutputPath);
          const convertedSizeBytes = outStat.size;
          const savedBytes = originalSizeBytes - convertedSizeBytes;
          const percentSaved = originalSizeBytes > 0 ? ((savedBytes / originalSizeBytes) * 100).toFixed(1) : '0';
          const durationSeconds = (Date.now() - startTime) / 1000;

          resolve({
            success: true,
            inputPath: resolvedInput,
            outputPath: finalOutputPath,
            format: fmt,
            bitrate: fmt === 'wav' || fmt === 'flac' ? 'lossless' : bitrate,
            sampleRate: sampleRate ? `${sampleRate} Hz` : 'source-default',
            originalSizeBytes,
            originalSizeFormatted: formatBytes(originalSizeBytes),
            convertedSizeBytes,
            convertedSizeFormatted: formatBytes(convertedSizeBytes),
            savedBytes,
            savedBytesFormatted: formatBytes(savedBytes),
            percentSaved: `${percentSaved}%`,
            duration: `${durationSeconds.toFixed(2)}s`,
          });
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        reject(new Error(`Audio conversion failed: ${err.message}`));
      })
      .save(finalOutputPath);
  });
}

// ==========================================
// TOOL 1: convert_image (Single File)
// ==========================================
server.tool(
  'convert_image',
  {
    inputPath: z.string().describe('Path to image file to convert (e.g. C:/photos/pic.png or ~/images/doc.jpg). Quotes will be automatically cleaned.'),
    outputPath: z.string().optional().describe('Optional destination path for converted file (.webp, .png, .jpg, .avif). Defaults to same folder as original.'),
    format: z.enum(['webp', 'png', 'jpeg', 'avif']).default('webp').describe('Output image format (default: webp)'),
    quality: z.number().min(0.01).max(100).default(82).describe('Compression quality: can be percentage 1-100 or decimal 0.1-1.0 (default: 82)'),
    maxWidth: z.number().optional().describe('Maximum width in pixels (aspect ratio locked)'),
    maxHeight: z.number().optional().describe('Maximum height in pixels (aspect ratio locked)'),
    rotate: z.number().optional().describe('Rotate clockwise degrees: 90, 180, 270'),
    grayscale: z.boolean().default(false).describe('Convert image to grayscale'),
    overwrite: z.boolean().default(false).describe('Overwrite output file if it already exists'),
  },
  async (args) => {
    try {
      const result = await processSingleImage(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'success',
                message: `Successfully converted ${path.basename(result.inputPath)} to ${result.format.toUpperCase()} at ${result.qualityApplied}% quality (${result.percentSaved} size reduction)`,
                details: result,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Image conversion error: ${err.message}`,
          },
        ],
      };
    }
  }
);

// ==========================================
// TOOL 2: convert_batch (Batch Folder / Files)
// ==========================================
server.tool(
  'convert_batch',
  {
    directoryPath: z.string().optional().describe('Directory path containing images to batch convert (e.g. C:/photos or ./screenshots)'),
    inputPaths: z.array(z.string()).optional().describe('Explicit array of file paths to convert'),
    outputDir: z.string().optional().describe('Target folder to save converted files. Defaults to same folder as each original.'),
    format: z.enum(['webp', 'png', 'jpeg', 'avif']).default('webp').describe('Target image format (default: webp)'),
    quality: z.number().min(0.01).max(100).default(82).describe('Compression quality: 1-100 or 0.1-1.0 (default: 82)'),
    recursive: z.boolean().default(false).describe('If scanning directoryPath, whether to scan nested subfolders (skips node_modules/.git automatically)'),
    maxWidth: z.number().optional().describe('Optional maximum width in pixels for downscaling'),
    maxHeight: z.number().optional().describe('Optional maximum height in pixels for downscaling'),
    grayscale: z.boolean().default(false).describe('Convert images to grayscale'),
    overwrite: z.boolean().default(false).describe('Overwrite existing destination files'),
  },
  async (args) => {
    try {
      let fileList = [];

      if (args.inputPaths && Array.isArray(args.inputPaths) && args.inputPaths.length > 0) {
        fileList = args.inputPaths.map(resolvePath);
      } else if (args.directoryPath) {
        const resolvedDir = resolvePath(args.directoryPath);
        if (!fsSync.existsSync(resolvedDir)) {
          throw new Error(`Directory not found: ${resolvedDir}`);
        }
        fileList = await scanImages(resolvedDir, args.recursive);
      } else {
        throw new Error('Either directoryPath or inputPaths must be provided for batch conversion.');
      }

      if (fileList.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'warning',
                  message: 'No supported images (.png, .jpg, .webp, .avif, .bmp, .tiff) found in the specified location.',
                  scannedFilesCount: 0,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const results = [];
      let totalOriginalBytes = 0;
      let totalConvertedBytes = 0;
      let succeededCount = 0;
      let failedCount = 0;

      if (args.outputDir) {
        const resolvedOutDir = resolvePath(args.outputDir);
        await fs.mkdir(resolvedOutDir, { recursive: true });
      }

      for (const filePath of fileList) {
        try {
          let customOutput = null;
          if (args.outputDir) {
            const parsed = path.parse(filePath);
            customOutput = path.join(resolvePath(args.outputDir), `${parsed.name}.${args.format}`);
          }

          const res = await processSingleImage({
            inputPath: filePath,
            outputPath: customOutput,
            format: args.format,
            quality: args.quality,
            maxWidth: args.maxWidth,
            maxHeight: args.maxHeight,
            grayscale: args.grayscale,
            overwrite: args.overwrite,
          });

          totalOriginalBytes += res.originalSizeBytes;
          totalConvertedBytes += res.convertedSizeBytes;
          succeededCount++;
          results.push(res);
        } catch (itemErr) {
          failedCount++;
          results.push({
            success: false,
            inputPath: filePath,
            error: itemErr.message,
          });
        }
      }

      const totalSaved = totalOriginalBytes - totalConvertedBytes;
      const totalSavedPercent = totalOriginalBytes > 0
        ? ((totalSaved / totalOriginalBytes) * 100).toFixed(1)
        : '0';

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'success',
                message: `Batch conversion complete: ${succeededCount} succeeded, ${failedCount} failed. Saved ${formatBytes(totalSaved)} (${totalSavedPercent}%).`,
                summary: {
                  totalScanned: fileList.length,
                  succeeded: succeededCount,
                  failed: failedCount,
                  totalOriginalSize: formatBytes(totalOriginalBytes),
                  totalConvertedSize: formatBytes(totalConvertedBytes),
                  totalSaved: formatBytes(totalSaved),
                  totalSavedPercent: `${totalSavedPercent}%`,
                },
                conversions: results,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Batch conversion error: ${err.message}`,
          },
        ],
      };
    }
  }
);

// ==========================================
// TOOL 3: extract_audio (NEW: Video -> Audio)
// ==========================================
server.tool(
  'extract_audio',
  {
    inputPath: z.string().describe('Path to the video file (.mp4, .mov, .mkv, .webm, .avi, etc.). Quotes cleaned automatically.'),
    outputFormat: z.enum(['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg']).default('mp3').describe('Target audio format (default: mp3)'),
    outputPath: z.string().optional().describe('Destination file path. Defaults to original name & folder with new audio extension.'),
    bitrate: z.string().default('192k').describe('Audio bitrate for lossy formats (e.g. 128k, 192k, 320k)'),
    channels: z.number().min(1).max(2).default(2).describe('Number of audio channels: 1 (mono) or 2 (stereo, default)'),
    overwrite: z.boolean().default(false).describe('Overwrite destination file if it already exists'),
  },
  async (args) => {
    try {
      const result = await processAudioExtraction(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'success',
                message: `Successfully extracted ${result.format.toUpperCase()} audio (${result.channels}, ${result.bitrate}) from ${path.basename(result.inputPath)} in ${result.duration}`,
                details: result,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Audio extraction error: ${err.message}` }],
      };
    }
  }
);

// ==========================================
// TOOL 4: convert_video (NEW: Video Transcode/Compress)
// ==========================================
server.tool(
  'convert_video',
  {
    inputPath: z.string().describe('Path to source video file (.mp4, .mov, .mkv, .webm, .avi, etc.)'),
    format: z.enum(['mp4', 'webm', 'mkv', 'mov']).default('mp4').describe('Target video container format (default: mp4)'),
    outputPath: z.string().optional().describe('Optional destination path. Defaults to same name and directory with new video extension.'),
    preset: z.enum(['ultrafast', 'fast', 'medium', 'slow']).default('fast').describe('Encoding speed/compression preset (default: fast)'),
    crf: z.number().min(18).max(35).default(23).describe('Constant Rate Factor: lower = higher quality, 18-28 recommended (default: 23)'),
    maxWidth: z.number().optional().describe('Optional max width in pixels (aspect ratio strictly preserved)'),
    maxHeight: z.number().optional().describe('Optional max height in pixels (aspect ratio strictly preserved)'),
    muteAudio: z.boolean().default(false).describe('Strip audio track from the video if true (default: false)'),
    overwrite: z.boolean().default(false).describe('Overwrite existing destination file if present'),
  },
  async (args) => {
    try {
      const result = await processVideoConversion(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'success',
                message: `Successfully converted video ${path.basename(result.inputPath)} to ${result.format.toUpperCase()} (${result.percentSaved} size reduction, completed in ${result.duration})`,
                details: result,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Video conversion error: ${err.message}` }],
      };
    }
  }
);

// ==========================================
// TOOL 5: convert_audio (NEW: Audio -> Audio)
// ==========================================
server.tool(
  'convert_audio',
  {
    inputPath: z.string().describe('Path to source audio file (.mp3, .wav, .aac, .m4a, .flac, .ogg, etc.)'),
    format: z.enum(['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg']).default('mp3').describe('Target audio format (default: mp3)'),
    outputPath: z.string().optional().describe('Optional destination path. Defaults to same folder with new audio extension.'),
    bitrate: z.string().default('192k').describe('Target bitrate (e.g. 128k, 192k, 320k)'),
    sampleRate: z.number().optional().describe('Audio sample rate in Hz (e.g. 44100, 48000)'),
    overwrite: z.boolean().default(false).describe('Overwrite output file if it already exists'),
  },
  async (args) => {
    try {
      const result = await processAudioConversion(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'success',
                message: `Successfully converted audio ${path.basename(result.inputPath)} to ${result.format.toUpperCase()} (${result.originalSizeFormatted} -> ${result.convertedSizeFormatted} in ${result.duration})`,
                details: result,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Audio conversion error: ${err.message}` }],
      };
    }
  }
);

// ==========================================
// TOOL 6: get_media_info (UPGRADED: Unified Inspector)
// ==========================================
server.tool(
  'get_media_info',
  {
    filePath: z.string().describe('Path to image, video, or audio file to inspect metadata'),
  },
  async ({ filePath }) => {
    try {
      const resolved = resolvePath(filePath);
      if (!fsSync.existsSync(resolved)) {
        throw new Error(`File not found: ${resolved}`);
      }
      const stat = await fs.stat(resolved);
      if (stat.isDirectory()) {
        throw new Error(`'${resolved}' is a directory, not a media file.`);
      }

      const ext = path.extname(resolved).toLowerCase();

      // 1. If recognized as image, try Sharp first
      if (IMAGE_EXTENSIONS.has(ext)) {
        try {
          const meta = await sharp(resolved, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    mediaType: 'image',
                    filePath: resolved,
                    fileName: path.basename(resolved),
                    fileSizeBytes: stat.size,
                    fileSizeFormatted: formatBytes(stat.size),
                    format: meta.format,
                    width: meta.width,
                    height: meta.height,
                    dimensions: `${meta.width}x${meta.height}`,
                    space: meta.space,
                    channels: meta.channels,
                    depth: meta.depth,
                    density: meta.density,
                    hasAlpha: meta.hasAlpha,
                    isProgressive: meta.isProgressive,
                    hasExif: !!meta.exif,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (imgErr) {
          // If sharp fails (e.g. animated format or unusual container), fallback to ffprobe
        }
      }

      // 2. Video / Audio / Container inspection via ffprobe
      const probeData = await probeMedia(resolved);
      const streams = probeData.streams || [];
      const vStream = streams.find((s) => s.codec_type === 'video');
      const aStream = streams.find((s) => s.codec_type === 'audio');
      const mediaType = vStream ? 'video' : aStream ? 'audio' : 'media';

      const durationSec = parseFloat(probeData.format?.duration || 0);
      const minutes = Math.floor(durationSec / 60);
      const seconds = (durationSec % 60).toFixed(1);
      const durationFormatted = `${minutes > 0 ? `${minutes}m ` : ''}${seconds}s`;

      let fps = undefined;
      if (vStream?.r_frame_rate) {
        const parts = vStream.r_frame_rate.split('/');
        if (parts.length === 2 && Number(parts[1]) > 0) {
          fps = Math.round((Number(parts[0]) / Number(parts[1])) * 100) / 100;
        }
      }

      const info = {
        mediaType,
        filePath: resolved,
        fileName: path.basename(resolved),
        fileSizeBytes: stat.size,
        fileSizeFormatted: formatBytes(stat.size),
        format: probeData.format?.format_name || ext.replace('.', ''),
        durationSeconds: durationSec,
        durationFormatted,
        bitrate: probeData.format?.bit_rate ? `${Math.round(probeData.format.bit_rate / 1000)} kbps` : undefined,
        streamsCount: streams.length,
      };

      if (vStream) {
        info.video = {
          codec: vStream.codec_name,
          profile: vStream.profile,
          width: vStream.width,
          height: vStream.height,
          resolution: `${vStream.width}x${vStream.height}`,
          fps: fps || vStream.avg_frame_rate,
          aspectRatio: vStream.display_aspect_ratio || `${vStream.width}:${vStream.height}`,
          pixelFormat: vStream.pix_fmt,
        };
      }

      if (aStream) {
        info.audio = {
          codec: aStream.codec_name,
          sampleRate: aStream.sample_rate ? `${aStream.sample_rate} Hz` : undefined,
          channels: aStream.channels,
          channelLayout: aStream.channel_layout,
          bitrate: aStream.bit_rate ? `${Math.round(aStream.bit_rate / 1000)} kbps` : undefined,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(info, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to inspect media file: ${err.message}` }],
      };
    }
  }
);

// ==========================================
// TOOL 7: optimize_for_agent (LLM Vision Optimization)
// ==========================================
server.tool(
  'optimize_for_agent',
  {
    inputPath: z.string().describe('Path to high-resolution screenshot or image'),
    outputPath: z.string().optional().describe('Optional destination path (.webp only)'),
    maxDimension: z.number().default(1280).describe('Max width or height in px for LLM vision models (default: 1280)'),
  },
  async ({ inputPath, outputPath, maxDimension }) => {
    try {
      const resolved = resolvePath(inputPath);
      const parsed = path.parse(resolved);
      const dest = outputPath ? resolvePath(outputPath) : path.join(parsed.dir, `${parsed.name}_agent_opt.webp`);

      const result = await processSingleImage({
        inputPath: resolved,
        outputPath: dest,
        format: 'webp',
        quality: 80,
        maxWidth: maxDimension,
        maxHeight: maxDimension,
        overwrite: true,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'success',
                message: `Image optimized for AI context window: ${formatBytes(result.originalSizeBytes)} -> ${formatBytes(result.convertedSizeBytes)} (${result.percentSaved} savings)`,
                optimizedFilePath: dest,
                dimensions: result.dimensions,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Optimization error: ${err.message}` }],
      };
    }
  }
);

// ==========================================
// TOOL 8: extract_poster_frame (Video -> Poster)
// ==========================================
server.tool(
  'extract_poster_frame',
  {
    inputPath: z.string().describe('Path to source video file (.mp4, .mov, .mkv, .webm, etc.)'),
    timestamp: z.number().default(0.5).describe('Timestamp in seconds to capture poster frame (default: 0.5)'),
    format: z.enum(['webp', 'jpeg', 'png']).default('webp').describe('Target image format for poster (default: webp)'),
    outputPath: z.string().optional().describe('Optional destination image path'),
    overwrite: z.boolean().default(false).describe('Overwrite existing destination file'),
  },
  async (args) => {
    try {
      const result = await processPosterExtraction(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'success',
                message: `Successfully extracted poster frame at ${result.timestamp}s as ${result.format.toUpperCase()} (${result.sizeFormatted})`,
                details: result,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: `Poster extraction error: ${err.message}` }] };
    }
  }
);

// ==========================================
// TOOL 9: analyze_media (Media Analyzer - Single File)
// ==========================================
server.tool(
  'analyze_media',
  {
    filePath: z.string().describe('Path to image or SVG file to analyze for website performance bottlenecks'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').describe('Level of detail: compact (default), standard, detailed, raw'),
    tokenBudget: z.number().optional().describe('Optional token budget to cap MCP response size'),
  },
  async ({ filePath, detailLevel, tokenBudget }) => {
    try {
      const resolved = resolvePath(filePath);
      if (!fsSync.existsSync(resolved)) {
        throw new Error(`File not found: ${resolved}`);
      }
      const asset = await analyzeSingleMediaAsset(resolved);
      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          path: asset.relativePath,
          format: asset.format,
          dimensions: asset.dimensions,
          sizeBytes: asset.sizeBytes,
          sizeFormatted: asset.sizeFormatted,
          potentialSavingsBytes: asset.optimizationPotentialBytes,
          potentialSavingsFormatted: formatBytes(asset.optimizationPotentialBytes),
          issueCount: asset.issues.length,
          topIssues: asset.issues.map((i) => `${i.id}: ${i.message}`),
        },
        issues: asset.issues,
        recommendations: asset.issues.map((i) => i.recommendation),
        nextAction: asset.issues.length > 0 ? 'generate_optimization_plan' : 'all_assets_optimized',
        details: asset,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 10: analyze_web_assets (Media Analyzer - Project/Dir)
// ==========================================
server.tool(
  'analyze_web_assets',
  {
    directoryPath: z.string().optional().describe('Project directory or asset directory to analyze (e.g. ./public or .). Defaults to current workspace.'),
    recursive: z.boolean().default(true).describe('Whether to recursively scan nested directories (default: true)'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').describe('Detail level: compact (default), standard, detailed, raw'),
    tokenBudget: z.number().default(1200).optional().describe('Token budget for response (default: 1200 tokens)'),
  },
  async ({ directoryPath, recursive, detailLevel, tokenBudget }) => {
    try {
      const target = resolvePath(directoryPath || '.');
      const analysis = await analyzeWebAssets(target, recursive);
      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          score: analysis.score.overall,
          scoreBreakdown: analysis.score.breakdown,
          framework: analysis.framework,
          totalAssets: analysis.totalAssets,
          totalSizeBytes: analysis.totalSizeBytes,
          totalSizeFormatted: analysis.totalSizeFormatted,
          potentialSavingsBytes: analysis.potentialSavingsBytes,
          potentialSavingsFormatted: analysis.potentialSavingsFormatted,
          issueCount: analysis.issues.length,
          duplicateGroupsCount: analysis.duplicateGroups.length,
          topIssues: analysis.issues.slice(0, 5).map((i) => `${i.id}: ${i.message}`),
        },
        issues: analysis.issues,
        recommendations: analysis.recommendations,
        nextAction: analysis.nextAction,
        details: analysis,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 11: find_oversized_assets (Media Analyzer)
// ==========================================
server.tool(
  'find_oversized_assets',
  {
    directoryPath: z.string().optional().describe('Directory path to inspect (defaults to current directory)'),
    maxDimension: z.number().default(1920).describe('Max width or height in px (default: 1920)'),
    maxSizeBytes: z.number().default(500 * 1024).describe('Max file size in bytes (default: 500 KB)'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ directoryPath, maxDimension, maxSizeBytes, detailLevel, tokenBudget }) => {
    try {
      const target = resolvePath(directoryPath || '.');
      const analysis = await analyzeWebAssets(target);
      const oversized = analysis.assets.filter(
        (a) => (a.width && a.width > maxDimension) || (a.height && a.height > maxDimension) || a.sizeBytes > maxSizeBytes
      );
      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          totalOversizedFound: oversized.length,
          potentialSavingsBytes: oversized.reduce((acc, a) => acc + a.optimizationPotentialBytes, 0),
          potentialSavingsFormatted: formatBytes(oversized.reduce((acc, a) => acc + a.optimizationPotentialBytes, 0)),
          topIssues: oversized.slice(0, 5).map((a) => `${a.relativePath}: ${a.dimensions || formatBytes(a.sizeBytes)} exceeds limits`),
        },
        issues: oversized.flatMap((a) => a.issues.filter((i) => i.id === 'OVERSIZED_IMAGE')),
        recommendations: ['Downscale oversized images to max 1920px width and convert to WebP/AVIF.'],
        nextAction: oversized.length > 0 ? 'generate_optimization_plan' : 'all_assets_optimized',
        details: oversized,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 12: find_inefficient_formats (Media Analyzer)
// ==========================================
server.tool(
  'find_inefficient_formats',
  {
    directoryPath: z.string().optional().describe('Directory path to inspect (defaults to current directory)'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ directoryPath, detailLevel, tokenBudget }) => {
    try {
      const target = resolvePath(directoryPath || '.');
      const analysis = await analyzeWebAssets(target);
      const inefficient = analysis.assets.filter((a) => a.issues.some((i) => i.id === 'INEFFICIENT_FORMAT'));
      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          totalInefficientFound: inefficient.length,
          potentialSavingsBytes: inefficient.reduce((acc, a) => acc + a.optimizationPotentialBytes, 0),
          potentialSavingsFormatted: formatBytes(inefficient.reduce((acc, a) => acc + a.optimizationPotentialBytes, 0)),
          topIssues: inefficient.slice(0, 5).map((a) => `${a.relativePath} (${a.format.toUpperCase()}) -> recommend ${a.recommendedFormat?.toUpperCase() || 'WEBP'}`),
        },
        issues: inefficient.flatMap((a) => a.issues.filter((i) => i.id === 'INEFFICIENT_FORMAT')),
        recommendations: ['Convert non-transparent PNGs and legacy JPEGs to modern WebP or AVIF.'],
        nextAction: inefficient.length > 0 ? 'generate_optimization_plan' : 'all_assets_optimized',
        details: inefficient,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 13: find_duplicate_assets (Media Analyzer - Perceptual Duplicate Detection)
// ==========================================
server.tool(
  'find_duplicate_assets',
  {
    directoryPath: z.string().optional().describe('Directory path to inspect (defaults to current directory)'),
    similarityThreshold: z.number().default(93.75).describe('Perceptual similarity percentage threshold (default: 93.75%)'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ directoryPath, similarityThreshold, detailLevel, tokenBudget }) => {
    try {
      const target = resolvePath(directoryPath || '.');
      const analysis = await analyzeWebAssets(target);
      const duplicateGroups = groupDuplicates(analysis.assets, similarityThreshold);
      const totalDupSavings = duplicateGroups.reduce((acc, g) => acc + g.potentialSavingsBytes, 0);

      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          totalDuplicateGroups: duplicateGroups.length,
          potentialSavingsBytes: totalDupSavings,
          potentialSavingsFormatted: formatBytes(totalDupSavings),
          topIssues: duplicateGroups.slice(0, 5).map((g) => `${path.basename(g.representative)}: ${g.files.length} redundant copies (${g.similarityPercent}% similarity, saves ${g.potentialSavingsFormatted})`),
        },
        issues: duplicateGroups.map((g) => ({
          id: 'DUPLICATE_ASSET',
          severity: 'medium',
          message: `${g.files.length} duplicate or visually redundant copies (${g.similarityPercent}% similarity)`,
          recommendation: `Retain ${path.basename(g.representative)} and consolidate duplicates`,
          potentialSavingsBytes: g.potentialSavingsBytes,
        })),
        recommendations: duplicateGroups.length > 0
          ? [`Consolidate ${duplicateGroups.length} duplicate groups to save ${formatBytes(totalDupSavings)}.`]
          : ['No duplicate assets detected. Clean media library.'],
        nextAction: duplicateGroups.length > 0 ? 'generate_optimization_plan' : 'test_web_performance',
        details: duplicateGroups,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 14: find_responsive_opportunities (Media Analyzer)
// ==========================================
server.tool(
  'find_responsive_opportunities',
  {
    directoryPath: z.string().optional().describe('Directory path to inspect (defaults to current directory)'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ directoryPath, detailLevel, tokenBudget }) => {
    try {
      const target = resolvePath(directoryPath || '.');
      const analysis = await analyzeWebAssets(target);
      const responsiveOpportunities = analysis.assets.filter((a) => a.issues.some((i) => i.id === 'RESPONSIVE_VARIANT'));
      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          totalOpportunitiesFound: responsiveOpportunities.length,
          topIssues: responsiveOpportunities.slice(0, 5).map((a) => `${a.relativePath} (${a.dimensions}): missing responsive srcset variants`),
        },
        issues: responsiveOpportunities.flatMap((a) => a.issues.filter((i) => i.id === 'RESPONSIVE_VARIANT')),
        recommendations: ['Generate responsive variants (640w, 1024w, 1920w) and use picture or srcset.'],
        nextAction: 'generate_optimization_plan',
        details: responsiveOpportunities,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 15: test_web_performance (Performance Tester)
// ==========================================
server.tool(
  'test_web_performance',
  {
    url: z.string().optional().describe('Target URL (e.g. http://localhost:3000 or https://example.com)'),
    localPath: z.string().optional().describe('Local project folder or HTML build directory to test locally'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ url, localPath, detailLevel, tokenBudget }) => {
    try {
      const target = url || (localPath ? resolvePath(localPath) : resolvePath('.'));
      const testResult = await testWebPerformance(target);
      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          testId: testResult.testId,
          target: testResult.target,
          score: testResult.score.overall,
          scoreBreakdown: testResult.score.breakdown,
          totalAssets: testResult.metrics.totalAssetsCount,
          totalSizeBytes: testResult.metrics.totalSizeBytes,
          totalSizeFormatted: testResult.metrics.totalSizeFormatted,
          potentialSavingsBytes: testResult.potentialSavingsBytes,
          potentialSavingsFormatted: testResult.potentialSavingsFormatted,
          issueCount: testResult.issueCount,
          topIssues: testResult.topIssues,
          lcpCandidate: testResult.metrics.lcpCandidate,
          estimatedTransferTime4GMs: testResult.metrics.estimatedTransferTime4GMs,
        },
        issues: testResult.topIssues,
        recommendations: testResult.recommendations,
        nextAction: testResult.nextAction,
        details: testResult,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 16: get_web_performance_summary (Performance Tester)
// ==========================================
server.tool(
  'get_web_performance_summary',
  {
    testId: z.string().optional().describe('Test ID of previous audit. Defaults to most recent test.'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ testId, detailLevel, tokenBudget }) => {
    try {
      const test = engineCache.getTest(testId);
      if (!test) {
        throw new Error(`No performance test record found${testId ? ` for ID: ${testId}` : ''}. Please run test_web_performance first.`);
      }
      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          testId: test.testId,
          target: test.target,
          score: test.score.overall,
          scoreBreakdown: test.score.breakdown,
          totalAssets: test.metrics.totalAssetsCount,
          totalSizeFormatted: test.metrics.totalSizeFormatted,
          potentialSavingsFormatted: test.potentialSavingsFormatted,
          topIssues: test.topIssues,
          lcpCandidate: test.metrics.lcpCandidate,
        },
        issues: test.topIssues,
        recommendations: test.recommendations,
        nextAction: test.nextAction,
        details: test,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 17: compare_web_performance (Performance Tester)
// ==========================================
server.tool(
  'compare_web_performance',
  {
    beforeTestId: z.string().optional().describe('Test ID before optimization'),
    afterTestId: z.string().optional().describe('Test ID after optimization (defaults to most recent test)'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ beforeTestId, afterTestId, detailLevel, tokenBudget }) => {
    try {
      const afterTest = engineCache.getTest(afterTestId);
      const beforeTest = engineCache.getTest(beforeTestId);
      if (!afterTest || !beforeTest) {
        throw new Error('Could not find performance test records for comparison. Ensure both before and after tests exist.');
      }
      const comparison = comparePerformanceTests(beforeTest, afterTest);
      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          scoreBefore: comparison.scoreBefore,
          scoreAfter: comparison.scoreAfter,
          scoreDelta: comparison.scoreDelta,
          mediaBefore: comparison.mediaBeforeFormatted,
          mediaAfter: comparison.mediaAfterFormatted,
          savedBytes: comparison.savedFormatted,
          reductionPercent: comparison.reductionPercent,
          measuredImprovements: comparison.measuredImprovements,
        },
        recommendations: comparison.scoreDelta > 0 ? ['Optimizations confirmed successful! Commit changes to repository.'] : ['Verify remaining bottlenecks.'],
        nextAction: 'all_verified',
        details: comparison,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 18: generate_optimization_plan (Performance Booster)
// ==========================================
server.tool(
  'generate_optimization_plan',
  {
    directoryPath: z.string().optional().describe('Directory path of website/project to optimize (defaults to current directory)'),
    targetDir: z.string().optional().describe('Target folder for optimized files (defaults to safe non-destructive ./.photonow/optimized)'),
    format: z.enum(['webp', 'avif']).default('webp').describe('Preferred modern format (default: webp)'),
    quality: z.number().default(82).describe('Compression quality 1-100 (default: 82)'),
    maxDimension: z.number().default(1920).describe('Max width/height for downscaling oversized images (default: 1920)'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ directoryPath, targetDir, format, quality, maxDimension, detailLevel, tokenBudget }) => {
    try {
      const target = resolvePath(directoryPath || '.');
      const plan = await generateOptimizationPlan(target, {
        targetDir: targetDir ? resolvePath(targetDir) : undefined,
        format,
        quality,
        maxDimension,
      });
      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          planId: plan.planId,
          actionsCount: plan.actionsCount,
          impactSummary: plan.impactSummary,
          estimatedBefore: plan.estimatedBeforeFormatted,
          estimatedAfter: plan.estimatedAfterFormatted,
          estimatedSaved: plan.estimatedSavedFormatted,
          estimatedReductionPercent: plan.estimatedReductionPercent,
          targetDir: plan.targetDir,
          topActions: plan.actions.slice(0, 5).map((a) => `[${a.impact.toUpperCase()}] ${path.basename(a.inputPath)} -> ${path.basename(a.outputPath)} (${a.estimatedSavingsFormatted} est. savings)`),
        },
        recommendations: [
          `Execute optimization with optimize_web_assets(planId="${plan.planId}")`,
          'Default execution is non-destructive and saves to safe target directory.',
        ],
        nextAction: `optimize_web_assets("${plan.planId}")`,
        details: plan,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 19: optimize_web_assets (Performance Booster)
// ==========================================
server.tool(
  'optimize_web_assets',
  {
    planId: z.string().optional().describe('Plan ID generated by generate_optimization_plan'),
    directoryPath: z.string().optional().describe('Project directory if optimizing ad-hoc without pre-generated plan'),
    overwriteSource: z.boolean().default(false).describe('If true, creates backup in .photonow/backups and replaces original files. Default: false (non-destructive).'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ planId, directoryPath, overwriteSource, detailLevel, tokenBudget }) => {
    try {
      const target = planId || (directoryPath ? resolvePath(directoryPath) : resolvePath('.'));
      const execution = await executeOptimizationPlan(target, { overwriteSource });
      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          planId: execution.planId,
          totalProcessed: execution.totalProcessed,
          succeeded: execution.succeeded,
          failed: execution.failed,
          alreadyOptimizedCount: execution.alreadyOptimizedCount,
          actualBefore: execution.actualBeforeFormatted,
          actualAfter: execution.actualAfterFormatted,
          actualSaved: execution.actualSavedFormatted,
          actualReductionPercent: execution.actualReductionPercent,
          backupLocation: execution.backupLocation,
        },
        recommendations: [`Verify optimization gains with verify_optimization(planId="${execution.planId}")`],
        nextAction: `verify_optimization("${execution.planId}")`,
        details: execution,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 20: verify_optimization (Performance Booster)
// ==========================================
server.tool(
  'verify_optimization',
  {
    planId: z.string().optional().describe('Plan ID to verify'),
    directoryPath: z.string().optional().describe('Directory path to verify if ad-hoc'),
    generateReport: z.boolean().default(true).describe('Generate local self-contained HTML/Markdown report'),
    reportFormat: z.enum(['html', 'markdown', 'json']).default('html').describe('Report format: html (default), markdown, json'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ planId, directoryPath, generateReport, reportFormat, detailLevel, tokenBudget }) => {
    try {
      const target = planId || (directoryPath ? resolvePath(directoryPath) : resolvePath('.'));
      const verification = await verifyOptimization(target);
      let reportSavedPath = null;
      if (generateReport) {
        reportSavedPath = await saveLocalReport(verification, reportFormat);
        verification.reportSavedPath = reportSavedPath;
      }
      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          planId: verification.planId,
          mediaBefore: verification.mediaBeforeFormatted,
          mediaAfter: verification.mediaAfterFormatted,
          savedBytes: verification.savedFormatted,
          reductionPercent: verification.reductionPercent,
          scoreAfter: verification.scoreAfter,
          measuredImprovements: verification.measuredImprovements,
          reportSavedPath,
        },
        recommendations: ['All optimizations verified locally. Ready for deployment.'],
        nextAction: verification.nextAction,
        details: verification,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 21: inspect_project (Project Understanding)
// ==========================================
server.tool(
  'inspect_project',
  {
    projectPath: z.string().describe('Project root directory path'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ projectPath, detailLevel, tokenBudget }) => {
    try {
      const target = resolvePath(projectPath);
      const structure = await scanProjectStructure(target);
      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          projectRoot: structure.projectRoot,
          framework: structure.framework,
          frameworkVariant: structure.frameworkVariant,
          routesDir: structure.routesDir,
          componentsDir: structure.componentsDir,
          publicDir: structure.publicDir,
          configFile: structure.configFile,
          sourceFilesCount: structure.sourceFilesCount,
          assetFilesCount: structure.assetFilesCount,
          frameworkConfidence: structure.frameworkConfidence,
        },
        recommendations: [`Framework detected as '${structure.framework}'. Run 'analyze_web_assets' to audit media performance.`],
        nextAction: 'analyze_web_assets',
        details: structure,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 22: get_asset_usage (Asset Dependency Graph)
// ==========================================
server.tool(
  'get_asset_usage',
  {
    projectPath: z.string().describe('Project root directory path'),
    assetPath: z.string().describe('Path or file name of the asset to inspect'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ projectPath, assetPath, detailLevel, tokenBudget }) => {
    try {
      const targetRoot = resolvePath(projectPath);
      const structure = await scanProjectStructure(targetRoot);
      const sourceRefs = await scanProjectSourceReferences(targetRoot, structure.publicDir);
      const analysis = await analyzeWebAssets(targetRoot);
      const graph = buildAssetGraph(targetRoot, analysis.assets, sourceRefs);
      const usage = graph.getAssetUsage(assetPath);

      if (!usage) {
        throw new Error(`Asset '${assetPath}' not found in project assets or graph.`);
      }

      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          assetPath: usage.assetPath,
          relativePath: usage.relativePath,
          referenceCount: usage.referenceCount,
          routesCount: usage.routes.length,
          componentsCount: usage.components.length,
          routes: usage.routes,
          components: usage.components,
          isLcpCandidate: usage.isLcpCandidate,
          isShared: usage.isShared,
          isUnused: usage.isUnused,
          riskRating: usage.riskRating,
        },
        issues: usage.isUnused ? ['Asset has 0 references in source code.'] : [],
        recommendations: usage.isUnused
          ? ['Verify dynamic usage before pruning.']
          : (usage.isShared ? ['Shared across multiple routes. Optimize format/size with caution.'] : ['Safe to optimize or resize.']),
        nextAction: usage.isUnused ? 'find_unused_assets' : 'generate_optimization_plan',
        details: usage,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 23: find_unused_assets (Dead Asset Intelligence)
// ==========================================
server.tool(
  'find_unused_assets',
  {
    projectPath: z.string().describe('Project root directory path'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ projectPath, detailLevel, tokenBudget }) => {
    try {
      const targetRoot = resolvePath(projectPath);
      const structure = await scanProjectStructure(targetRoot);
      const sourceRefs = await scanProjectSourceReferences(targetRoot, structure.publicDir);
      const analysis = await analyzeWebAssets(targetRoot);
      const graph = buildAssetGraph(targetRoot, analysis.assets, sourceRefs);
      const unusedAssets = graph.findUnusedAssets();

      const totalWasteBytes = unusedAssets.reduce((acc, a) => acc + a.sizeBytes, 0);

      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          totalUnusedFound: unusedAssets.length,
          totalWasteBytes,
          totalWasteFormatted: formatBytes(totalWasteBytes),
          safeToPruneCount: unusedAssets.filter((a) => a.confidence === 'SAFE').length,
          likelyUnusedCount: unusedAssets.filter((a) => a.confidence === 'LIKELY').length,
          uncertainCount: unusedAssets.filter((a) => a.confidence === 'UNCERTAIN').length,
          topUnused: unusedAssets.slice(0, 5).map((a) => `${a.relativePath} (${a.sizeFormatted}) [${a.confidence}]`),
        },
        issues: unusedAssets.slice(0, 5).map((a) => `Unreferenced asset: ${a.relativePath} (${a.sizeFormatted})`),
        recommendations: ['Do NOT delete automatically. Review assets marked SAFE and require explicit confirmation.'],
        nextAction: 'review_unused_assets',
        details: unusedAssets,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 24: check_performance_budget (Budget Engine)
// ==========================================
server.tool(
  'check_performance_budget',
  {
    projectPath: z.string().describe('Project root directory path'),
    targetUrl: z.string().optional().describe('Optional live URL to evaluate'),
    budget: z.record(z.any()).optional().describe('Optional inline budget configuration'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ projectPath, targetUrl, budget, detailLevel, tokenBudget }) => {
    try {
      const targetRoot = resolvePath(projectPath);
      const analysis = await analyzeWebAssets(targetRoot);
      const configuredBudget = budget || (await loadProjectBudget(targetRoot));

      let lcpMs = 0;
      let fcpMs = 0;
      if (targetUrl) {
        const runtime = await verifyRuntimePerformance(targetUrl);
        lcpMs = runtime.lcpMs || 0;
        fcpMs = runtime.fcpMs || 0;
      }

      const evaluation = evaluatePerformanceBudget({
        target: targetUrl || targetRoot,
        assets: analysis.assets,
        totalSizeBytes: analysis.totalSizeBytes,
        lcpMs,
        fcpMs,
        budgetConfig: configuredBudget,
      });

      const formatted = formatMcpResponse({
        ok: evaluation.status !== 'FAIL',
        summary: {
          status: evaluation.status,
          target: evaluation.target,
          passedCount: evaluation.passedCount,
          failedCount: evaluation.failedCount,
          warningCount: evaluation.warningCount,
          failedRules: evaluation.checks.filter((c) => !c.passed).map((c) => `${c.rule}: actual ${c.actualFormatted} exceeded limit ${c.limitFormatted} by ${c.exceededByFormatted}`),
        },
        issues: evaluation.checks.filter((c) => !c.passed).map((c) => `${c.rule} exceeded budget`),
        recommendations: evaluation.status === 'FAIL' ? ['Generate an optimization plan to reduce media weight within budget limits.'] : ['Performance budgets satisfied.'],
        nextAction: evaluation.nextAction,
        details: evaluation,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 25: verify_runtime_performance (Browser Verifier)
// ==========================================
server.tool(
  'verify_runtime_performance',
  {
    targetUrl: z.string().describe('Target URL to measure (e.g. http://localhost:3000)'),
    timeoutMs: z.number().default(8000).optional().describe('Navigation timeout in milliseconds'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ targetUrl, timeoutMs, detailLevel, tokenBudget }) => {
    try {
      const result = await verifyRuntimePerformance(targetUrl, { timeoutMs });
      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          measurementType: result.measurementType,
          url: result.url,
          lcpMs: result.lcpMs,
          fcpMs: result.fcpMs,
          cls: result.cls,
          totalLoadMs: result.totalLoadMs,
          mediaTransferFormatted: result.mediaTransferFormatted,
          mediaRequestCount: result.mediaRequestCount,
          lcpElement: result.lcpElement,
        },
        recommendations: [result.measurementType === 'OBSERVED' ? 'Real browser metrics collected successfully.' : 'Live URL did not respond; simulated fallback metrics provided.'],
        nextAction: 'compare_web_performance',
        details: result,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 26: generate_source_patch (Source Code Patching)
// ==========================================
server.tool(
  'generate_source_patch',
  {
    projectPath: z.string().describe('Project root directory path'),
    planId: z.string().describe('Plan ID from generate_optimization_plan'),
    dryRun: z.boolean().default(true).describe('Preview diff without modifying files (default true)'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ projectPath, planId, dryRun, detailLevel, tokenBudget }) => {
    try {
      const targetRoot = resolvePath(projectPath);
      let plan = planId ? engineCache.getPlan(planId) : null;
      if (!plan) {
        plan = await generateOptimizationPlan(targetRoot);
      }

      const structure = await scanProjectStructure(targetRoot);
      const sourceRefs = await scanProjectSourceReferences(targetRoot, structure.publicDir);
      const analysis = await analyzeWebAssets(targetRoot);
      const graph = buildAssetGraph(targetRoot, analysis.assets, sourceRefs);

      const patch = await generateSourcePatch(plan, graph, { dryRun });
      engineCache.set(`patch:${patch.patchId}`, patch);

      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          patchId: patch.patchId,
          planId,
          actionsCount: patch.actions.length,
          affectedFilesCount: patch.affectedFiles.length,
          affectedFiles: patch.affectedFiles.map((f) => path.relative(targetRoot, f)),
          isDryRun: patch.isDryRun,
          diffPreview: patch.unifiedDiff ? patch.unifiedDiff.slice(0, 500) + (patch.unifiedDiff.length > 500 ? '\n... (truncated diff preview)' : '') : 'No source file changes needed.',
        },
        recommendations: ['Review unified diff. Execute apply_source_patch with confirmApply=true to modify code.'],
        nextAction: `apply_source_patch(patchId="${patch.patchId}", confirmApply=true)`,
        details: patch,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 27: apply_source_patch (Safe Patch Applicator)
// ==========================================
server.tool(
  'apply_source_patch',
  {
    projectPath: z.string().describe('Project root directory path'),
    patchId: z.string().optional().describe('Patch ID generated from generate_source_patch'),
    patch: z.record(z.any()).optional().describe('Direct patch object'),
    confirmApply: z.boolean().describe('Must be explicitly true to confirm source code modification'),
    dryRun: z.boolean().default(false).optional(),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ projectPath, patchId, patch, confirmApply, dryRun, detailLevel, tokenBudget }) => {
    try {
      if (!confirmApply) {
        throw new Error("Safety check: 'confirmApply' must be true to modify source code files.");
      }

      const targetRoot = resolvePath(projectPath);
      let targetPatch = patch;
      if (!targetPatch && patchId) {
        targetPatch = engineCache.get(`patch:${patchId}`);
      }
      if (!targetPatch) {
        throw new Error(`Patch record not found for ID '${patchId}'. Please generate_source_patch first.`);
      }

      const manifest = await applySourcePatch(targetPatch, { projectRoot: targetRoot, dryRun });

      const formatted = formatMcpResponse({
        ok: true,
        summary: {
          operationId: manifest.operationId,
          filesPatched: manifest.sourcePatches.length,
          backupDir: manifest.backupDir,
          canRollback: manifest.canRollback,
          appliedDetails: manifest.sourcePatches.map((p) => `${path.relative(targetRoot, p.file)} (${p.actionsApplied} actions applied)`),
        },
        recommendations: [`Rollback available via rollback_operation(operationId="${manifest.operationId}")`],
        nextAction: 'verify_optimization',
        details: manifest,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 28: rollback_operation (Rollback Engine)
// ==========================================
server.tool(
  'rollback_operation',
  {
    projectPath: z.string().describe('Project root directory path'),
    operationId: z.string().describe('Operation ID to rollback (e.g. op_abc123)'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ projectPath, operationId, detailLevel, tokenBudget }) => {
    try {
      const targetRoot = resolvePath(projectPath);
      const rollbackResult = await rollbackOperation(operationId, targetRoot);

      const formatted = formatMcpResponse({
        ok: rollbackResult.success,
        summary: {
          operationId,
          restoredSourcesCount: rollbackResult.restoredSourcesCount,
          restoredAssetsCount: rollbackResult.restoredAssetsCount,
          message: rollbackResult.message,
        },
        recommendations: ['Rollback finished. State restored from backup.'],
        nextAction: 'inspect_project',
        details: rollbackResult,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// ==========================================
// TOOL 29: optimize_project (Autonomous Mission)
// ==========================================
server.tool(
  'optimize_project',
  {
    projectPath: z.string().describe('Project root directory path'),
    mode: z.enum(['safe', 'review', 'aggressive']).default('safe').optional().describe('safe (non-destructive), review (dryRun), aggressive (overwrite source)'),
    dryRun: z.boolean().default(false).optional().describe('When true, generates plans and diffs without executing changes'),
    format: z.enum(['webp', 'avif']).default('webp').optional(),
    maxDimension: z.number().default(1920).optional(),
    quality: z.number().default(82).optional(),
    applySourcePatches: z.boolean().default(false).optional().describe('Automatically apply generated source diffs'),
    detailLevel: z.enum(['compact', 'standard', 'detailed', 'raw']).default('compact').optional(),
    tokenBudget: z.number().optional(),
  },
  async ({ projectPath, mode, dryRun, format, maxDimension, quality, applySourcePatches, detailLevel, tokenBudget }) => {
    try {
      const targetRoot = resolvePath(projectPath);
      const result = await optimizeProject({
        projectPath: targetRoot,
        mode,
        dryRun,
        format,
        maxDimension,
        quality,
        applySourcePatches,
        detailLevel,
        tokenBudget,
      });

      const formatted = formatMcpResponse({
        ok: result.status !== 'failed',
        summary: {
          status: result.status,
          missionId: result.missionId,
          scoreBefore: result.scoreBefore,
          scoreAfter: result.scoreAfter,
          scoreDelta: result.scoreDelta,
          assetsAnalyzed: result.assetsAnalyzed,
          assetsOptimized: result.assetsOptimized,
          bytesBeforeFormatted: result.bytesBeforeFormatted,
          bytesAfterFormatted: result.bytesAfterFormatted,
          bytesSavedFormatted: result.bytesSavedFormatted,
          assetReductionPercent: result.assetReductionPercent,
          lcpBefore: result.lcpBefore,
          lcpAfter: result.lcpAfter,
          lcpImprovementPercent: result.lcpImprovementPercent,
          regression: result.regression,
          sourcePatchesCount: result.sourcePatchesCount,
          appliedPatchesCount: result.appliedPatchesCount,
          rollbackAvailable: result.rollbackAvailable,
        },
        recommendations: [result.dryRun ? 'Dry run finished. Execute with dryRun=false to apply optimizations.' : 'Mission complete. All assets verified.'],
        nextAction: result.nextAction,
        details: result,
        detailLevel,
        tokenBudget,
      });
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(formatMcpResponse({ ok: false, error: err }), null, 2) }],
      };
    }
  }
);

// Connect to stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal MCP error: ${err.stack || err.message}\n`);
  process.exit(1);
});
