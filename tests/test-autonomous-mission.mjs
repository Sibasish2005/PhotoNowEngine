/**
 * PhotoNow Autonomous Mission End-to-End Test Suite
 * Validates the complete 10-step autonomous loop via `optimizeProject`.
 */

import assert from 'assert';
import path from 'path';
import fs from 'fs/promises';
import { setupTestFixtures, FIXTURES_ROOT } from './fixtures/setup-fixtures.mjs';
import { optimizeProject } from '../lib/engine/mission.mjs';
import { rollbackOperation } from '../lib/engine/patchGenerator.mjs';
import { formatMcpResponse } from '../lib/engine/tokenEconomy.mjs';

async function runMissionTests() {
  console.log('\n===========================================================');
  console.log('🚀 RUNNING AUTONOMOUS MISSION END-TO-END VERIFICATION');
  console.log('===========================================================\n');

  // 1. Setup fixture project
  await setupTestFixtures();
  const nextProjectDir = path.join(FIXTURES_ROOT, 'nextjs_project');

  console.log('--- Step 1: Running Autonomous Mission in Dry-Run Mode ---');
  const dryRunResult = await optimizeProject({
    projectPath: nextProjectDir,
    dryRun: true,
    format: 'avif',
  });

  assert.strictEqual(dryRunResult.status, 'dry_run_complete');
  assert.ok(dryRunResult.bytesSaved > 0, 'Dry run should estimate savings');
  assert.ok(dryRunResult.sourcePatchesCount > 0, 'Dry run should identify source patches');
  assert.strictEqual(dryRunResult.rollbackAvailable, false, 'Dry run should not generate rollback');
  console.log(`  ✓ Dry-Run Mission Status: ${dryRunResult.status}`);
  console.log(`  ✓ Projected Savings: ${dryRunResult.bytesBeforeFormatted} -> ${dryRunResult.bytesAfterFormatted} (${dryRunResult.assetReductionPercent} reduction)`);
  console.log(`  ✓ Proposed Source Patches: ${dryRunResult.sourcePatchesCount}`);

  // Verify source files were untouched in dry-run
  const preContent = await fs.readFile(path.join(nextProjectDir, 'app', 'page.tsx'), 'utf8');
  assert.ok(preContent.includes('hero_banner.png'), 'Source file should not be modified in dry-run mode');
  console.log('  ✅ PASS: Dry-Run completed safely with zero disk mutations\n');

  console.log('--- Step 2: Executing Full Autonomous Mission with Safe Source Patching ---');
  const missionResult = await optimizeProject({
    projectPath: nextProjectDir,
    dryRun: false,
    format: 'avif',
    applySourcePatches: true,
  });

  assert.strictEqual(missionResult.status, 'verified');
  assert.ok(missionResult.scoreAfter >= missionResult.scoreBefore);
  assert.ok(missionResult.bytesAfter < missionResult.bytesBefore);
  assert.ok(missionResult.appliedPatchesCount > 0, 'Source patches should be applied');
  assert.strictEqual(missionResult.rollbackAvailable, true);
  assert.ok(missionResult.manifestId, 'Should have manifestId');

  console.log(`  ✓ Mission ID: ${missionResult.missionId}`);
  console.log(`  ✓ Media Footprint: ${missionResult.bytesBeforeFormatted} -> ${missionResult.bytesAfterFormatted} (-${missionResult.assetReductionPercent})`);
  console.log(`  ✓ Net Saved: ${missionResult.bytesSavedFormatted}`);
  console.log(`  ✓ Score Change: ${missionResult.scoreBefore} -> ${missionResult.scoreAfter} (+${missionResult.scoreDelta} pts)`);
  console.log(`  ✓ Source Patches Applied: ${missionResult.appliedPatchesCount}`);
  console.log(`  ✓ Rollback Manifest: ${missionResult.manifestId}`);

  // Verify source file on disk was patched
  const postContent = await fs.readFile(path.join(nextProjectDir, 'app', 'page.tsx'), 'utf8');
  assert.ok(postContent.includes('hero_banner.avif'), 'Source file should be patched to use .avif');
  console.log('  ✅ PASS: Autonomous mission executed and source references patched\n');

  console.log('--- Step 3: Verifying Rollback Capability ---');
  const rollbackRes = await rollbackOperation(missionResult.manifestId, nextProjectDir);
  assert.strictEqual(rollbackRes.success, true);
  const revertedContent = await fs.readFile(path.join(nextProjectDir, 'app', 'page.tsx'), 'utf8');
  assert.ok(revertedContent.includes('hero_banner.png'), 'Source file should be reverted to original');
  console.log(`  ✓ Rollback verified: restored ${rollbackRes.restoredSourcesCount} source file(s)`);
  console.log('  ✅ PASS: Complete rollback restored project to original state\n');

  console.log('--- Step 4: Verifying Compact Token Contract for AI Agents ---');
  const compactResponse = formatMcpResponse({
    ok: true,
    summary: {
      status: missionResult.status,
      missionId: missionResult.missionId,
      scoreBefore: missionResult.scoreBefore,
      scoreAfter: missionResult.scoreAfter,
      bytesSavedFormatted: missionResult.bytesSavedFormatted,
      assetReductionPercent: missionResult.assetReductionPercent,
      appliedPatchesCount: missionResult.appliedPatchesCount,
      nextAction: missionResult.nextAction,
    },
    detailLevel: 'compact',
    tokenBudget: 300,
  });

  const compactChars = JSON.stringify(compactResponse).length;
  const compactTokens = Math.ceil(compactChars / 4);
  assert.ok(compactTokens < 200, `Compact mission response should be < 200 tokens, was ${compactTokens}`);
  console.log(`  ✓ Compact Mission Response Size: ${compactTokens} tokens (${compactChars} characters)`);
  console.log(`  ✓ Contract Next Action: "${compactResponse.nextAction}"`);
  console.log('  ✅ PASS: Token efficiency contract satisfied (< 200 tokens)\n');

  console.log('===========================================================');
  console.log('🎉 ALL AUTONOMOUS MISSION TESTS PASSED 100%!');
  console.log('===========================================================\n');
}

runMissionTests().catch((err) => {
  console.error('\n❌ Autonomous mission test failed:', err);
  process.exit(1);
});
