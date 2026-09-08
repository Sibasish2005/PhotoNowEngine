'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { HeaderNav } from '@/components/HeaderNav';
import { LeftHeroIllustration } from '@/components/LeftHeroIllustration';
import { PhotoConverter } from '@/components/PhotoConverter';
import { RightVerticalTabStrip, FooterStamps } from '@/components/DoodleDecorations';
import { getConversionCount } from '@/lib/storage';
import { StoredConversion } from '@/lib/types';
import { initBrowserAgentApi } from '@/lib/browserAgentApi';

const VideoConverter = dynamic(
  () => import('@/components/VideoConverter').then((mod) => mod.VideoConverter),
  {
    loading: () => (
      <div className="hand-box" style={{ padding: '32px', textAlign: 'center' }}>
        [LOADING VIDEO ENGINE...]
      </div>
    ),
  }
);

const StorageHistory = dynamic(
  () => import('@/components/StorageHistory').then((mod) => mod.StorageHistory),
  {
    loading: () => (
      <div className="hand-box" style={{ padding: '32px', textAlign: 'center' }}>
        [LOADING STORAGE HISTORY...]
      </div>
    ),
  }
);

const AgenticPanel = dynamic(
  () => import('@/components/AgenticPanel').then((mod) => mod.AgenticPanel),
  {
    loading: () => (
      <div className="hand-box" style={{ padding: '32px', textAlign: 'center' }}>
        [LOADING AGENTIC WORKBENCH...]
      </div>
    ),
  }
);

const McpDeveloperHub = dynamic(
  () => import('@/components/McpDeveloperHub').then((mod) => mod.McpDeveloperHub),
  {
    loading: () => (
      <div className="hand-box" style={{ padding: '32px', textAlign: 'center' }}>
        [LOADING DEVELOPER MCP HUB & TOOLCALLING SPECIFICATION...]
      </div>
    ),
  }
);

export default function Home() {
  const [activeTab, setActiveTab] = useState<'photo' | 'video' | 'storage' | 'agent' | 'mcp' | 'performance'>('photo');
  const [storageCount, setStorageCount] = useState<number>(0);

  const refreshStorageStats = async () => {
    try {
      const count = await getConversionCount();
      setStorageCount(count);
    } catch {
      // Ignored if unmounted
    }
  };

  useEffect(() => {
    refreshStorageStats();
    const api = initBrowserAgentApi();
    const unsubscribe = api.subscribe(() => {
      refreshStorageStats();
    });
    return () => unsubscribe();
  }, []);

  const handleConversionSuccess = (_item: StoredConversion) => {
    refreshStorageStats();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* FIXED VERTICAL TAB STRIP ON RIGHT EDGE AS PER DESIGN.MD */}
      <RightVerticalTabStrip />

      {/* TOP HEADER WITH BRACKETED LINKS */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        storageCount={storageCount}
      />

      {/* MAIN TWO-COLUMN SPLIT CONTAINER (40% LEFT / 60% RIGHT AS PER DESIGN.MD) */}
      <main className="main-content-area" style={{
        flex: 1,
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: 'clamp(16px, 3vw, 32px) clamp(12px, 2vw, 24px)',
      }}>
        <div className="main-workbench-grid">
          {/* LEFT HERO COLUMN: HAND-DRAWN VECTOR CHARACTER & HUGE NAME */}
          <aside>
            <LeftHeroIllustration />
          </aside>

          {/* RIGHT INTERACTIVE ENGINE COLUMN */}
          <section style={{ minWidth: 0 }}>
            {activeTab === 'photo' && (
              <PhotoConverter onConversionSuccess={handleConversionSuccess} />
            )}

            {activeTab === 'video' && (
              <VideoConverter onConversionSuccess={handleConversionSuccess} />
            )}

            {activeTab === 'agent' && (
              <AgenticPanel onConversionSuccess={handleConversionSuccess} />
            )}

            {(activeTab === 'performance' || activeTab === 'mcp') && (
              <McpDeveloperHub />
            )}

            {activeTab === 'storage' && (
              <StorageHistory onStorageUpdated={refreshStorageStats} />
            )}
          </section>
        </div>

        {/* AEO & SEO KNOWLEDGE BASE: AGENT CAPABILITIES & SPECIFICATION */}
        <section aria-labelledby="agent-aeo-heading" style={{ marginTop: '48px' }}>
          <div className="hand-box" style={{ padding: '28px 24px', background: 'var(--paper-tint)' }}>
            <div className="section-header" style={{
              borderBottom: '2px solid var(--ink)',
              paddingBottom: '10px',
              marginBottom: '20px',
            }}>
              <h2 id="agent-aeo-heading" className="marker-font" style={{ fontSize: '24px' }}>
                AI AGENT KNOWLEDGE BASE & MCP CAPABILITIES.
              </h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hand-btn"
                  style={{ padding: '3px 8px', fontSize: '10px' }}
                >
                  [LLMS.TXT] ↗
                </a>
                <a
                  href="/llms-full.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hand-btn"
                  style={{ padding: '3px 8px', fontSize: '10px' }}
                >
                  [LLMS-FULL.TXT] ↗
                </a>
                <span style={{ fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                  [AEO / LLM CITEABLE SPECIFICATION]
                </span>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              fontSize: '12px',
              lineHeight: '1.6',
            }}>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  [1. NATIVE STDIO MCP — ZERO PERMISSION PROMPTS]
                </h3>
                <p style={{ color: 'var(--ink-gray)' }}>
                  Autonomous coding agents (Claude Desktop, Cursor, Google Antigravity, Claude Code) typically trigger 7–10 disruptive terminal permission popups per image when using shell scripts. PhotoNow runs as a native Stdio MCP server (<code>node ./bin/mcp-server.mjs</code>), enabling single and batch image conversion with <em>one single initial approval</em>.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  [2. BATCH FOLDER PROCESSING & TOKEN OPTIMIZER]
                </h3>
                <p style={{ color: 'var(--ink-gray)' }}>
                  Includes <code>convert_batch</code> to transform entire directory trees in parallel while filtering out <code>.git</code> and <code>node_modules</code>, and <code>optimize_for_agent</code> to downscale high-res UI screenshots into compact WebP under 1568px—reducing vision model context window consumption by up to 90%.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  [3. REAL-TIME NATIVE SHARP & HIGH PERFORMANCE]
                </h3>
                <p style={{ color: 'var(--ink-gray)' }}>
                  Powered by native Sharp (libvips 8.16) for blazing-fast ~250ms in-memory transformations. Supports WebP, AVIF, PNG, JPEG, and BMP formats with configurable quality, dimensional bounding boxes, grayscale, and Sobel ink sketch filters.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  [4. 100% ZERO-CLOUD PRIVACY & BROWSER ENGINE]
                </h3>
                <p style={{ color: 'var(--ink-gray)' }}>
                  In web environments, PhotoNow processes media via client-side HTML5 Canvas 2D, MediaRecorder, and Web Audio APIs with persistence in IndexedDB (<code>photoConvert_DB</code>). In both desktop MCP and web modes, zero bytes are uploaded to remote cloud servers or third-party databases.
                </p>
              </div>
            </div>

            {/* QUICK COPY CONFIG FOR AGENTS */}
            <div style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px dashed var(--ink-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '11px' }}>
                  [QUICK SETUP FOR CLAUDE DESKTOP / CURSOR / ANTIGRAVITY]:
                </span>
                <span style={{ fontSize: '10px', color: 'var(--ink-gray)' }}>
                  ADD TO YOUR MCP CONFIG JSON
                </span>
              </div>
              <pre style={{
                background: '#0A0A0A',
                color: '#F2F2F0',
                padding: '12px',
                fontSize: '11px',
                borderRadius: '4px',
                overflowX: 'auto',
                fontFamily: 'var(--font-mono), monospace',
                margin: 0,
              }}>
{`{
  "mcpServers": {
    "photoConvert": {
      "command": "node",
      "args": ["./bin/mcp-server.mjs"]
    }
  }
}`}
              </pre>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER STAMPS */}
      <FooterStamps />
    </div>
  );
}
