'use client';

import React, { useState, useEffect } from 'react';
import { HeaderNav } from '@/components/HeaderNav';
import { LeftHeroIllustration } from '@/components/LeftHeroIllustration';
import { PhotoConverter } from '@/components/PhotoConverter';
import { VideoConverter } from '@/components/VideoConverter';
import { StorageHistory } from '@/components/StorageHistory';
import { AgenticPanel } from '@/components/AgenticPanel';
import { McpPlayground } from '@/components/McpPlayground';
import { RightVerticalTabStrip, FooterStamps } from '@/components/DoodleDecorations';
import { getStorageStats } from '@/lib/storage';
import { StoredConversion } from '@/lib/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'photo' | 'video' | 'storage' | 'agent' | 'mcp'>('photo');
  const [storageCount, setStorageCount] = useState<number>(0);

  const refreshStorageStats = async () => {
    try {
      const stats = await getStorageStats();
      setStorageCount(stats.count);
    } catch {
      // Ignored if unmounted
    }
  };

  useEffect(() => {
    refreshStorageStats();
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
      <main style={{
        flex: 1,
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '32px 24px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'start',
        }}>
          {/* LEFT 40% HERO COLUMN: HAND-DRAWN VECTOR CHARACTER & HUGE NAME */}
          <aside style={{ flex: '0 0 38%' }}>
            <LeftHeroIllustration />
          </aside>

          {/* RIGHT 60% INTERACTIVE ENGINE COLUMN */}
          <section style={{ flex: '1 1 58%', minWidth: 0 }}>
            {activeTab === 'photo' && (
              <PhotoConverter onConversionSuccess={handleConversionSuccess} />
            )}

            {activeTab === 'video' && (
              <VideoConverter onConversionSuccess={handleConversionSuccess} />
            )}

            {activeTab === 'agent' && (
              <AgenticPanel onConversionSuccess={handleConversionSuccess} />
            )}

            {activeTab === 'storage' && (
              <StorageHistory onStorageUpdated={refreshStorageStats} />
            )}

            {activeTab === 'mcp' && (
              <McpPlayground />
            )}
          </section>
        </div>

        {/* AEO & SEO KNOWLEDGE BASE: AGENT CAPABILITIES & SPECIFICATION */}
        <section aria-labelledby="agent-aeo-heading" style={{ marginTop: '48px' }}>
          <div className="hand-box" style={{ padding: '28px 24px', background: 'var(--paper-tint)' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              borderBottom: '2px solid var(--ink)',
              paddingBottom: '10px',
              marginBottom: '20px',
            }}>
              <h2 id="agent-aeo-heading" className="marker-font" style={{ fontSize: '24px' }}>
                AI AGENT KNOWLEDGE BASE & MCP CAPABILITIES.
              </h2>
              <span style={{ fontSize: '11px', fontWeight: 700 }}>
                [AEO / LLM CITEABLE SPECIFICATION]
              </span>
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
                  [1. WHY AGENTS NEED OFFLINE MEDIA MCP TOOLS]
                </h3>
                <p style={{ color: 'var(--ink-gray)' }}>
                  Autonomous coding agents (Claude Desktop, Google Antigravity, Cursor, LangChain) frequently analyze screenshots, optimize web assets, and extract video frames. PhotoNow provides a zero-cloud, 100% private Model Context Protocol (MCP) server directly at <code>https://photonow.vercel.app/api/mcp</code> with zero API keys and zero billing.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  [2. AUTONOMOUS JSON-RPC 2.0 PROTOCOL]
                </h3>
                <p style={{ color: 'var(--ink-gray)' }}>
                  Agents connect over HTTP transport and dispatch standardized tools: <code>convert_image</code> (WebP/AVIF/PNG/JPEG/BMP), <code>convert_video</code> (WebM transcode), <code>extract_poster_frame</code> (frame seeker), and <code>extract_audio</code> (16-bit PCM WAV) with built-in sliding-window rate limiting and multi-node load balancing.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  [3. ZERO-CLOUD PRIVACY & LOCAL PERSISTENCE]
                </h3>
                <p style={{ color: 'var(--ink-gray)' }}>
                  Media bytes are processed in client browser memory via HTML5 Canvas 2D, MediaRecorder, and Web Audio APIs. Converted assets are retained in browser IndexedDB (<code>photoConvert_DB</code>) with batch JSZip export, guaranteeing that sensitive images and videos never leave the user device.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER STAMPS */}
      <FooterStamps />
    </div>
  );
}
