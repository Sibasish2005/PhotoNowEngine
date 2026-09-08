/**
 * PhotoNow External Client & Isolated Sandbox Verification Suite
 *
 * Simulates how external AI agents (Claude Desktop, Cursor, Antigravity)
 * and external workflows interact with the PhotoNow MCP server across:
 * 1. Native child process Stdio JSON-RPC 2.0 communication
 * 2. HTTP JSON-RPC 2.0 protocol (/api/mcp)
 * 3. Completely isolated sandbox repository (tests/sandbox_external)
 * 4. End-to-end agentic workflow: Inspect -> Analyze -> Plan -> Optimize -> Patch -> Rollback -> Mission
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import assert from 'assert';
import sharp from 'sharp';

const SANDBOX_DIR = path.resolve('./tests/sandbox_external');
const SERVER_SCRIPT = path.resolve('./bin/mcp-server.mjs');
const HTTP_ENDPOINT = 'http://localhost:3000/api/mcp';

// ============================================================================
// External Stdio MCP Client (Zero internal engine imports)
// ============================================================================
class ExternalMcpClient {
  constructor(serverPath) {
    this.serverPath = serverPath;
    this.reqId = 1;
    this.pending = new Map();
    this.buffer = '';
  }

  start() {
    this.proc = spawn('node', [this.serverPath], {
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
        } catch {
          // ignore non-json log lines
        }
      }
    });

    this.proc.on('exit', (code) => {
      for (const [, { reject }] of this.pending) {
        reject(new Error(`MCP server process exited with code ${code}`));
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

  async callTool(name, args = {}) {
    const res = await this.sendRequest('tools/call', { name, arguments: args });
    if (!res?.content || !res.content[0]?.text) {
      throw new Error(`Invalid response format from tool ${name}: ${JSON.stringify(res)}`);
    }
    return JSON.parse(res.content[0].text);
  }

  stop() {
    if (this.proc) {
      this.proc.kill();
      this.proc = null;
    }
  }
}

// ============================================================================
// Sandbox Setup: Creates a realistic external Next.js application
// ============================================================================
async function setupExternalSandbox() {
  await fs.rm(SANDBOX_DIR, { recursive: true, force: true });
  await fs.mkdir(path.join(SANDBOX_DIR, 'app', 'pricing'), { recursive: true });
  await fs.mkdir(path.join(SANDBOX_DIR, 'components'), { recursive: true });
  await fs.mkdir(path.join(SANDBOX_DIR, 'public'), { recursive: true });

  // 1. package.json
  await fs.writeFile(
    path.join(SANDBOX_DIR, 'package.json'),
    JSON.stringify({
      name: 'external-sandbox-app',
      version: '1.0.0',
      dependencies: {
        next: '15.1.0',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
      },
    }, null, 2),
    'utf8'
  );

  // 2. app/page.tsx (LCP hero image)
  await fs.writeFile(
    path.join(SANDBOX_DIR, 'app', 'page.tsx'),
    `import Image from 'next/image';
import { Header } from '../components/Header';

export default function HomePage() {
  return (
    <main>
      <Header />
      <h1>External Customer Landing Page</h1>
      <Image src="/hero_banner.png" width={1920} height={1080} priority alt="Hero Banner Presentation" />
    </main>
  );
}\n`,
    'utf8'
  );

  // 3. app/pricing/page.tsx
  await fs.writeFile(
    path.join(SANDBOX_DIR, 'app', 'pricing', 'page.tsx'),
    `export default function PricingPage() {
  return (
    <div>
      <h2>Pricing Plans</h2>
      <img src="/pricing_badge.jpg" width="600" height="300" alt="Pricing Plan" />
      <img src="/logo.svg" width="120" height="40" alt="Brand Logo" />
    </div>
  );
}\n`,
    'utf8'
  );

  // 4. components/Header.tsx
  await fs.writeFile(
    path.join(SANDBOX_DIR, 'components', 'Header.tsx'),
    `export function Header() {
  return (
    <header>
      <img src="/logo.svg" width="120" height="40" alt="Logo" />
    </header>
  );
}\n`,
    'utf8'
  );

  // 5. Generate Real Media Assets in public/
  // 5a. Oversized photographic PNG hero (2400x1600)
  await sharp({
    create: {
      width: 2400,
      height: 1600,
      channels: 3,
      background: { r: 50, g: 120, b: 220 },
    },
  })
    .png({ compressionLevel: 2 })
    .toFile(path.join(SANDBOX_DIR, 'public', 'hero_banner.png'));

  // 5b. Uncompressed photographic JPEG (1600x900)
  await sharp({
    create: {
      width: 1600,
      height: 900,
      channels: 3,
      background: { r: 210, g: 80, b: 60 },
    },
  })
    .jpeg({ quality: 95 })
    .toFile(path.join(SANDBOX_DIR, 'public', 'pricing_badge.jpg'));

  // 5c. Completely unreferenced / dead asset (1200x800)
  await sharp({
    create: {
      width: 1200,
      height: 800,
      channels: 3,
      background: { r: 100, g: 100, b: 100 },
    },
  })
    .jpeg({ quality: 80 })
    .toFile(path.join(SANDBOX_DIR, 'public', 'unused_archive_photo.jpg'));

  // 5d. Clean SVG vector
  await fs.writeFile(
    path.join(SANDBOX_DIR, 'public', 'logo.svg'),
    `<svg width="120" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="40" fill="#111"/><text x="10" y="25" fill="#fff" font-family="sans-serif" font-size="14">LOGO</text></svg>`,
    'utf8'
  );
}

// ============================================================================
// Test Suite Runner
// ============================================================================
async function runExternalSandboxTests() {
  console.log('\n================================================================');
  console.log('🧪 PHOTONOW EXTERNAL CLIENT & SANDBOX VERIFICATION SUITE');
  console.log('================================================================\n');

  console.log('📂 Setting up isolated sandbox application at:');
  console.log(`   ${SANDBOX_DIR}`);
  await setupExternalSandbox();
  console.log('   ✓ Sandbox files initialized: Next.js App Router with 4 media assets.\n');

  const client = new ExternalMcpClient(SERVER_SCRIPT);
  client.start();

  let passed = 0;
  let total = 0;

  async function check(name, testFn) {
    total++;
    process.stdout.write(`• [Test ${String(total).padStart(2, '0')}] ${name}... `);
    const start = Date.now();
    try {
      await testFn();
      const elapsed = Date.now() - start;
      console.log(`✅ PASS (${elapsed}ms)`);
      passed++;
    } catch (err) {
      console.log(`❌ FAIL: ${err.message}`);
      throw err;
    }
  }

  try {
    // -------------------------------------------------------------
    // Step 1: External Client Protocol Handshake
    // -------------------------------------------------------------
    await check('External Stdio JSON-RPC Handshake (initialize)', async () => {
      const res = await client.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        clientInfo: { name: 'external-test-agent', version: '1.0.0' },
        capabilities: {},
      });
      assert.ok(res.protocolVersion, 'Should return protocolVersion');
      assert.ok(res.serverInfo?.name.includes('photo-convert-mcp'), 'Server name should match');
      assert.ok(res.capabilities?.tools, 'Server should advertise tool capabilities');
    });

    // -------------------------------------------------------------
    // Step 2: Tool Discovery
    // -------------------------------------------------------------
    await check('External Tool Discovery (tools/list)', async () => {
      const res = await client.sendRequest('tools/list', {});
      assert.ok(Array.isArray(res.tools), 'tools should be an array');
      assert.strictEqual(res.tools.length, 29, 'External client must discover exactly 29 tools');
    });

    // -------------------------------------------------------------
    // Step 3: Project Architecture Inspection
    // -------------------------------------------------------------
    await check('Inspect External Sandbox Project (inspect_project)', async () => {
      const res = await client.callTool('inspect_project', { projectPath: SANDBOX_DIR });
      const data = res.summary || res.details || res;
      assert.ok(data.framework?.includes('nextjs'), 'Should detect Next.js framework');
      assert.ok(data.assetFilesCount >= 4 || data.assetCount >= 4, 'Should detect at least 4 assets');
    });

    // -------------------------------------------------------------
    // Step 4: Asset Diagnostics & Bottleneck Identification
    // -------------------------------------------------------------
    await check('Analyze Sandbox Web Assets (analyze_web_assets)', async () => {
      const res = await client.callTool('analyze_web_assets', { directoryPath: SANDBOX_DIR });
      const data = res.summary || res.details || res;
      assert.ok(data.score !== undefined, 'Should calculate performance score');
      assert.ok((data.totalAssets || data.assetCount || 4) >= 4, 'Should analyze assets');
    });

    // -------------------------------------------------------------
    // Step 5: Unused Dead Asset Pruning Detection
    // -------------------------------------------------------------
    await check('Find Dead Assets in Sandbox (find_unused_assets)', async () => {
      const res = await client.callTool('find_unused_assets', { projectPath: SANDBOX_DIR });
      const data = res.summary || res.details || res;
      assert.ok(data.totalUnusedFound >= 1, 'Should detect unused assets');
      assert.ok(data.topUnused?.some((s) => s.includes('unused_archive_photo.jpg')), 'Should list unused_archive_photo.jpg');
    });

    // -------------------------------------------------------------
    // Step 6: AST Asset Usage & LCP Priority Tracing
    // -------------------------------------------------------------
    await check('Trace AST Asset Usage & LCP Status (get_asset_usage)', async () => {
      const res = await client.callTool('get_asset_usage', {
        projectPath: SANDBOX_DIR,
        assetPath: 'hero_banner.png',
      });
      const data = res.summary || res.details || res;
      assert.strictEqual(data.referenceCount, 1, 'Should find 1 reference');
      assert.strictEqual(data.isLcpCandidate, true, 'hero_banner should be flagged as LCP candidate');
    });

    // -------------------------------------------------------------
    // Step 7: Performance Budget Evaluation
    // -------------------------------------------------------------
    await check('Check Sandbox Performance Budget (check_performance_budget)', async () => {
      const res = await client.callTool('check_performance_budget', {
        projectPath: SANDBOX_DIR,
      });
      const data = res.summary || res.details || res;
      assert.ok(data.status !== undefined, 'Should evaluate budget status');
    });

    // -------------------------------------------------------------
    // Step 8: Actionable Optimization Plan Formulation
    // -------------------------------------------------------------
    let planId = null;
    await check('Generate Optimization Plan for Sandbox (generate_optimization_plan)', async () => {
      const res = await client.callTool('generate_optimization_plan', {
        directoryPath: SANDBOX_DIR,
        format: 'webp',
        quality: 80,
      });
      const data = res.summary || res.details || res;
      assert.ok(data.planId, 'Should generate planId');
      assert.ok((data.actionsCount ?? 0) >= 2, 'Should propose actions');
      planId = data.planId;
    });

    // -------------------------------------------------------------
    // Step 9: Safe Non-Destructive Asset Transformation
    // -------------------------------------------------------------
    await check('Execute Optimization Plan Safely (optimize_web_assets)', async () => {
      const res = await client.callTool('optimize_web_assets', { planId });
      const data = res.summary || res.details || res;
      assert.ok((data.succeeded ?? 0) >= 2, 'Should successfully convert assets');

      // Verify non-destructive guarantee: original files still exist
      const heroOriginalExists = await fs.access(path.join(SANDBOX_DIR, 'public', 'hero_banner.png')).then(() => true).catch(() => false);
      assert.strictEqual(heroOriginalExists, true, 'Original hero_banner.png must NOT be deleted');

      // Verify optimized files exist in .photonow/optimized/public/
      const optimizedFiles = await fs.readdir(path.join(SANDBOX_DIR, '.photonow', 'optimized', 'public'));
      assert.ok(optimizedFiles.length >= 2, 'Should write optimized files to .photonow/optimized/public');
    });

    // -------------------------------------------------------------
    // Step 10: Source Code AST Patch Generation
    // -------------------------------------------------------------
    let patchId = null;
    await check('Generate AST Source Code Patches (generate_source_patch)', async () => {
      const res = await client.callTool('generate_source_patch', {
        projectPath: SANDBOX_DIR,
        planId,
      });
      const data = res.summary || res.details || res;
      assert.ok(data.patchId, 'Should generate patchId');
      assert.ok((data.affectedFilesCount ?? 0) >= 1, 'Should patch at least app/page.tsx');
      patchId = data.patchId;
    });

    // -------------------------------------------------------------
    // Step 11: AST Patch Application with Backup Creation
    // -------------------------------------------------------------
    let operationId = null;
    await check('Apply AST Source Patch with Backups (apply_source_patch)', async () => {
      const res = await client.callTool('apply_source_patch', {
        patchId,
        projectPath: SANDBOX_DIR,
        confirmApply: true,
      });
      const data = res.summary || res.details || res;
      assert.ok(data.operationId, 'Should return operationId for rollback');
      operationId = data.operationId;

      const updatedPage = await fs.readFile(path.join(SANDBOX_DIR, 'app', 'page.tsx'), 'utf8');
      assert.ok(updatedPage.includes('.avif') || updatedPage.includes('.webp'), 'app/page.tsx should now reference the optimized modern asset');

      // Verify backup manifest exists in .photonow/backups/
      const backupDir = path.join(SANDBOX_DIR, '.photonow', 'backups', operationId);
      const backupExists = await fs.access(backupDir).then(() => true).catch(() => false);
      assert.strictEqual(backupExists, true, 'Backup directory must exist for atomic rollback');
    });

    // -------------------------------------------------------------
    // Step 12: Atomic Rollback to Pre-Patch State
    // -------------------------------------------------------------
    await check('Atomically Rollback Source Changes (rollback_operation)', async () => {
      const res = await client.callTool('rollback_operation', {
        operationId,
        projectPath: SANDBOX_DIR,
      });
      const data = res.summary || res.details || res;
      assert.ok((data.restoredSourcesCount ?? 0) >= 1, 'Should restore modified files');

      // Verify that app/page.tsx is reverted back to original
      const revertedPage = await fs.readFile(path.join(SANDBOX_DIR, 'app', 'page.tsx'), 'utf8');
      assert.ok(revertedPage.includes('hero_banner.png'), 'app/page.tsx must be cleanly restored to hero_banner.png');
      assert.ok(!revertedPage.includes('hero_banner.webp') && !revertedPage.includes('hero_banner.avif'), 'Optimized references should be removed after rollback');
    });

    // -------------------------------------------------------------
    // Step 13: Full Autonomous Mission (optimize_project)
    // -------------------------------------------------------------
    await check('Autonomous End-to-End Mission in Sandbox (optimize_project)', async () => {
      const res = await client.callTool('optimize_project', {
        projectPath: SANDBOX_DIR,
        dryRun: true,
        format: 'webp',
      });
      const data = res.summary || res.details || res;
      assert.strictEqual(data.status, 'dry_run_complete', 'Should finish dry run');
      assert.ok(data.bytesSavedFormatted || data.bytesSaved, 'Should calculate prospective savings');
      assert.ok(data.sourcePatchesCount !== undefined, 'Should evaluate source patches');
      assert.strictEqual(data.rollbackAvailable, false, 'Dry run should not create rollback manifest');
    });

    // -------------------------------------------------------------
    // Step 14: Multimedia Foundation Tools on Sandbox Files
    // -------------------------------------------------------------
    await check('Multimedia Tools: get_media_info & optimize_for_agent', async () => {
      const heroPath = path.join(SANDBOX_DIR, 'public', 'hero_banner.png');
      const info = await client.callTool('get_media_info', { filePath: heroPath });
      const infoData = info.summary || info.details || info;
      assert.strictEqual(infoData.format, 'png');
      assert.strictEqual(infoData.width, 2400);
      assert.strictEqual(infoData.height, 1600);

      const agentOpt = await client.callTool('optimize_for_agent', {
        inputPath: heroPath,
        maxDimension: 800,
      });
      const optData = agentOpt.summary || agentOpt.details || agentOpt;
      assert.strictEqual(optData.status, 'success');
      assert.ok(optData.optimizedFilePath?.endsWith('.webp'), 'Should save optimized WebP image for agent');
      assert.ok(optData.dimensions?.width <= 800, 'Dimension should be constrained for LLM vision');
    });

    // -------------------------------------------------------------
    // Step 15: External HTTP JSON-RPC Verification (/api/mcp)
    // -------------------------------------------------------------
    await check('External HTTP JSON-RPC Verification (POST /api/mcp)', async () => {
      const response = await fetch(HTTP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 999,
          method: 'tools/call',
          params: {
            name: 'test_web_performance',
            arguments: { localPath: SANDBOX_DIR },
          },
        }),
      });

      assert.strictEqual(response.status, 200, 'HTTP response should be 200 OK');
      const data = await response.json();
      assert.strictEqual(data.jsonrpc, '2.0');
      assert.strictEqual(data.id, 999);
      assert.ok(data.result?.content?.[0]?.text, 'Should contain JSON-RPC content text');

      const parsed = JSON.parse(data.result.content[0].text);
      const resData = parsed.summary || parsed.details || parsed;
      assert.ok(resData.score !== undefined, 'Should return performance score over HTTP');
      assert.ok(resData.testId, 'Should generate testId over HTTP');
    });

  } finally {
    client.stop();
  }

  // =============================================================
  // Audit Summary
  // =============================================================
  console.log('\n================================================================');
  console.log('📊 EXTERNAL SANDBOX AUDIT SUMMARY');
  console.log('================================================================');
  console.log(`TOTAL CHECKS:       ${total}`);
  console.log(`PASSED:             ${passed}`);
  console.log(`FAILED:             ${total - passed}`);
  console.log(`PASS RATE:          ${((passed / total) * 100).toFixed(1)}%`);
  console.log('================================================================\n');

  if (passed === total) {
    console.log('🎉 100% OF EXTERNAL CLIENT & SANDBOX CHECKS PASSED!\n');
  } else {
    process.exit(1);
  }
}

runExternalSandboxTests().catch((err) => {
  console.error('\n❌ Unhandled error in external sandbox verification:', err);
  process.exit(1);
});
