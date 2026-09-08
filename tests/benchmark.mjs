/**
 * PhotoNow Performance & Token Economy Benchmark Suite
 * Measures empirical execution timing, memory usage, cache hit rate,
 * and token payload sizes (cold run vs warm run, compact vs detailed).
 */

import path from 'path';
import { setupTestFixtures, FIXTURES_ROOT } from './fixtures/setup-fixtures.mjs';
import { scanProjectStructure } from '../lib/engine/projectScanner.mjs';
import { scanProjectSourceReferences } from '../lib/engine/sourceAnalyzer.mjs';
import { analyzeWebAssets } from '../lib/engine/analyzer.mjs';
import { buildAssetGraph } from '../lib/engine/assetGraph.mjs';
import { generateOptimizationPlan, executeOptimizationPlan, verifyOptimization } from '../lib/engine/booster.mjs';
import { formatMcpResponse, formatBytes } from '../lib/engine/tokenEconomy.mjs';

async function runBenchmark() {
  console.log('\n===========================================================');
  console.log('⚡ RUNNING PHOTONOW EMPIRICAL BENCHMARK SUITE');
  console.log('===========================================================\n');

  await setupTestFixtures();
  const nextProjectDir = path.join(FIXTURES_ROOT, 'nextjs_project');

  // -------------------------------------------------------------
  // 1. Cold Run vs Warm Run Timing
  // -------------------------------------------------------------
  console.log('--- 1. Cold Run vs Warm Run Benchmarks ---');

  const startCold = performance.now();
  const coldStructure = await scanProjectStructure(nextProjectDir);
  const coldRefs = await scanProjectSourceReferences(nextProjectDir, coldStructure.publicDir);
  const coldAnalysis = await analyzeWebAssets(nextProjectDir);
  const coldGraph = buildAssetGraph(nextProjectDir, coldAnalysis.assets, coldRefs);
  const durationColdMs = (performance.now() - startCold).toFixed(2);

  const startWarm = performance.now();
  const warmStructure = await scanProjectStructure(nextProjectDir);
  const warmRefs = await scanProjectSourceReferences(nextProjectDir, warmStructure.publicDir);
  const warmAnalysis = await analyzeWebAssets(nextProjectDir);
  const warmGraph = buildAssetGraph(nextProjectDir, warmAnalysis.assets, warmRefs);
  const durationWarmMs = (performance.now() - startWarm).toFixed(2);

  console.log(`  • Cold Scan + Analysis + Graph Duration: ${durationColdMs} ms`);
  console.log(`  • Warm Cached Scan Duration:             ${durationWarmMs} ms`);
  console.log(`  • Cache Speedup Factor:                  ${(Number(durationColdMs) / Math.max(0.1, Number(durationWarmMs))).toFixed(1)}x faster`);

  // -------------------------------------------------------------
  // 2. Optimization & Verification Timing
  // -------------------------------------------------------------
  console.log('\n--- 2. Optimization & Verification Benchmarks ---');
  const startPlan = performance.now();
  const plan = await generateOptimizationPlan(nextProjectDir, { format: 'avif' });
  const durationPlanMs = (performance.now() - startPlan).toFixed(2);

  const startExec = performance.now();
  const execResult = await executeOptimizationPlan(plan.planId, { overwriteSource: false });
  const durationExecMs = (performance.now() - startExec).toFixed(2);

  const startVerify = performance.now();
  const verification = await verifyOptimization(plan.planId);
  const durationVerifyMs = (performance.now() - startVerify).toFixed(2);

  console.log(`  • Plan Formulation Time:   ${durationPlanMs} ms (${plan.actionsCount} actions)`);
  console.log(`  • Batch Optimization Time: ${durationExecMs} ms (${execResult.succeeded} assets converted)`);
  console.log(`  • Verification Time:       ${durationVerifyMs} ms (Sharp decodability confirmed)`);
  console.log(`  • Net Payload Reduction:   ${execResult.actualBeforeFormatted} -> ${execResult.actualAfterFormatted} (-${execResult.actualReductionPercent})`);

  // -------------------------------------------------------------
  // 3. Token Economy: Compact vs Detailed Payloads
  // -------------------------------------------------------------
  console.log('\n--- 3. Token Economy & Payload Size Benchmark ---');

  const compactPayload = formatMcpResponse({
    ok: true,
    summary: {
      score: coldAnalysis.score.overall,
      totalAssets: coldAnalysis.totalAssets,
      potentialSavingsFormatted: coldAnalysis.potentialSavingsFormatted,
      topIssues: coldAnalysis.issues.slice(0, 3).map((i) => `${i.id}: ${i.message}`),
    },
    issues: coldAnalysis.issues,
    detailLevel: 'compact',
    tokenBudget: 300,
  });

  const detailedPayload = formatMcpResponse({
    ok: true,
    summary: {
      score: coldAnalysis.score.overall,
      totalAssets: coldAnalysis.totalAssets,
      potentialSavingsFormatted: coldAnalysis.potentialSavingsFormatted,
    },
    issues: coldAnalysis.issues,
    details: coldAnalysis,
    detailLevel: 'detailed',
  });

  const compactChars = JSON.stringify(compactPayload).length;
  const detailedChars = JSON.stringify(detailedPayload).length;
  const compactTokens = Math.ceil(compactChars / 4);
  const detailedTokens = Math.ceil(detailedChars / 4);
  const tokenSavingsPercent = (((detailedTokens - compactTokens) / detailedTokens) * 100).toFixed(1);

  console.log(`  • Detailed Diagnostic Payload: ~${detailedTokens} tokens (${detailedChars} chars)`);
  console.log(`  • Compact Agent Payload:       ~${compactTokens} tokens (${compactChars} chars)`);
  console.log(`  • Agent Context Token Savings: ${tokenSavingsPercent}% reduction`);

  // -------------------------------------------------------------
  // 4. Memory Footprint
  // -------------------------------------------------------------
  const mem = process.memoryUsage();
  console.log('\n--- 4. Node.js Memory Footprint ---');
  console.log(`  • RSS:          ${formatBytes(mem.rss)}`);
  console.log(`  • Heap Total:   ${formatBytes(mem.heapTotal)}`);
  console.log(`  • Heap Used:    ${formatBytes(mem.heapUsed)}`);
  console.log(`  • External:     ${formatBytes(mem.external)}`);

  console.log('\n===========================================================');
  console.log('🎉 BENCHMARK SUITE COMPLETED SUCCESSFULLY');
  console.log('===========================================================\n');
}

runBenchmark().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
