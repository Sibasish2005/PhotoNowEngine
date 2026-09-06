import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import sharp from 'sharp';

const SANDBOX_DIR = path.resolve('./tests/sandbox_security');

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
          // ignore non-json
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
    this.proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
  }

  stop() {
    if (this.proc) this.proc.kill();
  }
}

async function runSecurityAndUsabilityTests() {
  console.log('===========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE USABILITY & SECURITY TEST SUITE');
  console.log('===========================================================\n');

  await fs.rm(SANDBOX_DIR, { recursive: true, force: true });
  await fs.mkdir(SANDBOX_DIR, { recursive: true });

  const validImgPath = path.join(SANDBOX_DIR, 'valid_image.png');
  await sharp({
    create: {
      width: 400,
      height: 300,
      channels: 4,
      background: { r: 100, g: 150, b: 200, alpha: 1 },
    },
  })
    .png()
    .toFile(validImgPath);

  const client = new McpTestClient(path.resolve('./bin/mcp-server.mjs'));
  client.start();

  let passedTests = 0;
  let totalTests = 0;

  async function assertTest(name, fn) {
    totalTests++;
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} -> ${err.message}`);
    }
  }

  try {
    // Initialize session
    await client.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'AuditRunner', version: '1.0' },
      capabilities: {},
    });
    client.sendNotification('notifications/initialized');

    console.log('--- 1. USABILITY TESTS ---');

    // U1: Quoted paths (Single quotes and double quotes)
    await assertTest('Handles paths with surrounding double quotes', async () => {
      const quotedPath = `"${validImgPath}"`;
      const res = await client.sendRequest('tools/call', {
        name: 'convert_image',
        arguments: {
          inputPath: quotedPath,
          format: 'webp',
        },
      });
      const data = JSON.parse(res.content[0].text);
      if (data.status !== 'success') throw new Error(data.message);
    });

    // U2: Decimal quality normalization (0.75 -> 75%)
    await assertTest('Accepts decimal quality (0.75) and normalizes properly', async () => {
      const res = await client.sendRequest('tools/call', {
        name: 'convert_image',
        arguments: {
          inputPath: validImgPath,
          format: 'webp',
          quality: 0.75,
        },
      });
      const data = JSON.parse(res.content[0].text);
      if (data.status !== 'success') throw new Error(data.message);
      if (!data.message.includes('75%')) throw new Error('Expected 75% quality in message');
    });

    // U3: Friendly error when directory is passed to convert_image
    await assertTest('Friendly error when folder path is passed to single convert_image', async () => {
      const res = await client.sendRequest('tools/call', {
        name: 'convert_image',
        arguments: {
          inputPath: SANDBOX_DIR,
          format: 'webp',
        },
      });
      if (!res.isError) throw new Error('Expected isError=true for directory input');
      if (!res.content[0].text.includes("convert_batch")) {
        throw new Error('Expected hint recommending convert_batch');
      }
    });

    // U4: Clean error on non-existent file
    await assertTest('Graceful error response for missing file', async () => {
      const res = await client.sendRequest('tools/call', {
        name: 'convert_image',
        arguments: {
          inputPath: path.join(SANDBOX_DIR, 'non_existent_file.jpg'),
          format: 'webp',
        },
      });
      if (!res.isError) throw new Error('Expected isError=true for non-existent file');
      if (!res.content[0].text.includes('Input file not found')) {
        throw new Error('Expected "Input file not found" message');
      }
    });

    // U5: Safe collision handling without overwriting original
    await assertTest('Avoids destroying original or overwriting when overwrite=false', async () => {
      const dest = path.join(SANDBOX_DIR, 'collision_test.webp');
      await fs.writeFile(dest, 'dummy');

      const res = await client.sendRequest('tools/call', {
        name: 'convert_image',
        arguments: {
          inputPath: validImgPath,
          outputPath: dest,
          format: 'webp',
          overwrite: false,
        },
      });
      const data = JSON.parse(res.content[0].text);
      if (data.details.outputPath === dest) {
        throw new Error('Should have generated a safe non-colliding path when overwrite=false');
      }
      if (!fsSync.existsSync(data.details.outputPath)) {
        throw new Error('Safe converted file was not created');
      }
    });

    // U6: Multiple format outputs (AVIF, JPEG, PNG)
    await assertTest('Converts cleanly to AVIF, JPEG, PNG', async () => {
      for (const fmt of ['avif', 'jpeg', 'png']) {
        const res = await client.sendRequest('tools/call', {
          name: 'convert_image',
          arguments: {
            inputPath: validImgPath,
            format: fmt,
            quality: 80,
          },
        });
        const data = JSON.parse(res.content[0].text);
        if (data.status !== 'success') throw new Error(`Failed for format ${fmt}`);
      }
    });

    console.log('\n--- 2. SECURITY VULNERABILITY TESTS ---');

    // S1: Arbitrary File Overwrite Protection (Extension Whitelist)
    await assertTest('BLOCKS arbitrary file write to non-image extension (.bat / .exe / .json)', async () => {
      const maliciousDest = path.join(SANDBOX_DIR, 'payload.bat');
      const res = await client.sendRequest('tools/call', {
        name: 'convert_image',
        arguments: {
          inputPath: validImgPath,
          outputPath: maliciousDest,
          format: 'webp',
        },
      });
      if (!res.isError) throw new Error('Security failure: Non-image output path was not blocked!');
      if (!res.content[0].text.includes('Security violation')) {
        throw new Error('Expected "Security violation" error message');
      }
    });

    // S2: Protection against overwriting sensitive configuration (.env)
    await assertTest('BLOCKS writing to .env files', async () => {
      const envDest = path.join(SANDBOX_DIR, '.env');
      const res = await client.sendRequest('tools/call', {
        name: 'convert_image',
        arguments: {
          inputPath: validImgPath,
          outputPath: envDest,
          format: 'webp',
        },
      });
      if (!res.isError) throw new Error('Security failure: .env output was not blocked!');
      if (!res.content[0].text.includes('Security violation')) {
        throw new Error('Expected Security violation message');
      }
    });

    // S3: Path Traversal into sensitive directories (.git)
    await assertTest('BLOCKS writing into .git directory', async () => {
      const gitDest = path.join(SANDBOX_DIR, '.git', 'hooks.webp');
      const res = await client.sendRequest('tools/call', {
        name: 'convert_image',
        arguments: {
          inputPath: validImgPath,
          outputPath: gitDest,
          format: 'webp',
        },
      });
      if (!res.isError) throw new Error('Security failure: .git path was not blocked!');
      if (!res.content[0].text.includes('Security violation')) {
        throw new Error('Expected Security violation message');
      }
    });

    // S4: Corrupted file input (Graceful handling without crash)
    await assertTest('Gracefully catches corrupted binary data without server crash', async () => {
      const corruptedPath = path.join(SANDBOX_DIR, 'corrupted.png');
      await fs.writeFile(corruptedPath, Buffer.from('NOT_AN_IMAGE_RANDOM_GARBAGE_BYTES_12345'));

      const res = await client.sendRequest('tools/call', {
        name: 'convert_image',
        arguments: {
          inputPath: corruptedPath,
          format: 'webp',
        },
      });
      if (!res.isError) throw new Error('Expected isError=true for corrupted image file');
      if (!res.content[0].text.includes('Image conversion error')) {
        throw new Error('Expected error message describing invalid format');
      }
    });

    // S5: Batch Scan directory traversal / noise isolation
    await assertTest('Batch scan safely ignores node_modules and .git folders', async () => {
      const fakeGitDir = path.join(SANDBOX_DIR, '.git');
      const fakeNodeModules = path.join(SANDBOX_DIR, 'node_modules');
      await fs.mkdir(fakeGitDir, { recursive: true });
      await fs.mkdir(fakeNodeModules, { recursive: true });

      // Put an image in ignored folder
      await fs.copyFile(validImgPath, path.join(fakeGitDir, 'secret.png'));
      await fs.copyFile(validImgPath, path.join(fakeNodeModules, 'dep.png'));

      const res = await client.sendRequest('tools/call', {
        name: 'convert_batch',
        arguments: {
          directoryPath: SANDBOX_DIR,
          recursive: true,
          format: 'webp',
        },
      });
      const data = JSON.parse(res.content[0].text);
      const outputFiles = data.conversions.map((c) => c.inputPath);
      const leakedGit = outputFiles.some((p) => p.includes('.git'));
      const leakedModules = outputFiles.some((p) => p.includes('node_modules'));

      if (leakedGit || leakedModules) {
        throw new Error('Security violation: Ignored directories were scanned!');
      }
    });

    console.log(`\n===========================================================`);
    console.log(`📊 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log(`===========================================================\n`);

    if (passedTests !== totalTests) {
      throw new Error(`Some tests failed (${totalTests - passedTests} failures)`);
    }
  } finally {
    client.stop();
  }
}

runSecurityAndUsabilityTests().catch((err) => {
  console.error('\n❌ Security & Usability Test suite failed:', err);
  process.exit(1);
});
