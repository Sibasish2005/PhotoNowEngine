/**
 * PhotoNow HTTP JSON-RPC 2.0 Transport Standard Test Suite
 *
 * Tests /api/mcp endpoint for JSON-RPC 2.0 specification compliance,
 * error handling (-32600, -32601, -32602), tool discovery, and tool execution.
 */

const BASE_URL = 'http://localhost:3000/api/mcp';

async function rpcCall(payload) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: res.status, json: await res.json() };
}

async function runHttpTests() {
  console.log('================================================================');
  console.log('🌐 PHOTONOW HTTP JSON-RPC 2.0 PROTOCOL & EDGE-CASE TEST SUITE');
  console.log('================================================================\n');

  const results = [];

  async function assertHttp(name, testFn) {
    process.stdout.write(`• Testing: ${name}... `);
    const start = Date.now();
    try {
      await testFn();
      const duration = Date.now() - start;
      console.log(`✅ PASS (${duration}ms)`);
      results.push({ name, pass: true, duration });
    } catch (err) {
      const duration = Date.now() - start;
      console.log(`❌ FAIL (${duration}ms): ${err.message}`);
      results.push({ name, pass: false, duration, error: err.message });
    }
  }

  // 1. GET metadata
  await assertHttp('GET /api/mcp discovery metadata', async () => {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.name || !data.toolsCount) throw new Error('Missing metadata fields');
  });

  // 2. Protocol Handshake: initialize
  await assertHttp('JSON-RPC "initialize" handshake', async () => {
    const { status, json } = await rpcCall({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { clientInfo: { name: 'test-runner' } },
    });
    if (status !== 200 || !json.result?.protocolVersion) throw new Error('Failed initialization handshake');
  });

  // 3. Protocol Discovery: tools/list
  await assertHttp('JSON-RPC "tools/list" discovery', async () => {
    const { status, json } = await rpcCall({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
    });
    if (status !== 200 || !Array.isArray(json.result?.tools) || json.result.tools.length < 29) {
      throw new Error(`Expected at least 29 tools, got ${json.result?.tools?.length}`);
    }
  });

  // 4. Edge Case: Invalid JSON-RPC version
  await assertHttp('Reject invalid jsonrpc version with -32600', async () => {
    const { status, json } = await rpcCall({
      jsonrpc: '1.0',
      id: 3,
      method: 'tools/list',
    });
    if (status !== 400 || json.error?.code !== -32600) {
      throw new Error(`Expected error code -32600, got ${json.error?.code}`);
    }
  });

  // 5. Edge Case: Unknown Method
  await assertHttp('Reject unknown method with -32601', async () => {
    const { json } = await rpcCall({
      jsonrpc: '2.0',
      id: 4,
      method: 'non_existent_method_xyz',
    });
    if (json.error?.code !== -32601) {
      throw new Error(`Expected error code -32601, got ${json.error?.code}`);
    }
  });

  // 6. Edge Case: tools/call missing "name" parameter
  await assertHttp('Reject tools/call without tool name with -32602', async () => {
    const { status, json } = await rpcCall({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {},
    });
    if (status !== 400 || json.error?.code !== -32602) {
      throw new Error(`Expected -32602 for missing name, got ${json.error?.code}`);
    }
  });

  // 7. Edge Case: Calling unregistered tool name
  await assertHttp('Reject unknown tool name with -32602', async () => {
    const { json } = await rpcCall({
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: { name: 'fictional_tool_abc' },
    });
    if (json.error?.code !== -32602) {
      throw new Error(`Expected -32602 for unknown tool, got ${json.error?.code}`);
    }
  });

  // 8. Tool Call: test_web_performance
  await assertHttp('Execute tools/call (test_web_performance)', async () => {
    const { status, json } = await rpcCall({
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: {
        name: 'test_web_performance',
        arguments: { localPath: '.' },
      },
    });
    if (status !== 200 || !json.result?.content?.[0]?.text) {
      throw new Error('Failed tool execution');
    }
  });

  // 9. Tool Call: inspect_project
  await assertHttp('Execute tools/call (inspect_project)', async () => {
    const { status, json } = await rpcCall({
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: {
        name: 'inspect_project',
        arguments: { projectPath: '.' },
      },
    });
    if (status !== 200 || !json.result?.content?.[0]?.text) {
      throw new Error('Failed tool execution');
    }
  });

  // 10. Tool Call: convert_image in-memory
  await assertHttp('Execute tools/call (convert_image in-memory)', async () => {
    const tinyPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const { status, json } = await rpcCall({
      jsonrpc: '2.0',
      id: 9,
      method: 'tools/call',
      params: {
        name: 'convert_image',
        arguments: {
          imageBase64: tinyPngBase64,
          format: 'webp',
          quality: 0.8,
        },
      },
    });
    if (status !== 200 || !json.result?.content?.[0]?.text) {
      throw new Error('Failed in-memory image conversion');
    }
    const data = JSON.parse(json.result.content[0].text);
    if (!data.convertedImageBase64) throw new Error('Missing converted base64 output');
  });

  console.log('\n================================================================');
  console.log('📊 HTTP JSON-RPC 2.0 PROTOCOL AUDIT SUMMARY');
  console.log('================================================================\n');

  const passCount = results.filter((r) => r.pass).length;
  const failCount = results.filter((r) => !r.pass).length;

  console.log(`TOTAL HTTP CHECKS:   ${results.length}`);
  console.log(`PASSED:              ${passCount}`);
  console.log(`FAILED:              ${failCount}`);
  console.log(`PASS RATE:           ${((passCount / results.length) * 100).toFixed(1)}%\n`);

  if (failCount > 0) {
    process.exit(1);
  } else {
    console.log('🎉 100% OF ALL HTTP JSON-RPC 2.0 PROTOCOL & EDGE-CASE CHECKS PASSED!');
  }
}

runHttpTests().catch((err) => {
  console.error('Fatal HTTP test runner failure:', err);
  process.exit(1);
});
