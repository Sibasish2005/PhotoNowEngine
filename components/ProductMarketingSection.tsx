'use client';

import React, { useState } from 'react';

export const ProductMarketingSection: React.FC = () => {
  const [activeConfigTab, setActiveConfigTab] = useState<'cursor' | 'claude' | 'antigravity' | 'windsurf' | 'npx'>('cursor');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const CONFIG_PRESETS = {
    cursor: {
      client: 'CURSOR',
      path: '.cursor/mcp.json or Settings ➔ Features ➔ MCP',
      code: `{
  "mcpServers": {
    "photonow": {
      "command": "node",
      "args": ["./bin/mcp-server.mjs"]
    }
  }
}`
    },
    claude: {
      client: 'CLAUDE DESKTOP',
      path: '%APPDATA%\\Claude\\claude_desktop_config.json (Win) or ~/Library/Application Support/Claude/ (Mac)',
      code: `{
  "mcpServers": {
    "photonow": {
      "command": "node",
      "args": ["C:/absolute/path/to/PhotoNow/bin/mcp-server.mjs"]
    }
  }
}`
    },
    antigravity: {
      client: 'GOOGLE ANTIGRAVITY',
      path: '.agents/mcp_config.json or Global Antigravity Config',
      code: `{
  "mcpServers": {
    "photonow": {
      "command": "node",
      "args": ["./bin/mcp-server.mjs"]
    }
  }
}`
    },
    windsurf: {
      client: 'WINDSURF / CLINE',
      path: '~/.codeium/windsurf/mcp_config.json or cline_mcp_settings.json',
      code: `{
  "mcpServers": {
    "photonow": {
      "command": "node",
      "args": ["./bin/mcp-server.mjs"]
    }
  }
}`
    },
    npx: {
      client: 'ZERO-INSTALL NPX',
      path: 'Runs directly without cloning the repository',
      code: `{
  "mcpServers": {
    "photonow": {
      "command": "npx",
      "args": ["-y", "photonow-mcp"]
    }
  }
}`
    }
  };

  const PROMPT_TEMPLATES = [
    {
      id: 'p1',
      category: 'AUTONOMOUS MISSION',
      prompt: 'Run an autonomous media performance mission on my project in safe review mode. Audit all media in ./public, calculate byte savings, and generate safe AST source diffs for my JSX/TSX files without modifying disk files.',
      desc: 'Executes the flagship 10-step optimize_project loop with atomic rollback protection.'
    },
    {
      id: 'p2',
      category: 'DEAD ASSET PRUNING',
      prompt: 'Inspect our codebase AST and find all unreferenced dead images in ./public. Classify them into SAFE, LIKELY, and UNCERTAIN safety tiers before we delete them.',
      desc: 'Traces Route ➔ Component ➔ Asset references to eradicate dead media waste safely.'
    },
    {
      id: 'p3',
      category: 'LCP BOTTLENECK AUDIT',
      prompt: 'Run a 5-axis media performance audit on this directory. Show me our score out of 100, Largest Contentful Paint (LCP) candidates, and 4G mobile transfer savings.',
      desc: 'Instant diagnostic scoring across formats, sizing, responsive srcsets, and compression.'
    },
    {
      id: 'p4',
      category: 'LOCAL BATCH CONVERSION',
      prompt: 'Convert all legacy PNG and JPG assets in ./public/images to WebP at 80% quality, resize oversized files to max 1200px width, and update my React image imports.',
      desc: 'High-speed local Sharp + AST transformation pipeline with zero external cloud egress.'
    }
  ];

  const FAQS = [
    {
      q: 'HOW IS PHOTONOW DIFFERENT FROM CLOUDINARY OR AN IMAGE CDN?',
      a: 'Cloudinary and image CDNs require monthly SaaS subscriptions, meter bandwidth/transformations, demand API keys, and require uploading all your company\'s proprietary media to their cloud servers. PhotoNow is 100% offline, runs locally via native Sharp and bundled FFmpeg binaries, and costs $0. Zero bytes ever leave your development machine.'
    },
    {
      q: 'HOW IS IT DIFFERENT FROM RUNNING LIGHTHOUSE IN CHROME DEVTOOLS?',
      a: 'Lighthouse is strictly an audit tool—it tells you that your images are slow, but it cannot fix them. Moreover, dumping Lighthouse JSON into an AI agent burns 30,000+ tokens and causes context overflow. PhotoNow provides a closed loop: it audits, converts media, updates JSX/TSX source code ASTs, and delivers ultra-compact reports (<200 tokens) with 1-click atomic rollback.'
    },
    {
      q: 'WILL CODE PATCHES BREAK MY NEXT.JS OR REACT APPLICATION?',
      a: 'No. PhotoNow utilizes AST (Abstract Syntax Tree) semantic parsing rather than brittle regular expressions. In safe/review mode, it generates standard unified diffs (.patch) and automatically creates versioned backups in .photonow/backups/. If anything is unsatisfactory, running rollback_operation atomically restores all files in milliseconds.'
    },
    {
      q: 'DO I NEED TO INSTALL FFMPEG OR GLOBAL C++ LIBRARIES ON MY SYSTEM?',
      a: 'No. PhotoNow bundles static, pre-compiled multi-platform FFmpeg and FFprobe binaries and pre-built native Sharp bindings. It runs instantly on macOS, Windows, and Linux without requiring apt-get, brew, or manual PATH configuration.'
    },
    {
      q: 'WHY THE STRICT <200 TOKEN CONTRACT FOR AI AGENTS?',
      a: 'AI coding agents (Claude 3.7 Sonnet, GPT-4o, Cursor) degrade rapidly when bombarded with megabytes of terminal logs, stack traces, and verbose JSON diagnostics. PhotoNow writes heavy diagnostic files to disk and returns only lean, structured executive summaries with next-action directives, keeping your agent sharp, focused, and hallucination-free.'
    }
  ];

  return (
    <section id="product-marketing-section" aria-label="PhotoNow Product Specification & Marketing" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 1. HERO PRODUCT VALUE PROPOSITION */}
      <div className="hand-box-invert" style={{ padding: 'clamp(24px, 4vw, 40px) clamp(20px, 3vw, 36px)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{
            background: 'var(--ink-inverted)',
            color: 'var(--ink)',
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: 700,
            borderRadius: '2px',
          }}>
            [OFFICIAL PRODUCT SPECIFICATION]
          </span>
          <span style={{ fontSize: '11px', letterSpacing: '1px', opacity: 0.85 }}>
            • MODEL CONTEXT PROTOCOL (MCP) • ZERO-CLOUD • 29 NATIVE TOOLS •
          </span>
        </div>

        <h1 className="marker-font" style={{ fontSize: 'clamp(28px, 4.5vw, 44px)', lineHeight: '1.05', marginBottom: '16px' }}>
          TURN YOUR AI AGENT INTO AN AUTONOMOUS PERFORMANCE ENGINEER.
        </h1>

        <p style={{ fontSize: '13px', lineHeight: '1.7', maxWidth: '820px', opacity: 0.9, marginBottom: '24px' }}>
          Autonomous coding agents (Cursor, Claude Desktop, Google Antigravity, Windsurf) can write code—but until now, they lacked the local engine to transcode media, audit web performance, prune dead assets, and safely refactor JSX/TSX ASTs. <strong>PhotoNow (`photonow-mcp`)</strong> bridges this gap with 29 zero-permission native tools, zero cloud egress, and guaranteed &lt;200 token payloads.
        </p>

        {/* HERO CTA BUTTONS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => copyToClipboard('npx -y photonow-mcp', 'hero-npx')}
            className="hand-btn"
            style={{
              background: 'var(--ink-inverted)',
              color: 'var(--ink)',
              padding: '10px 20px',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            {copiedKey === 'hero-npx' ? '[COPIED TO CLIPBOARD!]' : '[RUN: npx -y photonow-mcp]'}
          </button>

          <a
            href="https://github.com/Sibasish2005/PhotoNowEngine"
            target="_blank"
            rel="noopener noreferrer"
            className="hand-btn"
            style={{
              background: 'transparent',
              color: 'var(--ink-inverted)',
              borderColor: 'var(--ink-inverted)',
              padding: '10px 20px',
              fontSize: '12px',
            }}
          >
            [STAR ON GITHUB ↗]
          </a>

          <span style={{ fontSize: '11px', opacity: 0.75, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>✓ 100% Free & Open Source (MIT)</span>
            <span>•</span>
            <span>✓ Zero Cloud Uploads</span>
          </span>
        </div>
      </div>

      {/* 2. ROI & PROVEN IMPACT BENCHMARKS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="hand-box" style={{ padding: '20px 18px', textAlign: 'center', background: 'var(--paper-tint)' }}>
          <span className="marker-font" style={{ fontSize: '38px', display: 'block', marginBottom: '4px' }}>
            -68%
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            AVERAGE MEDIA PAYLOAD
          </span>
          <p style={{ fontSize: '10px', color: 'var(--ink-gray)', lineHeight: '1.4' }}>
            Automated lossless downscaling and modern WebP/AVIF transcoding reduce asset footprint instantly.
          </p>
        </div>

        <div className="hand-box" style={{ padding: '20px 18px', textAlign: 'center', background: 'var(--paper-tint)' }}>
          <span className="marker-font" style={{ fontSize: '38px', display: 'block', marginBottom: '4px' }}>
            -58%
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            LCP LOAD ACCELERATION
          </span>
          <p style={{ fontSize: '10px', color: 'var(--ink-gray)', lineHeight: '1.4' }}>
            Identifies Largest Contentful Paint bottlenecks and generates pre-calculated responsive srcsets.
          </p>
        </div>

        <div className="hand-box" style={{ padding: '20px 18px', textAlign: 'center', background: 'var(--paper-tint)' }}>
          <span className="marker-font" style={{ fontSize: '38px', display: 'block', marginBottom: '4px' }}>
            $0 / MO
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            CLOUD API & CDN BILLS
          </span>
          <p style={{ fontSize: '10px', color: 'var(--ink-gray)', lineHeight: '1.4' }}>
            Zero recurring subscription costs. Replaces expensive Cloudinary and TinyPNG metered tiers.
          </p>
        </div>

        <div className="hand-box" style={{ padding: '20px 18px', textAlign: 'center', background: 'var(--paper-tint)' }}>
          <span className="marker-font" style={{ fontSize: '38px', display: 'block', marginBottom: '4px' }}>
            1 PERM
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            ZERO TERMINAL POPUPS
          </span>
          <p style={{ fontSize: '10px', color: 'var(--ink-gray)', lineHeight: '1.4' }}>
            Single initial agent approval grants full access to 29 tools without repetitive CLI confirmation dialogs.
          </p>
        </div>
      </div>

      {/* 3. THE 4 ARCHITECTURAL PILLARS (PRODUCT MOATS) */}
      <div className="hand-box" style={{ padding: '28px 24px' }}>
        <div className="section-header" style={{ borderBottom: '2px solid var(--ink)', paddingBottom: '10px', marginBottom: '22px' }}>
          <h2 className="marker-font" style={{ fontSize: '26px' }}>
            THE 4 PILLARS OF PHOTONOW ENGINE.
          </h2>
          <span style={{ fontSize: '11px', fontWeight: 700 }}>
            [WHY NO OTHER TOOL OFFERS THIS UNIFIED ARCHITECTURE]
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          
          {/* PILLAR 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'var(--ink)', color: 'var(--ink-inverted)', padding: '2px 6px', fontSize: '11px', fontWeight: 700 }}>
                PILLAR 01
              </span>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>
                100% OFFLINE ZERO-CLOUD PRIVACY
              </h3>
            </div>
            <p style={{ fontSize: '11px', lineHeight: '1.6', color: 'var(--ink-gray)' }}>
              Proprietary assets, unreleased client videos, and copyrighted imagery must never leak to third-party cloud APIs. PhotoNow bundles static cross-platform binaries (FFmpeg, FFprobe, Sharp) for pure local execution. Zero network requests, zero telemetry, GDPR & HIPAA audit-ready.
            </p>
          </div>

          {/* PILLAR 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'var(--ink)', color: 'var(--ink-inverted)', padding: '2px 6px', fontSize: '11px', fontWeight: 700 }}>
                PILLAR 02
              </span>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>
                AST CODE PATCHING & 1-CLICK ROLLBACK
              </h3>
            </div>
            <p style={{ fontSize: '11px', lineHeight: '1.6', color: 'var(--ink-gray)' }}>
              Audit reports are useless if an agent cannot safely implement the changes. PhotoNow parses JSX/TSX ASTs, updates <code>&lt;img src="..."&gt;</code> and Next.js <code>&lt;Image /&gt;</code> references to newly converted WebP/AVIF files, generates unified diffs, and maintains automated backups for instant 1-click rollback.
            </p>
          </div>

          {/* PILLAR 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'var(--ink)', color: 'var(--ink-inverted)', padding: '2px 6px', fontSize: '11px', fontWeight: 700 }}>
                PILLAR 03
              </span>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>
                &lt;200 TOKEN AGENT CONTRACT
              </h3>
            </div>
            <p style={{ fontSize: '11px', lineHeight: '1.6', color: 'var(--ink-gray)' }}>
              AI coding agents suffer context degradation and hallucinations when fed large 50KB JSON diagnostic dumps. PhotoNow writes exhaustive diagnostics to local disk artifacts while returning concise, actionable payloads under 200 tokens with prescriptive next-step instructions.
            </p>
          </div>

          {/* PILLAR 4 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'var(--ink)', color: 'var(--ink-inverted)', padding: '2px 6px', fontSize: '11px', fontWeight: 700 }}>
                PILLAR 04
              </span>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>
                AST ASSET GRAPH & DEAD ASSET PRUNING
              </h3>
            </div>
            <p style={{ fontSize: '11px', lineHeight: '1.6', color: 'var(--ink-gray)' }}>
              Web repositories accumulate hundreds of megabytes of abandoned photos, old marketing banners, and test assets. PhotoNow maps the complete <code>Route ➔ Component ➔ Asset</code> import tree, classifying unreferenced assets into <code>SAFE</code>, <code>LIKELY</code>, and <code>UNCERTAIN</code> tiers before pruning.
            </p>
          </div>

        </div>
      </div>

      {/* 4. HOW THE AUTONOMOUS MISSION LOOP WORKS (FLOWCHART) */}
      <div className="hand-box" style={{ padding: '24px 20px', background: 'var(--paper-tint)' }}>
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }}>
            [1-PROMPT AUTONOMOUS OPTIMIZATION LOOP]
          </span>
          <h3 className="marker-font" style={{ fontSize: '20px', marginTop: '4px' }}>
            FROM NATURAL LANGUAGE PROMPT TO PRODUCTION VERIFICATION.
          </h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          fontSize: '11px',
        }}>
          <div className="hand-box" style={{ padding: '12px', background: 'var(--bg-paper)' }}>
            <span style={{ fontWeight: 700, display: 'block', borderBottom: '1px solid var(--ink)', paddingBottom: '4px', marginBottom: '6px' }}>
              01. INTENT
            </span>
            <span>Agent receives user prompt via Stdio MCP protocol.</span>
          </div>

          <div className="hand-box" style={{ padding: '12px', background: 'var(--bg-paper)' }}>
            <span style={{ fontWeight: 700, display: 'block', borderBottom: '1px solid var(--ink)', paddingBottom: '4px', marginBottom: '6px' }}>
              02. AST SCAN
            </span>
            <span>Maps route & component tree to detect active vs. dead assets.</span>
          </div>

          <div className="hand-box" style={{ padding: '12px', background: 'var(--bg-paper)' }}>
            <span style={{ fontWeight: 700, display: 'block', borderBottom: '1px solid var(--ink)', paddingBottom: '4px', marginBottom: '6px' }}>
              03. LOCAL CONVERT
            </span>
            <span>Sharp & FFmpeg transcode images/video with zero cloud upload.</span>
          </div>

          <div className="hand-box" style={{ padding: '12px', background: 'var(--bg-paper)' }}>
            <span style={{ fontWeight: 700, display: 'block', borderBottom: '1px solid var(--ink)', paddingBottom: '4px', marginBottom: '6px' }}>
              04. AST DIFF
            </span>
            <span>Generates unified patch for JSX/TSX image import tags.</span>
          </div>

          <div className="hand-box" style={{ padding: '12px', background: 'var(--bg-paper)' }}>
            <span style={{ fontWeight: 700, display: 'block', borderBottom: '1px solid var(--ink)', paddingBottom: '4px', marginBottom: '6px' }}>
              05. ROLLBACK GUARD
            </span>
            <span>Creates snapshot backup. 1-click restore via rollback_operation.</span>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE CLIENT CONFIGURATION & QUICK COPY */}
      <div className="hand-box" style={{ padding: '28px 24px' }}>
        <div className="section-header" style={{ borderBottom: '2px solid var(--ink)', paddingBottom: '10px', marginBottom: '18px' }}>
          <h2 className="marker-font" style={{ fontSize: '24px' }}>
            CONNECT TO YOUR FAVORITE AI AGENT.
          </h2>
          <span style={{ fontSize: '11px', fontWeight: 700 }}>
            [1-CLICK READY TO PASTE CONFIGURATION]
          </span>
        </div>

        {/* CLIENT TABS */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {(['cursor', 'claude', 'antigravity', 'windsurf', 'npx'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveConfigTab(tab)}
              className={`hand-btn ${activeConfigTab === tab ? 'active' : ''}`}
              style={{ padding: '5px 12px', fontSize: '11px' }}
            >
              [{CONFIG_PRESETS[tab].client}]
            </button>
          ))}
        </div>

        {/* TARGET LOCATION NOTICE */}
        <div style={{
          fontSize: '11px',
          color: 'var(--ink-gray)',
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <span>
            CONFIG TARGET: <code>{CONFIG_PRESETS[activeConfigTab].path}</code>
          </span>
          <button
            onClick={() => copyToClipboard(CONFIG_PRESETS[activeConfigTab].code, `config-${activeConfigTab}`)}
            className="hand-btn"
            style={{ padding: '3px 10px', fontSize: '10px', fontWeight: 700 }}
          >
            {copiedKey === `config-${activeConfigTab}` ? '[COPIED!]' : '[COPY CONFIG JSON]'}
          </button>
        </div>

        {/* CONFIG CODE BLOCK */}
        <pre style={{
          background: '#0A0A0A',
          color: '#F2F2F0',
          padding: '16px',
          borderRadius: '4px',
          fontSize: '12px',
          overflowX: 'auto',
          fontFamily: 'var(--font-mono), monospace',
          margin: 0,
        }}>
          {CONFIG_PRESETS[activeConfigTab].code}
        </pre>
      </div>

      {/* 6. READY-TO-USE AGENT PROMPTS (COPY & TEST) */}
      <div className="hand-box" style={{ padding: '28px 24px' }}>
        <div className="section-header" style={{ borderBottom: '2px solid var(--ink)', paddingBottom: '10px', marginBottom: '20px' }}>
          <h2 className="marker-font" style={{ fontSize: '24px' }}>
            READY-TO-USE AGENT PROMPTS.
          </h2>
          <span style={{ fontSize: '11px', fontWeight: 700 }}>
            [COPY INTO CURSOR / CLAUDE / ANTIGRAVITY]
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {PROMPT_TEMPLATES.map((item) => (
            <div
              key={item.id}
              className="hand-box"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: 'var(--bg-paper)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ background: 'var(--ink)', color: 'var(--ink-inverted)', padding: '2px 6px', fontSize: '9px', fontWeight: 700 }}>
                    {item.category}
                  </span>
                  <button
                    onClick={() => copyToClipboard(item.prompt, item.id)}
                    className="hand-btn"
                    style={{ padding: '2px 8px', fontSize: '9px' }}
                  >
                    {copiedKey === item.id ? '[COPIED!]' : '[COPY PROMPT]'}
                  </button>
                </div>
                <p style={{ fontSize: '11px', fontWeight: 700, lineHeight: '1.5', marginBottom: '8px' }}>
                  "{item.prompt}"
                </p>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--ink-gray)', borderTop: '1px dashed var(--ink-light)', paddingTop: '6px' }}>
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 7. FREQUENTLY ASKED QUESTIONS (OBJECTION HANDLING) */}
      <div className="hand-box" style={{ padding: '28px 24px' }}>
        <div className="section-header" style={{ borderBottom: '2px solid var(--ink)', paddingBottom: '10px', marginBottom: '18px' }}>
          <h2 className="marker-font" style={{ fontSize: '24px' }}>
            PRODUCT FAQ & TECHNICAL SPECIFICATIONS.
          </h2>
          <span style={{ fontSize: '11px', fontWeight: 700 }}>
            [TRANSPARENT, ZERO-SURPRISE ARCHITECTURE]
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FAQS.map((faq, index) => (
            <div
              key={index}
              className="hand-box"
              style={{
                padding: '14px 16px',
                cursor: 'pointer',
                background: openFaq === index ? 'var(--paper-tint)' : 'var(--bg-paper)',
              }}
              onClick={() => setOpenFaq(openFaq === index ? null : index)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>
                  {faq.q}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>
                  {openFaq === index ? '[-]' : '[+]'}
                </span>
              </div>
              {openFaq === index && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--ink-light)', fontSize: '11px', lineHeight: '1.6', color: 'var(--ink-gray)' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 8. FINAL CONVERSION BANNER */}
      <div className="hand-box-invert" style={{ padding: '32px 24px', textAlign: 'center' }}>
        <h2 className="marker-font" style={{ fontSize: '32px', marginBottom: '12px' }}>
          START OPTIMIZING IN UNDER 60 SECONDS.
        </h2>
        <p style={{ fontSize: '12px', maxWidth: '640px', margin: '0 auto 20px', opacity: 0.85 }}>
          Join developers and teams upgrading Claude Desktop, Cursor, and Antigravity into high-performance web engineering suites with zero cloud overhead.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => copyToClipboard('npx -y photonow-mcp', 'footer-npx')}
            className="hand-btn"
            style={{
              background: 'var(--ink-inverted)',
              color: 'var(--ink)',
              padding: '10px 24px',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            {copiedKey === 'footer-npx' ? '[COPIED: npx -y photonow-mcp]' : '[COPY NPX COMMAND]'}
          </button>

          <a
            href="https://github.com/Sibasish2005/PhotoNowEngine"
            target="_blank"
            rel="noopener noreferrer"
            className="hand-btn"
            style={{
              background: 'transparent',
              color: 'var(--ink-inverted)',
              borderColor: 'var(--ink-inverted)',
              padding: '10px 24px',
              fontSize: '12px',
            }}
          >
            [VIEW ON GITHUB ↗]
          </a>
        </div>
      </div>

    </section>
  );
};
