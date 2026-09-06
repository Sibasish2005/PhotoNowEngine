import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | PhotoNow MCP Engine',
  description:
    'PhotoNow is 100% private and offline-first. We do not collect, upload, store, or transmit your photos, videos, or audio to any server.',
  alternates: {
    canonical: 'https://photonow.vercel.app/privacy',
  },
};

export default function PrivacyPage() {
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
          <span style={{ fontWeight: 700, fontSize: '14px' }}>PHOTONOW.PRIVACY</span>
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
              OFFLINE-FIRST PRIVACY POLICY • EFFECTIVE DATE: SEPTEMBER 2026
            </span>
            <h1 className="marker-font" style={{ fontSize: '36px', lineHeight: 1.1 }}>
              PRIVACY POLICY.
            </h1>
            <p style={{ color: 'var(--ink-gray)', marginTop: '8px', fontSize: '12px' }}>
              100% IN-BROWSER EXECUTION. ZERO SERVER UPLOADS. ABSOLUTE DATA OWNERSHIP.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 1. CORE PRIVACY PROMISE */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [1. ZERO CLOUD PROCESSING & ZERO UPLOADS]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                PhotoNow Engine (accessible at <code>https://photonow.vercel.app/</code>) is architected on an <strong>offline-first, client-side computing model</strong>. When you or an automated AI agent process images, transcode videos, or extract audio tracks, <strong>your media files never leave your computer or browser runtime</strong>.
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li>No images, videos, or audio files are ever uploaded to our hosting servers.</li>
                <li>All encoding (WebP, AVIF, PNG, JPEG, WebM, WAV) executes locally via browser Canvas 2D, MediaRecorder, and Web Audio APIs.</li>
                <li>We do not operate backend storage buckets, databases, or content delivery networks that intercept your media.</li>
              </ul>
            </section>

            {/* 2. LOCAL PERSISTENCE */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [2. CLIENT-SIDE LOCAL STORAGE (INDEXEDDB)]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                PhotoNow provides persistent storage using your browser&apos;s native <code>IndexedDB</code> engine (database name: <code>photoConvert_DB</code>).
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li>All converted binary Blobs and conversion logs exist solely within your local browser sandbox.</li>
                <li>We cannot inspect, read, copy, or recover your locally stored items.</li>
                <li>You retain full control to delete individual items or clear your entire database instantly via the <code>[CLEAR STORAGE]</code> button.</li>
              </ul>
            </section>

            {/* 3. SERVER LOGS & RATE LIMITING */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [3. SERVER LOGS & MODEL CONTEXT PROTOCOL (MCP) API]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                When you or an AI agent access the application or dispatch tool calls to the MCP endpoint (<code>/api/mcp</code>):
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li><strong>Ephemeral Rate Limiting</strong>: Our server maintains an in-memory sliding-window counter tracking client IP addresses to defend against denial-of-service (DoS) attacks and crawler abuse. This IP data is held strictly in volatile RAM and is automatically evicted every 60 seconds.</li>
                <li><strong>No User Content in Logs</strong>: Tool calls dispatched to <code>/api/mcp</code> do not transmit your local image or video files to the server.</li>
                <li><strong>Hosting Telemetry</strong>: Standard web hosting infrastructure (Vercel) may log anonymous HTTP request metadata (HTTP status, timestamp, rough country origin) for basic uptime monitoring.</li>
              </ul>
            </section>

            {/* 4. TRACKING, COOKIES & ADS */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [4. NO COOKIES, NO TRACKERS, NO ADVERTISING]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                We believe utility tools should be free from surveillance:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li>We do NOT use tracking cookies, advertising beacons, or fingerprinting scripts.</li>
                <li>We do NOT sell, rent, monetize, or disclose your data to third-party data brokers or advertisers.</li>
                <li>We do NOT use your photos or videos to train machine learning models.</li>
              </ul>
            </section>

            {/* 5. GDPR & CCPA COMPLIANCE */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [5. GDPR & CCPA/CPRA COMPLIANCE]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                Because PhotoNow does not harvest, store, or process personal identifying information (PII) on any server, there is no remote user profile or personal database maintained. By design, privacy compliance is baked into our zero-cloud architecture.
              </p>
            </section>

            {/* 6. CONTACT */}
            <section style={{ borderTop: '1.5px solid var(--ink)', paddingTop: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [6. PRIVACY INQUIRIES]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                For any questions regarding our architectural privacy model or source code, contact:
                <br />
                <strong>Email:</strong> <a href="mailto:sibasishchakraborti@gmail.com" style={{ color: 'var(--ink)', fontWeight: 700 }}>sibasishchakraborti@gmail.com</a>
                <br />
                <strong>Project Repository:</strong> <a href="https://github.com/Sibasish2005/PhotoNowEngine" target="_blank" rel="noreferrer" style={{ color: 'var(--ink)', fontWeight: 700 }}>GitHub / PhotoNowEngine</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: '2px solid var(--ink)', padding: '20px', textAlign: 'center', fontSize: '11px' }}>
        <span>PHOTONOW PRIVACY POLICY • 100% IN-BROWSER GUARANTEE</span>
      </footer>
    </div>
  );
}
