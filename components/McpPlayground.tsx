'use client';

import React, { useState, useEffect } from 'react';
import { SAMPLE_MCP_CLIENT_CONFIG, MCP_TOOLS } from '@/lib/mcpTools';

export const McpPlayground: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<string>('convert_image');
  const [rpcMethod, setRpcMethod] = useState<'tools/list' | 'tools/call' | 'initialize'>('tools/list');
  const [rpcResponse, setRpcResponse] = useState<string | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<any>(null);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/mcp');
      const data = await res.json();
      setTelemetry(data);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(SAMPLE_MCP_CLIENT_CONFIG, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteRpc = async () => {
    setLoading(true);
    setRpcResponse(null);
    setResponseHeaders({});

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

      const hdrs: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        if (key.startsWith('x-')) {
          hdrs[key] = val;
        }
      });
      setResponseHeaders(hdrs);

      const data = await res.json();
      setRpcResponse(JSON.stringify(data, null, 2));
      fetchTelemetry();
    } catch (err: any) {
      setRpcResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* HEADER */}
      <div className="section-header" style={{
        borderBottom: '2px solid var(--ink)',
        paddingBottom: '8px',
      }}>
        <h2 className="marker-font" style={{ fontSize: '28px' }}>
          MCP AGENT SERVER.
        </h2>
        <span style={{ fontSize: '11px', fontWeight: 700 }}>
          [RATE LIMITER • LOAD BALANCER • JSON-RPC 2.0]
        </span>
      </div>

      {/* CLUSTER & RATE LIMIT TELEMETRY DASHBOARD */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
      }}>
        {/* RATE LIMITER STATUS */}
        <div className="hand-box" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '11px' }}>[RATE LIMITER GUARD]</span>
            <span style={{
              background: 'var(--ink)',
              color: 'var(--ink-inverted)',
              padding: '1px 6px',
              fontSize: '9px',
              fontWeight: 700,
              borderRadius: '2px',
            }}>
              ARMED / ACTIVE
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--ink-gray)', lineHeight: '1.5' }}>
            POLICY: <strong>{telemetry?.rateLimiter?.limit || 60} REQ / MINUTE</strong>
            <br />
            REMAINING: <strong>{telemetry?.rateLimiter?.remaining ?? 60} TOKENS</strong>
            <br />
            PROTECTION: SLIDING WINDOW (BURST & SPAM DEFENSE)
          </div>
        </div>

        {/* LOAD BALANCER STATUS */}
        <div className="hand-box" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '11px' }}>[LOAD BALANCER]</span>
            <span style={{
              background: 'var(--ink)',
              color: 'var(--ink-inverted)',
              padding: '1px 6px',
              fontSize: '9px',
              fontWeight: 700,
              borderRadius: '2px',
            }}>
              {telemetry?.loadBalancer?.strategy?.toUpperCase() || 'LEAST-CONNECTIONS'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--ink-gray)', lineHeight: '1.5' }}>
            HEALTHY NODES: <strong>{telemetry?.loadBalancer?.healthyNodes || 3} / {telemetry?.loadBalancer?.totalNodes || 3} ONLINE</strong>
            <br />
            PROCESSED: <strong>{telemetry?.loadBalancer?.totalRequestsProcessed || 0} CALLS</strong>
            <br />
            CIRCUIT BREAKER: AUTO-FAILOVER & RECOVERY
          </div>
        </div>
      </div>

      {/* OVERVIEW */}
      <div className="hand-box" style={{ padding: '20px', lineHeight: '1.6', fontSize: '12px' }}>
        <span style={{ fontWeight: 700, fontSize: '13px', display: 'block', marginBottom: '6px' }}>
          CONNECT EXTERNAL AGENTS (ANTIGRAVITY, CLAUDE, CURSOR)
        </span>
        <p style={{ color: 'var(--ink-gray)', marginBottom: '12px' }}>
          THIS APPLICATION EXPOSES A SECURED MCP SERVER AT{' '}
          <code style={{ background: 'var(--paper-tint)', padding: '2px 6px', border: '1px solid var(--ink)' }}>
            /api/mcp
          </code>
          . PROTECTED WITH CLIENT IP RATE LIMITING AND LOAD BALANCING ACROSS WORKER DISPATCH PIPELINES.
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
          WebkitOverflowScrolling: 'touch',
          fontFamily: 'var(--font-mono), monospace',
        }}>
          {JSON.stringify(SAMPLE_MCP_CLIENT_CONFIG, null, 2)}
        </pre>
      </div>

      {/* INTERACTIVE RPC TEST CONSOLE */}
      <div className="hand-box" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="section-header">
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
          {loading ? 'DISPATCHING VIA LOAD BALANCER...' : 'EXECUTE RPC TEST CALL ➔'}
        </button>

        {/* ACTIVE RESPONSE & HEADERS */}
        {rpcResponse && (
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.keys(responseHeaders).length > 0 && (
              <div style={{
                background: 'var(--paper-tint)',
                border: '1.5px solid var(--ink)',
                padding: '8px 12px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono), monospace',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                {Object.entries(responseHeaders).map(([k, v]) => (
                  <span key={k}>
                    <strong>{k.toUpperCase()}:</strong> {v}
                  </span>
                ))}
              </div>
            )}

            <div>
              <span style={{ fontSize: '10px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                JSON-RPC 2.0 SERVER RESPONSE:
              </span>
              <pre style={{
                background: '#0A0A0A',
                color: '#F2F2F0',
                padding: '12px',
                fontSize: '11px',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                maxHeight: '260px',
                fontFamily: 'var(--font-mono), monospace',
              }}>
                {rpcResponse}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
