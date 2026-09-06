import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Trademark & Legal Notice | PhotoNow MCP Engine',
  description:
    'Legal disclaimers, trademark independence notice, nominative fair use disclosure, and intellectual property dispute procedure for PhotoNow Engine.',
  alternates: {
    canonical: 'https://photonow.vercel.app/legal',
  },
};

export default function LegalPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-paper)' }}>
      {/* TOP HEADER */}
      <header style={{
        borderBottom: '2px solid var(--ink)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
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
          <span style={{ fontWeight: 700, fontSize: '14px' }}>PHOTONOW.TRADEMARKS</span>
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
        padding: '40px 24px',
        flex: 1,
      }}>
        <div className="hand-box" style={{ padding: '36px 28px', lineHeight: '1.7', fontSize: '13px' }}>
          <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: '16px', marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
              LEGAL NOTICE, TRADEMARK DISCLAIMERS & INTELLECTUAL PROPERTY
            </span>
            <h1 className="marker-font" style={{ fontSize: '36px', lineHeight: 1.1 }}>
              TRADEMARKS & LEGAL NOTICE.
            </h1>
            <p style={{ color: 'var(--ink-gray)', marginTop: '8px', fontSize: '12px' }}>
              DISCLAIMER OF AFFILIATION, NOMINATIVE FAIR USE & IP DISPUTE RESOLUTION.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 1. BRAND INDEPENDENCE & DISCLAIMER OF AFFILIATION */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [1. INDEPENDENT PROJECT & DISCLAIMER OF AFFILIATION]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                <strong>PhotoNow</strong> (also referred to as <em>PhotoNow Engine</em> or <em>PhotoNow MCP Engine</em>, hosted at <code>https://photonow.vercel.app/</code>) is an independent software development project engineered by Sibasish Chakraborti.
              </p>
              <div style={{
                background: 'var(--paper-tint)',
                border: '1.5px solid var(--ink)',
                padding: '14px',
                marginTop: '10px',
                fontSize: '12px',
              }}>
                <strong>EXPRESS DISCLAIMER OF AFFILIATION:</strong>
                <br />
                PhotoNow Engine is <strong>NOT</strong> affiliated, associated, authorized, endorsed by, sponsored by, or in any way officially connected with any other commercial company, enterprise, retail photography studio, physical photo kiosk, passport photo booth, printing franchise, or corporate entity that may operate or hold rights to names resembling &ldquo;PhotoNow&rdquo;, &ldquo;Photo-Now&rdquo;, or &ldquo;Photo Now&rdquo; in any national or international jurisdiction.
              </div>
              <p style={{ color: 'var(--ink-gray)', marginTop: '10px' }}>
                The name &ldquo;PhotoNow&rdquo; is used descriptively and functionally within the computer software domain to denote immediate, real-time, zero-queue, browser-native client media conversion without remote server round-trips.
              </p>
            </section>

            {/* 2. THIRD-PARTY TRADEMARKS & NOMINATIVE FAIR USE */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [2. THIRD-PARTY TRADEMARK NOTICES (NOMINATIVE FAIR USE)]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                This software and its documentation reference third-party software products, AI platforms, protocols, and company names strictly for purposes of technical compatibility, interoperability, and nominative fair use:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--ink-gray)' }}>
                <li><strong>Model Context Protocol (MCP)</strong>: Refers to the open-source specification initiated by Anthropic for connecting AI models to external tools.</li>
                <li><strong>Claude &amp; Anthropic</strong>: Are registered trademarks of Anthropic, PBC.</li>
                <li><strong>Google, Antigravity &amp; Gemini</strong>: Are trademarks or registered trademarks of Google LLC / Alphabet Inc.</li>
                <li><strong>Cursor</strong>: Is a trademark of Anysphere, Inc.</li>
                <li><strong>Next.js &amp; Vercel</strong>: Are registered trademarks of Vercel Inc.</li>
                <li><strong>Apple, Safari &amp; iOS</strong>: Are registered trademarks of Apple Inc.</li>
                <li><strong>WebP &amp; WebM</strong>: Are media format projects maintained by Google and the open-source community.</li>
              </ul>
              <p style={{ color: 'var(--ink-gray)', marginTop: '8px' }}>
                All referenced trademarks, logos, and brand names are the intellectual property of their respective owners. Their mention on this website does not imply endorsement, affiliation, sponsorship, or certification by those respective entities.
              </p>
            </section>

            {/* 3. OPEN SOURCE LICENSING */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [3. OPEN-SOURCE CODEBASE & COPYRIGHT]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                The PhotoNow codebase is distributed under open-source terms. The custom hand-drawn monochrome artwork, Sobel convolution shaders, and architecture documentation are copyright &copy; 2026 Sibasish Chakraborti / PhotoNow Engineering.
              </p>
            </section>

            {/* 4. TRADEMARK & INTELLECTUAL PROPERTY INQUIRY PROCEDURE */}
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [4. INTELLECTUAL PROPERTY & TRADEMARK INQUIRY PROCEDURE]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                PhotoNow Engineering respects all valid intellectual property rights. If you are a trademark owner, copyright holder, or authorized legal representative and have concerns, questions, or objections regarding the project name, trademark boundaries, or content:
              </p>
              <div style={{
                border: '1.5px dashed var(--ink)',
                padding: '16px',
                marginTop: '10px',
                background: 'var(--bg-paper)',
              }}>
                <span style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  STEP-BY-STEP AMICABLE RESOLUTION NOTICE:
                </span>
                <ol style={{ paddingLeft: '20px', color: 'var(--ink-gray)' }}>
                  <li>Provide your full legal name, organization, and contact information.</li>
                  <li>Identify the specific registered trademark, registration number, and relevant jurisdictions/classes.</li>
                  <li>Describe the nature of the inquiry or perceived conflict.</li>
                  <li>Send the notification directly to our legal contact below.</li>
                </ol>
                <p style={{ marginTop: '10px', color: 'var(--ink-gray)' }}>
                  We commit to reviewing all verified good-faith communications promptly and working constructively toward an amicable clarification or technical adjustment.
                </p>
              </div>
            </section>

            {/* 5. LEGAL CONTACT */}
            <section style={{ borderTop: '1.5px solid var(--ink)', paddingTop: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                [5. OFFICIAL LEGAL CONTACT]
              </h2>
              <p style={{ color: 'var(--ink-gray)' }}>
                All trademark notices, legal correspondence, and compliance inquiries should be directed to:
                <br />
                <strong>Primary Legal Contact:</strong> Sibasish Chakraborti
                <br />
                <strong>Email:</strong> <a href="mailto:sibasishchakraborti@gmail.com" style={{ color: 'var(--ink)', fontWeight: 700 }}>sibasishchakraborti@gmail.com</a>
                <br />
                <strong>GitHub Official Repository:</strong> <a href="https://github.com/Sibasish2005/PhotoNowEngine" target="_blank" rel="noreferrer" style={{ color: 'var(--ink)', fontWeight: 700 }}>https://github.com/Sibasish2005/PhotoNowEngine</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: '2px solid var(--ink)', padding: '20px', textAlign: 'center', fontSize: '11px' }}>
        <span>PHOTONOW LEGAL NOTICE &amp; TRADEMARK DISCLAIMERS • INDEPENDENT OPEN WORKBENCH</span>
      </footer>
    </div>
  );
}
