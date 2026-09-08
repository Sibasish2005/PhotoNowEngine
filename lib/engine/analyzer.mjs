/**
 * PhotoNow Media Analyzer Engine
 *
 * Deeply inspects website and project media assets, detects bottlenecks,
 * classifies issues with deterministic rules, and computes explainable performance scores.
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import sharp from 'sharp';
import { calculateSha256, computeDHash, groupDuplicates } from './perceptualHash.mjs';
import { formatBytes } from './tokenEconomy.mjs';
import { engineCache } from './cache.mjs';

const SUPPORTED_IMAGE_EXTS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.tif', '.bmp', '.gif', '.svg'
]);

const IGNORED_DIRS = new Set([
  '.git', 'node_modules', '.next', 'dist', 'build', '.vscode', '.idea',
  'coverage', '.turbo', '.cache', '$recycle.bin', 'system volume information'
]);

/**
 * Detects framework in a project directory to tailor recommendations.
 */
export async function detectFramework(dirPath) {
  try {
    const pkgPath = path.join(dirPath, 'package.json');
    if (fsSync.existsSync(pkgPath)) {
      const raw = await fs.readFile(pkgPath, 'utf8');
      const pkg = JSON.parse(raw);
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (deps['next']) return 'Next.js';
      if (deps['astro']) return 'Astro';
      if (deps['vite']) return 'Vite';
      if (deps['remix'] || deps['@remix-run/react']) return 'Remix';
      if (deps['nuxt'] || deps['nuxt3']) return 'Nuxt';
      if (deps['react']) return 'React';
    }
  } catch {
    // Ignore detection errors
  }
  return 'Static HTML / Modern Web';
}

/**
 * Recursively scans directory for media files.
 */
export async function scanMediaFiles(targetDir, recursive = true, depth = 0, maxDepth = 6) {
  const mediaFiles = [];
  if (depth > maxDepth) return mediaFiles;

  try {
    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(targetDir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name.toLowerCase()) && recursive) {
          const nested = await scanMediaFiles(fullPath, recursive, depth + 1, maxDepth);
          mediaFiles.push(...nested);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_IMAGE_EXTS.has(ext)) {
          mediaFiles.push(fullPath);
        }
      }
    }
  } catch {
    // Return whatever was collected
  }
  return mediaFiles;
}

/**
 * Analyzes a single media asset file.
 */
export async function analyzeSingleMediaAsset(filePath, baseDir = '') {
  const stat = await fs.stat(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  const relativePath = baseDir ? path.relative(baseDir, filePath) : fileName;
  const sizeBytes = stat.size;

  // Handle SVG specifically
  if (ext === '.svg') {
    const svgText = await fs.readFile(filePath, 'utf8');
    const contentHash = calculateSha256(Buffer.from(svgText));
    const issues = [];
    let optimizationPotentialBytes = 0;

    // Check SVG size
    if (sizeBytes > 50 * 1024) {
      const potSavings = Math.round(sizeBytes * 0.6);
      optimizationPotentialBytes += potSavings;
      issues.push({
        id: 'LARGE_SVG',
        severity: sizeBytes > 200 * 1024 ? 'critical' : 'high',
        message: `SVG file is unusually large (${formatBytes(sizeBytes)}). SVGs should typically be <50 KB.`,
        recommendation: 'Minify SVG paths, remove editor metadata, or consider vector cleanup.',
        potentialSavingsBytes: potSavings,
        confidence: 'confirmed',
      });
    }

    // Check for embedded base64 raster images in SVG
    if (svgText.includes('data:image/')) {
      const potSavings = Math.round(sizeBytes * 0.75);
      optimizationPotentialBytes += potSavings;
      issues.push({
        id: 'LARGE_SVG',
        severity: 'critical',
        message: 'SVG contains embedded base64 raster images, causing massive transfer bloat.',
        recommendation: 'Extract raster images to separate WebP/AVIF files and reference by URL.',
        potentialSavingsBytes: potSavings,
        confidence: 'confirmed',
      });
    }

    return {
      path: filePath,
      relativePath,
      fileName,
      format: 'svg',
      sizeBytes,
      sizeFormatted: formatBytes(sizeBytes),
      contentHash,
      optimizationPotentialBytes,
      issues,
    };
  }

  // Handle Raster Images via Sharp
  const fileBuffer = await fs.readFile(filePath);
  const contentHash = calculateSha256(fileBuffer);

  // Check cache
  const cached = engineCache.getAssetAnalysis(contentHash);
  if (cached && cached.path === filePath) {
    return cached;
  }

  let meta;
  try {
    meta = await sharp(fileBuffer, { failOn: 'none', limitInputPixels: 100_000_000 }).metadata();
  } catch (err) {
    // Unparsable image
    return {
      path: filePath,
      relativePath,
      fileName,
      format: ext.replace('.', ''),
      sizeBytes,
      sizeFormatted: formatBytes(sizeBytes),
      contentHash,
      optimizationPotentialBytes: 0,
      issues: [
        {
          id: 'INEFFICIENT_FORMAT',
          severity: 'low',
          message: `Unable to parse image metadata: ${err.message}`,
          recommendation: 'Inspect file integrity.',
          potentialSavingsBytes: 0,
          confidence: 'possible',
        },
      ],
    };
  }

  const width = meta.width || 0;
  const height = meta.height || 0;
  const aspectRatio = width && height ? `${(width / height).toFixed(2)}:1` : undefined;
  const hasAlpha = !!meta.hasAlpha;
  const isAnimated = (meta.pages || 1) > 1;
  const format = meta.format || ext.replace('.', '');
  const dHash = await computeDHash(fileBuffer);

  const issues = [];
  let optimizationPotentialBytes = 0;
  let recommendedFormat = 'webp';

  // 1. Check OVERSIZED: width/height > 1920 or file > 500 KB
  if (width > 2560 || height > 2560) {
    const potSavings = Math.round(sizeBytes * 0.7);
    optimizationPotentialBytes += potSavings;
    issues.push({
      id: 'OVERSIZED_IMAGE',
      severity: 'critical',
      message: `Image resolution (${width}x${height}) severely exceeds desktop viewport requirements (max 1920-2560px).`,
      recommendation: 'Downscale width to max 1920px (or 2560px for retina heroes).',
      potentialSavingsBytes: potSavings,
      confidence: 'confirmed',
    });
  } else if (width > 1920 || sizeBytes > 1024 * 1024) {
    const potSavings = Math.round(sizeBytes * 0.5);
    optimizationPotentialBytes += potSavings;
    issues.push({
      id: 'OVERSIZED_IMAGE',
      severity: 'high',
      message: `Image dimensions (${width}x${height}) or file size (${formatBytes(sizeBytes)}) exceed web performance best practices (>1MB / >1920px).`,
      recommendation: 'Resize and re-encode to modern web standards.',
      potentialSavingsBytes: potSavings,
      confidence: 'likely',
    });
  }

  // 2. Check INEFFICIENT_FORMAT: Photographic PNG or uncompressed JPG or GIF
  if (format === 'png' && !hasAlpha && width > 400 && height > 400) {
    // Non-transparent photographic PNG
    const potSavings = Math.round(sizeBytes * 0.75);
    optimizationPotentialBytes = Math.max(optimizationPotentialBytes, potSavings);
    recommendedFormat = 'avif';
    issues.push({
      id: 'INEFFICIENT_FORMAT',
      severity: 'high',
      message: `Photographic image (${width}x${height}) stored in uncompressed PNG format without transparency.`,
      recommendation: 'Convert to modern WebP or AVIF (typically 65-85% smaller with zero visible loss).',
      potentialSavingsBytes: potSavings,
      confidence: 'confirmed',
    });
  } else if (format === 'jpeg' || format === 'jpg') {
    if (sizeBytes > 250 * 1024) {
      const potSavings = Math.round(sizeBytes * 0.45);
      optimizationPotentialBytes = Math.max(optimizationPotentialBytes, potSavings);
      recommendedFormat = 'webp';
      issues.push({
        id: 'INEFFICIENT_FORMAT',
        severity: 'medium',
        message: `Legacy JPEG image (${formatBytes(sizeBytes)}) can achieve significant compression gains in modern formats.`,
        recommendation: 'Convert to WebP or AVIF at quality 80-82.',
        potentialSavingsBytes: potSavings,
        confidence: 'likely',
      });
    }
  } else if (format === 'gif' && isAnimated) {
    const potSavings = Math.round(sizeBytes * 0.8);
    optimizationPotentialBytes = Math.max(optimizationPotentialBytes, potSavings);
    issues.push({
      id: 'INEFFICIENT_FORMAT',
      severity: 'critical',
      message: `Animated GIF (${formatBytes(sizeBytes)}, ${meta.pages} frames) causes severe performance penalties.`,
      recommendation: 'Convert animated GIF to animated WebP or MP4 video (saving 70-90% bandwidth).',
      potentialSavingsBytes: potSavings,
      confidence: 'confirmed',
    });
  } else if (['bmp', 'tiff', 'tif'].includes(format)) {
    const potSavings = Math.round(sizeBytes * 0.85);
    optimizationPotentialBytes = Math.max(optimizationPotentialBytes, potSavings);
    recommendedFormat = 'webp';
    issues.push({
      id: 'INEFFICIENT_FORMAT',
      severity: 'critical',
      message: `Legacy uncompressed format (${format.toUpperCase()}) is unsuitable for web delivery.`,
      recommendation: 'Convert to WebP at quality 82.',
      potentialSavingsBytes: potSavings,
      confidence: 'confirmed',
    });
  }

  // 3. Check RESPONSIVE_VARIANT_OPPORTUNITY: Wide image lacking responsive set
  if (width >= 1200 && !fileName.includes('@') && !fileName.match(/-\d+w\./)) {
    const potSavings = Math.round(sizeBytes * 0.4);
    issues.push({
      id: 'RESPONSIVE_VARIANT',
      severity: 'medium',
      message: `Large single-resolution image (${width}px width) serves full payload to mobile devices.`,
      recommendation: 'Generate responsive variants (640w, 1024w, 1920w) and use srcset/picture tags.',
      potentialSavingsBytes: potSavings,
      confidence: 'likely',
    });
  }

  // 4. POTENTIAL_LCP_ASSET heuristic: Hero/banner or top image
  const lowerName = fileName.toLowerCase();
  if (
    lowerName.includes('hero') ||
    lowerName.includes('banner') ||
    lowerName.includes('cover') ||
    lowerName.includes('featured') ||
    (width >= 1200 && height >= 600)
  ) {
    issues.push({
      id: 'POTENTIAL_LCP_ASSET',
      severity: sizeBytes > 300 * 1024 ? 'high' : 'medium',
      message: `Likely Largest Contentful Paint (LCP) candidate asset (${width}x${height}, ${formatBytes(sizeBytes)}).`,
      recommendation: 'Ensure modern format, high fetch priority, preloading, and appropriate viewport sizing.',
      potentialSavingsBytes: Math.round(sizeBytes * 0.4),
      confidence: lowerName.includes('hero') || lowerName.includes('banner') ? 'likely' : 'possible',
    });
  }

  const analysis = {
    path: filePath,
    relativePath,
    fileName,
    format,
    sizeBytes,
    sizeFormatted: formatBytes(sizeBytes),
    width,
    height,
    dimensions: `${width}x${height}`,
    aspectRatio,
    hasAlpha,
    isAnimated,
    dHash,
    contentHash,
    optimizationPotentialBytes,
    recommendedFormat,
    issues,
  };

  engineCache.setAssetAnalysis(contentHash, analysis);
  return analysis;
}

/**
 * Computes an explainable PhotoNow Performance Score (0-100) based on identified asset issues.
 */
export function computePhotoNowScore(assetAnalyses, duplicateGroups = []) {
  let formatScore = 25;
  let sizingScore = 25;
  let compressionScore = 20;
  let responsiveScore = 15;
  let svgScore = 15;

  const deductions = [];

  for (const asset of assetAnalyses) {
    for (const issue of asset.issues) {
      if (issue.id === 'INEFFICIENT_FORMAT') {
        const loss = issue.severity === 'critical' ? 4 : issue.severity === 'high' ? 2 : 1;
        if (formatScore > 5) {
          formatScore = Math.max(5, formatScore - loss);
          deductions.push({
            ruleId: 'RULE_INEFFICIENT_FORMAT',
            category: 'formatEfficiency',
            pointsLost: loss,
            reason: issue.message,
            affectedAssets: [asset.relativePath],
          });
        }
      } else if (issue.id === 'OVERSIZED_IMAGE') {
        const loss = issue.severity === 'critical' ? 5 : 3;
        if (sizingScore > 5) {
          sizingScore = Math.max(5, sizingScore - loss);
          deductions.push({
            ruleId: 'RULE_OVERSIZED_IMAGE',
            category: 'imageSizing',
            pointsLost: loss,
            reason: issue.message,
            affectedAssets: [asset.relativePath],
          });
        }
      } else if (issue.id === 'HIGH_COMPRESSION_POTENTIAL') {
        const loss = 2;
        if (compressionScore > 5) {
          compressionScore = Math.max(5, compressionScore - loss);
          deductions.push({
            ruleId: 'RULE_COMPRESSION_POTENTIAL',
            category: 'compression',
            pointsLost: loss,
            reason: issue.message,
            affectedAssets: [asset.relativePath],
          });
        }
      } else if (issue.id === 'RESPONSIVE_VARIANT') {
        const loss = 2;
        if (responsiveScore > 3) {
          responsiveScore = Math.max(3, responsiveScore - loss);
          deductions.push({
            ruleId: 'RULE_RESPONSIVE_READINESS',
            category: 'responsiveReadiness',
            pointsLost: loss,
            reason: issue.message,
            affectedAssets: [asset.relativePath],
          });
        }
      } else if (issue.id === 'LARGE_SVG') {
        const loss = issue.severity === 'critical' ? 5 : 3;
        if (svgScore > 3) {
          svgScore = Math.max(3, svgScore - loss);
          deductions.push({
            ruleId: 'RULE_LARGE_SVG',
            category: 'svgEfficiency',
            pointsLost: loss,
            reason: issue.message,
            affectedAssets: [asset.relativePath],
          });
        }
      }
    }
  }

  // Deduct for duplicates if any found
  if (duplicateGroups.length > 0) {
    const dupLoss = Math.min(6, duplicateGroups.length * 2);
    sizingScore = Math.max(4, sizingScore - dupLoss);
    deductions.push({
      ruleId: 'RULE_DUPLICATE_ASSETS',
      category: 'imageSizing',
      pointsLost: dupLoss,
      reason: `Found ${duplicateGroups.length} duplicate or visually redundant asset groups.`,
      affectedAssets: duplicateGroups.map((g) => g.representative),
    });
  }

  const overall = formatScore + sizingScore + compressionScore + responsiveScore + svgScore;

  return {
    overall: Math.max(0, Math.min(100, overall)),
    breakdown: {
      formatEfficiency: formatScore,
      imageSizing: sizingScore,
      compression: compressionScore,
      responsiveReadiness: responsiveScore,
      svgEfficiency: svgScore,
    },
    deductions: deductions.slice(0, 15),
  };
}

/**
 * Performs full project or directory media analysis.
 */
export async function analyzeWebAssets(targetPath, recursive = true) {
  const resolved = path.resolve(targetPath);
  if (!fsSync.existsSync(resolved)) {
    throw new Error(`Target path not found: ${resolved}`);
  }

  const stat = await fs.stat(resolved);
  let filesToAnalyze = [];
  let baseDir = resolved;

  if (stat.isFile()) {
    filesToAnalyze = [resolved];
    baseDir = path.dirname(resolved);
  } else {
    // Check if target is a project root with subfolders like 'public', 'assets', 'src/assets'
    const candidateSubdirs = ['public', 'assets', 'static', 'images', 'media', 'src/assets'];
    const foundSubdirs = candidateSubdirs.filter((sub) => fsSync.existsSync(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ resolved, sub)));

    if (foundSubdirs.length > 0 && !candidateSubdirs.some((sub) => path.basename(resolved).toLowerCase() === sub)) {
      // Collect media across discovered asset subdirs
      for (const sub of foundSubdirs) {
        const subFiles = await scanMediaFiles(path.join(resolved, sub), recursive);
        filesToAnalyze.push(...subFiles);
      }
      // Also scan root directory shallowly
      const rootMedia = await scanMediaFiles(resolved, false);
      filesToAnalyze.push(...rootMedia);
    } else {
      filesToAnalyze = await scanMediaFiles(resolved, recursive);
    }
  }

  // Deduplicate file list
  filesToAnalyze = Array.from(new Set(filesToAnalyze));

  const analyses = [];
  let totalSizeBytes = 0;
  let totalPotentialSavingsBytes = 0;

  for (const filePath of filesToAnalyze) {
    try {
      const item = await analyzeSingleMediaAsset(filePath, baseDir);
      analyses.push(item);
      totalSizeBytes += item.sizeBytes;
      totalPotentialSavingsBytes += item.optimizationPotentialBytes;
    } catch {
      // Skip unreadable files gracefully
    }
  }

  // Group duplicates
  const duplicateGroups = groupDuplicates(analyses);
  for (const group of duplicateGroups) {
    totalPotentialSavingsBytes += group.potentialSavingsBytes;
  }

  // Sort assets by size descending
  analyses.sort((a, b) => b.sizeBytes - a.sizeBytes);

  // Score
  const score = computePhotoNowScore(analyses, duplicateGroups);
  const framework = await detectFramework(baseDir);

  // Flatten all issues
  const allIssues = [];
  for (const item of analyses) {
    for (const iss of item.issues) {
      allIssues.push({
        ...iss,
        assetPath: item.relativePath,
        assetSizeBytes: item.sizeBytes,
      });
    }
  }

  // Sort issues by potential savings descending
  allIssues.sort((a, b) => b.potentialSavingsBytes - a.potentialSavingsBytes);

  // Generate top recommendations
  const recommendations = [];
  if (framework === 'Next.js') {
    recommendations.push('Framework detected: Next.js. Consider next/image component for automated AVIF/WebP and responsive sizing.');
  }
  if (duplicateGroups.length > 0) {
    recommendations.push(`Consolidate ${duplicateGroups.length} duplicate groups to save up to ${formatBytes(duplicateGroups.reduce((acc, g) => acc + g.potentialSavingsBytes, 0))}.`);
  }
  if (allIssues.some((i) => i.id === 'OVERSIZED_IMAGE')) {
    recommendations.push('Resize oversized images to standard desktop max (1920px) to cut massive bandwidth.');
  }
  if (allIssues.some((i) => i.id === 'INEFFICIENT_FORMAT')) {
    recommendations.push('Convert photographic PNG and legacy JPEG assets to modern WebP / AVIF.');
  }
  if (allIssues.some((i) => i.id === 'LARGE_SVG')) {
    recommendations.push('Minify large SVGs and extract embedded base64 bitmaps.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Media assets are in great shape! Maintain web performance budgets in CI/CD.');
  }

  return {
    projectPath: resolved,
    framework,
    totalAssets: analyses.length,
    totalSizeBytes,
    totalSizeFormatted: formatBytes(totalSizeBytes),
    potentialSavingsBytes: totalPotentialSavingsBytes,
    potentialSavingsFormatted: formatBytes(totalPotentialSavingsBytes),
    score,
    duplicateGroups,
    issues: allIssues,
    assets: analyses,
    recommendations,
    nextAction: allIssues.length > 0 ? 'generate_optimization_plan' : 'test_web_performance',
  };
}
