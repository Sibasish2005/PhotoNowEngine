import { NextRequest, NextResponse } from 'next/server';
import { MCP_TOOLS } from '@/lib/mcpTools';
import { checkRateLimit, getRateLimiterStats } from '@/lib/rateLimiter';
import { mcpLoadBalancer } from '@/lib/loadBalancer';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// Maximum allowed payload size: 1MB for MCP JSON-RPC messages
const MAX_PAYLOAD_BYTES = 1024 * 1024;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(req: NextRequest) {
  // Apply rate limiter check
  const rateLimit = checkRateLimit(req);
  const clusterSnapshot = mcpLoadBalancer.getClusterSnapshot();
  const rateStats = getRateLimiterStats();

  const responseHeaders = {
    ...CORS_HEADERS,
    ...rateLimit.headers,
    'X-Load-Balancer-Nodes': String(clusterSnapshot.totalNodes),
    'X-Load-Balancer-Strategy': clusterSnapshot.activeStrategy,
  };

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${rateLimit.retryAfterSec} seconds.`,
      },
      { status: 429, headers: responseHeaders }
    );
  }

  return NextResponse.json(
    {
      name: 'photoConvert MCP Server',
      description: 'Agentic Photo & Video Converter with Browser Local Storage persistence',
      version: '1.0.0',
      protocol: 'mcp-jsonrpc-2.0',
      rateLimiter: {
        status: 'active',
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        windowSeconds: rateStats.windowSeconds,
      },
      loadBalancer: {
        status: 'active',
        strategy: clusterSnapshot.activeStrategy,
        healthyNodes: clusterSnapshot.healthyNodes,
        totalNodes: clusterSnapshot.totalNodes,
        totalRequestsProcessed: clusterSnapshot.totalRequestsProcessed,
        nodes: clusterSnapshot.nodes.map((n) => ({
          id: n.id,
          name: n.name,
          role: n.role,
          status: n.status,
          avgLatencyMs: n.avgLatencyMs,
          activeConnections: n.activeConnections,
        })),
      },
      toolsCount: MCP_TOOLS.length,
      tools: MCP_TOOLS,
    },
    { headers: responseHeaders }
  );
}

export async function POST(req: NextRequest) {
  // 1. RATE LIMITER CHECK
  const rateLimit = checkRateLimit(req);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32000,
          message: `Rate limit exceeded. Maximum ${rateLimit.limit} requests per minute. Retry in ${rateLimit.retryAfterSec}s.`,
          retryAfterSec: rateLimit.retryAfterSec,
        },
      },
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          ...rateLimit.headers,
        },
      }
    );
  }

  // 2. PAYLOAD SIZE GUARD
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32600, message: 'Invalid Request: Payload exceeds maximum limit (1MB)' },
      },
      { status: 413, headers: { ...CORS_HEADERS, ...rateLimit.headers } }
    );
  }

  // 3. LOAD BALANCER NODE ACQUISITION
  const startTime = Date.now();
  const node = mcpLoadBalancer.acquireNode();
  let executionSuccess = false;

  const responseHeaders = {
    ...CORS_HEADERS,
    ...rateLimit.headers,
    'X-Load-Balancer-Node': node.id,
    'X-Load-Balancer-Role': node.role,
    'X-Load-Balancer-Latency': `${node.avgLatencyMs}ms`,
  };

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: 'Parse error: Invalid or malformed JSON payload' },
        },
        { status: 400, headers: responseHeaders }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32600, message: 'Invalid Request: Expected a JSON object' },
        },
        { status: 400, headers: responseHeaders }
      );
    }

    const { jsonrpc, id, method, params } = body;

    // Check JSON-RPC 2.0 version spec
    if (jsonrpc !== '2.0') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: id ?? null,
          error: { code: -32600, message: 'Invalid Request: Expected jsonrpc "2.0"' },
        },
        { status: 400, headers: responseHeaders }
      );
    }

    if (!method || typeof method !== 'string') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: id ?? null,
          error: { code: -32600, message: 'Invalid Request: "method" must be a non-empty string' },
        },
        { status: 400, headers: responseHeaders }
      );
    }

    // Handle MCP Handshake
    if (method === 'initialize') {
      executionSuccess = true;
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {
                listChanged: false,
              },
            },
            serverInfo: {
              name: 'photoConvert-agent-mcp',
              version: '1.0.0',
            },
            nodeInfo: {
              assignedNode: node.id,
              nodeRole: node.role,
            },
          },
        },
        { headers: responseHeaders }
      );
    }

    if (method === 'notifications/initialized') {
      executionSuccess = true;
      return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, result: {} }, { headers: responseHeaders });
    }

    if (method === 'tools/list') {
      executionSuccess = true;
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            tools: MCP_TOOLS,
          },
        },
        { headers: responseHeaders }
      );
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const toolArgs = (params?.arguments && typeof params.arguments === 'object') ? params.arguments : {};

      if (!toolName || typeof toolName !== 'string') {
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            id: id ?? null,
            error: { code: -32602, message: 'Invalid params: "name" parameter is required for tools/call' },
          },
          { status: 400, headers: responseHeaders }
        );
      }

      const tool = MCP_TOOLS.find((t) => t.name === toolName);
      if (!tool) {
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Unknown tool: ${toolName}` },
          },
          { headers: responseHeaders }
        );
      }

      // Execute tool dispatch instruction
      let resultData: any = {};
      if (toolName === 'convert_image') {
        resultData = {
          success: true,
          mode: 'client_browser_storage',
          message: `Ready to convert image to ${String(toolArgs.format || 'WEBP').toUpperCase()} at ${Math.round((Number(toolArgs.quality) || 0.8) * 100)}% quality.`,
          parametersApplied: toolArgs,
          storageDestination: 'photoConvert_DB (IndexedDB in browser)',
          workerNode: node.id,
        };
      } else if (toolName === 'convert_video') {
        resultData = {
          success: true,
          mode: 'client_browser_storage',
          message: `Video conversion action [${String(toolArgs.action || 'webm')}] scheduled in browser memory.`,
          parametersApplied: toolArgs,
          storageDestination: 'photoConvert_DB (IndexedDB in browser)',
          workerNode: node.id,
        };
      } else if (toolName === 'extract_poster_frame') {
        resultData = {
          success: true,
          message: `Frame extracted at timestamp ${Number(toolArgs.timestamp) || 0.5}s in ${String(toolArgs.format || 'webp')} format.`,
          parametersApplied: toolArgs,
          workerNode: node.id,
        };
      } else if (toolName === 'extract_audio') {
        resultData = {
          success: true,
          message: 'Audio extraction to 16-bit PCM WAV initialized in browser audio context.',
          format: 'wav',
          workerNode: node.id,
        };
      } else if (toolName === 'list_storage_conversions') {
        resultData = {
          success: true,
          message: 'Storage query dispatched. Conversions are stored securely in browser IndexedDB.',
          storageEngine: 'IndexedDB (photoConvert_DB)',
          workerNode: node.id,
        };
      }

      executionSuccess = true;
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(resultData, null, 2),
              },
            ],
          },
        },
        { headers: responseHeaders }
      );
    }

    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: id ?? null,
        error: { code: -32601, message: `Method not found: ${method}` },
      },
      { headers: responseHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32603, message: 'Internal error: ' + error.message },
      },
      { status: 500, headers: responseHeaders }
    );
  } finally {
    // Release node in load balancer and update moving average latency
    const duration = Date.now() - startTime;
    mcpLoadBalancer.releaseNode(node.id, executionSuccess, duration);
  }
}
