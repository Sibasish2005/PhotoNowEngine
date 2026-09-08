// Automated Production Test Suite for https://photonow.vercel.app

const PROD_URL = 'https://photonow.vercel.app';

async function testEndpoint(name, testFn) {
  process.stdout.write(`Testing ${name}... `);
  const start = Date.now();
  try {
    const res = await testFn();
    const duration = Date.now() - start;
    console.log(`✅ PASS (${duration}ms)`);
    return { name, pass: true, duration, data: res };
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`❌ FAIL (${duration}ms): ${err.message}`);
    return { name, pass: false, duration, error: err.message };
  }
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`🌐 RUNNING AUTOMATED PRODUCTION TEST SUITE`);
  console.log(`🎯 Target: ${PROD_URL}`);
  console.log(`======================================================\n`);

  const results = [];

  // 1. Static Pages & Discovery
  results.push(await testEndpoint('GET / (Home Page)', async () => {
    const res = await fetch(`${PROD_URL}/`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    if (!html.includes('PHOTONOW.ENGINE') && !html.includes('PhotoNow')) throw new Error('Missing brand text');
    return { bytes: html.length };
  }));

  results.push(await testEndpoint('GET /robots.txt', async () => {
    const res = await fetch(`${PROD_URL}/robots.txt`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return { preview: text.slice(0, 50) };
  }));

  results.push(await testEndpoint('GET /sitemap.xml', async () => {
    const res = await fetch(`${PROD_URL}/sitemap.xml`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes('urlset')) throw new Error('Invalid sitemap XML');
    return { urls: (text.match(/<loc>/g) || []).length };
  }));

  results.push(await testEndpoint('GET /llms.txt', async () => {
    const res = await fetch(`${PROD_URL}/llms.txt`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes('PhotoNow')) throw new Error('Invalid llms.txt');
    return { length: text.length };
  }));

  // 2. Performance over MCP: test_web_performance tool
  results.push(await testEndpoint('POST /api/mcp (tool: test_web_performance)', async () => {
    const res = await fetch(`${PROD_URL}/api/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'test-1',
        method: 'tools/call',
        params: {
          name: 'test_web_performance',
          arguments: { url: 'https://example.com' },
        },
      }),
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || 'JSON-RPC error');
    return { ok: true };
  }));

  // 3. Performance over MCP: inspect_project tool
  results.push(await testEndpoint('POST /api/mcp (tool: inspect_project)', async () => {
    const res = await fetch(`${PROD_URL}/api/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'test-2',
        method: 'tools/call',
        params: {
          name: 'inspect_project',
          arguments: { projectPath: 'tests/fixtures/nextjs_project' },
        },
      }),
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || 'JSON-RPC error');
    return { ok: true };
  }));

  // 4. Performance over MCP: find_unused_assets tool
  results.push(await testEndpoint('POST /api/mcp (tool: find_unused_assets)', async () => {
    const res = await fetch(`${PROD_URL}/api/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'test-3',
        method: 'tools/call',
        params: {
          name: 'find_unused_assets',
          arguments: { projectPath: 'tests/fixtures/nextjs_project' },
        },
      }),
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || 'JSON-RPC error');
    return { ok: true };
  }));

  // 5. Performance over MCP: check_performance_budget tool
  results.push(await testEndpoint('POST /api/mcp (tool: check_performance_budget)', async () => {
    const res = await fetch(`${PROD_URL}/api/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'test-4',
        method: 'tools/call',
        params: {
          name: 'check_performance_budget',
          arguments: { projectPath: 'tests/fixtures/nextjs_project' },
        },
      }),
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || 'JSON-RPC error');
    return { ok: true };
  }));

  // 6. MCP API: JSON-RPC tools/list
  results.push(await testEndpoint('POST /api/mcp (JSON-RPC tools/list)', async () => {
    const res = await fetch(`${PROD_URL}/api/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      }),
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || 'JSON-RPC error');
    const tools = json.result?.tools || [];
    if (tools.length === 0) throw new Error('0 tools returned');
    return { toolsCount: tools.length };
  }));

  // 7. MCP API: JSON-RPC tools/call (test_web_performance)
  results.push(await testEndpoint('POST /api/mcp (JSON-RPC call: test_web_performance)', async () => {
    const res = await fetch(`${PROD_URL}/api/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'test_web_performance',
          arguments: { url: 'https://example.com' },
        },
      }),
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || 'JSON-RPC error');
    return { content: json.result?.content?.[0]?.text?.slice(0, 100) };
  }));

  // 8. MCP API: JSON-RPC tools/call (inspect_project)
  results.push(await testEndpoint('POST /api/mcp (JSON-RPC call: inspect_project)', async () => {
    const res = await fetch(`${PROD_URL}/api/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'inspect_project',
          arguments: { targetPath: 'tests/fixtures/nextjs_project' },
        },
      }),
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || 'JSON-RPC error');
    return { content: json.result?.content?.[0]?.text?.slice(0, 100) };
  }));

  console.log(`\n======================================================`);
  const passCount = results.filter(r => r.pass).length;
  console.log(`📊 SUMMARY: ${passCount} / ${results.length} ENDPOINTS PASSED IN PRODUCTION`);
  console.log(`======================================================\n`);
}

run();
