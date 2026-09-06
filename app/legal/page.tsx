import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Trademark & Legal Notice | PhotoNow Multimedia MCP Engine',
  description:
    'Legal disclaimers, trademark independence notice, nominative fair use disclosure, codec licensing notice, and DMCA intellectual property dispute procedure for PhotoNow Engine.',
  alternates: {
    canonical: 'https://photonow.vercel.app/legal',
  },
};

export default function LegalPage() {
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
          <span style={{ fontWeight: 700, fontSize: '14px' }}>PHOTONOW.LEGAL_NOTICE</span>
        </div>

        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <Link href="/privacy" className="hand-btn" style={{ padding: '5px 10px', fontSize: '11px', textDecoration: 'none' }}>
            [PRIVACY POLICY]
          </Link>
          <Link href="/terms" className="hand-btn" style={{ padding: '5px 10px', fontSize: '11px', textDecoration: 'none' }}>
            [TERMS OF USE]
          </Link>
          <Link href="/legal" className="hand-btn" style={{ padding: '5px 10px', fontSize: '11px', textDecoration: 'none', background: 'var(--ink)', color: 'var(--ink-inverted)' }}>
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
              LEGAL NOTICE, TRADEMARK DISCLAIMERS &amp; INTELLECTUAL PROPERTY • REVISED SEPTEMBER 2026
            </span>
            <h1 className="marker-font" style={{ fontSize: '36px', lineHeight: 1.1 }}>
              TRADEMARKS &amp; LEGAL NOTICE.
            </h1>
            <p style={{ color: 'var(--ink-gray)', marginTop: '8px', fontSize: '12px' }}>
              DISCLAIMER OF AFFILIATION, NOMINATIVE FAIR USE, THIRD-PARTY OPEN-SOURCE LICENSES &amp; DMCA PROCEDURE.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            {/* 1. BRAND INDEPENDENCE & DISCLAIMER OF AFFILIATION */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [1. INDEPENDENT PROJECT &amp; DISCLAIMER OF AFFILIATION]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                <strong>PhotoNow</strong> (also referred to as <em>PhotoNow Engine</em> or <em>PhotoNow MCP Engine</em>, accessible via <code>https://photonow.vercel.app/</code>) is an independent, open-source software workbench and Model Context Protocol (MCP) server engineered by Sibasish Chakraborti.
              </p>
              <div style={{
                background: 'var(--paper-tint)',
                border: '1.5px solid var(--ink)',
                padding: '14px',
                marginTop: '10px',
                fontSize: '12px',
              }}>
                <strong>EXPRESS DISCLAIMER OF COMMERCIAL AFFILIATION:</strong>
                <br />
                PhotoNow Engine is <strong>NOT</strong> affiliated, associated, authorized, endorsed by, sponsored by, or in any way officially connected with any other commercial corporation, retail portrait studio, physical automated photo kiosk, passport photo booth franchise, printing bureau, or corporate entity that may operate or hold registered trademarks for names resembling &ldquo;PhotoNow&rdquo;, &ldquo;Photo-Now&rdquo;, or &ldquo;Photo Now&rdquo; in any domestic or international jurisdiction.
              </div>
              <p style={{ color: 'var(--ink-gray)', marginTop: '10px' }}>
                The name &ldquo;PhotoNow&rdquo; is utilized descriptively and functionally within the computer software domain to denote immediate, real-time, zero-queue, offline-first client-side multimedia processing (images, video transcoding, and audio extraction) without server round-trips or cloud intermediaries.
              </p>
            </section>

            {/* 2. THIRD-PARTY TRADEMARKS & NOMINATIVE FAIR USE */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [2. THIRD-PARTY TRADEMARK NOTICES (NOMINATIVE FAIR USE)]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                This software, its documentation, and its tool schemas reference third-party software products, AI platforms, protocols, and company names strictly for the nominative fair use purpose of indicating technical interoperability and compatibility:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li><strong>Model Context Protocol (MCP)</strong>: Refers to the open protocol initiated by Anthropic for connecting AI models to external tools and execution contexts.</li>
                <li><strong>Claude &amp; Anthropic</strong>: Are trademarks or registered trademarks of Anthropic, PBC.</li>
                <li><strong>Google, Antigravity &amp; Gemini</strong>: Are trademarks or registered trademarks of Google LLC / Alphabet Inc.</li>
                <li><strong>Cursor</strong>: Is a trademark of Anysphere, Inc.</li>
                <li><strong>FFmpeg &amp; FFprobe</strong>: Are trademarks of Fabrice Bellard and the FFmpeg project development team.</li>
                <li><strong>Sharp &amp; libvips</strong>: Are trademarks or copyright holdings of Lovell Fuller and the libvips community.</li>
                <li><strong>Next.js &amp; Vercel</strong>: Are registered trademarks of Vercel Inc.</li>
                <li><strong>Apple, Safari &amp; iOS</strong>: Are registered trademarks of Apple Inc.</li>
                <li><strong>Format Standards (WebP, WebM, AVIF, MP4, MP3, AAC, FLAC)</strong>: Are technical specifications and container formats developed and maintained by Google, the Alliance for Open Media (AOMedia), MPEG, Fraunhofer IIS, Xiph.Org Foundation, and respective industry working groups.</li>
              </ul>
              <p style={{ color: 'var(--ink-gray)', marginTop: '8px' }}>
                All referenced trademarks, registered trademarks, service marks, and brand names are the intellectual property of their respective owners. Mention on this site or in our MCP schemas does not imply endorsement, affiliation, sponsorship, or certification by any trademark holder.
              </p>
            </section>

            {/* 3. OPEN SOURCE LICENSING & MULTIMEDIA CODECS */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [3. OPEN-SOURCE CODEBASE, COPYRIGHT &amp; CODECS]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                The PhotoNow core application codebase is open-source software distributed under the permissive <strong>MIT License</strong>. The hand-drawn aesthetic monochrome UI components, Sobel convolution ink shaders, and technical documentation are copyright &copy; 2026 Sibasish Chakraborti / PhotoNow Engineering.
              </p>
              <div style={{
                background: 'var(--paper-tint)',
                border: '1.5px solid var(--ink)',
                padding: '14px',
                marginTop: '10px',
                fontSize: '12px',
              }}>
                <strong>THIRD-PARTY SOFTWARE &amp; CODEC ACKNOWLEDGEMENT:</strong>
                <ul style={{ paddingLeft: '18px', marginTop: '6px' }}>
                  <li><strong>Bundled FFmpeg Binaries</strong>: Distributed via <code>@ffmpeg-installer/ffmpeg</code> and <code>@ffprobe-installer/ffprobe</code> under the GNU LGPL v2.1+ / GPL v3.0 licenses. PhotoNow does not distribute modified binary forks.</li>
                  <li><strong>Sharp &amp; libvips</strong>: Distributed under Apache License 2.0 and LGPL v3.0+.</li>
                  <li><strong>Client-Side Codec Execution</strong>: All multimedia encoding and decoding takes place strictly on the end-user&apos;s local hardware device or inside their browser sandbox. PhotoNow does not operate hosted streaming services or commercial broadcast transcoding servers.</li>
                </ul>
              </div>
            </section>

            {/* 4. DMCA & INTELLECTUAL PROPERTY TAKEDOWN POLICY */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [4. DMCA COPYRIGHT &amp; INTELLECTUAL PROPERTY TAKEDOWN POLICY]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                PhotoNow Engineering respects all valid intellectual property rights. In accordance with the Digital Millennium Copyright Act (17 U.S.C. &sect; 512) and applicable international copyright treaties, we will respond promptly to verified notices of alleged infringement.
              </p>
              <div style={{
                border: '1.5px dashed var(--ink)',
                padding: '16px',
                marginTop: '10px',
                background: 'var(--bg-paper)',
              }}>
                <span style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  DMCA NOTICE REQUIREMENTS:
                </span>
                <p style={{ color: 'var(--ink-gray)', marginBottom: '8px' }}>
                  To submit a copyright or trademark infringement notice, please furnish our Designated Agent with the following written information:
                </p>
                <ol style={{ paddingLeft: '20px', color: 'var(--ink-gray)' }}>
                  <li>Physical or electronic signature of a person authorized to act on behalf of the copyright or trademark owner.</li>
                  <li>Identification of the copyrighted work or trademark claimed to have been infringed.</li>
                  <li>Identification of the material claimed to be infringing and information reasonably sufficient to allow us to locate it (e.g., exact URL or repository file path).</li>
                  <li>Your full contact information, including physical address, telephone number, and email address.</li>
                  <li>A statement that you have a good-faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
                  <li>A statement made under penalty of perjury that the information in the notification is accurate and that you are authorized to act on behalf of the owner.</li>
                </ol>
              </div>
            </section>

            {/* 5. OFFICIAL LEGAL CONTACT & DISPUTE PROCEDURE */}
            <section style={{ borderTop: '1.5px solid var(--ink)', paddingTop: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [5. OFFICIAL LEGAL CONTACT &amp; AMICABLE RESOLUTION]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                We believe in resolving inquiries cooperatively and in good faith. All legal correspondence, trademark boundary inquiries, and DMCA notices should be directed to:
              </p>
              <div style={{
                background: 'var(--paper-tint)',
                border: '1.5px solid var(--ink)',
                padding: '14px',
                marginTop: '10px',
                fontSize: '12px',
              }}>
                <strong>Designated Legal Representative:</strong> Sibasish Chakraborti
                <br />
                <strong>Email:</strong> <a href="mailto:sibasishchakraborti@gmail.com" style={{ color: 'var(--ink)', fontWeight: 700 }}>sibasishchakraborti@gmail.com</a>
                <br />
                <strong>Official GitHub Repository:</strong> <a href="https://github.com/Sibasish2005/PhotoNowEngine" target="_blank" rel="noreferrer" style={{ color: 'var(--ink)', fontWeight: 700 }}>https://github.com/Sibasish2005/PhotoNowEngine</a>
                <br />
                <strong>Response Window:</strong> We strive to acknowledge and evaluate all verified legal inquiries within 48 to 72 business hours.
              </div>
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
          PHOTONOW MULTIMEDIA MCP ENGINE • INDEPENDENT OPEN-SOURCE WORKBENCH • COPYRIGHT &copy; 2026
        </span>
      </footer>
    </div>
  );
}
