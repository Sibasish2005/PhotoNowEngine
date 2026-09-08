// Test HTTP JSON-RPC 2.0 MCP Endpoint on http://localhost:3000/api/mcp

const BASE_URL = 'http://localhost:3000/api/mcp';

async function rpcCall(method, params = {}, id = 1) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return await res.json();
}

async function run() {
  console.log('================================================================');
  console.log('🌐 TESTING MCP HTTP JSON-RPC 2.0 TRANSPORT (/api/mcp)');
  console.log('================================================================\n');

  // 1. GET metadata
  const getRes = await fetch(BASE_URL);
  const getJson = await getRes.json();
  console.log(`✓ GET /api/mcp: Server=${getJson.name} (Tools Count: ${getJson.toolsCount})`);

  // 2. initialize
  const initRes = await rpcCall('initialize');
  console.log(`✓ MCP Handshake initialize: Protocol=${initRes.result?.protocolVersion}, Assigned Node=${initRes.result?.nodeInfo?.assignedNode}`);

  // 3. tools/list
  const listRes = await rpcCall('tools/list');
  const tools = listRes.result?.tools || [];
  console.log(`✓ tools/list: ${tools.length} tools registered over HTTP transport`);

  // 4. Test Key Tools via HTTP
  const toolsToTest = [
    { name: 'convert_image', args: { format: 'webp', quality: 0.8 } },
    { name: 'convert_video', args: { action: 'webm' } },
    { name: 'convert_audio', args: { format: 'mp3' } },
    { name: 'convert_batch', args: { directoryPath: '.' } },
    { name: 'extract_poster_frame', args: { timestamp: 1.0, format: 'webp' } },
    { name: 'extract_audio', args: {} },
    { name: 'get_media_info', args: { filePath: 'package.json' } },
    { name: 'optimize_for_agent', args: { inputPath: 'sample.png', maxDimension: 1280 } },
    { name: 'list_storage_conversions', args: {} },
    { name: 'test_web_performance', args: { localPath: '.' } },
    { name: 'analyze_web_assets', args: { directoryPath: '.' } },
    { name: 'inspect_project', args: { projectPath: '.' } },
    { name: 'check_performance_budget', args: { projectPath: '.' } },
    { name: 'verify_runtime_performance', args: { targetUrl: 'http://localhost:3000' } },
  ];

  console.log(`\nTesting sample tool executions over HTTP JSON-RPC:`);
  let passed = 0;
  for (const t of toolsToTest) {
    const start = Date.now();
    try {
      const callRes = await rpcCall('tools/call', { name: t.name, arguments: t.args }, Math.floor(Math.random() * 10000));
      const duration = Date.now() - start;
      if (callRes.error) {
        throw new Error(callRes.error.message || JSON.stringify(callRes.error));
      }
      console.log(`  ✅ ${t.name} passed (${duration}ms)`);
      passed++;
    } catch (err) {
      console.log(`  ❌ ${t.name} failed: ${err.message}`);
    }
  }

  console.log(`\nHTTP MCP TEST RESULT: ${passed} / ${toolsToTest.length} PASSED!\n`);
}

run().catch((e) => {
  console.error('HTTP Test error:', e);
  process.exit(1);
});
