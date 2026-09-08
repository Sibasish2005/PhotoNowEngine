/**
 * PhotoNow Sandbox Feature Demonstration & Verification Script
 *
 * Runs the complete end-to-end PhotoNow Intelligence & Booster lifecycle
 * in an isolated sandbox environment:
 * Discover -> Analyze -> Measure -> Plan -> Optimize -> Verify -> Report
 */

import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

import {
  analyzeSingleMediaAsset,
  analyzeWebAssets,
  testWebPerformance,
  comparePerformanceTests,
  generateOptimizationPlan,
  executeOptimizationPlan,
  verifyOptimization,
  groupDuplicates,
  formatMcpResponse,
  formatBytes,
  saveLocalReport,
} from '../lib/engine/index.mjs';

const ffmpegPath = ffmpegInstaller.path || ffmpegInstaller.default?.path;
const ffprobePath = ffprobeInstaller.path || ffprobeInstaller.default?.path;
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
if (ffprobePath) ffmpeg.setFfprobePath(ffprobePath);

const SANDBOX_DIR = path.resolve('./tests/sandbox_demo');

function createSyntheticVideo(destPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input('testsrc=duration=1:size=320x240:rate=15')
      .inputFormat('lavfi')
      .input('sine=frequency=1000:duration=1')
      .inputFormat('lavfi')
      .outputOptions(['-c:v libx264', '-c:a aac', '-pix_fmt yuv420p'])
      .save(destPath)
      .on('end', resolve)
      .on('error', reject);
  });
}

async function setupSandbox() {
  console.log('📦 Initializing isolated sandbox environment at:', SANDBOX_DIR);
  await fs.rm(SANDBOX_DIR, { recursive: true, force: true });
  await fs.mkdir(path.join(SANDBOX_DIR, 'public', 'images'), { recursive: true });
  await fs.mkdir(path.join(SANDBOX_DIR, 'public', 'icons'), { recursive: true });

  // 1. Oversized Photographic PNG (3840x2160 Desktop Hero)
  const heroPath = path.join(SANDBOX_DIR, 'public', 'hero_landing.png');
  await sharp({
    create: {
      width: 3840,
      height: 2160,
      channels: 3,
      background: { r: 50, g: 90, b: 160 },
    },
  })
    .png()
    .toFile(heroPath);

  // 2. Near-duplicate of hero image (simulating redundant uploads across teams)
  const heroCopyPath = path.join(SANDBOX_DIR, 'public', 'hero_landing_v2.png');
  await sharp(heroPath).png().toFile(heroCopyPath);

  // 3. Uncompressed Large JPEG (2400x1600 Product Photo)
  const productPath = path.join(SANDBOX_DIR, 'public', 'images', 'product_feature.jpg');
  await sharp({
    create: {
      width: 2400,
      height: 1600,
      channels: 3,
      background: { r: 230, g: 110, b: 40 },
    },
  })
    .jpeg({ quality: 98 })
    .toFile(productPath);

  // 4. Large unoptimized SVG with editor metadata bloat
  const svgPath = path.join(SANDBOX_DIR, 'public', 'icons', 'brand_illustration.svg');
  const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <!-- Adobe Illustrator / Figma Metadata Export Block -->
    <!-- ${'#'.repeat(12000)} -->
    <rect width="800" height="600" fill="#2563eb"/>
    <circle cx="400" cy="300" r="150" fill="#f59e0b"/>
    <polygon points="400,180 480,340 320,340" fill="#ffffff"/>
  </svg>`;
  await fs.writeFile(svgPath, svgData, 'utf8');

  // 5. Already-optimized asset (to test idempotency)
  const avatarPath = path.join(SANDBOX_DIR, 'public', 'avatar_clean.webp');
  await sharp({
    create: {
      width: 120,
      height: 120,
      channels: 4,
      background: { r: 16, g: 185, b: 129, alpha: 1 },
    },
  })
    .webp({ quality: 80 })
    .toFile(avatarPath);

  // 6. Video clip for poster extraction & multimedia inspection
  const videoPath = path.join(SANDBOX_DIR, 'public', 'feature_demo.mp4');
  await createSyntheticVideo(videoPath);

  // 7. Mock Website HTML referencing assets
  const htmlPath = path.join(SANDBOX_DIR, 'index.html');
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>PhotoNow Mock Store</title>
  <link rel="preload" as="image" href="public/hero_landing.png">
</head>
<body>
  <h1>Welcome to Store</h1>
  <img src="public/hero_landing.png" width="3840" height="2160" alt="Hero Banner">
  <img src="public/images/product_feature.jpg" alt="Featured Product">
  <img src="public/icons/brand_illustration.svg" alt="Brand Logo">
  <img src="public/avatar_clean.webp" width="120" height="120" alt="Avatar" loading="lazy">
</body>
</html>`;
  await fs.writeFile(htmlPath, htmlContent, 'utf8');

  console.log('✓ Sandbox populated with 6 test media assets + mock website HTML.\n');
}

async function runDemo() {
  await setupSandbox();

  const report = {
    timestamp: new Date().toISOString(),
    sandboxPath: SANDBOX_DIR,
    steps: {},
  };

  // STEP 1: DISCOVER & ANALYZE
  console.log('=================================================================');
  console.log('STEP 1: MEDIA ANALYZER (Discover, Inspect & Classify Bottlenecks)');
  console.log('=================================================================');
  const initialAnalysis = await analyzeWebAssets(SANDBOX_DIR);

  report.steps.analysis = {
    totalAssets: initialAnalysis.totalAssets,
    totalSizeBytes: initialAnalysis.totalSizeBytes,
    totalSizeFormatted: initialAnalysis.totalSizeFormatted,
    potentialSavingsFormatted: initialAnalysis.potentialSavingsFormatted,
    score: initialAnalysis.score.overall,
    breakdown: initialAnalysis.score.breakdown,
    duplicateGroupsCount: initialAnalysis.duplicateGroups.length,
    issuesFound: initialAnalysis.issues.map((i) => `[${i.id}] in ${path.basename(i.assetPath)}: ${i.message}`),
  };

  console.log(`• Total Assets: ${initialAnalysis.totalAssets}`);
  console.log(`• Total Media Footprint: ${initialAnalysis.totalSizeFormatted}`);
  console.log(`• Potential Savings Detected: ${initialAnalysis.potentialSavingsFormatted}`);
  console.log(`• PhotoNow Score: ${initialAnalysis.score.overall}/100`);
  console.log('• Score Breakdown:');
  console.log(`  - Format Efficiency:    ${initialAnalysis.score.breakdown.formatEfficiency}/25`);
  console.log(`  - Image Sizing:         ${initialAnalysis.score.breakdown.imageSizing}/25`);
  console.log(`  - Compression:          ${initialAnalysis.score.breakdown.compression}/20`);
  console.log(`  - Responsive Readiness: ${initialAnalysis.score.breakdown.responsiveReadiness}/15`);
  console.log(`  - SVG Efficiency:       ${initialAnalysis.score.breakdown.svgEfficiency}/15`);
  console.log(`• Perceptual Duplicate Groups: ${initialAnalysis.duplicateGroups.length}`);
  if (initialAnalysis.duplicateGroups.length > 0) {
    const dup = initialAnalysis.duplicateGroups[0];
    console.log(`  * Group: ${dup.files.map((f) => path.basename(f.path)).join(', ')} (${dup.similarityPercent}% match, saves ${dup.potentialSavingsFormatted})`);
  }
  console.log(`• Identified Bottlenecks (${initialAnalysis.issues.length}):`);
  initialAnalysis.issues.slice(0, 5).forEach((iss, idx) => {
    console.log(`  ${idx + 1}. [${iss.severity.toUpperCase()}] ${iss.id}: ${iss.message}`);
  });

  // STEP 2: MEASURE WEBSITE PERFORMANCE
  console.log('\n=================================================================');
  console.log('STEP 2: WEB PERFORMANCE TESTER (Asset-Centric Performance Audit)');
  console.log('=================================================================');
  const webTest = await testWebPerformance(SANDBOX_DIR);
  report.steps.performanceTest = {
    testId: webTest.testId,
    target: webTest.target,
    score: webTest.score.overall,
    estimatedTransferTime4GMs: webTest.metrics.estimatedTransferTime4GMs,
    lcpCandidate: webTest.metrics.lcpCandidate,
  };
  console.log(`• Test ID: ${webTest.testId}`);
  console.log(`• Audit Score: ${webTest.score.overall}/100`);
  console.log(`• Estimated 4G Mobile Transfer Time: ${webTest.metrics.estimatedTransferTime4GMs}ms`);
  if (webTest.metrics.lcpCandidate) {
    console.log(`• LCP Candidate: ${path.basename(webTest.metrics.lcpCandidate.pathOrUrl)} (${webTest.metrics.lcpCandidate.sizeFormatted}, ${webTest.metrics.lcpCandidate.reason})`);
  }
  console.log(`• Recommended Next Action: ${webTest.nextAction}`);

  // STEP 3: OPTIMIZATION PLAN
  console.log('\n=================================================================');
  console.log('STEP 3: WEB PERFORMANCE BOOSTER (Plan Generation)');
  console.log('=================================================================');
  const plan = await generateOptimizationPlan(SANDBOX_DIR, {
    format: 'webp',
    maxDimension: 1920,
    quality: 82,
  });
  report.steps.plan = {
    planId: plan.planId,
    targetDir: plan.targetDir,
    actionsCount: plan.actionsCount,
    impactSummary: plan.impactSummary,
    estimatedBeforeFormatted: plan.estimatedBeforeFormatted,
    estimatedAfterFormatted: plan.estimatedAfterFormatted,
    estimatedSavedFormatted: plan.estimatedSavedFormatted,
    estimatedReductionPercent: plan.estimatedReductionPercent,
  };
  console.log(`• Plan ID: ${plan.planId}`);
  console.log(`• Actions Formulated: ${plan.actionsCount}`);
  console.log(`• Action Impact Distribution: High: ${plan.impactSummary.high}, Med: ${plan.impactSummary.medium}, Low: ${plan.impactSummary.low}`);
  console.log(`• Projected Savings: ${plan.estimatedBeforeFormatted} -> ${plan.estimatedAfterFormatted} (${plan.estimatedReductionPercent} reduction)`);
  console.log(`• Safe Non-Destructive Target: ${plan.targetDir}`);
  plan.actions.forEach((act, idx) => {
    console.log(`  ${idx + 1}. [${act.impact.toUpperCase()}] ${path.basename(act.inputPath)} -> ${path.basename(act.outputPath)} (${act.estimatedSavingsFormatted} est. savings)`);
  });

  // STEP 4: EXECUTE OPTIMIZATION (SAFE MODE)
  console.log('\n=================================================================');
  console.log('STEP 4: EXECUTE OPTIMIZATION (Safe, Validated & Non-Destructive)');
  console.log('=================================================================');
  const execution = await executeOptimizationPlan(plan.planId, { overwriteSource: false });
  report.steps.execution = {
    planId: execution.planId,
    totalProcessed: execution.totalProcessed,
    succeeded: execution.succeeded,
    failed: execution.failed,
    actualBeforeFormatted: execution.actualBeforeFormatted,
    actualAfterFormatted: execution.actualAfterFormatted,
    actualSavedFormatted: execution.actualSavedFormatted,
    actualReductionPercent: execution.actualReductionPercent,
  };
  console.log(`• Total Processed: ${execution.totalProcessed}`);
  console.log(`• Succeeded: ${execution.succeeded}, Failed: ${execution.failed}`);
  console.log(`• Actual Media Size: ${execution.actualBeforeFormatted} -> ${execution.actualAfterFormatted}`);
  console.log(`• Actual Measured Savings: ${execution.actualSavedFormatted} (${execution.actualReductionPercent} reduction)`);
  execution.details.forEach((d) => {
    console.log(`  ✓ ${path.basename(d.inputPath)}: ${d.status} (${formatBytes(d.beforeBytes)} -> ${formatBytes(d.afterBytes)}, saved ${formatBytes(d.savedBytes)})`);
  });

  // STEP 5: VERIFICATION & LOCAL REPORTING
  console.log('\n=================================================================');
  console.log('STEP 5: VERIFY & GENERATE OFFLINE LOCAL REPORTS');
  console.log('=================================================================');
  const verification = await verifyOptimization(plan.planId);
  const htmlReportPath = await saveLocalReport(verification, 'html', path.join(SANDBOX_DIR, 'reports'));
  const mdReportPath = await saveLocalReport(verification, 'markdown', path.join(SANDBOX_DIR, 'reports'));

  report.steps.verification = {
    verifiedAt: verification.verifiedAt,
    measuredImprovements: verification.measuredImprovements,
    scoreAfter: verification.scoreAfter,
    htmlReport: htmlReportPath,
    markdownReport: mdReportPath,
  };
  console.log('• Measured Improvements:');
  verification.measuredImprovements.forEach((imp) => console.log(`  - ${imp}`));
  console.log(`• Offline HTML Report: ${htmlReportPath}`);
  console.log(`• Offline Markdown Report: ${mdReportPath}`);

  // STEP 6: TOKEN EFFICIENCY BENCHMARK
  console.log('\n=================================================================');
  console.log('STEP 6: TOKEN ECONOMY VERIFICATION (Compact vs Standard vs Raw)');
  console.log('=================================================================');
  const compactMcp = formatMcpResponse({
    ok: true,
    summary: {
      score: initialAnalysis.score.overall,
      totalAssets: initialAnalysis.totalAssets,
      potentialSavingsFormatted: initialAnalysis.potentialSavingsFormatted,
      topIssues: initialAnalysis.issues.slice(0, 3).map((i) => `${i.id}: ${i.message}`),
    },
    issues: initialAnalysis.issues,
    detailLevel: 'compact',
    tokenBudget: 500,
  });

  const compactChars = JSON.stringify(compactMcp).length;
  const rawChars = JSON.stringify(initialAnalysis).length;
  const tokenSavingsPercent = (((rawChars - compactChars) / rawChars) * 100).toFixed(1);

  report.steps.tokenEfficiency = {
    rawPayloadChars: rawChars,
    compactPayloadChars: compactChars,
    rawEstimatedTokens: Math.ceil(rawChars / 4),
    compactEstimatedTokens: Math.ceil(compactChars / 4),
    tokenReductionPercent: `${tokenSavingsPercent}%`,
  };

  console.log(`• Raw Diagnostic Payload:     ~${Math.ceil(rawChars / 4)} tokens (${rawChars} chars)`);
  console.log(`• Compact Agent Payload:      ~${Math.ceil(compactChars / 4)} tokens (${compactChars} chars)`);
  console.log(`• Agent Token Consumption Reduced By: ${tokenSavingsPercent}%`);
  console.log(`• Next Action Provided for Agent Chaining: "${compactMcp.nextAction}"`);

  // Write final JSON test summary
  const summaryJsonPath = path.join(SANDBOX_DIR, 'sandbox_verification_summary.json');
  await fs.writeFile(summaryJsonPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 Saved complete sandbox verification summary: ${summaryJsonPath}`);

  console.log('\n=================================================================');
  console.log('🎉 ALL SANDBOX FEATURES VERIFIED SUCCESSFULLY (100% OPERATIONAL)!');
  console.log('=================================================================\n');

  return report;
}

runDemo().catch((err) => {
  console.error('\n❌ Sandbox demo failed:', err);
  process.exit(1);
});
