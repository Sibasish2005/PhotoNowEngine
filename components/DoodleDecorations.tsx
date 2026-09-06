'use client';

import React from 'react';

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
      padding: '24px',
      marginTop: '40px',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      fontSize: '11px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="marker-font" style={{ fontSize: '16px' }}>PHOTONOW.</span>
        <span>CLIENT STORAGE CONVERTER WORKBENCH</span>
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
    </footer>
  );
};
