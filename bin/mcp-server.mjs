#!/usr/bin/env node

/**
 * PhotoNow Standalone MCP Server (Stdio Transport)
 *
 * Plug-and-play Model Context Protocol tool server for local media conversions.
 * Works seamlessly with Antigravity IDE, Claude Desktop, Cursor, and other MCP clients.
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

// Initialize server
const server = new McpServer({
  name: 'photo-convert-mcp',
  version: '1.2.0',
});

// Supported input image extensions
const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.tif', '.bmp', '.gif'
]);

// Allowed output extensions (strict whitelist to prevent arbitrary file overwrite)
const ALLOWED_OUTPUT_EXTENSIONS = new Set([
  '.webp', '.png', '.jpg', '.jpeg', '.avif'
]);

// Directories to skip during batch scans
const IGNORED_DIRECTORIES = new Set([
  '.git', 'node_modules', '.next', 'dist', 'build', '.vscode', '.idea',
  'system volume information', '$recycle.bin', 'appdata', '.cache'
]);

// Maximum safety limits
const MAX_INPUT_FILE_BYTES = 250 * 1024 * 1024; // 250 MB
const MAX_INPUT_PIXELS = 100_000_000;          // 100 MegaPixels (~10,000 x 10,000 px)
const MAX_BATCH_FILES = 1000;                   // Maximum images in a single batch scan
const MAX_SCAN_DEPTH = 6;                       // Maximum folder recursion depth

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

  // 1. Strict extension check: MUST be a supported image format
  if (!ALLOWED_OUTPUT_EXTENSIONS.has(ext)) {
    throw new Error(
      `Security violation: Output file must have an authorized image extension (.webp, .png, .jpg, .jpeg, .avif). Writing to '${ext || 'no-extension'}' is blocked.`
    );
  }

  // 2. Sensitive directory protection
  const lower = resolved.toLowerCase();
  const sensitivePatterns = [
    `${path.sep}.git${path.sep}`,
    `${path.sep}.ssh${path.sep}`,
    `${path.sep}.aws${path.sep}`,
    `${path.sep}.gnupg${path.sep}`,
    `${path.sep}node_modules${path.sep}`,
    `${path.sep}windows${path.sep}system32`,
    `/etc/`,
    `/bin/`,
    `/sbin/`,
    `/root/`,
  ];

  for (const pattern of sensitivePatterns) {
    if (lower.includes(pattern.toLowerCase())) {
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
  if (bytes === 0) return '0 B';
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
    // E.g., 0.85 -> 85
    return Math.round(q * 100);
  }
  return Math.min(Math.round(q), 100);
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

    if (stat.size > MAX_INPUT_FILE_BYTES) {
      throw new Error(
        `File size (${formatBytes(stat.size)}) exceeds the maximum allowed limit of ${formatBytes(MAX_INPUT_FILE_BYTES)}.`
      );
    }

    originalSizeBytes = stat.size;
    buffer = await fs.readFile(resolvedInput);
  } else if (buffer) {
    originalSizeBytes = buffer.length;
    if (originalSizeBytes > MAX_INPUT_FILE_BYTES) {
      throw new Error(`Input buffer exceeds maximum allowed limit of ${formatBytes(MAX_INPUT_FILE_BYTES)}.`);
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
  }

  // Collision handling if not overwriting
  if (finalOutputPath && !overwrite && fsSync.existsSync(finalOutputPath)) {
    // If output is same as input or user didn't ask to overwrite existing output file
    const parsed = path.parse(finalOutputPath);
    let counter = 1;
    let safePath = path.join(parsed.dir, `${parsed.name}_converted${parsed.ext}`);
    while (fsSync.existsSync(safePath)) {
      safePath = path.join(parsed.dir, `${parsed.name}_converted_${counter}${parsed.ext}`);
      counter++;
    }
    finalOutputPath = safePath;
  }

  if (finalOutputPath) {
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
    return []; // Skip unreadable directories
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

      // Ensure output directory exists if provided
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
// TOOL 3: get_media_info (Inspect Image File)
// ==========================================
server.tool(
  'get_media_info',
  {
    filePath: z.string().describe('Path to image file to inspect metadata'),
  },
  async ({ filePath }) => {
    try {
      const resolved = resolvePath(filePath);
      if (!fsSync.existsSync(resolved)) {
        throw new Error(`File not found: ${resolved}`);
      }
      const stat = await fs.stat(resolved);
      if (stat.isDirectory()) {
        throw new Error(`'${resolved}' is a directory, not an image file.`);
      }

      const meta = await sharp(resolved, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                filePath: resolved,
                fileName: path.basename(resolved),
                fileSizeBytes: stat.size,
                fileSizeFormatted: formatBytes(stat.size),
                format: meta.format,
                width: meta.width,
                height: meta.height,
                space: meta.space,
                channels: meta.channels,
                depth: meta.depth,
                density: meta.density,
                hasAlpha: meta.hasAlpha,
                isProgressive: meta.isProgressive,
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
        content: [{ type: 'text', text: `Failed to inspect image: ${err.message}` }],
      };
    }
  }
);

// ==========================================
// TOOL 4: optimize_for_agent (LLM Vision Optimization)
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

// Connect to stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal MCP error: ${err.stack || err.message}\n`);
  process.exit(1);
});
