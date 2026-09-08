/**
 * PhotoNow Git-Aware Performance Regression Guard & Baseline Engine
 *
 * Inspects local git repository state to detect newly introduced or modified
 * media assets, flags performance regressions, and manages persistent baselines.
 */

import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { formatBytes } from './tokenEconomy.mjs';

const execFileAsync = promisify(execFile);

const MEDIA_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.gif',
  '.svg',
  '.mp4',
  '.webm',
]);

/**
 * Checks if a directory is inside a Git repository.
 */
async function isGitRepository(dir) {
  try {
    await execFileAsync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: dir });
    return true;
  } catch {
    return false;
  }
}

/**
 * Detects Git status and identifies newly added or modified media assets.
 *
 * @param {string} projectRoot
 * @returns {Promise<import('./types').GitRegressionReport>}
 */
export async function checkGitPerformanceRegression(projectRoot) {
  const resolvedRoot = path.resolve(projectRoot);
  const hasGit = await isGitRepository(resolvedRoot);

  if (!hasGit) {
    return {
      hasGit: false,
      changedMediaCount: 0,
      changedMediaFiles: [],
      payloadBeforeBytes: 0,
      payloadBeforeFormatted: '0 B',
      payloadAfterBytes: 0,
      payloadAfterFormatted: '0 B',
      payloadDeltaBytes: 0,
      payloadDeltaFormatted: '0 B',
      payloadDeltaPercent: '0%',
      status: 'unknown',
      primaryRegressors: [],
    };
  }

  let branch = 'unknown';
  let headCommit = 'unknown';
  try {
    const branchRes = await execFileAsync('git', ['branch', '--show-current'], { cwd: resolvedRoot });
    branch = branchRes.stdout.trim() || 'HEAD';
    const commitRes = await execFileAsync('git', ['rev-parse', '--short', 'HEAD'], { cwd: resolvedRoot });
    headCommit = commitRes.stdout.trim();
  } catch {
    // Git metadata fetch failed
  }

  // Get git status porcelain output
  let statusOutput = '';
  try {
    const statusRes = await execFileAsync('git', ['status', '--porcelain'], { cwd: resolvedRoot });
    statusOutput = statusRes.stdout;
  } catch {
    statusOutput = '';
  }

  const changedMedia = [];
  let payloadDeltaBytes = 0;
  const primaryRegressors = [];

  const lines = statusOutput.split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    const code = line.slice(0, 2).trim();
    const filePathRel = line.slice(3).trim();
    const ext = path.extname(filePathRel).toLowerCase();

    if (MEDIA_EXTENSIONS.has(ext)) {
      const fullPath = path.join(resolvedRoot, filePathRel);
      let sizeBytes = 0;
      try {
        const stat = await fs.stat(fullPath);
        sizeBytes = stat.size;
      } catch {
        sizeBytes = 0;
      }

      let status = 'modified';
      if (code === '??' || code === 'A') status = 'added';
      else if (code === 'D') status = 'deleted';

      changedMedia.push({
        path: filePathRel,
        status,
        sizeBytes,
        sizeFormatted: formatBytes(sizeBytes),
      });

      if (status === 'added' || status === 'modified') {
        payloadDeltaBytes += sizeBytes;
        if (sizeBytes > 250000) {
          primaryRegressors.push(`${filePathRel} (+${formatBytes(sizeBytes)})`);
        }
      } else if (status === 'deleted') {
        payloadDeltaBytes -= sizeBytes;
      }
    }
  }

  let status = 'unchanged';
  if (payloadDeltaBytes > 500000 || primaryRegressors.length > 0) {
    status = 'regression';
  } else if (payloadDeltaBytes < -100000) {
    status = 'improvement';
  }

  return {
    hasGit: true,
    branch,
    headCommit,
    changedMediaCount: changedMedia.length,
    changedMediaFiles: changedMedia,
    payloadBeforeBytes: 0,
    payloadBeforeFormatted: '0 B',
    payloadAfterBytes: Math.max(0, payloadDeltaBytes),
    payloadAfterFormatted: formatBytes(Math.max(0, payloadDeltaBytes)),
    payloadDeltaBytes,
    payloadDeltaFormatted: `${payloadDeltaBytes >= 0 ? '+' : ''}${formatBytes(payloadDeltaBytes)}`,
    payloadDeltaPercent: payloadDeltaBytes > 0 ? `+${formatBytes(payloadDeltaBytes)}` : '0%',
    status,
    primaryRegressors,
  };
}

/**
 * Saves current performance metrics as a local baseline.
 */
export async function saveBaseline(projectRoot, baselineData) {
  const resolvedRoot = path.resolve(projectRoot);
  const baselineDir = path.join(resolvedRoot, '.photonow', 'baselines');
  await fs.mkdir(baselineDir, { recursive: true });

  const baseline = {
    savedAt: Date.now(),
    projectRoot: resolvedRoot,
    ...baselineData,
  };

  const baselinePath = path.join(baselineDir, 'baseline_latest.json');
  await fs.writeFile(baselinePath, JSON.stringify(baseline, null, 2), 'utf8');
  return baselinePath;
}

/**
 * Compares current metrics against the latest stored baseline.
 */
export async function compareWithBaseline(projectRoot, currentMetrics) {
  const resolvedRoot = path.resolve(projectRoot);
  const baselinePath = path.join(resolvedRoot, '.photonow', 'baselines', 'baseline_latest.json');

  try {
    const raw = await fs.readFile(baselinePath, 'utf8');
    const baseline = JSON.parse(raw);

    const mediaBytesDelta = (currentMetrics.totalSizeBytes || 0) - (baseline.totalSizeBytes || 0);
    const scoreDelta = (currentMetrics.score || 0) - (baseline.score || 0);

    let status = 'unchanged';
    if (mediaBytesDelta > 200000 || scoreDelta < -5) {
      status = 'regression';
    } else if (mediaBytesDelta < -200000 || scoreDelta > 5) {
      status = 'improvement';
    }

    return {
      baselineFound: true,
      baselineTimestamp: baseline.savedAt,
      status,
      comparison: {
        score: { baseline: baseline.score, current: currentMetrics.score, delta: scoreDelta },
        mediaBytes: {
          baseline: baseline.totalSizeBytes,
          current: currentMetrics.totalSizeBytes,
          delta: mediaBytesDelta,
          deltaFormatted: `${mediaBytesDelta >= 0 ? '+' : ''}${formatBytes(mediaBytesDelta)}`,
        },
      },
    };
  } catch {
    return {
      baselineFound: false,
      status: 'unknown',
      message: 'No previous baseline found in .photonow/baselines/. Save a baseline first to enable regression tracking.',
    };
  }
}
