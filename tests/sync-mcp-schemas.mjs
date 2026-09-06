import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

const SCHEMA_DIR = path.resolve('C:/Users/sibas/.gemini/antigravity-ide/mcp/photoConvert');
const SERVER_PATH = path.resolve('./bin/mcp-server.mjs');

class McpClient {
  constructor() {
    this.reqId = 1;
    this.pending = new Map();
    this.buffer = '';
  }

  start() {
    this.proc = spawn('node', [SERVER_PATH], {
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
  }

  sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.reqId++;
      const payload = { jsonrpc: '2.0', id, method, params };
      this.pending.set(id, { resolve, reject });
      this.proc.stdin.write(JSON.stringify(payload) + '\n');
    });
  }

  stop() {
    if (this.proc) this.proc.kill();
  }
}

async function syncSchemas() {
  console.log('Querying MCP server for tool schemas...');
  const client = new McpClient();
  client.start();

  try {
    await client.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'SchemaSync', version: '1.0' },
      capabilities: {},
    });

    const res = await client.sendRequest('tools/list', {});
    console.log(`Found ${res.tools.length} tools registered on server:`, res.tools.map((t) => t.name));

    await fs.mkdir(SCHEMA_DIR, { recursive: true });

    for (const tool of res.tools) {
      const schemaObj = {
        name: tool.name,
        description: tool.description || '',
        parameters: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          ...(tool.inputSchema || { type: 'object', properties: {} }),
        },
      };

      const outPath = path.join(SCHEMA_DIR, `${tool.name}.json`);
      await fs.writeFile(outPath, JSON.stringify(schemaObj, null, 2), 'utf8');
      console.log(`✓ Updated schema: ${tool.name}.json -> ${outPath}`);
    }

    console.log('\nAll MCP tool schemas synced successfully!');
  } finally {
    client.stop();
  }
}

syncSchemas().catch((err) => {
  console.error('Error syncing schemas:', err);
  process.exit(1);
});
