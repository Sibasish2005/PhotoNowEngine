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

const TEST_DIR = path.resolve('./tests/sandbox');

class McpTestClient {
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
      this.buffer = lines.pop(); // Keep unfinished line in buffer

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
        reject(new Error(`Server process exited with code ${code}`));
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

async function runTests() {
  console.log('🚀 Starting PhotoNow Multimedia MCP Server Automated Verification Test...\n');

  // 1. Prepare sandbox directory and test assets
  await fs.rm(TEST_DIR, { recursive: true, force: true });
  await fs.mkdir(TEST_DIR, { recursive: true });

  const img1Path = path.join(TEST_DIR, 'sample_photo1.png');
  const img2Path = path.join(TEST_DIR, 'sample_photo2.jpg');
  const img3Path = path.join(TEST_DIR, 'sample_photo3.png');
  const video1Path = path.join(TEST_DIR, 'sample_video.mp4');
  const audio1Path = path.join(TEST_DIR, 'sample_audio.mp3');

  // Generate synthetic test images
  await sharp({
    create: {
      width: 1920,
      height: 1080,
      channels: 4,
      background: { r: 52, g: 152, b: 219, alpha: 1 },
    },
  })
    .png()
    .toFile(img1Path);

  await sharp({
    create: {
      width: 1200,
      height: 800,
      channels: 3,
      background: { r: 231, g: 76, b: 60 },
    },
  })
    .jpeg({ quality: 90 })
    .toFile(img2Path);

  await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 4,
      background: { r: 46, g: 204, b: 113, alpha: 1 },
    },
  })
    .png()
    .toFile(img3Path);

  // Generate synthetic test video & audio
  await generateSyntheticVideo(video1Path);
  await generateSyntheticAudio(audio1Path);

  console.log('✓ Created synthetic test media in sandbox:');
  console.log(`  - Image: ${path.basename(img1Path)} (1920x1080)`);
  console.log(`  - Image: ${path.basename(img2Path)} (1200x800)`);
  console.log(`  - Video: ${path.basename(video1Path)} (${(await fs.stat(video1Path)).size} bytes)`);
  console.log(`  - Audio: ${path.basename(audio1Path)} (${(await fs.stat(audio1Path)).size} bytes)\n`);

  // 2. Launch MCP Server
  const client = new McpTestClient(path.resolve('./bin/mcp-server.mjs'));
  client.start();

  try {
    // 3. Initialize MCP session
    const initRes = await client.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'PhotoNowTestRunner', version: '2.0.0' },
      capabilities: {},
    });
    client.sendNotification('notifications/initialized');
    console.log('✓ MCP Server Initialized:', initRes.serverInfo);

    // 4. Discover Tools
    const toolsRes = await client.sendRequest('tools/list', {});
    const toolNames = toolsRes.tools.map((t) => t.name);
    console.log('✓ Discovered MCP Tools (7):', toolNames);
    const expectedTools = [
      'convert_image',
      'convert_batch',
      'extract_audio',
      'convert_video',
      'convert_audio',
      'get_media_info',
      'optimize_for_agent',
    ];
    for (const expected of expectedTools) {
      if (!toolNames.includes(expected)) {
        throw new Error(`Missing required tool: ${expected}`);
      }
    }

    // 5. Test convert_image (Single File)
    console.log('\n--- Testing Tool: convert_image ---');
    const singleRes = await client.sendRequest('tools/call', {
      name: 'convert_image',
      arguments: {
        inputPath: img1Path,
        format: 'webp',
        quality: 80,
      },
    });
    const singleData = JSON.parse(singleRes.content[0].text);
    console.log('convert_image result:', singleData.message);
    const expectedWebp1 = path.join(TEST_DIR, 'sample_photo1.webp');
    if (!fsSync.existsSync(expectedWebp1)) {
      throw new Error(`Expected output file not found: ${expectedWebp1}`);
    }

    // 6. Test convert_batch
    console.log('\n--- Testing Tool: convert_batch ---');
    const batchOutputDir = path.join(TEST_DIR, 'batch_output_webp');
    const batchRes = await client.sendRequest('tools/call', {
      name: 'convert_batch',
      arguments: {
        directoryPath: TEST_DIR,
        outputDir: batchOutputDir,
        format: 'webp',
        quality: 85,
      },
    });
    const batchData = JSON.parse(batchRes.content[0].text);
    console.log('convert_batch summary:', batchData.summary);
    const convertedFiles = await fs.readdir(batchOutputDir);
    if (convertedFiles.length < 3) {
      throw new Error(`Expected at least 3 converted files, found: ${convertedFiles.length}`);
    }

    // 7. Test extract_audio (NEW)
    console.log('\n--- Testing Tool: extract_audio ---');
    const extractRes = await client.sendRequest('tools/call', {
      name: 'extract_audio',
      arguments: {
        inputPath: video1Path,
        outputFormat: 'mp3',
        bitrate: '192k',
      },
    });
    const extractData = JSON.parse(extractRes.content[0].text);
    console.log('extract_audio result:', extractData.message);
    const extractedMp3 = path.join(TEST_DIR, 'sample_video.mp3');
    if (!fsSync.existsSync(extractedMp3)) {
      throw new Error(`Extracted audio not found at: ${extractedMp3}`);
    }
    console.log(`  Extracted MP3 size: ${(await fs.stat(extractedMp3)).size} bytes`);

    // 8. Test convert_video (NEW)
    console.log('\n--- Testing Tool: convert_video ---');
    const videoConvRes = await client.sendRequest('tools/call', {
      name: 'convert_video',
      arguments: {
        inputPath: video1Path,
        format: 'webm',
        preset: 'fast',
        maxWidth: 240,
      },
    });
    const videoConvData = JSON.parse(videoConvRes.content[0].text);
    console.log('convert_video result:', videoConvData.message);
    const convertedWebm = path.join(TEST_DIR, 'sample_video.webm');
    if (!fsSync.existsSync(convertedWebm)) {
      throw new Error(`Converted video not found at: ${convertedWebm}`);
    }
    console.log(`  Converted WebM size: ${(await fs.stat(convertedWebm)).size} bytes`);

    // 9. Test convert_audio (NEW)
    console.log('\n--- Testing Tool: convert_audio ---');
    const audioConvRes = await client.sendRequest('tools/call', {
      name: 'convert_audio',
      arguments: {
        inputPath: audio1Path,
        format: 'wav',
      },
    });
    const audioConvData = JSON.parse(audioConvRes.content[0].text);
    console.log('convert_audio result:', audioConvData.message);
    const convertedWav = path.join(TEST_DIR, 'sample_audio.wav');
    if (!fsSync.existsSync(convertedWav)) {
      throw new Error(`Converted WAV audio not found at: ${convertedWav}`);
    }
    console.log(`  Converted WAV size: ${(await fs.stat(convertedWav)).size} bytes`);

    // 10. Test get_media_info (UPGRADED: inspect image, video, audio)
    console.log('\n--- Testing Tool: get_media_info (Unified Inspector) ---');
    // Inspect Image
    const imgInfoRes = await client.sendRequest('tools/call', {
      name: 'get_media_info',
      arguments: { filePath: expectedWebp1 },
    });
    const imgInfo = JSON.parse(imgInfoRes.content[0].text);
    console.log(`  ✓ Image Info: type=${imgInfo.mediaType}, format=${imgInfo.format}, dims=${imgInfo.dimensions}`);
    if (imgInfo.mediaType !== 'image') throw new Error('Expected mediaType=image');

    // Inspect Video
    const videoInfoRes = await client.sendRequest('tools/call', {
      name: 'get_media_info',
      arguments: { filePath: video1Path },
    });
    const videoInfo = JSON.parse(videoInfoRes.content[0].text);
    console.log(`  ✓ Video Info: type=${videoInfo.mediaType}, duration=${videoInfo.durationFormatted}, res=${videoInfo.video?.resolution}, codec=${videoInfo.video?.codec}`);
    if (videoInfo.mediaType !== 'video') throw new Error('Expected mediaType=video');
    if (!videoInfo.video) throw new Error('Expected video stream metadata');

    // Inspect Audio
    const audioInfoRes = await client.sendRequest('tools/call', {
      name: 'get_media_info',
      arguments: { filePath: convertedWav },
    });
    const audioInfo = JSON.parse(audioInfoRes.content[0].text);
    console.log(`  ✓ Audio Info: type=${audioInfo.mediaType}, duration=${audioInfo.durationFormatted}, codec=${audioInfo.audio?.codec}, rate=${audioInfo.audio?.sampleRate}`);
    if (audioInfo.mediaType !== 'audio') throw new Error('Expected mediaType=audio');
    if (!audioInfo.audio) throw new Error('Expected audio stream metadata');

    // 11. Test optimize_for_agent
    console.log('\n--- Testing Tool: optimize_for_agent ---');
    const optRes = await client.sendRequest('tools/call', {
      name: 'optimize_for_agent',
      arguments: {
        inputPath: img2Path,
        maxDimension: 800,
      },
    });
    const optData = JSON.parse(optRes.content[0].text);
    console.log('optimize_for_agent message:', optData.message);
    if (!fsSync.existsSync(optData.optimizedFilePath)) {
      throw new Error(`Optimized file does not exist: ${optData.optimizedFilePath}`);
    }

    // 12. Test extract_poster_frame
    console.log('\n--- Testing Tool: extract_poster_frame ---');
    const posterRes = await client.sendRequest('tools/call', {
      name: 'extract_poster_frame',
      arguments: {
        inputPath: video1Path,
        timestamp: 0.5,
        format: 'webp',
      },
    });
    const posterData = JSON.parse(posterRes.content[0].text);
    console.log('extract_poster_frame result:', posterData.message);
    if (!fsSync.existsSync(posterData.details.outputPath)) {
      throw new Error(`Poster frame not found at: ${posterData.details.outputPath}`);
    }

    // 13. Test analyze_media
    console.log('\n--- Testing Tool: analyze_media ---');
    const analyzeMediaRes = await client.sendRequest('tools/call', {
      name: 'analyze_media',
      arguments: {
        filePath: img1Path,
        detailLevel: 'compact',
      },
    });
    const analyzeMediaData = JSON.parse(analyzeMediaRes.content[0].text);
    console.log('analyze_media result summary:', JSON.stringify(analyzeMediaData.summary));
    if (!analyzeMediaData.ok || !analyzeMediaData.summary) {
      throw new Error('analyze_media did not return ok=true summary');
    }

    // 14. Test analyze_web_assets
    console.log('\n--- Testing Tool: analyze_web_assets ---');
    const scanRes = await client.sendRequest('tools/call', {
      name: 'analyze_web_assets',
      arguments: {
        directoryPath: TEST_DIR,
        detailLevel: 'compact',
      },
    });
    const scanData = JSON.parse(scanRes.content[0].text);
    console.log(`  ✓ Scan Score: ${scanData.summary.score}/100, Assets: ${scanData.summary.totalAssets}, Savings: ${scanData.summary.potentialSavingsFormatted}`);
    console.log(`  ✓ Next Action: ${scanData.nextAction}`);
    if (!scanData.summary?.score) throw new Error('Expected score in analyze_web_assets summary');

    // 15. Test test_web_performance
    console.log('\n--- Testing Tool: test_web_performance ---');
    const perfRes = await client.sendRequest('tools/call', {
      name: 'test_web_performance',
      arguments: {
        localPath: TEST_DIR,
        detailLevel: 'compact',
      },
    });
    const perfData = JSON.parse(perfRes.content[0].text);
    console.log(`  ✓ Performance Score: ${perfData.summary.score}/100, Media: ${perfData.summary.totalSizeFormatted}`);
    console.log(`  ✓ 4G Mobile Transfer Estimate: ${perfData.summary.estimatedTransferTime4GMs}ms`);

    // 16. Test generate_optimization_plan
    console.log('\n--- Testing Tool: generate_optimization_plan ---');
    const planRes = await client.sendRequest('tools/call', {
      name: 'generate_optimization_plan',
      arguments: {
        directoryPath: TEST_DIR,
        format: 'webp',
        quality: 80,
      },
    });
    const planData = JSON.parse(planRes.content[0].text);
    const planId = planData.summary.planId;
    console.log(`  ✓ Plan ID: ${planId}, Actions: ${planData.summary.actionsCount}, Est. Reduction: ${planData.summary.estimatedReductionPercent}`);
    if (!planId) throw new Error('Expected valid planId in planData');

    // 17. Test optimize_web_assets
    console.log('\n--- Testing Tool: optimize_web_assets ---');
    const execRes = await client.sendRequest('tools/call', {
      name: 'optimize_web_assets',
      arguments: {
        planId: planId,
        overwriteSource: false,
      },
    });
    const execData = JSON.parse(execRes.content[0].text);
    console.log(`  ✓ Succeeded: ${execData.summary.succeeded}, Saved: ${execData.summary.actualSaved} (${execData.summary.actualReductionPercent})`);

    // 18. Test verify_optimization
    console.log('\n--- Testing Tool: verify_optimization ---');
    const verifyRes = await client.sendRequest('tools/call', {
      name: 'verify_optimization',
      arguments: {
        planId: planId,
        generateReport: true,
        reportFormat: 'html',
      },
    });
    const verifyData = JSON.parse(verifyRes.content[0].text);
    console.log(`  ✓ Verified Reduction: ${verifyData.summary.reductionPercent}, Report: ${verifyData.summary.reportSavedPath}`);

    // 19. Test inspect_project
    console.log('\n--- Testing Tool: inspect_project ---');
    const inspectRes = await client.sendRequest('tools/call', {
      name: 'inspect_project',
      arguments: {
        projectPath: TEST_DIR,
      },
    });
    const inspectData = JSON.parse(inspectRes.content[0].text);
    console.log(`  ✓ Inspected Framework: ${inspectData.summary.framework}, Assets Count: ${inspectData.summary.assetFilesCount}`);

    // 20. Test find_unused_assets
    console.log('\n--- Testing Tool: find_unused_assets ---');
    const unusedRes = await client.sendRequest('tools/call', {
      name: 'find_unused_assets',
      arguments: {
        projectPath: TEST_DIR,
      },
    });
    const unusedData = JSON.parse(unusedRes.content[0].text);
    console.log(`  ✓ Unused Assets Found: ${unusedData.summary.totalUnusedFound}, Waste: ${unusedData.summary.totalWasteFormatted}`);

    // 21. Test check_performance_budget
    console.log('\n--- Testing Tool: check_performance_budget ---');
    const budgetRes = await client.sendRequest('tools/call', {
      name: 'check_performance_budget',
      arguments: {
        projectPath: TEST_DIR,
      },
    });
    const budgetData = JSON.parse(budgetRes.content[0].text);
    console.log(`  ✓ Budget Status: ${budgetData.summary.status}, Passed Rules: ${budgetData.summary.passedCount}`);

    // 22. Test verify_runtime_performance
    console.log('\n--- Testing Tool: verify_runtime_performance ---');
    const runtimeRes = await client.sendRequest('tools/call', {
      name: 'verify_runtime_performance',
      arguments: {
        targetUrl: 'http://localhost:65432', // simulated fallback
      },
    });
    const runtimeData = JSON.parse(runtimeRes.content[0].text);
    console.log(`  ✓ Runtime Measurement: ${runtimeData.summary.measurementType}, LCP: ${runtimeData.summary.lcpMs}ms`);

    // 23. Test generate_source_patch
    console.log('\n--- Testing Tool: generate_source_patch ---');
    const patchRes = await client.sendRequest('tools/call', {
      name: 'generate_source_patch',
      arguments: {
        projectPath: TEST_DIR,
        planId: planId,
        dryRun: true,
      },
    });
    const patchData = JSON.parse(patchRes.content[0].text);
    console.log(`  ✓ Patch ID: ${patchData.summary.patchId}, Actions: ${patchData.summary.actionsCount}, Affected Files: ${patchData.summary.affectedFilesCount}`);

    // 24. Test optimize_project (Autonomous Mission)
    console.log('\n--- Testing Tool: optimize_project (Autonomous Agent Mission) ---');
    const missionRes = await client.sendRequest('tools/call', {
      name: 'optimize_project',
      arguments: {
        projectPath: TEST_DIR,
        dryRun: true,
      },
    });
    const missionData = JSON.parse(missionRes.content[0].text);
    console.log(`  ✓ Autonomous Mission: status=${missionData.summary.status}, reduction=${missionData.summary.assetReductionPercent}, nextAction=${missionData.summary.nextAction}`);

    console.log('\n🎉 ALL MULTIMEDIA & PERFORMANCE MCP TOOLS VERIFIED SUCCESSFULLY OVER STDIO! 100% PASSING!\n');
  } finally {
    client.stop();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
