/**
 * PhotoNow Token Economy & Progressive Disclosure Engine
 *
 * Maximizes MCP context efficiency by computing heavy diagnostics locally
 * and returning compact, actionable intelligence to AI agents.
 */

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const val = (bytes / Math.pow(k, i)).toFixed(1);
  return `${val} ${sizes[i]}`;
}

export function estimateTokens(content) {
  if (!content) return 0;
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  // Standard token heuristic: ~4 characters per token for English & JSON
  return Math.ceil(str.length / 4);
}

/**
 * Normalizes detail level: compact (default) | standard | detailed | raw
 */
export function normalizeDetailLevel(raw) {
  if (!raw || typeof raw !== 'string') return 'compact';
  const val = raw.toLowerCase().trim();
  if (['compact', 'standard', 'detailed', 'raw'].includes(val)) {
    return val;
  }
  return 'compact';
}

/**
 * Formats an MCP response according to progressive disclosure and token budget.
 */
export function formatMcpResponse({
  ok = true,
  summary = {},
  issues = [],
  recommendations = [],
  nextAction = '',
  details = null,
  detailLevel = 'compact',
  tokenBudget = null,
  error = null,
}) {
  const level = normalizeDetailLevel(detailLevel);

  if (!ok && error) {
    const errorPayload = {
      ok: false,
      error: {
        code: error.code || 'ENGINE_ERROR',
        message: error.message || String(error),
      },
      nextAction: nextAction || 'check_inputs_and_retry',
    };
    return errorPayload;
  }

  // 1. RAW MODE: return complete unadulterated payload
  if (level === 'raw') {
    return {
      ok: true,
      summary,
      issues,
      recommendations,
      nextAction,
      details,
      detailsAvailable: false,
    };
  }

  // 2. COMPACT MODE (Default): highest signal-to-noise ratio
  if (level === 'compact') {
    // Only top 3-5 critical/high issues
    const topIssues = (issues || [])
      .slice(0, 5)
      .map((iss) => (typeof iss === 'string' ? iss : `${iss.id || 'ISSUE'}: ${iss.message || ''}`));

    const compactPayload = {
      ok: true,
      summary: {
        ...summary,
        ...(summary.score !== undefined ? { score: summary.score?.overall ?? summary.score } : {}),
        ...(summary.totalAssets !== undefined ? { totalAssets: summary.totalAssets } : {}),
        ...(summary.potentialSavingsBytes !== undefined ? { potentialSavingsBytes: summary.potentialSavingsBytes } : {}),
        ...(summary.potentialSavingsFormatted !== undefined ? { potentialSavingsFormatted: summary.potentialSavingsFormatted } : {}),
        issueCount: issues && issues.length > 0 ? issues.length : (summary.issueCount ?? 0),
        topIssues,
        ...(summary.scoreBreakdown ? { scoreBreakdown: summary.scoreBreakdown } : {}),
      },
      recommendations: (recommendations || []).slice(0, 3),
      nextAction: nextAction || 'generate_optimization_plan',
      detailsAvailable: true,
    };

    // Clean up null values to save tokens
    for (const key of Object.keys(compactPayload.summary)) {
      if (compactPayload.summary[key] === null || compactPayload.summary[key] === undefined) {
        delete compactPayload.summary[key];
      }
    }

    return applyTokenBudget(compactPayload, tokenBudget);
  }

  // 3. STANDARD MODE: balanced summary, important assets, relevant metrics
  if (level === 'standard') {
    const standardIssues = (issues || []).slice(0, 15).map((iss) => {
      if (typeof iss === 'string') return iss;
      return {
        id: iss.id,
        severity: iss.severity,
        message: iss.message,
        recommendation: iss.recommendation,
        potentialSavingsFormatted: iss.potentialSavingsBytes ? formatBytes(iss.potentialSavingsBytes) : undefined,
      };
    });

    const standardPayload = {
      ok: true,
      summary,
      issues: standardIssues,
      recommendations: (recommendations || []).slice(0, 6),
      nextAction,
      detailsAvailable: true,
    };

    return applyTokenBudget(standardPayload, tokenBudget);
  }

  // 4. DETAILED MODE: full diagnostics, asset-level listings
  const detailedPayload = {
    ok: true,
    summary,
    issues,
    recommendations,
    nextAction,
    details,
    detailsAvailable: false,
  };

  return applyTokenBudget(detailedPayload, tokenBudget);
}

/**
 * Truncates and budgets a response object to fit within a specified token limit.
 * Follows strict priority order:
 * Critical problems > High-impact opportunities > Potential savings > Recommended action > Secondary info
 */
export function applyTokenBudget(payload, tokenBudget) {
  if (!tokenBudget || typeof tokenBudget !== 'number' || tokenBudget <= 0) {
    return payload;
  }

  const currentTokens = estimateTokens(payload);
  if (currentTokens <= tokenBudget) {
    return payload;
  }

  // Clone payload
  const budgeted = JSON.parse(JSON.stringify(payload));
  budgeted._tokenBudgetApplied = {
    budget: tokenBudget,
    originalTokens: currentTokens,
    truncated: true,
  };

  // Step 1: Truncate deep details if present
  if (budgeted.details) {
    delete budgeted.details;
    budgeted.detailsAvailable = true;
    if (estimateTokens(budgeted) <= tokenBudget) return budgeted;
  }

  // Step 2: Truncate recommendations to top 2
  if (Array.isArray(budgeted.recommendations) && budgeted.recommendations.length > 2) {
    budgeted.recommendations = budgeted.recommendations.slice(0, 2);
    if (estimateTokens(budgeted) <= tokenBudget) return budgeted;
  }

  // Step 3: Trim issues list progressively
  if (Array.isArray(budgeted.issues) && budgeted.issues.length > 3) {
    budgeted.issues = budgeted.issues.slice(0, 3);
    budgeted.summary = budgeted.summary || {};
    budgeted.summary.additionalIssuesTruncated = payload.issues.length - 3;
    if (estimateTokens(budgeted) <= tokenBudget) return budgeted;
  }

  // Step 4: Fallback to ultra-compact summary if still overflowing
  return {
    ok: true,
    summary: {
      score: payload.summary?.score,
      totalAssets: payload.summary?.totalAssets,
      potentialSavingsFormatted: payload.summary?.potentialSavingsFormatted,
      topIssues: (payload.summary?.topIssues || []).slice(0, 2),
      truncatedMessage: `Response truncated to fit tokenBudget of ${tokenBudget} tokens. Request specific asset or higher budget for more details.`,
    },
    nextAction: payload.nextAction || 'generate_optimization_plan',
    detailsAvailable: true,
  };
}
