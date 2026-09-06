#!/usr/bin/env node

/**
 * PhotoNow Standalone MCP Server (Stdio Transport)
 *
 * Plug-and-play Model Context Protocol tool server for local media conversions.
 * Works seamlessly with Antigravity IDE, Claude Desktop, Cursor, and other MCP clients.
 * Zero shell command approvals required by the user during agent conversations.
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

// Supported image extensions
const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.tif', '.bmp', '.gif'
]);

/**
 * Resolve path expanding home directory (~) and normalizing separators
 */
function resolvePath(filePath) {
  if (!filePath) return '';
  let resolved = filePath.trim();
  if (resolved.startsWith('~')) {
    resolved = path.join(os.homedir(), resolved.slice(1));
  }
  return path.resolve(resolved);
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
  const qualityNum = Math.min(Math.max(Number(quality) || 82, 1), 100);

  let buffer = inputBuffer;
  let originalSizeBytes = 0;

  if (!buffer && inputPath) {
    const resolvedInput = resolvePath(inputPath);
    if (!fsSync.existsSync(resolvedInput)) {
      throw new Error(`Input file not found at: ${resolvedInput}`);
    }
    const stat = await fs.stat(resolvedInput);
    originalSizeBytes = stat.size;
    buffer = await fs.readFile(resolvedInput);
  } else if (buffer) {
    originalSizeBytes = buffer.length;
  }

  let pipeline = sharp(buffer);
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
  } else if (targetFormat === 'bmp') {
    // sharp doesn't output raw BMP directly; fallback to png or webp
    pipeline = pipeline.png();
    ext = '.png';
  } else {
    pipeline = pipeline.webp({ quality: qualityNum });
    ext = '.webp';
  }

  const outputBuffer = await pipeline.toBuffer();
  const outputSizeBytes = outputBuffer.length;
  const outMeta = await sharp(outputBuffer).metadata();

  // Determine output path if inputPath was provided
  let finalOutputPath = outputPath ? resolvePath(outputPath) : null;
  if (!finalOutputPath && inputPath) {
    const parsed = path.parse(resolvePath(inputPath));
    finalOutputPath = path.join(parsed.dir, `${parsed.name}${ext}`);
  }

  // Avoid overwriting original unless explicitly asked
  if (finalOutputPath && !overwrite && inputPath && resolvePath(inputPath) === finalOutputPath) {
    const parsed = path.parse(finalOutputPath);
    finalOutputPath = path.join(parsed.dir, `${parsed.name}_converted${parsed.ext}`);
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
 * Scan directory recursively or flat for image files
 */
async function scanImages(dir, recursive = false) {
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && recursive) {
      const sub = await scanImages(fullPath, recursive);
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
    inputPath: z.string().describe('Path to the image file to convert (e.g. C:/photos/pic.png or ~/images/doc.jpg)'),
    outputPath: z.string().optional().describe('Optional destination path for the converted file. Defaults to same directory as original with new extension.'),
    format: z.enum(['webp', 'png', 'jpeg', 'avif']).default('webp').describe('Output format (default: webp)'),
    quality: z.number().min(1).max(100).default(82).describe('Compression quality (1 to 100, default: 82)'),
    maxWidth: z.number().optional().describe('Maximum width in pixels (aspect-ratio preserved)'),
    maxHeight: z.number().optional().describe('Maximum height in pixels (aspect-ratio preserved)'),
    rotate: z.number().optional().describe('Rotate clockwise degrees: 90, 180, 270'),
    grayscale: z.boolean().default(false).describe('Convert image to grayscale / monochrome'),
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
                message: `Successfully converted ${path.basename(result.inputPath)} to ${result.format.toUpperCase()} (${result.percentSaved} size reduction)`,
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
    outputDir: z.string().optional().describe('Target folder to save all converted files. Defaults to same folder as each original.'),
    format: z.enum(['webp', 'png', 'jpeg', 'avif']).default('webp').describe('Target image format (default: webp)'),
    quality: z.number().min(1).max(100).default(82).describe('Compression quality (1 to 100, default: 82)'),
    recursive: z.boolean().default(false).describe('If scanning directoryPath, whether to scan nested subfolders'),
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
                  message: 'No supported images found in the specified directory or list.',
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
        await fs.mkdir(resolvePath(args.outputDir), { recursive: true });
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
      const meta = await sharp(resolved).metadata();

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
    outputPath: z.string().optional().describe('Optional destination path (defaults to [name]_agent_opt.webp)'),
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
