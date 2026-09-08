/**
 * PhotoNow Agentic Intelligence Unit Test Suite
 * Validates Project Scanner, Source Code Analyzer, Asset Dependency Graph,
 * Source Code Patch Generator, Performance Budgets, and Git Regression Guard.
 */

import assert from 'assert';
import path from 'path';
import fs from 'fs/promises';
import { setupTestFixtures, FIXTURES_ROOT } from '../fixtures/setup-fixtures.mjs';

import { scanProjectStructure } from '../../lib/engine/projectScanner.mjs';
import { scanProjectSourceReferences, extractReferencesFromContent, deriveRouteFromFile, deriveComponentFromFile } from '../../lib/engine/sourceAnalyzer.mjs';
import { buildAssetGraph } from '../../lib/engine/assetGraph.mjs';
import { analyzeWebAssets } from '../../lib/engine/analyzer.mjs';
import { generateOptimizationPlan } from '../../lib/engine/booster.mjs';
import { generateSourcePatch, applySourcePatch, rollbackOperation } from '../../lib/engine/patchGenerator.mjs';
import { evaluatePerformanceBudget, loadProjectBudget } from '../../lib/engine/budget.mjs';
import { checkGitPerformanceRegression, saveBaseline, compareWithBaseline } from '../../lib/engine/regression.mjs';
import { verifyRuntimePerformance } from '../../lib/engine/browserVerifier.mjs';

async function runUnitTests() {
  console.log('\n===========================================================');
  console.log('🧪 RUNNING PHOTONOW AGENTIC INTELLIGENCE UNIT TESTS');
  console.log('===========================================================\n');

  // Setup fixtures
  await setupTestFixtures();
  const nextProjectDir = path.join(FIXTURES_ROOT, 'nextjs_project');
  const viteProjectDir = path.join(FIXTURES_ROOT, 'vite_project');

  // -------------------------------------------------------------
  // Test 1: Project Scanner
  // -------------------------------------------------------------
  console.log('--- 1. Testing Project Scanner ---');
  const nextScan = await scanProjectStructure(nextProjectDir);
  assert.strictEqual(nextScan.framework, 'nextjs', 'Should detect Next.js framework');
  assert.strictEqual(nextScan.frameworkVariant, 'app_router', 'Should detect app router');
  assert.ok(nextScan.sourceFilesCount >= 3, 'Should count source files');
  assert.ok(nextScan.assetFilesCount >= 3, 'Should count asset files');
  console.log(`  ✓ Next.js Scanner: detected framework=${nextScan.framework}, variant=${nextScan.frameworkVariant}, sources=${nextScan.sourceFilesCount}, assets=${nextScan.assetFilesCount}`);

  const viteScan = await scanProjectStructure(viteProjectDir);
  assert.strictEqual(viteScan.framework, 'vite', 'Should detect Vite framework');
  console.log(`  ✓ Vite Scanner: detected framework=${viteScan.framework}`);
  console.log('  ✅ PASS: Project Scanner successfully categorized web projects\n');

  // -------------------------------------------------------------
  // Test 2: Source Code Asset Reference Analyzer
  // -------------------------------------------------------------
  console.log('--- 2. Testing Source Analyzer ---');
  const nextRefs = await scanProjectSourceReferences(nextProjectDir, nextScan.publicDir);
  assert.ok(nextRefs.length >= 3, `Expected at least 3 source references, got ${nextRefs.length}`);

  const heroRef = nextRefs.find((r) => r.assetRef.includes('hero_banner.png'));
  assert.ok(heroRef, 'Should find reference to hero_banner.png');
  assert.strictEqual(heroRef.tagOrImportType, 'next_image');
  assert.strictEqual(heroRef.renderedWidth, 1280);
  assert.strictEqual(heroRef.renderedHeight, 720);
  assert.strictEqual(heroRef.isLcpCandidate, true);
  console.log(`  ✓ Reference extracted: tag=${heroRef.tagOrImportType}, rendered=${heroRef.renderedWidth}x${heroRef.renderedHeight}, LCP candidate=${heroRef.isLcpCandidate}`);

  const routeDerived = deriveRouteFromFile(path.join(nextProjectDir, 'app', 'pricing', 'page.tsx'), nextProjectDir);
  assert.strictEqual(routeDerived, '/pricing', 'Should derive /pricing route');
  const compDerived = deriveComponentFromFile(path.join(nextProjectDir, 'components', 'Hero.tsx'));
  assert.strictEqual(compDerived, 'Hero', 'Should derive Hero component name');
  console.log(`  ✓ Route & Component derivation: route=${routeDerived}, comp=${compDerived}`);
  console.log('  ✅ PASS: Source Code Analyzer parsed references with fidelity\n');

  // -------------------------------------------------------------
  // Test 3: Asset Dependency Graph
  // -------------------------------------------------------------
  console.log('--- 3. Testing Asset Dependency Graph ---');
  const analysis = await analyzeWebAssets(nextProjectDir);
  const graph = buildAssetGraph(nextProjectDir, analysis.assets, nextRefs);
  const summary = graph.getSummary();
  assert.ok(summary.nodesCount > 5, 'Graph should have nodes');
  assert.ok(summary.edgesCount > 3, 'Graph should have edges');
  console.log(`  ✓ Graph Summary: nodes=${summary.nodesCount}, edges=${summary.edgesCount}, referenced=${summary.referencedAssetsCount}, unreferenced=${summary.unreferencedAssetsCount}`);

  // Test getAssetUsage
  const heroUsage = graph.getAssetUsage('hero_banner.png');
  assert.ok(heroUsage, 'Should find hero_banner usage');
  assert.strictEqual(heroUsage.isLcpCandidate, true);
  assert.strictEqual(heroUsage.isUnused, false);
  console.log(`  ✓ Asset Usage: hero_banner used in ${heroUsage.referenceCount} places, isLcp=${heroUsage.isLcpCandidate}`);

  // Test dead asset detection
  const unused = graph.findUnusedAssets();
  assert.ok(unused.length >= 1, 'Should find at least 1 unused asset');
  const deadHero = unused.find((u) => u.relativePath.includes('dead_hero_archive'));
  assert.ok(deadHero, 'Should detect dead_hero_archive.jpg');
  assert.strictEqual(deadHero.confidence, 'SAFE', 'Static public asset without references should be SAFE to review');
  console.log(`  ✓ Dead Asset Detected: ${deadHero.relativePath} (${deadHero.sizeFormatted}) [confidence: ${deadHero.confidence}]`);

  // Test shared asset detection
  const shared = graph.findSharedAssets();
  const sharedBadge = shared.find((s) => s.relativePath.includes('shared_badge.png'));
  assert.ok(sharedBadge, 'Should detect shared_badge.png as shared across routes/components');
  console.log(`  ✓ Shared Asset Detected: ${sharedBadge.relativePath} (used in ${sharedBadge.routesCount} routes, ${sharedBadge.componentsCount} components)`);
  console.log('  ✅ PASS: Asset Dependency Graph and dead/shared asset intelligence verified\n');

  // -------------------------------------------------------------
  // Test 4: Source Code Patch Generator & Rollback
  // -------------------------------------------------------------
  console.log('--- 4. Testing Source Code Patch Generator & Rollback ---');
  const plan = await generateOptimizationPlan(nextProjectDir, { format: 'avif' });
  assert.ok(plan.actions.length > 0, 'Plan should contain actions');

  // Generate Dry-Run patch
  const patch = await generateSourcePatch(plan, graph, { dryRun: true });
  assert.ok(patch.actions.length > 0, 'Should generate patch actions');
  assert.ok(patch.unifiedDiff.includes('hero_banner.avif'), 'Diff should replace extension with .avif');
  assert.strictEqual(patch.isDryRun, true);
  console.log(`  ✓ Patch Actions: generated ${patch.actions.length} code diffs across ${patch.affectedFiles.length} file(s)`);
  console.log(`  ✓ Unified Diff Preview:\n${patch.unifiedDiff.split('\n').slice(0, 6).join('\n')}`);

  // Apply Patch to disk
  const manifest = await applySourcePatch(patch, { projectRoot: nextProjectDir, dryRun: false });
  assert.ok(manifest.operationId, 'Should generate operationId');
  assert.strictEqual(manifest.canRollback, true);

  // Check file was modified
  const modifiedContent = await fs.readFile(path.join(nextProjectDir, 'app', 'page.tsx'), 'utf8');
  assert.ok(modifiedContent.includes('hero_banner.avif'), 'File on disk should now contain hero_banner.avif');
  console.log(`  ✓ Applied source patch on disk: manifest=${manifest.operationId}`);

  // Rollback operation
  const rollbackRes = await rollbackOperation(manifest.operationId, nextProjectDir);
  assert.strictEqual(rollbackRes.success, true);
  const revertedContent = await fs.readFile(path.join(nextProjectDir, 'app', 'page.tsx'), 'utf8');
  assert.ok(revertedContent.includes('hero_banner.png'), 'File should be restored to hero_banner.png');
  console.log(`  ✓ Rollback executed: restored ${rollbackRes.restoredSourcesCount} file(s) cleanly`);
  console.log('  ✅ PASS: Source code patching and manifest rollback verified\n');

  // -------------------------------------------------------------
  // Test 5: Performance Budgets
  // -------------------------------------------------------------
  console.log('--- 5. Testing Performance Budget Engine ---');
  const strictBudget = {
    media: {
      maxPageBytes: 50000, // 50 KB strict limit (will fail)
      maxImageBytes: 30000,
    },
  };
  const budgetEvaluation = evaluatePerformanceBudget({
    target: nextProjectDir,
    assets: analysis.assets,
    totalSizeBytes: analysis.totalSizeBytes,
    budgetConfig: strictBudget,
  });
  assert.strictEqual(budgetEvaluation.status, 'FAIL', 'Strict budget should FAIL');
  assert.ok(budgetEvaluation.failedCount >= 1, 'Should record failed rules');
  console.log(`  ✓ Budget Evaluation: status=${budgetEvaluation.status} (${budgetEvaluation.passedCount} passed, ${budgetEvaluation.failedCount} failed)`);
  console.log('  ✅ PASS: Performance budget evaluation verified\n');

  // -------------------------------------------------------------
  // Test 6: Git Regression Guard & Baselines
  // -------------------------------------------------------------
  console.log('--- 6. Testing Git Regression Guard & Baselines ---');
  const gitReport = await checkGitPerformanceRegression(process.cwd());
  assert.strictEqual(gitReport.hasGit, true);
  console.log(`  ✓ Git Regression: git repo detected=${gitReport.hasGit}, branch=${gitReport.branch}, head=${gitReport.headCommit}`);

  // Baseline save and compare
  const baselinePath = await saveBaseline(process.cwd(), {
    totalSizeBytes: 1000000,
    score: 80,
  });
  assert.ok(baselinePath, 'Baseline should save');

  const comparison = await compareWithBaseline(process.cwd(), {
    totalSizeBytes: 1500000,
    score: 70,
  });
  assert.strictEqual(comparison.baselineFound, true);
  assert.strictEqual(comparison.status, 'regression', 'Higher bytes and lower score should trigger regression');
  console.log(`  ✓ Baseline Comparison: status=${comparison.status}, delta=${comparison.comparison.mediaBytes.deltaFormatted}`);
  console.log('  ✅ PASS: Git performance regression guard & baselines verified\n');

  // -------------------------------------------------------------
  // Test 7: Runtime Browser Verification (Simulated vs Observed)
  // -------------------------------------------------------------
  console.log('--- 7. Testing Browser Runtime Verification ---');
  const runtimeResult = await verifyRuntimePerformance('http://localhost:99999'); // non-existent live port
  assert.strictEqual(runtimeResult.measurementType, 'SIMULATED', 'Unreachable server should transparently return SIMULATED');
  assert.ok(runtimeResult.lcpMs > 0);
  console.log(`  ✓ Runtime measurement: type=${runtimeResult.measurementType}, LCP=${runtimeResult.lcpMs}ms (transparent simulated fallback)`);
  console.log('  ✅ PASS: Browser runtime verification verified\n');

  console.log('===========================================================');
  console.log('🎉 ALL AGENTIC INTELLIGENCE UNIT TESTS PASSED 100%!');
  console.log('===========================================================\n');
}

runUnitTests().catch((err) => {
  console.error('\n❌ Unit test failed:', err);
  process.exit(1);
});
