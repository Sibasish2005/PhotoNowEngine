/**
 * PhotoNow Local Report Generator
 *
 * Generates offline, self-contained reports in Markdown, JSON, and HTML.
 * Zero-cloud, local-first, zero external CDN dependencies.
 */

import fs from 'fs/promises';
import path from 'path';
import { formatBytes } from './tokenEconomy.mjs';

/**
 * Generates a human-friendly Markdown performance report.
 */
export function generateMarkdownReport(analysisOrResult) {
  const score = analysisOrResult.score?.overall ?? analysisOrResult.score ?? 80;
  const breakdown = analysisOrResult.score?.breakdown || {};
  const issues = analysisOrResult.issues || [];
  const recs = analysisOrResult.recommendations || [];

  let md = `# PhotoNow Website Performance Intelligence Report\n\n`;
  md += `**Target**: \`${analysisOrResult.projectPath || analysisOrResult.target || 'Project Assets'}\`  \n`;
  md += `**Timestamp**: ${new Date().toISOString()}  \n`;
  md += `**Framework**: ${analysisOrResult.framework || 'Modern Web'}  \n\n`;

  md += `## Performance Score: **${score} / 100**\n\n`;
  md += `| Category | Score | Max |\n`;
  md += `| :--- | :--- | :--- |\n`;
  md += `| Format Efficiency | ${breakdown.formatEfficiency ?? 25} | 25 |\n`;
  md += `| Image Sizing | ${breakdown.imageSizing ?? 25} | 25 |\n`;
  md += `| Compression | ${breakdown.compression ?? 20} | 20 |\n`;
  md += `| Responsive Readiness | ${breakdown.responsiveReadiness ?? 15} | 15 |\n`;
  md += `| SVG Efficiency | ${breakdown.svgEfficiency ?? 15} | 15 |\n\n`;

  md += `## Asset Summary\n\n`;
  md += `- **Total Media Assets**: ${analysisOrResult.totalAssets || (analysisOrResult.assets?.length ?? 0)}\n`;
  md += `- **Total Size**: ${analysisOrResult.totalSizeFormatted || formatBytes(analysisOrResult.totalSizeBytes || 0)}\n`;
  md += `- **Potential Bandwidth Savings**: **${analysisOrResult.potentialSavingsFormatted || formatBytes(analysisOrResult.potentialSavingsBytes || 0)}**\n`;
  md += `- **Identified Bottlenecks**: ${issues.length}\n\n`;

  if (issues.length > 0) {
    md += `## Identified Issues\n\n`;
    for (const iss of issues.slice(0, 15)) {
      md += `### [${iss.severity?.toUpperCase() || 'INFO'}] ${iss.id || 'ISSUE'}\n`;
      md += `- **Problem**: ${iss.message}\n`;
      md += `- **Recommendation**: ${iss.recommendation}\n`;
      if (iss.potentialSavingsBytes) {
        md += `- **Potential Savings**: ${formatBytes(iss.potentialSavingsBytes)}\n`;
      }
      md += `\n`;
    }
  }

  if (recs.length > 0) {
    md += `## Actionable Next Steps\n\n`;
    recs.forEach((r, idx) => {
      md += `${idx + 1}. ${r}\n`;
    });
    md += `\n`;
  }

  return md;
}

/**
 * Generates an offline self-contained HTML report with embedded styles.
 */
export function generateHtmlReport(analysisOrResult) {
  const score = analysisOrResult.score?.overall ?? analysisOrResult.score ?? 80;
  const breakdown = analysisOrResult.score?.breakdown || {};
  const issues = analysisOrResult.issues || [];
  const recs = analysisOrResult.recommendations || [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PhotoNow Performance Report</title>
  <style>
    :root {
      --bg: #121214;
      --card: #1a1a1e;
      --border: #2e2e36;
      --text: #e1e1e6;
      --text-dim: #a1a1aa;
      --accent: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
    }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      line-height: 1.5;
      padding: 32px 20px;
      margin: 0;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 4px;
      background: #27272a;
      border: 1px solid var(--border);
    }
    .score-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--card);
      border: 2px solid var(--border);
      border-radius: 8px;
      padding: 24px 32px;
      margin-top: 16px;
    }
    .score-val {
      font-size: 54px;
      font-weight: 900;
      color: ${score >= 80 ? 'var(--accent)' : score >= 60 ? 'var(--warning)' : 'var(--danger)'};
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin: 20px 0;
    }
    .metric-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 16px;
      text-align: center;
    }
    .metric-num {
      font-size: 22px;
      font-weight: 700;
      color: var(--accent);
      margin-top: 4px;
    }
    .metric-label {
      font-size: 12px;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .issue-card {
      background: var(--card);
      border-left: 4px solid var(--warning);
      border-radius: 4px;
      padding: 14px 18px;
      margin-bottom: 12px;
      border-top: 1px solid var(--border);
      border-right: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }
    .issue-card.critical { border-left-color: var(--danger); }
    .issue-card.high { border-left-color: var(--warning); }
    .issue-card.medium { border-left-color: #3b82f6; }
    .issue-title { font-weight: 700; font-size: 15px; }
    .issue-desc { font-size: 13px; color: var(--text-dim); margin-top: 4px; }
    .issue-fix { font-size: 13px; color: var(--accent); margin-top: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">[PHOTONOW MCP ENGINE]</span>
    <h1 style="margin: 8px 0;">Website Performance Intelligence Audit</h1>
    <div style="color: var(--text-dim); font-size: 13px;">Target: ${analysisOrResult.projectPath || analysisOrResult.target || 'Project Media Assets'} &bull; ${new Date().toLocaleDateString()}</div>

    <div class="score-banner">
      <div>
        <div style="font-size: 14px; text-transform: uppercase; color: var(--text-dim); font-weight: 700;">Performance Score</div>
        <div style="font-size: 13px; color: var(--text-dim); margin-top: 4px;">Asset-centric optimization index</div>
      </div>
      <div class="score-val">${score}<span style="font-size: 24px; color: var(--text-dim);">/100</span></div>
    </div>

    <div class="grid">
      <div class="metric-card">
        <div class="metric-label">Total Assets</div>
        <div class="metric-num">${analysisOrResult.totalAssets || 0}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Media</div>
        <div class="metric-num">${analysisOrResult.totalSizeFormatted || '0 B'}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Potential Savings</div>
        <div class="metric-num">${analysisOrResult.potentialSavingsFormatted || '0 B'}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Issues Found</div>
        <div class="metric-num">${issues.length}</div>
      </div>
    </div>

    <h2>Score Breakdown</h2>
    <div class="grid">
      <div class="metric-card">
        <div class="metric-label">Format Efficiency</div>
        <div class="metric-num">${breakdown.formatEfficiency ?? 25}/25</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Image Sizing</div>
        <div class="metric-num">${breakdown.imageSizing ?? 25}/25</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Compression</div>
        <div class="metric-num">${breakdown.compression ?? 20}/20</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Responsive</div>
        <div class="metric-num">${breakdown.responsiveReadiness ?? 15}/15</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">SVG Efficiency</div>
        <div class="metric-num">${breakdown.svgEfficiency ?? 15}/15</div>
      </div>
    </div>

    <h2>Optimization Opportunities (${issues.length})</h2>
    ${issues
      .map(
        (iss) => `
      <div class="issue-card ${iss.severity || 'medium'}">
        <div class="issue-title">[${(iss.severity || 'INFO').toUpperCase()}] ${iss.id || 'ISSUE'}</div>
        <div class="issue-desc">${iss.message}</div>
        <div class="issue-fix">&rarr; Recommendation: ${iss.recommendation}</div>
      </div>`
      )
      .join('')}

    <h2>Next Actions</h2>
    <ol>
      ${recs.map((r) => `<li style="margin-bottom: 6px;">${r}</li>`).join('')}
    </ol>
  </div>
</body>
</html>`;
}

/**
 * Saves report locally in specified format (json, markdown, html).
 */
export async function saveLocalReport(analysisOrResult, format = 'html', outputDir = null) {
  const dir = outputDir || path.join(process.cwd(), '.photonow', 'reports');
  await fs.mkdir(dir, { recursive: true });

  const timestamp = Date.now();
  const baseName = `performance_report_${timestamp}`;
  const ext = format === 'json' ? '.json' : format === 'markdown' || format === 'md' ? '.md' : '.html';
  const filePath = path.join(dir, `${baseName}${ext}`);

  let content = '';
  if (format === 'json') {
    content = JSON.stringify(analysisOrResult, null, 2);
  } else if (format === 'markdown' || format === 'md') {
    content = generateMarkdownReport(analysisOrResult);
  } else {
    content = generateHtmlReport(analysisOrResult);
  }

  await fs.writeFile(filePath, content, 'utf8');
  return filePath;
}
