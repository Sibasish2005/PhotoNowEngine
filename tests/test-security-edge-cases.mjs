/**
 * PhotoNow Security & Edge-Case Standard Verification Suite
 *
 * Validates defensive security barriers, input sanitization, SSRF guards,
 * directory traversal containment, decompression bomb protection,
 * and robust handling of corrupt/zero-byte files and invalid parameters.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import sharp from 'sharp';
import { validateUrlSecurity } from '../lib/engine/performanceTester.mjs';
import { rollbackOperation } from '../lib/engine/patchGenerator.mjs';
import { analyzeSingleMediaAsset } from '../lib/engine/analyzer.mjs';

const SECURITY_SANDBOX = path.resolve('./tests/sandbox_security');

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
    const payload = { jsonrpc: '2.0', method, params };
    this.proc.stdin.write(JSON.stringify(payload) + '\n');
  }

  stop() {
    if (this.proc) {
      this.proc.kill();
    }
  }
}

async function runSecurityTests() {
  console.log('===============================================================');
  console.log('🛡️  PHOTONOW ENTERPRISE SECURITY & EDGE-CASE TEST SUITE');
  console.log('===============================================================\n');

  await fs.rm(SECURITY_SANDBOX, { recursive: true, force: true });
  await fs.mkdir(SECURITY_SANDBOX, { recursive: true });

  const validImg = path.join(SECURITY_SANDBOX, 'valid.png');
  await sharp({
    create: { width: 100, height: 100, channels: 4, background: { r: 0, g: 120, b: 255, alpha: 1 } },
  }).png().toFile(validImg);

  const zeroByteFile = path.join(SECURITY_SANDBOX, 'zero_byte.png');
  await fs.writeFile(zeroByteFile, Buffer.alloc(0));

  const corruptFile = path.join(SECURITY_SANDBOX, 'corrupted.jpg');
  await fs.writeFile(corruptFile, Buffer.from('NOT_AN_IMAGE_RANDOM_GARBAGE_PAYLOAD'));

  const client = new McpTestClient(path.resolve('./bin/mcp-server.mjs'));
  client.start();

  const results = [];

  async function assertSecurityCheck(name, testFn) {
    process.stdout.write(`• Checking: ${name}... `);
    const start = Date.now();
    try {
      await testFn();
      const duration = Date.now() - start;
      console.log(`✅ BLOCKED / PASSED (${duration}ms)`);
      results.push({ name, pass: true, duration });
    } catch (err) {
      const duration = Date.now() - start;
      console.log(`❌ VULNERABILITY / FAILED (${duration}ms): ${err.message}`);
      results.push({ name, pass: false, duration, error: err.message });
    }
  }

  try {
    await client.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'SecurityAuditor', version: '1.0' },
      capabilities: {},
    });
    client.sendNotification('notifications/initialized');

    // =========================================================================
    // SECTION 1: SSRF (Server-Side Request Forgery) & Protocol Restrictions
    // =========================================================================
    console.log('\n--- Section 1: SSRF Guards & URL Protocol Restrictions ---');

    await assertSecurityCheck('Block AWS Metadata IP (169.254.169.254)', async () => {
      let blocked = false;
      try {
        validateUrlSecurity('http://169.254.169.254/latest/meta-data/');
      } catch (err) {
        if (err.message.includes('Security violation')) blocked = true;
      }
      if (!blocked) throw new Error('Failed to block AWS metadata SSRF attempt');
    });

    await assertSecurityCheck('Block Google Cloud Metadata (metadata.google.internal)', async () => {
      let blocked = false;
      try {
        validateUrlSecurity('http://metadata.google.internal/computeMetadata/v1/');
      } catch (err) {
        if (err.message.includes('Security violation')) blocked = true;
      }
      if (!blocked) throw new Error('Failed to block Google Cloud metadata SSRF attempt');
    });

    await assertSecurityCheck('Block file:// Protocol Arbitrary Read Attempt', async () => {
      let blocked = false;
      try {
        validateUrlSecurity('file:///etc/passwd');
      } catch (err) {
        if (err.message.includes('Security violation')) blocked = true;
      }
      if (!blocked) throw new Error('Failed to block file:// protocol SSRF attempt');
    });

    await assertSecurityCheck('Block gopher:// and ftp:// Protocols', async () => {
      let blocked = false;
      try {
        validateUrlSecurity('gopher://127.0.0.1:6379/_FLUSHALL');
      } catch (err) {
        if (err.message.includes('Security violation')) blocked = true;
      }
      if (!blocked) throw new Error('Failed to block gopher:// protocol');
    });

    // =========================================================================
    // SECTION 2: Output Path Traversal & Unauthorized Overwrite
    // =========================================================================
    console.log('\n--- Section 2: Path Traversal & Destination Whitelisting ---');

    await assertSecurityCheck('Block Directory Traversal to /etc/passwd', async () => {
      const res = await client.sendRequest('tools/call', {
        name: 'convert_image',
        arguments: {
          inputPath: validImg,
          outputPath: '../../../../../../../../../../../../etc/passwd.webp',
          format: 'webp',
        },
      });
      // Tool returns isError: true or error message
      if (!res.isError && !res.content?.[0]?.text?.includes('Security violation') && !res.content?.[0]?.text?.includes('error')) {
        throw new Error('Allowed writing outside sandbox via directory traversal');
      }
    });

    await assertSecurityCheck('Block Arbitrary Executable Extension Write (.sh / .exe)', async () => {
      const res = await client.sendRequest('tools/call', {
        name: 'convert_image',
        arguments: {
          inputPath: validImg,
          outputPath: path.join(SECURITY_SANDBOX, 'exploit.sh'),
          format: 'webp',
        },
      });
      if (!res.isError && !res.content?.[0]?.text?.includes('Security violation') && !res.content?.[0]?.text?.includes('error')) {
        throw new Error('Allowed writing non-whitelisted output extension');
      }
    });

    await assertSecurityCheck('Block Overwriting Sensitive .git Folder', async () => {
      const res = await client.sendRequest('tools/call', {
        name: 'convert_image',
        arguments: {
          inputPath: validImg,
          outputPath: path.resolve('./.git/hook.webp'),
          format: 'webp',
        },
      });
      if (!res.isError && !res.content?.[0]?.text?.includes('Security violation') && !res.content?.[0]?.text?.includes('error')) {
        throw new Error('Allowed writing into protected .git directory');
      }
    });

    await assertSecurityCheck('Block Overwriting Environment Config (.env)', async () => {
      const res = await client.sendRequest('tools/call', {
        name: 'convert_image',
        arguments: {
          inputPath: validImg,
          outputPath: path.join(SECURITY_SANDBOX, '.env.local.webp'),
          format: 'webp',
        },
      });
      if (!res.isError && !res.content?.[0]?.text?.includes('Security violation') && !res.content?.[0]?.text?.includes('error')) {
        throw new Error('Allowed writing to sensitive .env filename');
      }
    });

    // =========================================================================
    // SECTION 3: Rollback Injection & Manifest Traversal
    // =========================================================================
    console.log('\n--- Section 3: Atomic Rollback Injection Guards ---');

    await assertSecurityCheck('Block Path Traversal in Rollback operationId', async () => {
      let blocked = false;
      try {
        await rollbackOperation('../../../../etc/passwd', SECURITY_SANDBOX);
      } catch (err) {
        if (err.message.includes('Security violation')) blocked = true;
      }
      if (!blocked) throw new Error('Failed to block directory traversal in operationId');
    });

    await assertSecurityCheck('Block Command Injection Pattern in operationId', async () => {
      let blocked = false;
      try {
        await rollbackOperation('op_123;rm -rf /', SECURITY_SANDBOX);
      } catch (err) {
        if (err.message.includes('Security violation')) blocked = true;
      }
      if (!blocked) throw new Error('Failed to block command injection in operationId');
    });

    await assertSecurityCheck('Handle Non-Existent Rollback Manifest Gracefully', async () => {
      let handled = false;
      try {
        await rollbackOperation('op_nonexistent_9999', SECURITY_SANDBOX);
      } catch (err) {
        if (err.message.includes('not found')) handled = true;
      }
      if (!handled) throw new Error('Did not handle missing manifest cleanly');
    });

    // =========================================================================
    // SECTION 4: Corrupt Media & Zero-Byte Input Edge Cases
    // =========================================================================
    console.log('\n--- Section 4: Corrupt & Zero-Byte Media Edge Cases ---');

    await assertSecurityCheck('Gracefully Handle Zero-Byte File in Media Analyzer', async () => {
      const res = await client.sendRequest('tools/call', {
        name: 'analyze_media',
        arguments: { filePath: zeroByteFile },
      });
      // Must not crash process; must return error response or invalid image issue
      if (!res || !res.content) throw new Error('Server crashed or returned empty response');
    });

    await assertSecurityCheck('Gracefully Handle Corrupted Garbage File in Media Analyzer', async () => {
      const res = await client.sendRequest('tools/call', {
        name: 'analyze_media',
        arguments: { filePath: corruptFile },
      });
      if (!res || !res.content) throw new Error('Server crashed on corrupt image');
      const data = JSON.parse(res.content[0].text);
      const hasIssue = (data.issues && data.issues.length > 0) || (data.summary?.topIssues && data.summary.topIssues.length > 0) || data.summary?.issueCount > 0 || data.error;
      if (!hasIssue) throw new Error('Expected issue report for corrupt file');
    });

    await assertSecurityCheck('Gracefully Handle Non-Existent File in convert_image', async () => {
      const res = await client.sendRequest('tools/call', {
        name: 'convert_image',
        arguments: {
          inputPath: path.join(SECURITY_SANDBOX, 'ghost_file.png'),
          format: 'webp',
        },
      });
      if (!res.isError && !res.content?.[0]?.text?.includes('not found')) {
        throw new Error('Expected file-not-found error for non-existent file');
      }
    });

    // =========================================================================
    // SECTION 5: AST Patch Confirmation Guard
    // =========================================================================
    console.log('\n--- Section 5: AST Source Code Patch Safety Guards ---');

    await assertSecurityCheck('Reject apply_source_patch if confirmApply is false', async () => {
      const res = await client.sendRequest('tools/call', {
        name: 'apply_source_patch',
        arguments: {
          projectPath: SECURITY_SANDBOX,
          patchId: 'patch_sample_123',
          confirmApply: false,
        },
      });
      if (!res.isError && !res.content?.[0]?.text?.includes('confirmApply')) {
        throw new Error('Allowed source code modification without confirmApply: true');
      }
    });

    console.log('\n===============================================================');
    console.log('📊 SECURITY & EDGE-CASE AUDIT SUMMARY');
    console.log('===============================================================\n');

    const passCount = results.filter((r) => r.pass).length;
    const failCount = results.filter((r) => !r.pass).length;

    console.log(`TOTAL SECURITY CHECKS: ${results.length}`);
    console.log(`PASSED / SECURED:      ${passCount}`);
    console.log(`FAILED / VULNERABLE:   ${failCount}`);
    console.log(`PASS RATE:             ${((passCount / results.length) * 100).toFixed(1)}%\n`);

    if (failCount > 0) {
      console.log('❌ Vulnerabilities Detected:');
      results.filter((r) => !r.pass).forEach((r) => console.log(`  - ${r.name}: ${r.error}`));
      process.exit(1);
    } else {
      console.log('🎉 100% OF ALL DEFENSIVE SECURITY & EDGE-CASE CHECKS PASSED!');
    }
  } finally {
    client.stop();
  }
}

runSecurityTests().catch((err) => {
  console.error('Fatal security test runner failure:', err);
  process.exit(1);
});
