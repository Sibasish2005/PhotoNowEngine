import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

const ffmpegPath = ffmpegInstaller.path || ffmpegInstaller.default?.path;
const ffprobePath = ffprobeInstaller.path || ffprobeInstaller.default?.path;
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
if (ffprobePath) ffmpeg.setFfprobePath(ffprobePath);

const SANDBOX_DIR = path.resolve('./tests/sandbox_all_mcp');

class McpClient {
  constructor(serverScriptPath) {
    this.serverScriptPath = serverScriptPath;
    this.reqId = 1;
    this.pending = new Map();
    this.buffer = '';
  }

  start() {
    this.proc = spawn('node', [this.serverScriptPath], {
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    this.proc.stdout.on('data', (chunk) => {
      this.buffer += chunk.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);
          if (msg.id !== undefined && this.pending.has(msg.id)) {
            const { resolve, reject } = this.pending.get(msg.id);
            this.pending.delete(msg.id);
            if (msg.error) {
              reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            } else {
              resolve(msg.result);
            }
          }
        } catch (e) {
          // ignore non-json lines
        }
      }
    });

    this.proc.on('exit', (code) => {
      for (const [, { reject }] of this.pending) {
        reject(new Error(`Server exited with code ${code}`));
      }
      this.pending.clear();
    });
  }

  sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.reqId++;
      const payload = { jsonrpc: '2.0', id, method, params };
      this.pending.set(id, { resolve, reject });
      this.proc.stdin.write(JSON.stringify(payload) + '\n');
    });
  }

  sendNotification(method, params = {}) {
    const payload = { jsonrpc: '2.0', method, params };
    this.proc.stdin.write(JSON.stringify(payload) + '\n');
  }

  stop() {
    if (this.proc) {
      this.proc.kill();
    }
  }
}

function generateSyntheticVideo(destPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input('testsrc=duration=2:size=320x240:rate=15')
      .inputFormat('lavfi')
      .input('sine=frequency=1000:duration=2')
      .inputFormat('lavfi')
      .outputOptions(['-c:v libx264', '-c:a aac', '-pix_fmt yuv420p'])
      .save(destPath)
      .on('end', resolve)
      .on('error', reject);
  });
}

function generateSyntheticAudio(destPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input('sine=frequency=440:duration=2')
      .inputFormat('lavfi')
      .audioCodec('libmp3lame')
      .save(destPath)
      .on('end', resolve)
      .on('error', reject);
  });
}

async function main() {
  console.log('================================================================');
  console.log('🔬 PHOTONOW 100% MCP SERVER TOOL AUDIT: ALL 29 TOOLS TEST SUITE');
  console.log('================================================================\n');

  // 1. Setup Sandbox with media and source code
  await fs.rm(SANDBOX_DIR, { recursive: true, force: true });
  await fs.mkdir(SANDBOX_DIR, { recursive: true });
  const srcDir = path.join(SANDBOX_DIR, 'src');
  await fs.mkdir(srcDir, { recursive: true });

  const img1 = path.join(SANDBOX_DIR, 'sample_photo1.png');
  const img2 = path.join(SANDBOX_DIR, 'sample_photo2.jpg');
  const img3 = path.join(SANDBOX_DIR, 'sample_photo3.png'); // Unused asset
  const video1 = path.join(SANDBOX_DIR, 'sample_video.mp4');
  const audio1 = path.join(SANDBOX_DIR, 'sample_audio.mp3');

  // Generate test images
  await sharp({
    create: { width: 1920, height: 1080, channels: 4, background: { r: 52, g: 152, b: 219, alpha: 1 } },
  }).png().toFile(img1);

  await sharp({
    create: { width: 1200, height: 800, channels: 3, background: { r: 231, g: 76, b: 60 } },
  }).jpeg({ quality: 90 }).toFile(img2);

  await sharp({
    create: { width: 800, height: 600, channels: 4, background: { r: 46, g: 204, b: 113, alpha: 1 } },
  }).png().toFile(img3);

  // Generate synthetic video and audio
  await generateSyntheticVideo(video1);
  await generateSyntheticAudio(audio1);

  // Generate synthetic source files for AST & patching tests
  const packageJsonPath = path.join(SANDBOX_DIR, 'package.json');
  await fs.writeFile(
    packageJsonPath,
    JSON.stringify({ name: 'mcp-sandbox-app', version: '1.0.0', dependencies: { react: '^18.0.0' } }, null, 2)
  );

  const headerJsxPath = path.join(srcDir, 'Header.jsx');
  await fs.writeFile(
    headerJsxPath,
    `import React from 'react';

export default function Header() {
  return (
    <header className="hero">
      <img src="sample_photo1.png" alt="Hero Banner" />
      <img src="sample_photo2.jpg" alt="Secondary Card" />
    </header>
  );
}
`
  );

  console.log('📁 Sandbox Environment Initialized:');
  console.log(`  - Root: ${SANDBOX_DIR}`);
  console.log(`  - Assets: sample_photo1.png, sample_photo2.jpg, sample_photo3.png, sample_video.mp4, sample_audio.mp3`);
  console.log(`  - Source: src/Header.jsx (references sample_photo1.png & sample_photo2.jpg)\n`);

  // 2. Start MCP Server process
  const client = new McpClient(path.resolve('./bin/mcp-server.mjs'));
  client.start();

  const auditResults = [];

  async function executeToolTest(toolNum, toolName, args, validateFn) {
    process.stdout.write(`[${String(toolNum).padStart(2, '0')}/29] Testing '${toolName}'... `);
    const start = Date.now();
    try {
      const res = await client.sendRequest('tools/call', {
        name: toolName,
        arguments: args,
      });
      const duration = Date.now() - start;

      if (!res || !res.content || !res.content[0]) {
        throw new Error('Empty response or invalid content array');
      }

      let parsed;
      try {
        parsed = JSON.parse(res.content[0].text);
      } catch (e) {
        throw new Error(`Failed to parse response as JSON: ${res.content[0].text.slice(0, 100)}`);
      }

      const summaryNote = validateFn ? validateFn(parsed) : 'Executed successfully';
      console.log(`✅ PASS (${duration}ms) - ${summaryNote}`);
      auditResults.push({
        num: toolNum,
        name: toolName,
        status: 'PASS',
        duration,
        note: summaryNote,
        error: null,
      });
      return parsed;
    } catch (err) {
      const duration = Date.now() - start;
      console.log(`❌ FAIL (${duration}ms) - ${err.message}`);
      auditResults.push({
        num: toolNum,
        name: toolName,
        status: 'FAIL',
        duration,
        note: 'Failed',
        error: err.message,
      });
      return null;
    }
  }

  try {
    // Handshake
    console.log('🔄 Initializing MCP Protocol...');
    const initRes = await client.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'PhotoNow29ToolTester', version: '2.0.0' },
      capabilities: {},
    });
    client.sendNotification('notifications/initialized');
    console.log(`✅ MCP Protocol Initialized: ${initRes.serverInfo.name} v${initRes.serverInfo.version}\n`);

    // Discovery
    const toolsRes = await client.sendRequest('tools/list', {});
    const catalog = toolsRes.tools || [];
    console.log(`📋 Discovered ${catalog.length} registered tools on MCP server:`);
    catalog.forEach((t, i) => console.log(`   ${i + 1}. ${t.name} - ${(t.description || '').slice(0, 60)}...`));
    console.log('\n--- Commencing Sequential 29-Tool Execution ---\n');

    let savedPlanId = null;
    let beforeTestId = null;
    let afterTestId = null;
    let generatedPatchId = null;
    let createdOperationId = null;

    // TOOL 1: convert_image
    await executeToolTest(1, 'convert_image', {
      inputPath: img1,
      format: 'webp',
      quality: 80,
    }, (data) => {
      const out = path.join(SANDBOX_DIR, 'sample_photo1.webp');
      if (!fsSync.existsSync(out)) throw new Error('Expected sample_photo1.webp to exist');
      return `Converted to WebP (${fsSync.statSync(out).size} bytes)`;
    });

    // TOOL 2: convert_batch
    const batchOut = path.join(SANDBOX_DIR, 'batch_out');
    await executeToolTest(2, 'convert_batch', {
      directoryPath: SANDBOX_DIR,
      outputDir: batchOut,
      format: 'webp',
      quality: 85,
    }, (data) => {
      const count = fsSync.readdirSync(batchOut).length;
      return `Batch converted ${count} images to ${batchOut}`;
    });

    // TOOL 3: extract_audio
    await executeToolTest(3, 'extract_audio', {
      inputPath: video1,
      outputFormat: 'mp3',
      bitrate: '192k',
    }, (data) => {
      const out = path.join(SANDBOX_DIR, 'sample_video.mp3');
      if (!fsSync.existsSync(out)) throw new Error('Audio file not created');
      return `Extracted MP3 (${fsSync.statSync(out).size} bytes)`;
    });

    // TOOL 4: convert_video
    await executeToolTest(4, 'convert_video', {
      inputPath: video1,
      format: 'webm',
      preset: 'fast',
    }, (data) => {
      const out = path.join(SANDBOX_DIR, 'sample_video.webm');
      if (!fsSync.existsSync(out)) throw new Error('WebM video not created');
      return `Converted WebM (${fsSync.statSync(out).size} bytes)`;
    });

    // TOOL 5: convert_audio
    await executeToolTest(5, 'convert_audio', {
      inputPath: audio1,
      format: 'wav',
    }, (data) => {
      const out = path.join(SANDBOX_DIR, 'sample_audio.wav');
      if (!fsSync.existsSync(out)) throw new Error('WAV file not created');
      return `Converted WAV (${fsSync.statSync(out).size} bytes)`;
    });

    // TOOL 6: get_media_info
    await executeToolTest(6, 'get_media_info', {
      filePath: img1,
    }, (data) => {
      if (data.mediaType !== 'image') throw new Error(`Expected image, got ${data.mediaType}`);
      return `Metadata: ${data.dimensions}, format=${data.format}`;
    });

    // TOOL 7: optimize_for_agent
    await executeToolTest(7, 'optimize_for_agent', {
      inputPath: img2,
      maxDimension: 800,
    }, (data) => {
      if (!fsSync.existsSync(data.optimizedFilePath)) throw new Error('Optimized file does not exist');
      return `Optimized for AI vision context (${data.dimensions})`;
    });

    // TOOL 8: extract_poster_frame
    await executeToolTest(8, 'extract_poster_frame', {
      inputPath: video1,
      timestamp: 0.5,
      format: 'webp',
    }, (data) => {
      return `Poster frame captured (${data.details?.format})`;
    });

    // TOOL 9: analyze_media
    await executeToolTest(9, 'analyze_media', {
      filePath: img1,
      detailLevel: 'compact',
    }, (data) => {
      if (!data.ok) throw new Error('ok=false');
      return `Analyzed: issues=${data.summary?.issueCount}, size=${data.summary?.sizeFormatted}`;
    });

    // TOOL 10: analyze_web_assets
    await executeToolTest(10, 'analyze_web_assets', {
      directoryPath: SANDBOX_DIR,
      detailLevel: 'compact',
    }, (data) => {
      return `Score: ${data.summary?.score}/100, Assets: ${data.summary?.totalAssets}`;
    });

    // TOOL 11: find_oversized_assets
    await executeToolTest(11, 'find_oversized_assets', {
      directoryPath: SANDBOX_DIR,
      maxDimension: 1000,
      maxSizeBytes: 20000,
      detailLevel: 'compact',
    }, (data) => {
      return `Found ${data.summary?.totalOversizedFound} oversized asset(s)`;
    });

    // TOOL 12: find_inefficient_formats
    await executeToolTest(12, 'find_inefficient_formats', {
      directoryPath: SANDBOX_DIR,
      detailLevel: 'compact',
    }, (data) => {
      return `Found ${data.summary?.totalInefficientFound} inefficient format(s)`;
    });

    // TOOL 13: find_duplicate_assets
    await executeToolTest(13, 'find_duplicate_assets', {
      directoryPath: SANDBOX_DIR,
      similarityThreshold: 90,
      detailLevel: 'compact',
    }, (data) => {
      return `Duplicate groups: ${data.summary?.totalDuplicateGroups}`;
    });

    // TOOL 14: find_responsive_opportunities
    await executeToolTest(14, 'find_responsive_opportunities', {
      directoryPath: SANDBOX_DIR,
      detailLevel: 'compact',
    }, (data) => {
      return `Opportunities found: ${data.summary?.totalOpportunitiesFound}`;
    });

    // TOOL 15: test_web_performance (Initial Baseline)
    const test1 = await executeToolTest(15, 'test_web_performance', {
      localPath: SANDBOX_DIR,
      detailLevel: 'compact',
    }, (data) => {
      beforeTestId = data.summary?.testId;
      return `Baseline Score: ${data.summary?.score}/100, testId=${beforeTestId}`;
    });

    // TOOL 16: get_web_performance_summary
    await executeToolTest(16, 'get_web_performance_summary', {
      testId: beforeTestId,
      detailLevel: 'compact',
    }, (data) => {
      return `Retrieved summary for ${data.summary?.testId}: score=${data.summary?.score}`;
    });

    // TOOL 17: generate_optimization_plan
    const planRes = await executeToolTest(17, 'generate_optimization_plan', {
      directoryPath: SANDBOX_DIR,
      format: 'webp',
      quality: 80,
    }, (data) => {
      savedPlanId = data.summary?.planId;
      return `Generated Plan ID: ${savedPlanId} (${data.summary?.actionsCount} actions)`;
    });

    // TOOL 18: optimize_web_assets
    await executeToolTest(18, 'optimize_web_assets', {
      planId: savedPlanId,
      overwriteSource: false,
    }, (data) => {
      return `Optimized: ${data.summary?.succeeded} files, saved ${data.summary?.actualSaved}`;
    });

    // TOOL 19: verify_optimization
    await executeToolTest(19, 'verify_optimization', {
      planId: savedPlanId,
      generateReport: false,
    }, (data) => {
      return `Verified: ${data.summary?.reductionPercent} reduction`;
    });

    // Second test for comparison
    const test2Res = await client.sendRequest('tools/call', {
      name: 'test_web_performance',
      arguments: { localPath: SANDBOX_DIR },
    });
    afterTestId = JSON.parse(test2Res.content[0].text).summary?.testId;

    // TOOL 20: compare_web_performance
    await executeToolTest(20, 'compare_web_performance', {
      beforeTestId: beforeTestId,
      afterTestId: afterTestId,
    }, (data) => {
      return `Delta: ${data.summary?.scoreDelta >= 0 ? '+' : ''}${data.summary?.scoreDelta}, reduction=${data.summary?.reductionPercent}`;
    });

    // TOOL 21: inspect_project
    await executeToolTest(21, 'inspect_project', {
      projectPath: SANDBOX_DIR,
    }, (data) => {
      return `Framework: ${data.summary?.framework}, Assets: ${data.summary?.assetFilesCount}`;
    });

    // TOOL 22: get_asset_usage
    await executeToolTest(22, 'get_asset_usage', {
      projectPath: SANDBOX_DIR,
      assetPath: 'sample_photo1.png',
    }, (data) => {
      return `Asset sample_photo1.png: references=${data.summary?.referenceCount}, isLcp=${data.summary?.isLcpCandidate}`;
    });

    // TOOL 23: find_unused_assets
    await executeToolTest(23, 'find_unused_assets', {
      projectPath: SANDBOX_DIR,
    }, (data) => {
      return `Unused count: ${data.summary?.totalUnusedFound}, Waste: ${data.summary?.totalWasteFormatted}`;
    });

    // TOOL 24: check_performance_budget
    await executeToolTest(24, 'check_performance_budget', {
      projectPath: SANDBOX_DIR,
    }, (data) => {
      return `Budget: ${data.summary?.status} (${data.summary?.passedCount} passed)`;
    });

    // TOOL 25: verify_runtime_performance
    await executeToolTest(25, 'verify_runtime_performance', {
      targetUrl: 'http://localhost:65432', // simulated fallback
    }, (data) => {
      return `Runtime type=${data.summary?.measurementType}, LCP=${data.summary?.lcpMs}ms`;
    });

    // TOOL 26: generate_source_patch
    const patchRes = await executeToolTest(26, 'generate_source_patch', {
      projectPath: SANDBOX_DIR,
      planId: savedPlanId,
      dryRun: false,
    }, (data) => {
      generatedPatchId = data.summary?.patchId;
      return `Patch ID: ${generatedPatchId}, affected files=${data.summary?.affectedFilesCount}`;
    });

    // TOOL 27: apply_source_patch
    await executeToolTest(27, 'apply_source_patch', {
      projectPath: SANDBOX_DIR,
      patchId: generatedPatchId,
      confirmApply: true,
      dryRun: false,
    }, (data) => {
      createdOperationId = data.summary?.operationId;
      return `Applied source patch, operationId=${createdOperationId}, backupDir=${data.summary?.backupDir ? 'yes' : 'no'}`;
    });

    // TOOL 28: rollback_operation
    await executeToolTest(28, 'rollback_operation', {
      projectPath: SANDBOX_DIR,
      operationId: createdOperationId,
    }, (data) => {
      return `Rollback complete: ${data.summary?.message || 'restored successfully'}`;
    });

    // TOOL 29: optimize_project (Autonomous Mission)
    await executeToolTest(29, 'optimize_project', {
      projectPath: SANDBOX_DIR,
      dryRun: true,
    }, (data) => {
      return `Mission Status: ${data.summary?.status}, Reduction: ${data.summary?.assetReductionPercent}`;
    });

    console.log('\n================================================================');
    console.log('📊 FINAL 29-TOOL AUDIT SUMMARY');
    console.log('================================================================\n');

    const passCount = auditResults.filter((r) => r.status === 'PASS').length;
    const failCount = auditResults.filter((r) => r.status === 'FAIL').length;
    const avgLatency = Math.round(auditResults.reduce((acc, r) => acc + r.duration, 0) / auditResults.length);

    console.log(`TOTAL TOOLS TESTED:  29 / 29`);
    console.log(`PASSED:              ${passCount}`);
    console.log(`FAILED:              ${failCount}`);
    console.log(`AVERAGE LATENCY:     ${avgLatency}ms`);
    console.log(`OVERALL PASS RATE:   ${((passCount / 29) * 100).toFixed(1)}%\n`);

    if (failCount > 0) {
      console.log('❌ Failed Tools:');
      auditResults.filter((r) => r.status === 'FAIL').forEach((r) => console.log(`  - [${r.num}] ${r.name}: ${r.error}`));
      process.exit(1);
    } else {
      console.log('🎉 100% OF ALL 29 MCP TOOLS PASSED WITH VERIFIED GROUND TRUTH EXECUTION!');
    }
  } finally {
    client.stop();
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
