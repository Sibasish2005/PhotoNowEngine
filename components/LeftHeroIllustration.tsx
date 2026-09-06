'use client';

import React from 'react';

export const LeftHeroIllustration: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      height: '100%',
    }}>
      {/* HUGE HERO NAME: 8-10X BODY SCALE JUMP AS PER DESIGN.MD */}
      <div>
        <span style={{
          display: 'inline-block',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '2px',
          marginBottom: '8px',
          borderBottom: '2px solid var(--ink)',
          paddingBottom: '2px',
        }}>
          #1 OFFLINE MCP TOOL SERVER • BUILT FOR AI AGENTS
        </span>
        <h1 style={{
          fontSize: 'clamp(3.4rem, 6.5vw, 5.8rem)',
          lineHeight: '0.88',
          letterSpacing: '-1px',
          marginBottom: '12px',
        }}>
          AGENT MEDIA.
        </h1>
        <p style={{
          fontSize: '12px',
          maxWidth: '380px',
          color: 'var(--ink-gray)',
          lineHeight: '1.6',
        }}>
          THE PREMIER OFFLINE PHOTO & VIDEO TOOL SERVER FOR AI AGENTS (CLAUDE, ANTIGRAVITY, CURSOR, SWARMS). AUTONOMOUS WEBP/AVIF ENCODING, WEBM TRANSCODING, WAV SOUNDTRACK EXTRACTION & INDEXEDDB STORAGE VIA JSON-RPC 2.0. (HUMAN WORKBENCH INCLUDED).
        </p>
      </div>

      {/* HAND-DRAWN BOXED ILLUSTRATION CONTAINER */}
      <div className="hand-box" style={{
        padding: '24px',
        position: 'relative',
        background: 'var(--bg-paper)',
        overflow: 'hidden',
      }}>
        {/* DOODLE ANNOTATION: "HEY." WITH HAND-DRAWN ARROW */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          zIndex: 10,
        }}>
          <span className="marker-font" style={{
            fontSize: '22px',
            lineHeight: 1,
            transform: 'rotate(5deg)',
          }}>
            HEY.
          </span>
          <svg width="48" height="32" viewBox="0 0 48 32" fill="none" style={{ marginTop: '2px' }}>
            <path
              d="M44 4 C35 10, 20 18, 6 24 M6 24 L14 18 M6 24 L12 28"
              stroke="var(--ink)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* HAND-DRAWN VECTOR CHARACTER & MEDIA DOODLES */}
        <svg
          viewBox="0 0 360 380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          {/* BACKGROUND SKETCH LINES */}
          <path
            d="M20 50 Q 80 40 160 55 T 320 45"
            stroke="var(--ink)"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.4"
          />
          <path
            d="M30 340 Q 150 350 330 335"
            stroke="var(--ink)"
            strokeWidth="1"
            strokeDasharray="6 4"
            opacity="0.4"
          />

          {/* FILM STRIP DOODLE */}
          <g transform="translate(25, 45) rotate(-12)">
            <rect x="0" y="0" width="85" height="42" fill="none" stroke="var(--ink)" strokeWidth="2" />
            <line x1="0" y1="12" x2="85" y2="12" stroke="var(--ink)" strokeWidth="1.5" />
            <line x1="0" y1="30" x2="85" y2="30" stroke="var(--ink)" strokeWidth="1.5" />
            <line x1="28" y1="12" x2="28" y2="30" stroke="var(--ink)" strokeWidth="1.5" />
            <line x1="56" y1="12" x2="56" y2="30" stroke="var(--ink)" strokeWidth="1.5" />
            <rect x="4" y="3" width="6" height="6" fill="var(--ink)" />
            <rect x="18" y="3" width="6" height="6" fill="var(--ink)" />
            <rect x="32" y="3" width="6" height="6" fill="var(--ink)" />
            <rect x="46" y="3" width="6" height="6" fill="var(--ink)" />
            <rect x="60" y="3" width="6" height="6" fill="var(--ink)" />
            <rect x="74" y="3" width="6" height="6" fill="var(--ink)" />
            <rect x="4" y="33" width="6" height="6" fill="var(--ink)" />
            <rect x="18" y="33" width="6" height="6" fill="var(--ink)" />
            <rect x="32" y="33" width="6" height="6" fill="var(--ink)" />
            <rect x="46" y="33" width="6" height="6" fill="var(--ink)" />
            <rect x="60" y="33" width="6" height="6" fill="var(--ink)" />
            <rect x="74" y="33" width="6" height="6" fill="var(--ink)" />
          </g>

          {/* CHARACTER: BOLD BLACK SHAPES (HAT, HAIR, SHIRT) AS SPECIFIED IN DESIGN.MD */}
          <g id="character">
            {/* BLACK HAT */}
            <path
              d="M110 115 C110 80, 230 75, 240 115 C265 118, 270 128, 260 135 C240 142, 90 142, 85 132 C80 124, 95 116, 110 115 Z"
              fill="var(--ink)"
            />
            {/* HAT BAND */}
            <path
              d="M115 116 Q 175 125 235 116"
              stroke="var(--bg-paper)"
              strokeWidth="3"
            />

            {/* BOLD INK HAIR */}
            <path
              d="M120 135 C105 155, 95 185, 110 205 C115 190, 125 180, 130 165 Z"
              fill="var(--ink)"
            />
            <path
              d="M230 135 C245 155, 255 185, 240 205 C235 190, 225 180, 220 165 Z"
              fill="var(--ink)"
            />

            {/* FACE OUTLINE & NEGATIVE SPACE */}
            <path
              d="M125 140 C125 210, 225 210, 225 140"
              stroke="var(--ink)"
              strokeWidth="2.5"
              fill="var(--bg-paper)"
            />

            {/* HAND-DRAWN GLASSES */}
            <circle cx="150" cy="165" r="14" stroke="var(--ink)" strokeWidth="2.5" fill="none" />
            <circle cx="200" cy="165" r="14" stroke="var(--ink)" strokeWidth="2.5" fill="none" />
            <path d="M164 165 Q 175 160 186 165" stroke="var(--ink)" strokeWidth="2.5" />
            {/* EYE DOTS */}
            <circle cx="150" cy="165" r="3.5" fill="var(--ink)" />
            <circle cx="200" cy="165" r="3.5" fill="var(--ink)" />

            {/* SMILE & NOSE */}
            <path d="M174 168 L170 178 L177 178" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
            <path d="M160 192 Q 175 200 190 192" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />

            {/* NECK */}
            <path d="M160 210 L160 230 M190 210 L190 230" stroke="var(--ink)" strokeWidth="2" />

            {/* SOLID BLACK SHIRT / JACKET */}
            <path
              d="M120 230 L160 230 L165 250 L185 250 L190 230 L230 230 C270 245, 285 300, 290 350 L60 350 C65 300, 80 245, 120 230 Z"
              fill="var(--ink)"
            />
            {/* SHIRT COLLAR IN NEGATIVE SPACE */}
            <path
              d="M165 230 L175 255 L185 230"
              stroke="var(--bg-paper)"
              strokeWidth="3"
            />
            {/* BUTTONS */}
            <circle cx="175" cy="275" r="3" fill="var(--bg-paper)" />
            <circle cx="175" cy="305" r="3" fill="var(--bg-paper)" />
            <circle cx="175" cy="335" r="3" fill="var(--bg-paper)" />

            {/* CAMERA HANGING ON SHOULDER */}
            <g transform="translate(90, 270) rotate(14)">
              <rect x="0" y="8" width="58" height="38" rx="4" fill="var(--bg-paper)" stroke="var(--ink)" strokeWidth="2" />
              <rect x="8" y="2" width="16" height="6" fill="var(--ink)" />
              <circle cx="34" cy="27" r="13" stroke="var(--ink)" strokeWidth="2" fill="none" />
              <circle cx="34" cy="27" r="8" fill="var(--ink)" />
              <circle cx="12" cy="17" r="3" fill="var(--ink)" />
              {/* STRAP */}
              <path d="M10 8 C 2 -20, 45 -40, 50 -45" stroke="var(--ink)" strokeWidth="1.8" strokeDasharray="3 2" fill="none" />
            </g>
          </g>

          {/* SPARKLES / STARS DOODLE */}
          <g transform="translate(285, 130)">
            <path d="M12 0 L15 9 L24 12 L15 15 L12 24 L9 15 L0 12 L9 9 Z" fill="var(--ink)" />
          </g>
          <g transform="translate(45, 175) scale(0.6)">
            <path d="M12 0 L15 9 L24 12 L15 15 L12 24 L9 15 L0 12 L9 9 Z" fill="var(--ink)" />
          </g>

          {/* SCISSORS DOODLE */}
          <g transform="translate(260, 240) rotate(-25)">
            <circle cx="8" cy="8" r="6" stroke="var(--ink)" strokeWidth="1.8" fill="none" />
            <circle cx="8" cy="24" r="6" stroke="var(--ink)" strokeWidth="1.8" fill="none" />
            <line x1="13" y1="10" x2="36" y2="22" stroke="var(--ink)" strokeWidth="2" />
            <line x1="13" y1="22" x2="36" y2="10" stroke="var(--ink)" strokeWidth="2" />
          </g>
        </svg>

        {/* BOTTOM DOODLE BADGE */}
        <div style={{
          marginTop: '16px',
          borderTop: '1.5px solid var(--ink)',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
        }}>
          <span style={{ fontWeight: 700 }}>[EST. 100% PRIVATE]</span>
          <span>NO TELEMETRY • NO CLOUD</span>
        </div>
      </div>

      {/* QUICK FACTS LIST (HAND-DRAWN BRACKETED) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', fontSize: '11px' }}>
          <span style={{ fontWeight: 700 }}>[STORAGE]</span>
          <span>PERSISTED IN YOUR BROWSER INDEXEDDB</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', fontSize: '11px' }}>
          <span style={{ fontWeight: 700 }}>[SECURITY]</span>
          <span>FILES NEVER LEAVE YOUR DEVICE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', fontSize: '11px' }}>
          <span style={{ fontWeight: 700 }}>[AGENTIC]</span>
          <span>MCP JSON-RPC READY FOR ANTIGRAVITY / CLAUDE</span>
        </div>
      </div>
    </div>
  );
};
