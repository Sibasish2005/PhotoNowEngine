'use client';

import React from 'react';

interface HeaderNavProps {
  activeTab: 'photo' | 'video' | 'storage' | 'agent' | 'mcp' | 'performance';
  setActiveTab: (tab: 'photo' | 'video' | 'storage' | 'agent' | 'mcp' | 'performance') => void;
  storageCount: number;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  storageCount,
}) => {
  return (
    <header style={{
      borderBottom: '2px solid var(--ink)',
      padding: 'clamp(10px, 2vw, 16px) clamp(14px, 2vw, 24px)',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'clamp(10px, 2vw, 16px)',
      background: 'var(--bg-paper)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* BRAND & STATUS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 700,
          fontSize: '14px',
        }}>
          <span style={{
            background: 'var(--ink)',
            color: 'var(--ink-inverted)',
            padding: '2px 8px',
            fontSize: '12px',
            borderRadius: '2px',
          }}>
            [MCP:AGENT]
          </span>
          <span>PHOTONOW.ENGINE</span>
        </div>

        <span className="header-subtitle">
          • #1 OFFLINE MEDIA MCP SERVER FOR AI AGENTS •
        </span>
      </div>

      {/* BRACKETED LINKS — HORIZONTALLY SCROLLABLE ON MOBILE */}
      <nav className="header-nav-strip">
        <button
          onClick={() => setActiveTab('photo')}
          className={`hand-btn ${activeTab === 'photo' ? 'active' : ''}`}
          style={{ padding: '6px 14px', fontSize: '11px' }}
        >
          [PHOTO CONVERT]
        </button>

        <button
          onClick={() => setActiveTab('video')}
          className={`hand-btn ${activeTab === 'video' ? 'active' : ''}`}
          style={{ padding: '6px 14px', fontSize: '11px' }}
        >
          [VIDEO CONVERT]
        </button>

        <button
          onClick={() => setActiveTab('agent')}
          className={`hand-btn ${activeTab === 'agent' ? 'active' : ''}`}
          style={{
            padding: '6px 14px',
            fontSize: '11px',
            position: 'relative',
          }}
        >
          [CUSTOMIZED]
          <span style={{
            position: 'absolute',
            top: '-8px',
            right: '-6px',
            background: 'var(--ink)',
            color: 'var(--ink-inverted)',
            fontSize: '8px',
            padding: '1px 4px',
            borderRadius: '2px',
          }}>
            PROMPT
          </span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`hand-btn ${activeTab === 'performance' || activeTab === 'mcp' ? 'active' : ''}`}
          style={{
            padding: '6px 14px',
            fontSize: '11px',
            position: 'relative',
          }}
        >
          [MCP PERFORMANCE HUB]
          <span style={{
            position: 'absolute',
            top: '-8px',
            right: '-6px',
            background: 'var(--ink)',
            color: 'var(--ink-inverted)',
            fontSize: '8px',
            padding: '1px 4px',
            borderRadius: '2px',
          }}>
            29 TOOLS
          </span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`hand-btn ${activeTab === 'storage' ? 'active' : ''}`}
          style={{ padding: '6px 14px', fontSize: '11px' }}
        >
          [STORAGE: {storageCount}]
        </button>
      </nav>
    </header>
  );
};
