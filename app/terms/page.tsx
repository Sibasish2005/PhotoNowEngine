import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions | PhotoNow Multimedia MCP Engine',
  description:
    'Terms of Service and Acceptable Use Policy governing human use and autonomous AI agent MCP access to PhotoNow Engine.',
  alternates: {
    canonical: 'https://photonow.vercel.app/terms',
  },
};

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-paper)' }}>
      {/* TOP HEADER WITH INTERCONNECTED NAVIGATION */}
      <header style={{
        borderBottom: '2px solid var(--ink)',
        padding: 'clamp(10px, 2vw, 16px) clamp(14px, 2vw, 24px)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--bg-paper)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            background: 'var(--ink)',
            color: 'var(--ink-inverted)',
            padding: '2px 8px',
            fontSize: '12px',
            borderRadius: '2px',
            fontWeight: 700,
          }}>
            [LEGAL]
          </span>
          <span style={{ fontWeight: 700, fontSize: '14px' }}>PHOTONOW.TERMS</span>
        </div>

        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <Link href="/privacy" className="hand-btn" style={{ padding: '5px 10px', fontSize: '11px', textDecoration: 'none' }}>
            [PRIVACY POLICY]
          </Link>
          <Link href="/terms" className="hand-btn" style={{ padding: '5px 10px', fontSize: '11px', textDecoration: 'none', background: 'var(--ink)', color: 'var(--ink-inverted)' }}>
            [TERMS OF USE]
          </Link>
          <Link href="/legal" className="hand-btn" style={{ padding: '5px 10px', fontSize: '11px', textDecoration: 'none' }}>
            [LEGAL &amp; TRADEMARKS]
          </Link>
          <Link href="/" className="hand-btn primary" style={{ padding: '5px 12px', fontSize: '11px', textDecoration: 'none' }}>
            ← WORKBENCH
          </Link>
        </nav>
      </header>

      {/* MAIN DOCUMENT CONTAINER */}
      <main style={{
        maxWidth: '920px',
        width: '100%',
        margin: '0 auto',
        padding: 'clamp(20px, 4vw, 40px) clamp(14px, 2vw, 24px)',
        flex: 1,
      }}>
        <div className="hand-box" style={{ padding: 'clamp(20px, 3vw, 36px) clamp(16px, 2vw, 28px)', lineHeight: '1.7', fontSize: '13px' }}>
          <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: '16px', marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
              TERMS OF SERVICE &amp; ACCEPTABLE USE • LAST REVISED: SEPTEMBER 2026
            </span>
            <h1 className="marker-font" style={{ fontSize: '36px', lineHeight: 1.1 }}>
              TERMS &amp; CONDITIONS.
            </h1>
            <p style={{ color: 'var(--ink-gray)', marginTop: '8px', fontSize: '12px' }}>
              LEGAL AGREEMENT GOVERNING MANUAL WORKBENCH AND AUTONOMOUS MCP AGENT USAGE.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            {/* 1. ACCEPTANCE OF TERMS */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [1. ACCEPTANCE OF TERMS &amp; SCOPE]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                By accessing, browsing, or utilizing the PhotoNow web application (located at <code>https://photonow.vercel.app/</code>) or by connecting an autonomous AI agent, script, CLI process, or language model to our Model Context Protocol (MCP) server endpoints (including local Stdio MCP via <code>bin/mcp-server.mjs</code> and HTTP JSON-RPC 2.0 at <code>/api/mcp</code>), you agree to be bound by these Terms and Conditions.
              </p>
              <p style={{ color: 'var(--ink-gray)', marginTop: '8px' }}>
                If you do not agree to these terms, you must discontinue use of the application and disengage any automated MCP connections immediately.
              </p>
            </section>

            {/* 2. OWNERSHIP OF CONTENT */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [2. INTELLECTUAL PROPERTY &amp; 100% USER MEDIA OWNERSHIP]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                <strong>You retain 100% full, unencumbered, and exclusive ownership, copyright, and all intellectual property rights in all images, videos, audio tracks, and data files processed through PhotoNow.</strong>
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li>PhotoNow claims zero ownership, license, title, royalty rights, or interest in any files you or your autonomous agents convert.</li>
                <li>Because conversions occur locally in your browser memory or on your local filesystem, PhotoNow never retains, hosts, copies, or replicates your media assets.</li>
                <li>You represent and warrant that you possess all necessary rights, licenses, and permissions for any media content processed using the software.</li>
              </ul>
            </section>

            {/* 3. ACCEPTABLE USE FOR HUMANS & AI AGENTS */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [3. ACCEPTABLE USE POLICY (HUMANS &amp; AI AGENTS)]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                You agree not to use the application, Stdio MCP server, or the HTTP MCP endpoint to:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li>Process, convert, or distribute unlawful, fraudulent, defamatory, infringing, or malicious media.</li>
                <li>Attempt to overwhelm, disrupt, or disable the MCP HTTP endpoint or hosting infrastructure via volumetric denial-of-service (DDoS) attacks.</li>
                <li>Bypass or attempt to circumvent the sliding-window rate limit policy (enforced at 60 requests per minute per IP on <code>/api/mcp</code>).</li>
                <li>Deploy malicious bots, exploit scripts, or vulnerability scanners against hosting boundaries.</li>
              </ul>
            </section>

            {/* 4. MCP AGENT USAGE & PROTOCOL RULES */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [4. MODEL CONTEXT PROTOCOL (MCP) SERVICE RULES]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                The Model Context Protocol interfaces are provided to empower autonomous coding agents (including Claude Desktop, Google Antigravity, Cursor, Claude Code, and custom agent swarms) to execute local media conversions:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li><strong>Rate Limiting &amp; Backoff</strong>: Requests exceeding the rate limit on <code>/api/mcp</code> will receive an HTTP <code>429 Too Many Requests</code> with a standard <code>Retry-After</code> header. Automated clients must honor backoff timers.</li>
                <li><strong>Payload Guard</strong>: JSON-RPC 2.0 payloads larger than 1MB are rejected to preserve server health.</li>
                <li><strong>Stdio MCP Local Authorization</strong>: When configuring the local Stdio MCP server (<code>node ./bin/mcp-server.mjs</code>), the user acknowledges and authorizes the connected AI agent to perform local filesystem reads and writes for media conversions using bundled static FFmpeg and Sharp binaries.</li>
              </ul>
            </section>

            {/* 5. OPEN SOURCE LICENSE */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [5. SOFTWARE LICENSE &amp; ATTRIBUTION]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                The PhotoNow software application is licensed under the terms of the <strong>MIT License</strong>. You are free to inspect, fork, modify, and build upon the source code in accordance with the license conditions set forth in our official repository.
              </p>
            </section>

            {/* 6. DISCLAIMER OF WARRANTIES */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [6. DISCLAIMER OF WARRANTIES (&ldquo;AS-IS&rdquo;)]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                PHOTONOW ENGINE AND ALL ACCOMPANYING MCP TOOLS ARE PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p style={{ color: 'var(--ink-gray)', marginTop: '8px' }}>
                WE DO NOT GUARANTEE THAT THE SERVICE WILL FUNCTION UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT CONVERSIONS WILL MEET SPECIFIC FIDELITY REQUIREMENTS ON ALL PLATFORMS AND HARDWARE ARCHITECTURES.
              </p>
            </section>

            {/* 7. LIMITATION OF LIABILITY */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [7. STRICT LIMITATION OF LIABILITY &amp; INDEMNITY]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                IN NO EVENT SHALL PHOTONOW ENGINEERING, ITS CREATOR (SIBASISH CHAKRABORTI), OR ITS CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT LIMITED TO LOSS OF DATA, CORRUPTION OF MEDIA FILES, LOSS OF PROFITS, DEVICE DAMAGE, OR BUSINESS INTERRUPTION) ARISING IN ANY WAY OUT OF THE USE OR INABILITY TO USE THIS APPLICATION, ITS WORKBENCH, OR ITS MCP SERVER INTERFACES.
              </p>
              <p style={{ color: 'var(--ink-gray)', marginTop: '8px' }}>
                You agree to defend, indemnify, and hold harmless PhotoNow Engineering against any claims, liabilities, damages, and expenses arising from your violation of these Terms or infringement of third-party intellectual property.
              </p>
            </section>

            {/* 8. DMCA PROCEDURE */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [8. DMCA COPYRIGHT POLICY]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                If you believe your copyrighted work has been infringed by any content made available through our repository or site, please follow the DMCA Takedown Procedure detailed in our <Link href="/legal" style={{ color: 'var(--ink)', fontWeight: 700 }}>Legal Notice</Link>.
              </p>
            </section>

            {/* 9. GOVERNING LAW & CONTACT */}
            <section style={{ borderTop: '1.5px solid var(--ink)', paddingTop: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [9. GOVERNING LAW, SEVERABILITY &amp; CONTACT]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                These terms are governed by and construed in accordance with applicable general law. If any provision of these Terms is found to be unlawful, void, or unenforceable, that provision shall be deemed severable from these Terms and shall not affect the validity and enforceability of any remaining provisions.
              </p>
              <p style={{ color: 'var(--ink-gray)', marginTop: '8px' }}>
                <strong>Legal Contact:</strong> <a href="mailto:sibasishchakraborti@gmail.com" style={{ color: 'var(--ink)', fontWeight: 700 }}>sibasishchakraborti@gmail.com</a>
                <br />
                <strong>GitHub Repository:</strong> <a href="https://github.com/Sibasish2005/PhotoNowEngine" target="_blank" rel="noreferrer" style={{ color: 'var(--ink)', fontWeight: 700 }}>GitHub / PhotoNowEngine</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{
        borderTop: '2px solid var(--ink)',
        padding: '20px',
        textAlign: 'center',
        fontSize: '11px',
        background: 'var(--bg-paper)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/privacy" style={{ color: 'var(--ink)', textDecoration: 'none', fontWeight: 700 }}>[PRIVACY POLICY]</Link>
          <span>•</span>
          <Link href="/terms" style={{ color: 'var(--ink)', textDecoration: 'none', fontWeight: 700 }}>[TERMS OF USE]</Link>
          <span>•</span>
          <Link href="/legal" style={{ color: 'var(--ink)', textDecoration: 'none', fontWeight: 700 }}>[LEGAL &amp; TRADEMARKS]</Link>
          <span>•</span>
          <a href="https://github.com/Sibasish2005/PhotoNowEngine" target="_blank" rel="noreferrer" style={{ color: 'var(--ink)', textDecoration: 'none', fontWeight: 700 }}>[GITHUB REPO]</a>
        </div>
        <span style={{ color: 'var(--ink-gray)' }}>
          PHOTONOW TERMS OF SERVICE • RESPECTING CREATORS, DEVELOPERS &amp; AUTONOMOUS AI AGENTS
        </span>
      </footer>
    </div>
  );
}
