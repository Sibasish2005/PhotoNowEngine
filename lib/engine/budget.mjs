/**
 * PhotoNow Performance Budget Engine
 *
 * Evaluates website assets and runtime metrics against configured performance budgets
 * (e.g. maxPageBytes, maxImageBytes, maxHeroBytes, maxSvgBytes, LCP budget).
 */

import fs from 'fs/promises';
import path from 'path';
import { formatBytes } from './tokenEconomy.mjs';

export const DEFAULT_PERFORMANCE_BUDGET = {
  media: {
    maxPageBytes: 2000000, // 2.0 MB max total page media
    maxImageBytes: 600000, // 600 KB max single image
    maxHeroBytes: 350000,  // 350 KB max hero LCP candidate
    maxSvgBytes: 50000,    // 50 KB max SVG
  },
  performance: {
    lcp: 2500, // 2.5s LCP budget
    fcp: 1800, // 1.8s FCP budget
  },
};

/**
 * Loads project performance budget from .photonow/budget.json or falls back to defaults.
 *
 * @param {string} projectRoot
 * @returns {Promise<import('./types').PerformanceBudgetConfig>}
 */
export async function loadProjectBudget(projectRoot) {
  const budgetPath = path.join(path.resolve(projectRoot), '.photonow', 'budget.json');
  try {
    const raw = await fs.readFile(budgetPath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      media: { ...DEFAULT_PERFORMANCE_BUDGET.media, ...(parsed.media || {}) },
      performance: { ...DEFAULT_PERFORMANCE_BUDGET.performance, ...(parsed.performance || {}) },
    };
  } catch {
    return DEFAULT_PERFORMANCE_BUDGET;
  }
}

/**
 * Evaluates performance metrics and assets against project budget.
 *
 * @param {object} params
 * @param {string} params.target - Project directory or URL
 * @param {import('./types').AssetAnalysis[]} [params.assets]
 * @param {number} [params.totalSizeBytes]
 * @param {number} [params.lcpMs]
 * @param {number} [params.fcpMs]
 * @param {import('./types').PerformanceBudgetConfig} [params.budgetConfig]
 * @returns {import('./types').BudgetEvaluation}
 */
export function evaluatePerformanceBudget({
  target,
  assets = [],
  totalSizeBytes = 0,
  lcpMs = 0,
  fcpMs = 0,
  budgetConfig = DEFAULT_PERFORMANCE_BUDGET,
}) {
  const checks = [];
  const mediaLimits = budgetConfig.media || DEFAULT_PERFORMANCE_BUDGET.media;
  const perfLimits = budgetConfig.performance || DEFAULT_PERFORMANCE_BUDGET.performance;

  // 1. Total Media Budget Check
  if (mediaLimits.maxPageBytes) {
    const passed = totalSizeBytes <= mediaLimits.maxPageBytes;
    const exceeded = Math.max(0, totalSizeBytes - mediaLimits.maxPageBytes);
    checks.push({
      rule: 'Total Media Footprint (maxPageBytes)',
      category: 'media',
      limit: mediaLimits.maxPageBytes,
      limitFormatted: formatBytes(mediaLimits.maxPageBytes),
      actual: totalSizeBytes,
      actualFormatted: formatBytes(totalSizeBytes),
      passed,
      severity: passed ? 'warning' : 'error',
      exceededBy: exceeded,
      exceededByFormatted: formatBytes(exceeded),
    });
  }

  // 2. Single Image Size Check
  if (mediaLimits.maxImageBytes && assets.length > 0) {
    const largestImg = assets.find((a) => a.format !== 'svg' && a.format !== 'mp4' && a.format !== 'webm');
    if (largestImg) {
      const passed = largestImg.sizeBytes <= mediaLimits.maxImageBytes;
      const exceeded = Math.max(0, largestImg.sizeBytes - mediaLimits.maxImageBytes);
      checks.push({
        rule: `Max Single Image Size: ${largestImg.fileName}`,
        category: 'media',
        limit: mediaLimits.maxImageBytes,
        limitFormatted: formatBytes(mediaLimits.maxImageBytes),
        actual: largestImg.sizeBytes,
        actualFormatted: formatBytes(largestImg.sizeBytes),
        passed,
        severity: passed ? 'warning' : 'error',
        exceededBy: exceeded,
        exceededByFormatted: formatBytes(exceeded),
      });
    }
  }

  // 3. SVG Size Check
  if (mediaLimits.maxSvgBytes && assets.length > 0) {
    const svgs = assets.filter((a) => a.format === 'svg');
    for (const svg of svgs) {
      if (svg.sizeBytes > mediaLimits.maxSvgBytes) {
        checks.push({
          rule: `SVG Asset Size: ${svg.fileName}`,
          category: 'media',
          limit: mediaLimits.maxSvgBytes,
          limitFormatted: formatBytes(mediaLimits.maxSvgBytes),
          actual: svg.sizeBytes,
          actualFormatted: formatBytes(svg.sizeBytes),
          passed: false,
          severity: 'warning',
          exceededBy: svg.sizeBytes - mediaLimits.maxSvgBytes,
          exceededByFormatted: formatBytes(svg.sizeBytes - mediaLimits.maxSvgBytes),
        });
      }
    }
  }

  // 4. LCP Budget Check
  if (perfLimits.lcp && lcpMs > 0) {
    const passed = lcpMs <= perfLimits.lcp;
    const exceeded = Math.max(0, lcpMs - perfLimits.lcp);
    checks.push({
      rule: 'Largest Contentful Paint (LCP)',
      category: 'performance',
      limit: perfLimits.lcp,
      limitFormatted: `${perfLimits.lcp}ms`,
      actual: lcpMs,
      actualFormatted: `${lcpMs}ms`,
      passed,
      severity: passed ? 'warning' : 'error',
      exceededBy: exceeded,
      exceededByFormatted: `${exceeded}ms`,
    });
  }

  // 5. FCP Budget Check
  if (perfLimits.fcp && fcpMs > 0) {
    const passed = fcpMs <= perfLimits.fcp;
    const exceeded = Math.max(0, fcpMs - perfLimits.fcp);
    checks.push({
      rule: 'First Contentful Paint (FCP)',
      category: 'performance',
      limit: perfLimits.fcp,
      limitFormatted: `${perfLimits.fcp}ms`,
      actual: fcpMs,
      actualFormatted: `${fcpMs}ms`,
      passed,
      severity: passed ? 'warning' : 'error',
      exceededBy: exceeded,
      exceededByFormatted: `${exceeded}ms`,
    });
  }

  const failedCount = checks.filter((c) => !c.passed && c.severity === 'error').length;
  const warningCount = checks.filter((c) => !c.passed && c.severity === 'warning').length;
  const passedCount = checks.filter((c) => c.passed).length;

  let status = 'PASS';
  let nextAction = 'all_budgets_satisfied';
  if (failedCount > 0) {
    status = 'FAIL';
    nextAction = 'generate_optimization_plan';
  } else if (warningCount > 0) {
    status = 'WARN';
    nextAction = 'review_budget_warnings';
  }

  return {
    status,
    target,
    evaluatedAt: Date.now(),
    checks,
    failedCount,
    warningCount,
    passedCount,
    nextAction,
  };
}
