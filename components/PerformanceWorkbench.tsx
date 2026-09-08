'use client';

import React, { useState, useEffect } from 'react';

export const PerformanceWorkbench: React.FC = () => {
  const [subTab, setSubTab] = useState<'analyze' | 'graph' | 'budget' | 'mission' | 'test' | 'plan' | 'verify'>('analyze');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isHosted, setIsHosted] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsHosted(!['localhost', '127.0.0.1'].includes(window.location.hostname));
    }
  }, []);

  // Target paths & URLs
  const [projectPath, setProjectPath] = useState<string>('.');
  const [websiteUrl, setWebsiteUrl] = useState<string>('http://localhost:3000');
  const [overwriteSource, setOverwriteSource] = useState<boolean>(false);

  const getCleanPath = () => (projectPath || '.').replace(/^["']|["']$/g, '').trim();

  // Results state
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [planResult, setPlanResult] = useState<any>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [graphSummary, setGraphSummary] = useState<any>(null);
  const [unusedAssets, setUnusedAssets] = useState<any[]>([]);
  const [sharedAssets, setSharedAssets] = useState<any[]>([]);
  const [budgetResult, setBudgetResult] = useState<any>(null);
  const [missionResult, setMissionResult] = useState<any>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setErrorMessage('');
    setStatusMessage('Scanning media assets, computing perceptual hashes, and evaluating score...');
    try {
      const cleanPath = getCleanPath();
      if (isHosted && /^[a-zA-Z]:[\\/]/.test(cleanPath)) {
        throw new Error(`Cloud server cannot access local drive "${cleanPath}". You are currently on the hosted cloud preview (Vercel). Please run PhotoNow locally via 'npm run dev' and visit http://localhost:3000 to scan local drives, or click [Demo Fixture] / [Root: .] to test the cloud preview!`);
      }
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', targetPath: cleanPath }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to analyze project');
      setAnalysisResult(data.result);
      setStatusMessage(`Analysis complete! Identified ${data.result.issues?.length || 0} optimization opportunities.`);
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  const runLoadGraph = async () => {
    setLoading(true);
    setErrorMessage('');
    setStatusMessage('Scanning source code references and building Asset Dependency Graph...');
    try {
      const cleanPath = getCleanPath();
      if (isHosted && /^[a-zA-Z]:[\\/]/.test(cleanPath)) {
        throw new Error(`Cloud server cannot access local drive "${cleanPath}". On Vercel, please click [Demo Fixture] or run locally on http://localhost:3000.`);
      }
      const [resGraph, resUnused, resShared] = await Promise.all([
        fetch('/api/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'graph', targetPath: cleanPath }),
        }).then((r) => r.json()),
        fetch('/api/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'unused', targetPath: cleanPath }),
        }).then((r) => r.json()),
        fetch('/api/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'shared', targetPath: cleanPath }),
        }).then((r) => r.json()),
      ]);

      if (resGraph.success) setGraphSummary(resGraph.graph?.summary);
      if (resUnused.success) setUnusedAssets(resUnused.unused || []);
      if (resShared.success) setSharedAssets(resShared.shared || []);

      setStatusMessage(`Asset graph compiled: ${resUnused.unused?.length || 0} potentially unused, ${resShared.shared?.length || 0} shared assets.`);
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  const runCheckBudget = async () => {
    setLoading(true);
    setErrorMessage('');
    setStatusMessage('Evaluating project against performance budgets...');
    try {
      const cleanPath = getCleanPath();
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'budget', targetPath: cleanPath, targetUrl: websiteUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to check budget');
      setBudgetResult(data.evaluation);
      setStatusMessage(`Performance budget evaluated: ${data.evaluation.status} (${data.evaluation.passedCount} passed, ${data.evaluation.failedCount} failed).`);
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  const runWebsiteTest = async () => {
    setLoading(true);
    setErrorMessage('');
    setStatusMessage(`Auditing performance metrics for ${websiteUrl}...`);
    try {
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', url: websiteUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to test website');
      setTestResult(data.result);
      setStatusMessage(`Website audit complete! Score: ${data.result.score?.overall || 0}/100.`);
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  const runGeneratePlan = async () => {
    setLoading(true);
    setErrorMessage('');
    setStatusMessage('Formulating non-destructive optimization plan...');
    try {
      const cleanPath = getCleanPath();
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'plan', targetPath: cleanPath }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to generate plan');
      setPlanResult(data.plan);
      setSubTab('plan');
      setStatusMessage(`Generated Plan [${data.plan.planId}] with ${data.plan.actionsCount} actions.`);
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  const runExecutePlan = async () => {
    if (!planResult) return;
    setLoading(true);
    setErrorMessage('');
    setStatusMessage(`Executing optimizations via Sharp engine (Safe mode: ${overwriteSource ? 'Backup + Overwrite' : 'Destination folder'})...`);
    try {
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize',
          planId: planResult.planId,
          overwriteSource,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to execute plan');
      setExecutionResult(data.execution);
      setStatusMessage(`Optimizations executed! Saved ${data.execution.actualSavedFormatted} (${data.execution.actualReductionPercent} reduction).`);
      await runVerifyPlan();
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  const runVerifyPlan = async () => {
    setLoading(true);
    setErrorMessage('');
    setStatusMessage('Re-auditing media assets to verify exact byte savings and generate report...');
    try {
      const cleanPath = getCleanPath();
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          planId: planResult?.planId,
          targetPath: cleanPath,
          generateReport: true,
          reportFormat: 'html',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to verify optimization');
      setVerificationResult(data.verification);
      setSubTab('verify');
      setStatusMessage('Verification complete! Report generated locally.');
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  const runAutonomousMission = async (dryRun: boolean = false) => {
    setLoading(true);
    setErrorMessage('');
    setStatusMessage(`Running autonomous optimization mission (dryRun=${dryRun})...`);
    try {
      const cleanPath = getCleanPath();
      if (isHosted && /^[a-zA-Z]:[\\/]/.test(cleanPath)) {
        throw new Error(`Cloud server cannot access local drive "${cleanPath}". On Vercel, please click [Demo Fixture] or run locally on http://localhost:3000.`);
      }
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mission',
          targetPath: cleanPath,
          dryRun,
          mode: overwriteSource ? 'aggressive' : 'safe',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to execute autonomous mission');
      setMissionResult(data.result);
      setStatusMessage(`Autonomous mission complete! Status: ${data.result.status}, reduction: ${data.result.assetReductionPercent}.`);
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  const currentScore = analysisResult?.score?.overall ?? testResult?.score?.overall;
  const scoreBreakdown = analysisResult?.score?.breakdown ?? testResult?.score?.breakdown;

  return (
    <div className="hand-box" style={{ padding: 'clamp(12px, 2vw, 20px)', maxWidth: '940px', margin: '0 auto' }}>
      {/* COMPACT CLEAN HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: 'var(--ink)', color: 'var(--ink-inverted)', padding: '2px 6px', fontSize: '10px', fontWeight: 700 }}>
            {isHosted ? 'CLOUD PREVIEW' : 'LOCAL ENGINE'}
          </span>
          <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Website Performance Intelligence
          </h2>
        </div>

        {currentScore !== undefined && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            border: '1.5px solid var(--ink)',
            padding: '3px 10px',
            background: 'var(--bg-paper)',
          }}>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#666' }}>Score:</span>
            <span style={{ fontSize: '16px', fontWeight: 900 }}>{currentScore}</span>
            <span style={{ fontSize: '10px', color: '#888' }}>/100</span>
          </div>
        )}
      </div>

      {/* SLEEK SUB-TABS STRIP */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', borderBottom: '1.5px solid var(--ink)', paddingBottom: '8px', marginBottom: '10px' }}>
        <button
          onClick={() => setSubTab('analyze')}
          className={`hand-btn ${subTab === 'analyze' ? 'active' : ''}`}
          style={{ padding: '5px 10px', fontSize: '11px' }}
        >
          [Audit]
        </button>
        <button
          onClick={() => { setSubTab('graph'); runLoadGraph(); }}
          className={`hand-btn ${subTab === 'graph' ? 'active' : ''}`}
          style={{ padding: '5px 10px', fontSize: '11px' }}
        >
          [Graph & Unused]
        </button>
        <button
          onClick={() => { setSubTab('budget'); runCheckBudget(); }}
          className={`hand-btn ${subTab === 'budget' ? 'active' : ''}`}
          style={{ padding: '5px 10px', fontSize: '11px' }}
        >
          [Budgets]
        </button>
        <button
          onClick={() => setSubTab('test')}
          className={`hand-btn ${subTab === 'test' ? 'active' : ''}`}
          style={{ padding: '5px 10px', fontSize: '11px' }}
        >
          [Test URL]
        </button>
        <button
          onClick={() => { setSubTab('plan'); if (!planResult) runGeneratePlan(); }}
          className={`hand-btn ${subTab === 'plan' ? 'active' : ''}`}
          style={{ padding: '5px 10px', fontSize: '11px' }}
        >
          [Plan {planResult ? `(${planResult.actionsCount})` : ''}]
        </button>
        <button
          onClick={() => { setSubTab('verify'); if (!verificationResult) runVerifyPlan(); }}
          className={`hand-btn ${subTab === 'verify' ? 'active' : ''}`}
          style={{ padding: '5px 10px', fontSize: '11px' }}
        >
          [Results]
        </button>
        <button
          onClick={() => setSubTab('mission')}
          className={`hand-btn ${subTab === 'mission' ? 'active' : ''}`}
          style={{ padding: '5px 10px', fontSize: '11px', background: subTab === 'mission' ? 'var(--ink)' : '#fef3c7' }}
        >
          [⚡ Full Mission]
        </button>
      </div>

      {/* FORK & RUN LOCALLY DISCLAIMER */}
      <div style={{
        background: '#fef3c7',
        border: '1.5px solid #d97706',
        padding: '7px 12px',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '11px',
        lineHeight: 1.4,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>💡</span>
          <span>
            <strong>Disclaimer:</strong> To audit your own projects and run optimization missions on your local files, <strong>fork the repo and run it locally</strong> (<code>npm run dev</code> at <code>http://localhost:3000</code>).
          </span>
        </div>
        <a
          href="https://github.com/Sibasish2005/PhotoNowEngine"
          target="_blank"
          rel="noopener noreferrer"
          className="hand-btn"
          style={{
            padding: '2px 8px',
            fontSize: '10px',
            background: '#fff',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 700,
          }}
        >
          <span>⭐ Fork on GitHub ➔</span>
        </a>
      </div>

      {/* STATUS & ERROR ALERTS */}
      {statusMessage && (
        <div style={{ background: '#f4f4f5', borderLeft: '3px solid var(--ink)', padding: '5px 10px', fontSize: '11px', marginBottom: '10px', fontFamily: 'monospace', color: '#4b5563' }}>
          &bull; {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div style={{ background: '#fee2e2', borderLeft: '3px solid #dc2626', color: '#991b1b', padding: '6px 10px', fontSize: '11px', marginBottom: '10px' }}>
          &times; {errorMessage}
        </div>
      )}

      {/* COMPACT TARGET DIRECTORY BAR */}
      {subTab !== 'test' && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px', background: '#f8fafc', border: '1px solid var(--ink)', padding: '6px 10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700 }}>Target:</span>
          <input
            type="text"
            value={projectPath}
            onChange={(e) => setProjectPath(e.target.value.replace(/^["']|["']$/g, ''))}
            placeholder="e.g. . or tests/fixtures/nextjs_project or C:\path\to\app"
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '5px 8px',
              border: '1px solid var(--ink)',
              fontFamily: 'monospace',
              fontSize: '11px',
              background: 'var(--bg-paper)',
            }}
          />
          <button
            type="button"
            onClick={() => setProjectPath('tests/fixtures/nextjs_project')}
            className="hand-btn"
            style={{ padding: '3px 8px', fontSize: '10px', background: '#fef3c7' }}
            title="Load bundled demo project"
          >
            [Demo]
          </button>
          <button
            type="button"
            onClick={() => setProjectPath('.')}
            className="hand-btn"
            style={{ padding: '3px 8px', fontSize: '10px' }}
            title="Current root directory"
          >
            [Root]
          </button>
        </div>
      )}

      {/* 1. ANALYZE PROJECT VIEW */}
      {subTab === 'analyze' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="hand-btn active"
              style={{ padding: '8px 20px', fontSize: '12px', fontWeight: 700, background: 'var(--ink)', color: '#fff' }}
            >
              {loading ? '[ANALYZING DIRECTORY...]' : '[RUN MEDIA AUDIT NOW ➔]'}
            </button>
          </div>

          {analysisResult && (
            <div>
              {/* METRICS ROW */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                <div style={{ border: '1px solid var(--ink)', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Total Media</div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{analysisResult.totalSizeFormatted}</div>
                  <div style={{ fontSize: '10px', color: '#888' }}>{analysisResult.totalAssets} assets</div>
                </div>

                <div style={{ border: '1px solid var(--ink)', padding: '10px', textAlign: 'center', background: '#ecfdf5' }}>
                  <div style={{ fontSize: '10px', color: '#065f46', textTransform: 'uppercase' }}>Potential Savings</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#047857' }}>{analysisResult.potentialSavingsFormatted}</div>
                  <div style={{ fontSize: '10px', color: '#065f46' }}>bandwidth reduction</div>
                </div>

                <div style={{ border: '1px solid var(--ink)', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Bottlenecks</div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{analysisResult.issues?.length || 0}</div>
                  <div style={{ fontSize: '10px', color: '#888' }}>{analysisResult.duplicateGroups?.length || 0} duplicate groups</div>
                </div>

                <div style={{ border: '1px solid var(--ink)', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Framework</div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{analysisResult.framework || 'Web'}</div>
                </div>
              </div>

              {/* 5-AXIS SCORE BREAKDOWN */}
              {scoreBreakdown && (
                <div style={{ border: '1.5px solid var(--ink)', padding: '12px', marginBottom: '16px', background: '#fafafa' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>
                    PhotoNow Performance Score Breakdown
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', fontSize: '11px' }}>
                    <div>Format: <b>{scoreBreakdown.formatEfficiency}/25</b></div>
                    <div>Sizing: <b>{scoreBreakdown.imageSizing}/25</b></div>
                    <div>Compression: <b>{scoreBreakdown.compression}/20</b></div>
                    <div>Responsive: <b>{scoreBreakdown.responsiveReadiness}/15</b></div>
                    <div>SVG: <b>{scoreBreakdown.svgEfficiency}/15</b></div>
                  </div>
                </div>
              )}

              {/* ACTION TRIGGER */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  onClick={runGeneratePlan}
                  disabled={loading}
                  className="hand-btn active"
                  style={{ padding: '8px 18px', fontSize: '12px', fontWeight: 700 }}
                >
                  {loading ? '[PREPARING PLAN...]' : '[GENERATE OPTIMIZATION PLAN]'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. ASSET GRAPH & UNUSED ASSETS VIEW */}
      {subTab === 'graph' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>Asset Dependency Graph & Unused Asset Triage</span>
            <button onClick={runLoadGraph} disabled={loading} className="hand-btn" style={{ padding: '4px 12px', fontSize: '11px' }}>
              [RE-SCAN GRAPH]
            </button>
          </div>

          {graphSummary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '16px' }}>
              <div style={{ border: '1px solid var(--ink)', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#666' }}>Routes</div>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>{graphSummary.routesCount}</div>
              </div>
              <div style={{ border: '1px solid var(--ink)', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#666' }}>Components</div>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>{graphSummary.componentsCount}</div>
              </div>
              <div style={{ border: '1px solid var(--ink)', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#666' }}>Referenced Assets</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#047857' }}>{graphSummary.referencedAssetsCount}</div>
              </div>
              <div style={{ border: '1px solid var(--ink)', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#666' }}>Unreferenced Assets</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#b91c1c' }}>{graphSummary.unreferencedAssetsCount}</div>
              </div>
            </div>
          )}

          {/* UNUSED ASSETS */}
          <div style={{ border: '1.5px solid var(--ink)', padding: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
              Potentially Unused Assets ({unusedAssets.length})
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '11px' }}>
              {unusedAssets.length === 0 ? (
                <div style={{ color: '#666' }}>No unreferenced assets found.</div>
              ) : (
                unusedAssets.map((u, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #ddd' }}>
                    <span>
                      <b>{u.relativePath}</b> ({u.sizeFormatted})
                    </span>
                    <span style={{
                      padding: '1px 6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      background: u.confidence === 'SAFE' ? '#bbf7d0' : (u.confidence === 'LIKELY' ? '#fef08a' : '#fed7aa'),
                    }}>
                      [{u.confidence}]
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SHARED ASSETS */}
          <div style={{ border: '1.5px solid var(--ink)', padding: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
              Shared Assets Across Routes ({sharedAssets.length})
            </div>
            <div style={{ maxHeight: '180px', overflowY: 'auto', fontSize: '11px' }}>
              {sharedAssets.map((s, idx) => (
                <div key={idx} style={{ padding: '6px 0', borderBottom: '1px dashed #ddd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><b>{s.relativePath}</b> ({s.sizeFormatted})</span>
                    <span style={{ fontWeight: 700, color: s.riskLevel === 'HIGH' ? '#dc2626' : '#d97706' }}>
                      Risk: {s.riskLevel}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#666' }}>
                    Used by routes: {s.routes?.join(', ') || 'shared'} ({s.referenceCount} total refs)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. PERFORMANCE BUDGETS VIEW */}
      {subTab === 'budget' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>Performance Budget Guard</span>
            <button onClick={runCheckBudget} disabled={loading} className="hand-btn" style={{ padding: '4px 12px', fontSize: '11px' }}>
              [EVALUATE BUDGET]
            </button>
          </div>

          {budgetResult && (
            <div>
              <div style={{
                border: '2px solid var(--ink)',
                padding: '14px',
                marginBottom: '16px',
                background: budgetResult.status === 'PASS' ? '#ecfdf5' : (budgetResult.status === 'WARN' ? '#fffbeb' : '#fef2f2'),
              }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 700 }}>Overall Budget Status</div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: budgetResult.status === 'PASS' ? '#047857' : (budgetResult.status === 'WARN' ? '#b45309' : '#b91c1c') }}>
                  {budgetResult.status}
                </div>
                <div style={{ fontSize: '12px' }}>
                  {budgetResult.passedCount} rules passed &bull; {budgetResult.failedCount} failed &bull; {budgetResult.warningCount} warnings
                </div>
              </div>

              <div style={{ border: '1px solid var(--ink)', padding: '10px' }}>
                {budgetResult.checks?.map((c: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #ddd', fontSize: '11px' }}>
                    <span>{c.rule}</span>
                    <span>
                      Actual: <b>{c.actualFormatted}</b> / Limit: {c.limitFormatted}
                      <span style={{ marginLeft: '8px', fontWeight: 700, color: c.passed ? '#047857' : '#dc2626' }}>
                        [{c.passed ? 'PASS' : 'FAIL'}]
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TEST LIVE URL VIEW */}
      {subTab === 'test' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700 }}>Live Website URL:</label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="e.g. http://localhost:3000"
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '6px 10px',
                border: '1.5px solid var(--ink)',
                fontFamily: 'monospace',
                fontSize: '12px',
                background: 'var(--bg-paper)',
              }}
            />
            <button
              onClick={runWebsiteTest}
              disabled={loading}
              className="hand-btn"
              style={{ padding: '6px 16px', fontSize: '12px', fontWeight: 700 }}
            >
              {loading ? '[AUDITING...]' : '[AUDIT URL]'}
            </button>
          </div>

          {testResult && (
            <div style={{ border: '1.5px solid var(--ink)', padding: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                Website Audit: {testResult.score?.overall}/100
              </div>
              <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                Estimated 4G Transfer: <b>{testResult.metrics?.estimatedTransferTime4GMs}ms</b>
              </div>
              {testResult.metrics?.lcpCandidate && (
                <div style={{ background: '#fef3c7', padding: '8px', fontSize: '11px', border: '1px solid #d97706' }}>
                  <b>LCP Candidate:</b> {testResult.metrics.lcpCandidate.pathOrUrl} ({testResult.metrics.lcpCandidate.sizeFormatted})
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. PLAN VIEW */}
      {subTab === 'plan' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>Optimization Plan Formulator</span>
            <button
              onClick={runGeneratePlan}
              disabled={loading}
              className="hand-btn"
              style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 700 }}
            >
              {loading ? '[FORMULATING PLAN...]' : '[⚡ FORMULATE / REFRESH PLAN]'}
            </button>
          </div>

          {!planResult && !loading && (
            <div style={{ border: '1.5px dashed var(--ink)', padding: '28px', textAlign: 'center', background: '#fafafa', borderRadius: '2px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '6px' }}>
                No Optimization Plan Formulated Yet
              </div>
              <p style={{ fontSize: '12px', color: '#666', margin: '0 0 16px 0' }}>
                Formulate a non-destructive optimization plan analyzing images in <code>{projectPath}</code>.
              </p>
              <button
                onClick={runGeneratePlan}
                disabled={loading}
                className="hand-btn active"
                style={{ padding: '8px 22px', fontSize: '12px', fontWeight: 800, background: 'var(--ink)', color: '#fff' }}
              >
                [⚡ GENERATE OPTIMIZATION PLAN NOW ➔]
              </button>
            </div>
          )}

          {planResult && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>Optimization Plan: {planResult.planId}</span>
                  <div style={{ fontSize: '11px', color: '#666' }}>{planResult.actionsCount} actions formulated</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#047857', fontWeight: 700 }}>
                    Estimated Reduction: {planResult.estimatedReductionPercent} ({planResult.estimatedSavedFormatted})
                  </div>
                </div>
              </div>

              {/* ACTIONS LIST */}
              <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--ink)', padding: '8px', marginBottom: '14px' }}>
                {planResult.actions?.map((act: any, idx: number) => (
                  <div key={idx} style={{ padding: '6px 0', borderBottom: '1px dashed #ccc', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700 }}>
                        [{act.impact?.toUpperCase()}] {act.inputPath?.split(/[/\\]/).pop()} &rarr; {act.outputPath?.split(/[/\\]/).pop()}
                      </span>
                      <span style={{ color: '#047857', fontWeight: 700 }}>+{act.estimatedSavingsFormatted}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* EXECUTION OPTIONS */}
              <div style={{ border: '1px solid var(--ink)', padding: '12px', background: '#fafafa', marginBottom: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={overwriteSource}
                    onChange={(e) => setOverwriteSource(e.target.checked)}
                  />
                  <span>
                    <b>Authorize source file overwrite</b> (Creates automated backup in <code>.photonow/backups/</code> first)
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={runExecutePlan}
                  disabled={loading}
                  className="hand-btn active"
                  style={{ padding: '8px 20px', fontSize: '12px', fontWeight: 700 }}
                >
                  {loading ? '[EXECUTING...]' : '[APPLY OPTIMIZATIONS NOW]'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. BEFORE/AFTER VERIFY VIEW */}
      {subTab === 'verify' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>Verification & Local Reporting</span>
            <button
              onClick={runVerifyPlan}
              disabled={loading}
              className="hand-btn"
              style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 700 }}
            >
              {loading ? '[VERIFYING...]' : '[⚡ RE-VERIFY & GENERATE REPORT]'}
            </button>
          </div>

          {!verificationResult && !loading && (
            <div style={{ border: '1.5px dashed var(--ink)', padding: '28px', textAlign: 'center', background: '#fafafa', borderRadius: '2px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '6px' }}>
                No Verification Executed Yet
              </div>
              <p style={{ fontSize: '12px', color: '#666', margin: '0 0 16px 0' }}>
                Measure exact byte reductions across optimized assets in <code>{projectPath}</code> and produce local HTML/Markdown audit reports.
              </p>
              <button
                onClick={runVerifyPlan}
                disabled={loading}
                className="hand-btn active"
                style={{ padding: '8px 22px', fontSize: '12px', fontWeight: 800, background: 'var(--ink)', color: '#fff' }}
              >
                [⚡ RUN VERIFICATION AUDIT NOW ➔]
              </button>
            </div>
          )}

          {verificationResult && (
            <div>
              <div style={{ border: '2px solid var(--ink)', padding: '16px', marginBottom: '16px', background: '#ecfdf5' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 700, color: '#065f46' }}>
                  Verified Performance Gain
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#047857', margin: '4px 0' }}>
                  -{verificationResult.reductionPercent} Bandwidth
                </div>
                <div style={{ fontSize: '13px', color: '#065f46' }}>
                  Saved <b>{verificationResult.savedFormatted}</b> across optimized media.
                </div>
              </div>

              <div style={{ border: '1px solid var(--ink)', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>Measured Improvements</div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px' }}>
                  {verificationResult.measuredImprovements?.map((imp: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{imp}</li>
                  ))}
                </ul>
              </div>

              {verificationResult.reportSavedPath && (
                <div style={{ fontSize: '11px', background: '#f8fafc', padding: '10px 12px', border: '1px solid #cbd5e1', marginBottom: '10px' }}>
                  📄 <b>Local HTML Report Generated:</b> <code style={{ color: '#0369a1', wordBreak: 'break-all' }}>{verificationResult.reportSavedPath}</code>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 7. AUTONOMOUS AGENT MISSION VIEW */}
      {subTab === 'mission' && (
        <div>
          <div style={{ border: '2px solid var(--ink)', padding: '14px', marginBottom: '16px', background: '#fef3c7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800 }}>⚡ Autonomous Performance Mission</div>
              <span style={{ fontSize: '10px', background: '#fef08a', color: '#854d0e', padding: '2px 6px', fontWeight: 700, borderRadius: '2px' }}>
                LOCAL ONLY 💻
              </span>
            </div>

            <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#78350f' }}>
              1-Click Full Pipeline: Discovers media, optimizes formats (AVIF/WebP), measures byte savings, and verifies integrity.
            </p>

            <div style={{ margin: '10px 0' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', background: '#fff', padding: '6px 10px', border: '1px solid #d97706', borderRadius: '2px' }}>
                <input
                  type="checkbox"
                  checked={overwriteSource}
                  onChange={(e) => setOverwriteSource(e.target.checked)}
                />
                <span>
                  <strong>In-Place Mode:</strong> Backup & replace original images in project folder (Default unchecked: Safe Mode outputs to <code>.photonow/optimized/</code>).
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => runAutonomousMission(true)}
                disabled={loading}
                className="hand-btn"
                style={{ padding: '7px 14px', fontSize: '11px', fontWeight: 700 }}
              >
                {loading ? '[WORKING...]' : '[DRY-RUN PREVIEW]'}
              </button>
              <button
                onClick={() => runAutonomousMission(false)}
                disabled={loading}
                className="hand-btn active"
                style={{ padding: '7px 18px', fontSize: '11px', fontWeight: 700, background: 'var(--ink)', color: '#fff' }}
              >
                {loading ? '[EXECUTING MISSION...]' : '[EXECUTE FULL MISSION]'}
              </button>
            </div>
          </div>

          {missionResult && (
            <div style={{ border: '1.5px solid var(--ink)', padding: '14px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Mission ID: {missionResult.missionId}</span>
                <span style={{
                  padding: '2px 8px',
                  fontWeight: 700,
                  fontSize: '11px',
                  background: missionResult.status === 'verified' ? '#bbf7d0' : '#fef08a',
                }}>
                  STATUS: {missionResult.status?.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '14px' }}>
                <div style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#666' }}>Execution Mode</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: missionResult.mode === 'aggressive' ? '#dc2626' : '#047857' }}>
                    {missionResult.mode === 'aggressive' ? 'IN-PLACE REPLACED' : 'SAFE (NON-DESTRUCTIVE)'}
                  </div>
                </div>
                <div style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#666' }}>Bandwidth Reduction</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#047857' }}>-{missionResult.assetReductionPercent}</div>
                </div>
                <div style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#666' }}>Net Saved</div>
                  <div style={{ fontSize: '16px', fontWeight: 800 }}>{missionResult.bytesSavedFormatted}</div>
                </div>
                <div style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#666' }}>Project Score</div>
                  <div style={{ fontSize: '12px', fontWeight: 800 }}>
                    {missionResult.mode === 'aggressive'
                      ? `${missionResult.scoreBefore} → ${missionResult.scoreAfter}/100`
                      : `${missionResult.scoreBefore}/100 (Unchanged)`}
                  </div>
                </div>
              </div>

              {missionResult.mode !== 'aggressive' && (
                <div style={{ fontSize: '11px', background: '#f0fdf4', padding: '8px 10px', border: '1px solid #86efac', marginBottom: '10px' }}>
                  💡 <b>Safe Mode Note:</b> Original images in your source folder were preserved. <b>Projected Score if swapped: ~{missionResult.scoreAfter}/100</b>.
                </div>
              )}

              {missionResult.outputDir && (
                <div style={{ fontSize: '11px', background: '#f8fafc', padding: '8px 10px', border: '1px solid #cbd5e1', marginBottom: '8px' }}>
                  📁 <b>Optimized Files Location:</b> <code style={{ color: '#0369a1', wordBreak: 'break-all' }}>{missionResult.outputDir}</code>
                </div>
              )}

              {missionResult.backupDir && (
                <div style={{ fontSize: '11px', background: '#fef3c7', padding: '8px 10px', border: '1px solid #f59e0b', marginBottom: '8px' }}>
                  💾 <b>Safety Backup Saved To:</b> <code style={{ color: '#92400e', wordBreak: 'break-all' }}>{missionResult.backupDir}</code>
                </div>
              )}

              {missionResult.rollbackAvailable && (
                <div style={{ fontSize: '11px', color: '#065f46', background: '#ecfdf5', padding: '8px', border: '1px solid #a7f3d0' }}>
                  &check; Rollback manifest recorded. Operation ID: <code>{missionResult.manifestId}</code>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
