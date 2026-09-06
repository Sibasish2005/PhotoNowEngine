import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import sharp from 'sharp';

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

async function runTests() {
  console.log('🚀 Starting PhotoNow MCP Server Automated Verification Test...\n');

  // 1. Prepare sandbox directory and test images
  await fs.rm(TEST_DIR, { recursive: true, force: true });
  await fs.mkdir(TEST_DIR, { recursive: true });

  const img1Path = path.join(TEST_DIR, 'sample_photo1.png');
  const img2Path = path.join(TEST_DIR, 'sample_photo2.jpg');
  const img3Path = path.join(TEST_DIR, 'sample_photo3.png');

  // Generate real high-res test images using sharp
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

  console.log('✓ Created 3 synthetic test images in sandbox:');
  console.log(`  - ${path.basename(img1Path)} (${(await fs.stat(img1Path)).size} bytes, 1920x1080)`);
  console.log(`  - ${path.basename(img2Path)} (${(await fs.stat(img2Path)).size} bytes, 1200x800)`);
  console.log(`  - ${path.basename(img3Path)} (${(await fs.stat(img3Path)).size} bytes, 800x600)\n`);

  // 2. Launch MCP Server
  const client = new McpTestClient(path.resolve('./bin/mcp-server.mjs'));
  client.start();

  try {
    // 3. Initialize MCP session
    const initRes = await client.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'PhotoNowTestRunner', version: '1.0.0' },
      capabilities: {},
    });
    client.sendNotification('notifications/initialized');
    console.log('✓ MCP Server Initialized:', initRes.serverInfo);

    // 4. Discover Tools
    const toolsRes = await client.sendRequest('tools/list', {});
    const toolNames = toolsRes.tools.map((t) => t.name);
    console.log('✓ Discovered MCP Tools:', toolNames);
    if (!toolNames.includes('convert_image') || !toolNames.includes('convert_batch')) {
      throw new Error('Missing core tools in tools/list');
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
    const webp1Stat = await fs.stat(expectedWebp1);
    console.log(`  Output file verified: ${expectedWebp1} (${webp1Stat.size} bytes, saved: ${singleData.details.percentSaved})`);

    // 6. Test get_media_info
    console.log('\n--- Testing Tool: get_media_info ---');
    const infoRes = await client.sendRequest('tools/call', {
      name: 'get_media_info',
      arguments: {
        filePath: expectedWebp1,
      },
    });
    const infoData = JSON.parse(infoRes.content[0].text);
    console.log(`  Inspected WebP: format=${infoData.format}, width=${infoData.width}, height=${infoData.height}`);

    // 7. Test convert_batch (Batch Folder Conversion in 1 Call)
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
    console.log(`  Files created in ${batchOutputDir}:`, convertedFiles);
    if (convertedFiles.length < 3) {
      throw new Error(`Expected at least 3 converted files, found: ${convertedFiles.length}`);
    }

    // 8. Test optimize_for_agent
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

    console.log('\n🎉 ALL MCP TOOLS VERIFIED SUCCESSFULLY! 100% PASSING!\n');
  } finally {
    client.stop();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
