import { NextRequest, NextResponse } from 'next/server';
import { MCP_TOOLS } from '@/lib/mcpTools';

export async function GET() {
  return NextResponse.json({
    name: 'photoConvert MCP Server',
    description: 'Agentic Photo & Video Converter with Browser Local Storage persistence',
    version: '1.0.0',
    protocol: 'mcp-jsonrpc-2.0',
    toolsCount: MCP_TOOLS.length,
    tools: MCP_TOOLS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jsonrpc, id, method, params } = body;

    // Check JSON-RPC 2.0
    if (jsonrpc !== '2.0') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: id || null,
          error: { code: -32600, message: 'Invalid Request: Expected jsonrpc 2.0' },
        },
        { status: 400 }
      );
    }

    // Handle MCP Methods
    if (method === 'initialize') {
      return NextResponse.json({
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
        },
      });
    }

    if (method === 'notifications/initialized') {
      return NextResponse.json({ jsonrpc: '2.0', id, result: {} });
    }

    if (method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOLS,
        },
      });
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      const tool = MCP_TOOLS.find((t) => t.name === toolName);
      if (!tool) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Tool not found: ${toolName}` },
        });
      }

      // Execute tool mock / dispatch instruction
      let resultData: any = {};
      if (toolName === 'convert_image') {
        resultData = {
          success: true,
          mode: 'client_browser_storage',
          message: `Ready to convert image to ${toolArgs.format?.toUpperCase() || 'WEBP'} at ${Math.round((toolArgs.quality || 0.8) * 100)}% quality.`,
          parametersApplied: toolArgs,
          storageDestination: 'photoConvert_DB (IndexedDB in browser)',
        };
      } else if (toolName === 'convert_video') {
        resultData = {
          success: true,
          mode: 'client_browser_storage',
          message: `Video conversion action [${toolArgs.action}] scheduled in browser memory.`,
          parametersApplied: toolArgs,
          storageDestination: 'photoConvert_DB (IndexedDB in browser)',
        };
      } else if (toolName === 'extract_poster_frame') {
        resultData = {
          success: true,
          message: `Frame extracted at timestamp ${toolArgs.timestamp || 0.5}s in ${toolArgs.format || 'webp'} format.`,
          parametersApplied: toolArgs,
        };
      } else if (toolName === 'extract_audio') {
        resultData = {
          success: true,
          message: 'Audio extraction to 16-bit PCM WAV initialized in browser audio context.',
          format: 'wav',
        };
      } else if (toolName === 'list_storage_conversions') {
        resultData = {
          success: true,
          message: 'Storage query dispatched. Conversions are stored securely in browser IndexedDB.',
          storageEngine: 'IndexedDB (photoConvert_DB)',
        };
      }

      return NextResponse.json({
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
      });
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32603, message: 'Internal error: ' + error.message },
      },
      { status: 500 }
    );
  }
}
