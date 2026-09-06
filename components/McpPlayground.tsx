'use client';

import React, { useState } from 'react';
import { SAMPLE_MCP_CLIENT_CONFIG, MCP_TOOLS } from '@/lib/mcpTools';

export const McpPlayground: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<string>('convert_image');
  const [rpcMethod, setRpcMethod] = useState<'tools/list' | 'tools/call' | 'initialize'>('tools/list');
  const [rpcResponse, setRpcResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(SAMPLE_MCP_CLIENT_CONFIG, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteRpc = async () => {
    setLoading(true);
    setRpcResponse(null);

    let payload: any;
    if (rpcMethod === 'initialize') {
      payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'playground-tester', version: '1.0' },
        },
      };
    } else if (rpcMethod === 'tools/list') {
      payload = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      };
    } else {
      payload = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: selectedTool,
          arguments:
            selectedTool === 'convert_image'
              ? { format: 'webp', quality: 0.85, maxWidth: 1200, applySketchFilter: true }
              : selectedTool === 'convert_video'
              ? { action: 'webm', videoScale: 0.75, videoBitrate: 2000000, mute: true }
              : selectedTool === 'extract_poster_frame'
              ? { timestamp: 1.5, format: 'webp', quality: 0.9 }
              : { format: 'wav' },
        },
      };
    }

    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setRpcResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setRpcResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        borderBottom: '2px solid var(--ink)',
        paddingBottom: '8px',
      }}>
        <h2 className="marker-font" style={{ fontSize: '28px' }}>
          MCP AGENT SERVER.
        </h2>
        <span style={{ fontSize: '11px', fontWeight: 700 }}>
          [MODEL CONTEXT PROTOCOL / JSON-RPC 2.0]
        </span>
      </div>

      {/* OVERVIEW */}
      <div className="hand-box" style={{ padding: '20px', lineHeight: '1.6', fontSize: '12px' }}>
        <span style={{ fontWeight: 700, fontSize: '13px', display: 'block', marginBottom: '6px' }}>
          CONNECT EXTERNAL AGENTS (ANTIGRAVITY, CLAUDE, CURSOR)
        </span>
        <p style={{ color: 'var(--ink-gray)', marginBottom: '12px' }}>
          THIS NEXT.JS APPLICATION EXPOSES A NATIVE MCP (MODEL CONTEXT PROTOCOL) SERVER AT{' '}
          <code style={{ background: 'var(--paper-tint)', padding: '2px 6px', border: '1px solid var(--ink)' }}>
            /api/mcp
          </code>
          . YOUR CODING AGENT OR ASSISTANT CAN DIRECTLY CALL THESE TOOLS TO DISPATCH PHOTO AND VIDEO CONVERSIONS TO STORE IN BROWSER LOCAL STORAGE.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontWeight: 700, fontSize: '11px' }}>[MCP_CONFIG.JSON SNIPPET]:</span>
          <button
            onClick={handleCopyConfig}
            className="hand-btn"
            style={{ padding: '4px 10px', fontSize: '10px' }}
          >
            {copied ? '✓ COPIED!' : 'COPY CONFIG ➔'}
          </button>
        </div>

        <pre style={{
          background: 'var(--ink)',
          color: 'var(--ink-inverted)',
          padding: '14px',
          borderRadius: '4px',
          fontSize: '11px',
          overflowX: 'auto',
          fontFamily: 'var(--font-mono), monospace',
        }}>
          {JSON.stringify(SAMPLE_MCP_CLIENT_CONFIG, null, 2)}
        </pre>
      </div>

      {/* INTERACTIVE RPC TEST CONSOLE */}
      <div className="hand-box" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '12px' }}>[INTERACTIVE MCP SANDBOX]</span>
          <span style={{ fontSize: '10px', color: 'var(--ink-gray)' }}>TEST LIVE JSON-RPC REQUESTS</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => setRpcMethod('tools/list')}
            className={`hand-btn ${rpcMethod === 'tools/list' ? 'primary' : ''}`}
            style={{ padding: '6px 12px', fontSize: '10px' }}
          >
            METHOD: tools/list
          </button>
          <button
            onClick={() => setRpcMethod('tools/call')}
            className={`hand-btn ${rpcMethod === 'tools/call' ? 'primary' : ''}`}
            style={{ padding: '6px 12px', fontSize: '10px' }}
          >
            METHOD: tools/call
          </button>
          <button
            onClick={() => setRpcMethod('initialize')}
            className={`hand-btn ${rpcMethod === 'initialize' ? 'primary' : ''}`}
            style={{ padding: '6px 12px', fontSize: '10px' }}
          >
            METHOD: initialize
          </button>
        </div>

        {rpcMethod === 'tools/call' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700 }}>SELECT TOOL TARGET:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {MCP_TOOLS.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTool(t.name)}
                  className={`hand-btn ${selectedTool === t.name ? 'primary' : ''}`}
                  style={{ padding: '4px 10px', fontSize: '10px' }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleExecuteRpc}
          disabled={loading}
          className="hand-btn primary"
          style={{ padding: '10px 18px', fontSize: '12px' }}
        >
          {loading ? 'SENDING JSON-RPC DISPATCH...' : 'EXECUTE RPC TEST CALL ➔'}
        </button>

        {rpcResponse && (
          <div style={{ marginTop: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              JSON-RPC 2.0 SERVER RESPONSE:
            </span>
            <pre style={{
              background: '#0A0A0A',
              color: '#F2F2F0',
              padding: '12px',
              fontSize: '11px',
              overflowX: 'auto',
              maxHeight: '260px',
              fontFamily: 'var(--font-mono), monospace',
            }}>
              {rpcResponse}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
