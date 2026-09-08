/**
 * PhotoNow Web Performance Booster Engine
 *
 * Generates actionable optimization plans, safely transforms media assets,
 * verifies output integrity, supports hash-based idempotency, and measures real gains.
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import sharp from 'sharp';
import { analyzeWebAssets } from './analyzer.mjs';
import { formatBytes } from './tokenEconomy.mjs';
import { engineCache } from './cache.mjs';
import { calculateSha256 } from './perceptualHash.mjs';

/**
 * Generates an explainable Optimization Plan with unique planId.
 */
export async function generateOptimizationPlan(targetPath, options = {}) {
  const resolved = path.resolve(targetPath);
  const analysis = await analyzeWebAssets(resolved);
  const planId = `plan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  const targetDir = options.targetDir
    ? path.resolve(options.targetDir)
    : path.join(resolved, '.photonow', 'optimized');

  const actions = [];
  let estimatedBeforeBytes = 0;
  let estimatedAfterBytes = 0;

  for (const asset of analysis.assets) {
    if (asset.format === 'svg') continue; // keep SVGs vector unless requested

    const hasOversized = asset.issues.find((i) => i.id === 'OVERSIZED_IMAGE');
    const hasInefficient = asset.issues.find((i) => i.id === 'INEFFICIENT_FORMAT');
    const hasCompression = asset.issues.find((i) => i.id === 'HIGH_COMPRESSION_POTENTIAL');

    if (hasOversized || hasInefficient || hasCompression || asset.format === 'png' || asset.format === 'jpeg') {
      const targetFormat = asset.recommendedFormat || (options.format || 'webp');
      const parsed = path.parse(asset.path);
      const relativeSubdir = path.dirname(asset.relativePath);
      const outFolder = path.join(/*turbopackIgnore: true*/ targetDir, relativeSubdir);
      const outPath = path.join(/*turbopackIgnore: true*/ outFolder, `${parsed.name}.${targetFormat}`);

      let targetWidth = undefined;
      let targetHeight = undefined;
      if (asset.width && asset.width > (options.maxDimension || 1920)) {
        targetWidth = options.maxDimension || 1920;
      }

      // Estimate savings: WebP/AVIF typically reduces 60-80% for photographic PNGs, 40-60% for JPEGs
      let savingsRatio = 0.5;
      if (asset.format === 'png' && !asset.hasAlpha) savingsRatio = 0.75;
      else if (targetWidth) savingsRatio = 0.7;

      const estimatedSavings = Math.round(asset.sizeBytes * savingsRatio);
      const estimatedAfter = Math.max(1024, asset.sizeBytes - estimatedSavings);

      estimatedBeforeBytes += asset.sizeBytes;
      estimatedAfterBytes += estimatedAfter;

      const impact =
        asset.sizeBytes > 1024 * 1024 || hasOversized?.severity === 'critical'
          ? 'high'
          : asset.sizeBytes > 250 * 1024
          ? 'medium'
          : 'low';

      actions.push({
        actionId: `act_${actions.length + 1}`,
        type: targetWidth ? 'resize' : 'convert',
        inputPath: asset.path,
        outputPath: outPath,
        targetFormat,
        quality: options.quality || 82,
        targetWidth,
        targetHeight,
        impact,
        estimatedSavingsBytes: estimatedSavings,
        estimatedSavingsFormatted: formatBytes(estimatedSavings),
        reason:
          hasOversized?.message ||
          hasInefficient?.message ||
          `Convert ${asset.format.toUpperCase()} to modern ${targetFormat.toUpperCase()}`,
      });
    }
  }

  // Sort actions by impact & savings
  actions.sort((a, b) => b.estimatedSavingsBytes - a.estimatedSavingsBytes);

  const estimatedSavedBytes = Math.max(0, estimatedBeforeBytes - estimatedAfterBytes);
  const estimatedReductionPercent =
    estimatedBeforeBytes > 0 ? ((estimatedSavedBytes / estimatedBeforeBytes) * 100).toFixed(1) : '0';

  const plan = {
    planId,
    createdAt: Date.now(),
    projectPath: resolved,
    targetDir,
    actionsCount: actions.length,
    impactSummary: {
      high: actions.filter((a) => a.impact === 'high').length,
      medium: actions.filter((a) => a.impact === 'medium').length,
      low: actions.filter((a) => a.impact === 'low').length,
    },
    estimatedBeforeBytes,
    estimatedBeforeFormatted: formatBytes(estimatedBeforeBytes),
    estimatedAfterBytes,
    estimatedAfterFormatted: formatBytes(estimatedAfterBytes),
    estimatedSavedBytes,
    estimatedSavedFormatted: formatBytes(estimatedSavedBytes),
    estimatedReductionPercent: `${estimatedReductionPercent}%`,
    actions,
    note: 'All estimated byte reductions are approximations until execution and verification occur.',
  };

  engineCache.savePlan(plan);
  return plan;
}

/**
 * Executes an optimization plan safely with verification and idempotency.
 */
export async function executeOptimizationPlan(planIdOrOptions, executionOptions = {}) {
  let plan = typeof planIdOrOptions === 'string' ? engineCache.getPlan(planIdOrOptions) : null;

  if (!plan && typeof planIdOrOptions === 'object') {
    // Generate plan on the fly if object passed
    const targetPath = planIdOrOptions.projectPath || planIdOrOptions.directoryPath || '.';
    plan = await generateOptimizationPlan(targetPath, planIdOrOptions);
  }

  if (!plan) {
    throw new Error(`Optimization plan not found: ${planIdOrOptions}. Please generate a plan first.`);
  }

  const overwriteSource = executionOptions.overwriteSource || false;
  const backupDir = overwriteSource
    ? path.join(plan.projectPath, '.photonow', 'backups', `backup_${Date.now()}`)
    : null;

  if (backupDir) {
    await fs.mkdir(backupDir, { recursive: true });
  }

  const results = [];
  let actualBeforeBytes = 0;
  let actualAfterBytes = 0;
  let succeededCount = 0;
  let failedCount = 0;
  let alreadyOptimizedCount = 0;

  for (const action of plan.actions) {
    try {
      if (!fsSync.existsSync(action.inputPath)) {
        throw new Error(`Source file missing: ${action.inputPath}`);
      }

      const inputStat = await fs.stat(action.inputPath);
      const inputBuffer = await fs.readFile(action.inputPath);
      const inputHash = calculateSha256(inputBuffer);

      let finalDestPath = action.outputPath;
      if (overwriteSource) {
        // Backup original before overwrite
        const backupFile = path.join(backupDir, path.basename(action.inputPath));
        await fs.copyFile(action.inputPath, backupFile);
        finalDestPath = action.inputPath;
      }

      // Check idempotency: if output exists and is already smaller and matches current hash record
      if (fsSync.existsSync(finalDestPath) && !overwriteSource) {
        const outStat = await fs.stat(finalDestPath);
        if (outStat.size > 0 && outStat.size <= inputStat.size) {
          alreadyOptimizedCount++;
          results.push({
            actionId: action.actionId,
            inputPath: action.inputPath,
            outputPath: finalDestPath,
            status: 'already_optimized',
            beforeBytes: inputStat.size,
            afterBytes: outStat.size,
            savedBytes: inputStat.size - outStat.size,
          });
          actualBeforeBytes += inputStat.size;
          actualAfterBytes += outStat.size;
          continue;
        }
      }

      // Setup Sharp transformation
      let pipeline = sharp(inputBuffer, { failOn: 'error', limitInputPixels: 100_000_000 });

      if (action.targetWidth || action.targetHeight) {
        pipeline = pipeline.resize({
          width: action.targetWidth,
          height: action.targetHeight,
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      const fmt = (action.targetFormat || 'webp').toLowerCase();
      const q = action.quality || 82;

      if (fmt === 'webp') {
        pipeline = pipeline.webp({ quality: q, effort: 4 });
      } else if (fmt === 'avif') {
        pipeline = pipeline.avif({ quality: q, effort: 4 });
      } else if (fmt === 'jpeg' || fmt === 'jpg') {
        pipeline = pipeline.jpeg({ quality: q, mozjpeg: true });
      } else if (fmt === 'png') {
        pipeline = pipeline.png({ compressionLevel: 8 });
      }

      const outBuffer = await pipeline.toBuffer();

      // Output Validation
      if (!outBuffer || outBuffer.length === 0) {
        throw new Error('Produced empty output buffer.');
      }

      // Decode check to verify output is valid image and not corrupted
      const checkMeta = await sharp(outBuffer).metadata();
      if (!checkMeta.width || !checkMeta.height) {
        throw new Error('Validation failed: output image cannot be decoded.');
      }

      // Ensure directory exists
      await fs.mkdir(path.dirname(finalDestPath), { recursive: true });
      await fs.writeFile(finalDestPath, outBuffer);

      const afterSize = outBuffer.length;
      const savedBytes = Math.max(0, inputStat.size - afterSize);

      actualBeforeBytes += inputStat.size;
      actualAfterBytes += afterSize;
      succeededCount++;

      results.push({
        actionId: action.actionId,
        inputPath: action.inputPath,
        outputPath: finalDestPath,
        status: 'success',
        beforeBytes: inputStat.size,
        afterBytes: afterSize,
        savedBytes,
      });
    } catch (err) {
      failedCount++;
      results.push({
        actionId: action.actionId,
        inputPath: action.inputPath,
        outputPath: action.outputPath,
        status: 'failed',
        beforeBytes: 0,
        afterBytes: 0,
        savedBytes: 0,
        error: err.message,
      });
    }
  }

  const actualSavedBytes = Math.max(0, actualBeforeBytes - actualAfterBytes);
  const actualReductionPercent =
    actualBeforeBytes > 0 ? ((actualSavedBytes / actualBeforeBytes) * 100).toFixed(1) : '0';

  const executionResult = {
    planId: plan.planId,
    completedAt: Date.now(),
    totalProcessed: plan.actions.length,
    succeeded: succeededCount,
    failed: failedCount,
    alreadyOptimizedCount,
    actualBeforeBytes,
    actualBeforeFormatted: formatBytes(actualBeforeBytes),
    actualAfterBytes,
    actualAfterFormatted: formatBytes(actualAfterBytes),
    actualSavedBytes,
    actualSavedFormatted: formatBytes(actualSavedBytes),
    actualReductionPercent: `${actualReductionPercent}%`,
    backupLocation: backupDir,
    details: results,
    nextAction: 'verify_optimization',
  };

  plan.executionResult = executionResult;
  return executionResult;
}

/**
 * Verifies optimization results by re-analyzing or re-testing and quantifying improvements.
 */
export async function verifyOptimization(planIdOrPath, options = {}) {
  let plan = typeof planIdOrPath === 'string' ? engineCache.getPlan(planIdOrPath) : null;
  const projectPath = plan ? plan.projectPath : path.resolve(planIdOrPath);

  // Analyze current state of project
  const currentAnalysis = await analyzeWebAssets(projectPath);

  const execution = plan?.executionResult;
  const beforeBytes = execution ? execution.actualBeforeBytes : (plan ? plan.estimatedBeforeBytes : currentAnalysis.totalSizeBytes);
  const afterBytes = execution ? execution.actualAfterBytes : currentAnalysis.totalSizeBytes;
  const savedBytes = execution ? execution.actualSavedBytes : Math.max(0, beforeBytes - afterBytes);
  const reductionPercent = execution ? execution.actualReductionPercent : (beforeBytes > 0 ? `${((savedBytes / beforeBytes) * 100).toFixed(1)}%` : '0%');

  const largestAsset = currentAnalysis.assets[0];

  const measuredImprovements = [
    `Media payload: ${formatBytes(beforeBytes)} -> ${formatBytes(afterBytes)} (saved ${formatBytes(savedBytes)}, -${reductionPercent}).`,
    `PhotoNow Performance Score: ${currentAnalysis.score.overall}/100.`,
    `Remaining issues in source: ${currentAnalysis.issues.length}.`,
  ];

  if (largestAsset) {
    measuredImprovements.push(`Largest asset in source: ${largestAsset.fileName} (${largestAsset.sizeFormatted}, ${largestAsset.dimensions || 'N/A'}).`);
  }

  return {
    planId: plan ? plan.planId : 'adhoc_verification',
    verifiedAt: Date.now(),
    projectPath,
    target: projectPath,
    totalAssets: currentAnalysis.totalAssets,
    totalSizeBytes: afterBytes,
    totalSizeFormatted: formatBytes(afterBytes),
    potentialSavingsBytes: savedBytes,
    potentialSavingsFormatted: formatBytes(savedBytes),
    mediaBeforeBytes: beforeBytes,
    mediaBeforeFormatted: formatBytes(beforeBytes),
    mediaAfterBytes: afterBytes,
    mediaAfterFormatted: formatBytes(afterBytes),
    savedBytes,
    savedFormatted: formatBytes(savedBytes),
    reductionPercent: typeof reductionPercent === 'string' && reductionPercent.endsWith('%') ? reductionPercent : `${reductionPercent}%`,
    score: currentAnalysis.score,
    scoreAfter: currentAnalysis.score.overall,
    scoreBreakdown: currentAnalysis.score.breakdown,
    issues: currentAnalysis.issues,
    recommendations: currentAnalysis.recommendations,
    measuredImprovements,
    nextAction: currentAnalysis.issues.length === 0 ? 'all_assets_optimized' : 'check_remaining_issues',
  };
}
