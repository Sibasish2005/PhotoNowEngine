import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions | PhotoNow MCP Engine',
  description:
    'Terms of Service and Acceptable Use Policy governing human use and automated AI agent MCP access to PhotoNow Engine.',
  alternates: {
    canonical: 'https://photonow.vercel.app/terms',
  },
};

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-paper)' }}>
      {/* TOP HEADER */}
      <header style={{
        borderBottom: '2px solid var(--ink)',
        padding: 'clamp(10px, 2vw, 16px) clamp(14px, 2vw, 24px)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
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

        <Link href="/" className="hand-btn primary" style={{ padding: '6px 14px', fontSize: '11px', textDecoration: 'none' }}>
          ← RETURN TO WORKBENCH
        </Link>
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
              TERMS OF SERVICE & ACCEPTABLE USE • LAST UPDATED: SEPTEMBER 2026
            </span>
            <h1 className="marker-font" style={{ fontSize: '36px', lineHeight: 1.1 }}>
              TERMS & CONDITIONS.
            </h1>
            <p style={{ color: 'var(--ink-gray)', marginTop: '8px', fontSize: '12px' }}>
              AGREEMENT GOVERNING MANUAL WORKBENCH AND AUTONOMOUS MCP AGENT USAGE.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 1. ACCEPTANCE OF TERMS */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [1. ACCEPTANCE OF TERMS]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                By accessing, browsing, or utilizing the PhotoNow application (located at <code>https://photonow.vercel.app/</code>) or by connecting an autonomous AI agent, script, or model to our Model Context Protocol (MCP) server endpoint (<code>/api/mcp</code>), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, do not use the application or its API interfaces.
              </p>
            </section>

            {/* 2. OWNERSHIP OF CONTENT */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [2. INTELLECTUAL PROPERTY & YOUR CONTENT]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                <strong>You retain 100% full and exclusive ownership, copyright, and intellectual property rights in all images, videos, audio, and media files processed through PhotoNow.</strong>
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li>PhotoNow claims zero ownership, license, title, or interest in any files you or your agents process.</li>
                <li>Because processing is local, PhotoNow does not receive or store any copies of your files.</li>
                <li>The PhotoNow source code, software architecture, and branding are protected by copyright and open-source licensing.</li>
              </ul>
            </section>

            {/* 3. ACCEPTABLE USE FOR HUMANS & AI AGENTS */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [3. ACCEPTABLE USE POLICY (HUMANS & AGENTS)]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                You agree not to use the application or the MCP endpoint to:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li>Process or distribute unlawful, fraudulent, defamatory, or abusive media.</li>
                <li>Attempt to overwhelm, disrupt, or disable the MCP server via volumetric denial-of-service (DDoS) attacks.</li>
                <li>Bypass or attempt to circumvent the sliding-window rate limit policy (enforced at 60 requests per minute per IP).</li>
                <li>Deploy malicious bots or scraper swarms designed to exploit hosting compute boundaries.</li>
              </ul>
            </section>

            {/* 4. MCP AGENT USAGE & PROTOCOL POLICY */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [4. MODEL CONTEXT PROTOCOL (MCP) SERVICE RULES]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                The MCP interface is provided to empower autonomous coding agents (such as Claude Desktop, Google Antigravity, Cursor, and custom agent swarms) to execute local media conversions:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li><strong>Rate Limiting</strong>: Requests exceeding the rate limit will receive an HTTP <code>429 Too Many Requests</code> with a standard <code>Retry-After</code> header. Automated agents must honor backoff timers.</li>
                <li><strong>Payload Guard</strong>: JSON-RPC 2.0 payloads larger than 1MB are rejected to preserve server health.</li>
                <li><strong>Availability</strong>: We reserve the right to temporarily limit or throttle abusive IPs to protect service availability for all users.</li>
              </ul>
            </section>

            {/* 5. DISCLAIMER OF WARRANTIES */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [5. DISCLAIMER OF WARRANTIES (&ldquo;AS-IS&rdquo;)]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                PHOTONOW ENGINE IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT THE APPLICATION WILL OPERATE ERROR-FREE, UNINTERRUPTED, OR COMPATIBLE WITH ALL BROWSER VERSIONS OR HARDWARE PLATFORMS.
              </p>
            </section>

            {/* 6. LIMITATION OF LIABILITY */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [6. LIMITATION OF LIABILITY]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                IN NO EVENT SHALL PHOTONOW ENGINEERING, ITS CREATORS, OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT LIMITED TO LOSS OF DATA, DEVICE DAMAGE, OR BUSINESS INTERRUPTION) ARISING IN ANY WAY OUT OF THE USE OR INABILITY TO USE THIS APPLICATION OR ITS MCP INTERFACES.
              </p>
            </section>

            {/* 7. MODIFICATIONS & TERMINATION */}
            <section style={{ borderTop: '1.5px solid var(--ink)', paddingTop: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [7. GOVERNING LAW & CONTACT]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                These terms are governed by and construed in accordance with applicable general law. For questions regarding our Terms of Service:
                <br />
                <strong>Legal Contact:</strong> <a href="mailto:sibasishchakraborti@gmail.com" style={{ color: 'var(--ink)', fontWeight: 700 }}>sibasishchakraborti@gmail.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: '2px solid var(--ink)', padding: '20px', textAlign: 'center', fontSize: '11px' }}>
        <span>PHOTONOW TERMS OF SERVICE • RESPECTING AGENTS & CREATORS</span>
      </footer>
    </div>
  );
}
