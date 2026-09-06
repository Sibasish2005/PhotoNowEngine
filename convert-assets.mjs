#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

// Resolve current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Try loading ffmpeg-static
let ffmpegPath = null;
try {
  const ffmpegModule = await import("ffmpeg-static");
  ffmpegPath = ffmpegModule.default || ffmpegModule;
} catch {
  // ffmpeg-static optional
}

const SUPPORTED_IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg"]);
const MAX_DIMENSION = 1920; // Max width or height for web display
const WEBP_QUALITY = 80;

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function getAllFiles(dirPath, arrayOfFiles = []) {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }

  return arrayOfFiles;
}

async function convertImageToWebp(filePath, force = false) {
  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_IMAGE_EXTS.has(ext)) return null;

  const webpPath = filePath.slice(0, -ext.length) + ".webp";

  // Check if destination exists
  if (!force && fs.existsSync(webpPath)) {
    const origStat = await fs.promises.stat(filePath);
    const webpStat = await fs.promises.stat(webpPath);
    return {
      file: path.relative(rootDir, filePath),
      origSize: origStat.size,
      newSize: webpStat.size,
      saved: origStat.size - webpStat.size,
      percent: (((origStat.size - webpStat.size) / origStat.size) * 100).toFixed(1),
      skipped: true,
    };
  }

  const origStat = await fs.promises.stat(filePath);
  const image = sharp(filePath);
  const metadata = await image.metadata();

  let transform = image.rotate(); // auto-rotate based on EXIF

  // Downscale if exceeds MAX_DIMENSION
  if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
    transform = transform.resize({
      width: metadata.width > metadata.height ? MAX_DIMENSION : null,
      height: metadata.height >= metadata.width ? MAX_DIMENSION : null,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Convert to WebP with optimal compression
  await transform
    .webp({
      quality: WEBP_QUALITY,
      effort: 6,
      lossless: false,
    })
    .toFile(webpPath);

  const webpStat = await fs.promises.stat(webpPath);
  const saved = origStat.size - webpStat.size;
  const percent = ((saved / origStat.size) * 100).toFixed(1);

  return {
    file: path.relative(rootDir, filePath),
    origSize: origStat.size,
    newSize: webpStat.size,
    saved,
    percent,
    skipped: false,
  };
}

async function convertVideoToWebm(videoPath, force = false) {
  if (!ffmpegPath || !fs.existsSync(videoPath)) return null;

  const ext = path.extname(videoPath).toLowerCase();
  if (ext !== ".mp4") return null;

  const webmPath = videoPath.slice(0, -ext.length) + ".webm";
  const posterPath = path.join(path.dirname(videoPath), "hero-poster.webp");

  const origStat = await fs.promises.stat(videoPath);
  const results = [];

  // Generate poster frame from second 0.5 if not exists
  if (force || !fs.existsSync(posterPath)) {
    const tempJpg = path.join(path.dirname(videoPath), "_temp_poster.jpg");
    try {
      await execFileAsync(ffmpegPath, [
        "-y",
        "-ss", "00:00:00.500",
        "-i", videoPath,
        "-vframes", "1",
        "-q:v", "2",
        tempJpg,
      ]);

      if (fs.existsSync(tempJpg)) {
        await sharp(tempJpg)
          .resize({ width: 1920, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(posterPath);
        await fs.promises.unlink(tempJpg);

        const posterStat = await fs.promises.stat(posterPath);
        results.push({
          file: `${path.relative(rootDir, posterPath)} (poster)`,
          origSize: origStat.size,
          newSize: posterStat.size,
          saved: origStat.size - posterStat.size,
          percent: "100.0",
          skipped: false,
        });
      }
    } catch (err) {
      console.warn(`[converter] Could not generate poster: ${err.message}`);
    }
  }

  // Convert MP4 to web-optimized WebM (VP9, CRF 32, no audio for background video)
  if (!force && fs.existsSync(webmPath)) {
    const webmStat = await fs.promises.stat(webmPath);
    results.push({
      file: path.relative(rootDir, webmPath),
      origSize: origStat.size,
      newSize: webmStat.size,
      saved: origStat.size - webmStat.size,
      percent: (((origStat.size - webmStat.size) / origStat.size) * 100).toFixed(1),
      skipped: true,
    });
    return results;
  }

  console.log(`[converter] Encoding video to WebM: ${path.basename(videoPath)}...`);
  try {
    await execFileAsync(ffmpegPath, [
      "-y",
      "-i", videoPath,
      "-c:v", "libvpx-vp9",
      "-crf", "32",
      "-b:v", "0",
      "-an",
      "-vf", "scale='min(1920,iw)':-2",
      "-deadline", "good",
      "-cpu-used", "2",
      webmPath,
    ]);

    const webmStat = await fs.promises.stat(webmPath);
    results.push({
      file: path.relative(rootDir, webmPath),
      origSize: origStat.size,
      newSize: webmStat.size,
      saved: origStat.size - webmStat.size,
      percent: (((origStat.size - webmStat.size) / origStat.size) * 100).toFixed(1),
      skipped: false,
    });
  } catch (err) {
    console.warn(`[converter] WebM conversion error: ${err.message}`);
  }

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const skipVideo = args.includes("--no-video");
  const targetArg = args.find((a) => !a.startsWith("--"));

  const targetPath = targetArg
    ? path.resolve(process.cwd(), targetArg)
    : path.resolve(rootDir, "public");

  console.log("================================================================================");
  console.log("             OPTIMIZED ASSET CONVERTER (PNG/JPG -> WebP & Video -> WebM)        ");
  console.log("================================================================================");
  console.log(`Scanning target: ${targetPath}`);
  console.log(`Force reconvert: ${force}`);
  console.log(`FFmpeg Available: ${ffmpegPath ? "Yes (" + ffmpegPath + ")" : "No"}`);
  console.log("--------------------------------------------------------------------------------\n");

  const results = [];
  const stat = await fs.promises.stat(targetPath);

  let filesToProcess = [];
  if (stat.isDirectory()) {
    filesToProcess = await getAllFiles(targetPath);
  } else {
    filesToProcess = [targetPath];
  }

  // Convert Images
  for (const file of filesToProcess) {
    const ext = path.extname(file).toLowerCase();
    if (SUPPORTED_IMAGE_EXTS.has(ext)) {
      try {
        const res = await convertImageToWebp(file, force);
        if (res) results.push(res);
      } catch (err) {
        console.error(`Error converting ${file}: ${err.message}`);
      }
    }
  }

  // Convert Videos
  if (!skipVideo && ffmpegPath) {
    for (const file of filesToProcess) {
      const ext = path.extname(file).toLowerCase();
      if (ext === ".mp4") {
        try {
          const videoResults = await convertVideoToWebm(file, force);
          if (videoResults) results.push(...videoResults);
        } catch (err) {
          console.error(`Error converting video ${file}: ${err.message}`);
        }
      }
    }
  }

  if (results.length === 0) {
    console.log("No convertible images or videos found.");
    return;
  }

  // Summary Table
  console.log("\nConversion Results:");
  console.log("--------------------------------------------------------------------------------");
  console.log(
    "File".padEnd(42) +
    "Original".padStart(12) +
    "Optimized".padStart(12) +
    "Saved".padStart(12) +
    "Reduced".padStart(9)
  );
  console.log("--------------------------------------------------------------------------------");

  let totalOrig = 0;
  let totalNew = 0;

  for (const r of results) {
    totalOrig += r.origSize;
    totalNew += r.newSize;
    const status = r.skipped ? " (cached)" : "";
    const name = (r.file.length > 39 ? "..." + r.file.slice(-36) : r.file) + status;
    console.log(
      name.padEnd(42) +
      formatBytes(r.origSize).padStart(12) +
      formatBytes(r.newSize).padStart(12) +
      formatBytes(r.saved).padStart(12) +
      `${r.percent}%`.padStart(9)
    );
  }

  const totalSaved = totalOrig - totalNew;
  const totalPercent = totalOrig > 0 ? ((totalSaved / totalOrig) * 100).toFixed(1) : "0";

  console.log("================================================================================");
  console.log(
    "TOTALS".padEnd(42) +
    formatBytes(totalOrig).padStart(12) +
    formatBytes(totalNew).padStart(12) +
    formatBytes(totalSaved).padStart(12) +
    `${totalPercent}%`.padStart(9)
  );
  console.log("================================================================================");
  console.log(`\n🎉 Success! Reduced asset payload by ${formatBytes(totalSaved)} (${totalPercent}% reduction).`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
