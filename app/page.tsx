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
        [LOADING CUSTOMIZED WORKBENCH...]
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

const ProductMarketingSection = dynamic(
  () => import('@/components/ProductMarketingSection').then((mod) => mod.ProductMarketingSection),
  {
    loading: () => (
      <div className="hand-box" style={{ padding: '32px', textAlign: 'center' }}>
        [LOADING PRODUCT SPECIFICATION & MARKETING SHOWCASE...]
      </div>
    ),
  }
);

export default function Home() {
  const [activeTab, setActiveTab] = useState<'photo' | 'video' | 'storage' | 'agent' | 'mcp' | 'performance' | 'product'>('photo');
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

            {activeTab === 'product' && (
              <ProductMarketingSection />
            )}
          </section>
        </div>

        {/* DEDICATED PRODUCT MARKETING SHOWCASE (WHEN NOT IN FOCUSED TAB VIEW) */}
        {activeTab !== 'product' && (
          <div style={{ marginTop: '48px' }}>
            <ProductMarketingSection />
          </div>
        )}

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
                  [1. NATIVE STDIO MCP — 29 ZERO-PERMISSION TOOLS]
                </h3>
                <p style={{ color: 'var(--ink-gray)' }}>
                  Autonomous coding agents (Claude Desktop, Cursor, Google Antigravity, Windsurf) typically encounter repetitive terminal permission popups per command. PhotoNow runs as a native Stdio MCP server (<code>node ./bin/mcp-server.mjs</code>), unlocking single, batch, video, and performance operations with <em>one single initial approval</em>.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  [2. AGENTIC WEBSITE PERFORMANCE INTELLIGENCE]
                </h3>
                <p style={{ color: 'var(--ink-gray)' }}>
                  Provides 5-axis media scoring across format efficiency, image sizing, compression potential, responsive srcset readiness, and SVG cleanliness. Identifies LCP bottlenecks, calculates 4G mobile transfer savings, and formulates explainable plans.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  [3. ASSET DEPENDENCY GRAPH & DEAD ASSET PRUNING]
                </h3>
                <p style={{ color: 'var(--ink-gray)' }}>
                  Constructs the complete <code>Route ➔ Component ➔ Asset</code> dependency graph. Identifies multi-route shared dependencies and flags unreferenced dead assets classified into safety tiers (<code>SAFE</code>, <code>LIKELY</code>, <code>UNCERTAIN</code>) to prevent accidental deletions.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  [4. SAFE AST SOURCE PATCHING & ATOMIC ROLLBACK]
                </h3>
                <p style={{ color: 'var(--ink-gray)' }}>
                  Parses JSX/TSX source code ASTs, generates unified diffs, creates automated backups in <code>.photonow/backups/</code>, and requires explicit confirmation. The <code>rollback_operation</code> tool enables 1-click atomic restoration of all modified source files and assets.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  [5. AUTONOMOUS MISSION & TOKEN CONTRACT (&lt;200 TOKENS)]
                </h3>
                <p style={{ color: 'var(--ink-gray)' }}>
                  Orchestrates the entire 10-step autonomous optimization loop via <code>optimize_project</code>. Heavy diagnostics are stored locally while returning compact intelligence (&lt;200 tokens) with next-action guidance to protect AI agent context windows from token blowups.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  [6. 100% ZERO-CLOUD ARCHITECTURE & LOCAL ENGINE]
                </h3>
                <p style={{ color: 'var(--ink-gray)' }}>
                  Zero bytes are uploaded to remote cloud servers. Bundles static FFmpeg/FFprobe binaries and native Sharp for local Node.js execution, accompanied by HTML5 Canvas 2D, MediaRecorder, and IndexedDB in the browser companion workbench.
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
