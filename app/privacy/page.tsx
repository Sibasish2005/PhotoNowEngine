import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | PhotoNow Multimedia MCP Engine',
  description:
    'PhotoNow is 100% private, zero-cloud, and offline-first. We do not collect, upload, store, or transmit your photos, videos, or audio to any remote server or AI training dataset.',
  alternates: {
    canonical: 'https://photonow.vercel.app/privacy',
  },
};

export default function PrivacyPage() {
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
          <span style={{ fontWeight: 700, fontSize: '14px' }}>PHOTONOW.PRIVACY</span>
        </div>

        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <Link href="/privacy" className="hand-btn" style={{ padding: '5px 10px', fontSize: '11px', textDecoration: 'none', background: 'var(--ink)', color: 'var(--ink-inverted)' }}>
            [PRIVACY POLICY]
          </Link>
          <Link href="/terms" className="hand-btn" style={{ padding: '5px 10px', fontSize: '11px', textDecoration: 'none' }}>
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
              OFFLINE-FIRST PRIVACY POLICY • EFFECTIVE &amp; UPDATED: SEPTEMBER 2026
            </span>
            <h1 className="marker-font" style={{ fontSize: '36px', lineHeight: 1.1 }}>
              PRIVACY POLICY.
            </h1>
            <p style={{ color: 'var(--ink-gray)', marginTop: '8px', fontSize: '12px' }}>
              100% IN-BROWSER &amp; LOCAL DISK EXECUTION. ZERO SERVER UPLOADS. ZERO AI TRAINING. COMPLETE DATA SOVEREIGNTY.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            {/* 1. CORE PRIVACY PROMISE */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [1. ZERO CLOUD PROCESSING &amp; ZERO SERVER UPLOADS]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                PhotoNow Engine (accessible at <code>https://photonow.vercel.app/</code>) is architected upon a fundamental principle: <strong>Offline-First, Zero-Cloud Computing</strong>. When you or an autonomous AI agent convert photos, transcode videos, or extract audio tracks, <strong>your original media files and converted outputs never leave your local machine or browser runtime</strong>.
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li><strong>No Cloud Storage</strong>: We do not operate Amazon S3 buckets, Cloudflare R2, Google Cloud Storage, or any remote file storage infrastructure.</li>
                <li><strong>Local Browser Execution</strong>: Browser-based operations execute exclusively in memory via HTML5 Canvas 2D, MediaRecorder, and Web Audio APIs.</li>
                <li><strong>Local MCP Agent Execution</strong>: Stdio MCP operations run locally on your filesystem using bundled static FFmpeg and Sharp binaries without remote API round-trips.</li>
                <li><strong>Supported Formats</strong>: All conversions (WebP, AVIF, PNG, JPEG, WebM, MP4, MKV, MP3, WAV, AAC, FLAC) are generated strictly on client hardware.</li>
              </ul>
            </section>

            {/* 2. CLIENT-SIDE LOCAL STORAGE */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [2. CLIENT-SIDE STORAGE SANDBOX (INDEXEDDB)]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                For user convenience, the PhotoNow web workbench maintains local conversion history and binary Blobs using your browser&apos;s native sandboxed database (<strong>IndexedDB</strong>, database name: <code>photoConvert_DB</code>).
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li>All stored items exist solely within your specific browser profile and local storage partition.</li>
                <li>We have no technical ability to access, inspect, copy, or recover items stored in your local IndexedDB.</li>
                <li>You maintain total sovereignty: you can delete individual conversions or wipe the entire database instantly using the <code>[CLEAR STORAGE]</code> button.</li>
              </ul>
            </section>

            {/* 3. SERVER LOGS & MCP RATE LIMITING */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [3. EPHEMERAL TELEMETRY &amp; MCP ENDPOINT SECURITY]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                When you access the website or when an autonomous AI agent dispatches tool calls to our Model Context Protocol endpoint (<code>/api/mcp</code>):
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li><strong>Ephemeral In-Memory Rate Limiting</strong>: To defend against volumetric DDoS attacks and crawler flooding, our server maintains an in-memory sliding window tracking IP addresses. This counter is stored in volatile RAM and is completely evicted every 60 seconds.</li>
                <li><strong>Zero Media Payload Logging</strong>: Requests to <code>/api/mcp</code> are never saved to disk, and file bytes or media parameters are never logged.</li>
                <li><strong>Infrastructure Telemetry</strong>: Our hosting provider (Vercel) may collect standard aggregate server logs (HTTP response code, user agent string, request timestamp, approximate country of origin) solely for system health and DDoS mitigation.</li>
              </ul>
            </section>

            {/* 4. AI AGENT & MACHINE LEARNING GUARANTEES */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [4. NO AI TRAINING &amp; MODEL ISOLATION]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                Unlike cloud multimedia APIs that use uploaded user media to train artificial intelligence models:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li>We <strong>NEVER</strong> use your photos, videos, audio recordings, or metadata to train machine learning models.</li>
                <li>We <strong>NEVER</strong> share, sell, or transmit your media data to OpenAI, Anthropic, Google, Meta, or any AI research lab.</li>
                <li>When AI agents connect via MCP, PhotoNow functions purely as an execution tool on the client side, maintaining end-to-end data confidentiality.</li>
              </ul>
            </section>

            {/* 5. NO TRACKING, COOKIES, OR ADS */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [5. ZERO TRACKING COOKIES &amp; NO ADVERTISING]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                PhotoNow respects developer and creator privacy:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li>We do <strong>NOT</strong> set third-party marketing cookies, tracking beacons, or cross-site fingerprinting scripts.</li>
                <li>We do <strong>NOT</strong> sell, broker, or monetize user data under any circumstances.</li>
                <li>We do <strong>NOT</strong> integrate advertising networks or third-party behavioral trackers.</li>
              </ul>
            </section>

            {/* 6. REGULATORY COMPLIANCE */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [6. GLOBAL COMPLIANCE: GDPR, CCPA/CPRA, CalOPPA &amp; COPPA]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                Because PhotoNow is built with a zero-cloud architecture and does not harvest, store, or process Personally Identifiable Information (PII) on remote servers:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li><strong>GDPR &amp; UK-GDPR</strong>: Rights to access, rectification, and erasure are naturally fulfilled by the user directly within their browser storage. No cross-border personal data transfers occur.</li>
                <li><strong>CCPA / CPRA</strong>: We do not &ldquo;sell&rdquo; or &ldquo;share&rdquo; personal consumer information as defined by California law.</li>
                <li><strong>COPPA (Children&apos;s Online Privacy)</strong>: PhotoNow is designed for software developers, engineers, and creators. We do not knowingly collect personal information from children under the age of 13 or 16.</li>
              </ul>
            </section>

            {/* 7. DATA SECURITY & ENCRYPTION */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [7. DATA SECURITY &amp; MEMORY HYGIENE]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                All web transmissions utilize strict Transport Layer Security (TLS/HTTPS). In the browser and Node.js MCP runtime, image canvases, video buffers, and audio contexts are garbage-collected and deallocated from RAM immediately following conversion completion.
              </p>
            </section>

            {/* 8. CONTACT */}
            <section style={{ borderTop: '1.5px solid var(--ink)', paddingTop: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [8. PRIVACY INQUIRIES &amp; DPO CONTACT]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                For questions regarding this Privacy Policy or our architectural zero-cloud security model, please contact:
                <br />
                <strong>Primary Privacy Contact:</strong> Sibasish Chakraborti
                <br />
                <strong>Email:</strong> <a href="mailto:sibasishchakraborti@gmail.com" style={{ color: 'var(--ink)', fontWeight: 700 }}>sibasishchakraborti@gmail.com</a>
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
          PHOTONOW PRIVACY POLICY • 100% IN-BROWSER &amp; OFFLINE GUARANTEE • ZERO CLOUD STORAGE
        </span>
      </footer>
    </div>
  );
}
