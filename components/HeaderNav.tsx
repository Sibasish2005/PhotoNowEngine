'use client';

import React from 'react';

interface HeaderNavProps {
  activeTab: 'photo' | 'video' | 'storage' | 'agent' | 'mcp';
  setActiveTab: (tab: 'photo' | 'video' | 'storage' | 'agent' | 'mcp') => void;
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
      padding: '16px 24px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      background: 'var(--bg-paper)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* BRAND & STATUS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            [NOW]
          </span>
          <span>PHOTONOW.ENGINE</span>
        </div>

        <span style={{ color: 'var(--ink-subtle)', fontSize: '11px' }}>
          • 100% LOCAL BROWSER RUNTIME •
        </span>
      </div>

      {/* BRACKETED LINKS */}
      <nav style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '8px',
      }}>
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
          [AGENTIC AI]
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
          onClick={() => setActiveTab('storage')}
          className={`hand-btn ${activeTab === 'storage' ? 'active' : ''}`}
          style={{ padding: '6px 14px', fontSize: '11px' }}
        >
          [STORAGE: {storageCount}]
        </button>

        <button
          onClick={() => setActiveTab('mcp')}
          className={`hand-btn ${activeTab === 'mcp' ? 'active' : ''}`}
          style={{ padding: '6px 14px', fontSize: '11px' }}
        >
          [MCP SERVER]
        </button>
      </nav>
    </header>
  );
};
