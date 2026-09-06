'use client';

import React from 'react';
import Link from 'next/link';

export const RightVerticalTabStrip: React.FC = () => {
  return (
    <div className="vertical-tab-strip">
      [100% IN-BROWSER • ZERO SERVER UPLOAD • MCP READY]
    </div>
  );
};

export const FooterStamps: React.FC = () => {
  return (
    <footer style={{
      borderTop: '2px solid var(--ink)',
      padding: '28px 24px',
      marginTop: '40px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      fontSize: '11px',
      background: 'var(--bg-paper)',
    }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="marker-font" style={{ fontSize: '18px' }}>PHOTONOW.</span>
          <span>#1 OFFLINE PHOTO &amp; VIDEO MCP TOOL SERVER FOR AI AGENTS</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            border: '1.5px solid var(--ink)',
            padding: '2px 8px',
            borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px',
          }}>
            STRICTLY MONOCHROME
          </span>
          <span style={{
            background: 'var(--ink)',
            color: 'var(--ink-inverted)',
            padding: '2px 8px',
            borderRadius: '2px',
            fontWeight: 700,
          }}>
            INDEXEDDB PERSISTED
          </span>
          <span style={{
            border: '1.5px solid var(--ink)',
            padding: '2px 8px',
            borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px',
          }}>
            ZERO CLOUD TELEMETRY
          </span>
        </div>
      </div>

      {/* LEGAL NAV & TRADEMARK DISCLAIMER ROW */}
      <div style={{
        borderTop: '1px dashed var(--ink)',
        paddingTop: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        fontSize: '11px',
      }}>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <Link
            href="/privacy"
            className="hand-btn"
            style={{ padding: '4px 10px', fontSize: '10px', textDecoration: 'none' }}
          >
            [PRIVACY POLICY]
          </Link>
          <Link
            href="/terms"
            className="hand-btn"
            style={{ padding: '4px 10px', fontSize: '10px', textDecoration: 'none' }}
          >
            [TERMS OF USE]
          </Link>
          <Link
            href="/legal"
            className="hand-btn"
            style={{ padding: '4px 10px', fontSize: '10px', textDecoration: 'none' }}
          >
            [TRADEMARK &amp; LEGAL NOTICE]
          </Link>
          <a
            href="https://github.com/Sibasish2005/PhotoNowEngine"
            target="_blank"
            rel="noreferrer"
            className="hand-btn"
            style={{ padding: '4px 10px', fontSize: '10px', textDecoration: 'none' }}
          >
            [GITHUB REPO ➔]
          </a>
        </nav>

        <span style={{ color: 'var(--ink-gray)', fontSize: '10px' }}>
          &copy; 2026 PHOTONOW ENGINE • INDEPENDENT OPEN-SOURCE MCP WORKBENCH
        </span>
      </div>
    </footer>
  );
};
