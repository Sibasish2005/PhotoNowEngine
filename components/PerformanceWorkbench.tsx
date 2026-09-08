'use client';

import React, { useState } from 'react';

export const PerformanceWorkbench: React.FC = () => {
  const [subTab, setSubTab] = useState<'analyze' | 'test' | 'plan' | 'verify'>('analyze');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Target paths & URLs
  const [projectPath, setProjectPath] = useState<string>('.');
  const [websiteUrl, setWebsiteUrl] = useState<string>('http://localhost:3000');
  const [overwriteSource, setOverwriteSource] = useState<boolean>(false);

  // Results state
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [planResult, setPlanResult] = useState<any>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setErrorMessage('');
    setStatusMessage('Scanning media assets, computing perceptual hashes, and evaluating score...');
    try {
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', targetPath: projectPath }),
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
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'plan', targetPath: projectPath }),
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
      setStatusMessage(`Optimized ${data.execution.succeeded} assets safely! Saved ${data.execution.actualSavedFormatted} (${data.execution.actualReductionPercent}).`);
      // Auto run verification
      await runVerification(data.execution.planId);
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  const runVerification = async (planId?: string) => {
    setLoading(true);
    setErrorMessage('');
    setStatusMessage('Verifying optimizations, validating outputs, and generating local report...');
    try {
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          planId: planId || planResult?.planId,
          targetPath: projectPath,
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

  const currentScore = analysisResult?.score?.overall ?? testResult?.score?.overall;
  const scoreBreakdown = analysisResult?.score?.breakdown ?? testResult?.score?.breakdown;

  return (
    <div className="hand-box" style={{ padding: 'clamp(14px, 2.5vw, 24px)', maxWidth: '900px', margin: '0 auto' }}>
      {/* HEADER TITLE */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: 'var(--ink)', color: 'var(--ink-inverted)', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
              [ENGINE:PERF]
            </span>
            <h2 style={{ fontSize: '18px', margin: 0, letterSpacing: '-0.5px' }}>
              WEBSITE PERFORMANCE INTELLIGENCE & OPTIMIZATION
            </h2>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-dim, #666)' }}>
            Offline media intelligence layer for AI agents & human developers. Zero cloud, token efficient.
          </p>
        </div>

        {currentScore !== undefined && (
          <div style={{
            border: '2px solid var(--ink)',
            padding: '6px 14px',
            textAlign: 'center',
            background: 'var(--bg-paper)',
          }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>PhotoNow Score</div>
            <div style={{ fontSize: '24px', fontWeight: 900 }}>{currentScore}<span style={{ fontSize: '12px' }}>/100</span></div>
          </div>
        )}
      </div>

      {/* SUB TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '2px solid var(--ink)', paddingBottom: '10px', marginBottom: '16px' }}>
        <button
          onClick={() => setSubTab('analyze')}
          className={`hand-btn ${subTab === 'analyze' ? 'active' : ''}`}
          style={{ padding: '6px 14px', fontSize: '11px' }}
        >
          [1. ANALYZE PROJECT]
        </button>
        <button
          onClick={() => setSubTab('test')}
          className={`hand-btn ${subTab === 'test' ? 'active' : ''}`}
          style={{ padding: '6px 14px', fontSize: '11px' }}
        >
          [2. TEST WEBSITE]
        </button>
        <button
          onClick={() => setSubTab('plan')}
          className={`hand-btn ${subTab === 'plan' ? 'active' : ''}`}
          style={{ padding: '6px 14px', fontSize: '11px' }}
        >
          [3. OPTIMIZATION PLAN {planResult ? `(${planResult.actionsCount})` : ''}]
        </button>
        <button
          onClick={() => setSubTab('verify')}
          className={`hand-btn ${subTab === 'verify' ? 'active' : ''}`}
          style={{ padding: '6px 14px', fontSize: '11px' }}
        >
          [4. BEFORE / AFTER]
        </button>
      </div>

      {/* STATUS & ERROR ALERTS */}
      {statusMessage && (
        <div style={{ background: '#f4f4f5', border: '1px solid var(--ink)', padding: '8px 12px', fontSize: '12px', marginBottom: '14px', fontFamily: 'monospace' }}>
          &bull; {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div style={{ background: '#fee2e2', border: '1px solid #dc2626', color: '#991b1b', padding: '8px 12px', fontSize: '12px', marginBottom: '14px' }}>
          &times; Error: {errorMessage}
        </div>
      )}

      {/* 1. ANALYZE PROJECT VIEW */}
      {subTab === 'analyze' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700 }}>Project / Asset Path:</label>
            <input
              type="text"
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
              placeholder="e.g. . or ./public"
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
              onClick={runAnalysis}
              disabled={loading}
              className="hand-btn"
              style={{ padding: '6px 16px', fontSize: '12px', fontWeight: 700 }}
            >
              {loading ? '[ANALYZING...]' : '[RUN MEDIA AUDIT]'}
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

              {/* ISSUES LIST */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '13px', margin: 0, textTransform: 'uppercase' }}>
                    Identified Bottlenecks ({analysisResult.issues?.length || 0})
                  </h3>
                  <button
                    onClick={runGeneratePlan}
                    className="hand-btn active"
                    style={{ padding: '4px 12px', fontSize: '11px' }}
                  >
                    [GENERATE OPTIMIZATION PLAN &rarr;]
                  </button>
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--ink)', padding: '8px' }}>
                  {analysisResult.issues?.slice(0, 15).map((iss: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: '6px 8px',
                        borderBottom: '1px dashed #ccc',
                        fontSize: '11px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700 }}>
                          [{iss.id}] {iss.assetPath || ''}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          padding: '1px 5px',
                          background: iss.severity === 'critical' ? '#fee2e2' : '#fef3c7',
                          color: iss.severity === 'critical' ? '#991b1b' : '#92400e',
                          fontWeight: 700,
                        }}>
                          {iss.severity?.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ color: '#555' }}>{iss.message}</div>
                      <div style={{ color: '#047857', fontWeight: 600 }}>&rarr; {iss.recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. TEST WEBSITE VIEW */}
      {subTab === 'test' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700 }}>Target URL:</label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="http://localhost:3000"
              style={{
                flex: 1,
                minWidth: '220px',
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
            <div>
              <div style={{ border: '1.5px solid var(--ink)', padding: '14px', marginBottom: '14px', background: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666' }}>Website Performance Audit</div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{testResult.target}</div>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 900 }}>
                    {testResult.score?.overall}<span style={{ fontSize: '12px' }}>/100</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', fontSize: '11px' }}>
                  <div>Total Media: <b>{testResult.metrics?.totalSizeFormatted}</b></div>
                  <div>Estimated 4G Delay: <b>{testResult.metrics?.estimatedTransferTime4GMs}ms</b></div>
                  <div>Images Tested: <b>{testResult.metrics?.imageCount}</b></div>
                  <div>SVGs Tested: <b>{testResult.metrics?.svgCount}</b></div>
                </div>
              </div>

              {testResult.metrics?.lcpCandidate && (
                <div style={{ border: '1.5px solid var(--ink)', padding: '12px', marginBottom: '14px', background: '#ecfdf5' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>
                    [POTENTIAL LCP CANDIDATE DETECTED]
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>
                    {testResult.metrics.lcpCandidate.pathOrUrl}
                  </div>
                  <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                    Size: {testResult.metrics.lcpCandidate.sizeFormatted} &bull; {testResult.metrics.lcpCandidate.reason}
                  </div>
                </div>
              )}

              <div style={{ border: '1px solid var(--ink)', padding: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Top Recommendations</div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11px' }}>
                  {testResult.recommendations?.map((r: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. OPTIMIZATION PLAN VIEW */}
      {subTab === 'plan' && (
        <div>
          {!planResult ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                No active optimization plan. Run an audit first to generate an actionable plan.
              </p>
              <button onClick={runGeneratePlan} className="hand-btn active" style={{ padding: '8px 18px', fontSize: '12px' }}>
                [GENERATE PLAN NOW]
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666' }}>Active Plan</div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>ID: {planResult.planId}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#047857', fontWeight: 700 }}>
                    Estimated Reduction: {planResult.estimatedReductionPercent} ({planResult.estimatedSavedFormatted})
                  </div>
                  <div style={{ fontSize: '10px', color: '#666' }}>{planResult.estimatedBeforeFormatted} &rarr; {planResult.estimatedAfterFormatted}</div>
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
                    <div style={{ color: '#666', fontSize: '10px' }}>{act.reason}</div>
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
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px', paddingLeft: '20px' }}>
                  If unchecked, optimized assets are safely created in <code>{planResult.targetDir}</code> without modifying originals.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={runExecutePlan}
                  disabled={loading}
                  className="hand-btn active"
                  style={{ padding: '8px 20px', fontSize: '12px', fontWeight: 700 }}
                >
                  {loading ? '[EXECUTING OPTIMIZATIONS...]' : '[APPLY OPTIMIZATIONS NOW]'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. BEFORE / AFTER VERIFICATION VIEW */}
      {subTab === 'verify' && (
        <div>
          {!verificationResult && !executionResult ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                Execute an optimization plan to see verified before & after comparisons and measured bandwidth savings.
              </p>
              <button onClick={() => setSubTab('plan')} className="hand-btn" style={{ padding: '6px 16px', fontSize: '12px' }}>
                [GO TO PLAN]
              </button>
            </div>
          ) : (
            <div>
              <div style={{ border: '2px solid var(--ink)', padding: '16px', marginBottom: '16px', background: '#ecfdf5' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 700, color: '#065f46' }}>
                  Verified Performance Gain
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#047857', margin: '4px 0' }}>
                  -{verificationResult?.reductionPercent || executionResult?.actualReductionPercent} Bandwidth
                </div>
                <div style={{ fontSize: '13px', color: '#065f46' }}>
                  Saved <b>{verificationResult?.savedFormatted || executionResult?.actualSavedFormatted}</b> across optimized media.
                </div>
              </div>

              <div style={{ border: '1px solid var(--ink)', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>Measured Improvements</div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px' }}>
                  {verificationResult?.measuredImprovements?.map((imp: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{imp}</li>
                  ))}
                </ul>
              </div>

              {verificationResult?.reportSavedPath && (
                <div style={{ border: '1px dashed var(--ink)', padding: '10px', fontSize: '11px', background: '#f4f4f5' }}>
                  &bull; Local report generated: <code>{verificationResult.reportSavedPath}</code>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
