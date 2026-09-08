/**
 * PhotoNow Asset-Centric Website Performance Tester
 *
 * Measures website media performance, resource payloads, transfer timings,
 * identifies LCP candidates, and computes explainable PhotoNow scores.
 * Works seamlessly with local dev servers (http://localhost:3000) and remote URLs.
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { analyzeWebAssets } from './analyzer.mjs';
import { formatBytes } from './tokenEconomy.mjs';
import { engineCache } from './cache.mjs';

const BLOCKED_METADATA_HOSTS = new Set([
  '169.254.169.254',
  'metadata.google.internal',
  'metadata',
  '100.100.100.200',
  'instance-data',
]);

/**
 * Validates URLs against SSRF attacks (blocks cloud metadata endpoints, non-HTTP schemes).
 */
export function validateUrlSecurity(targetUrl) {
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw new Error(`Security violation: Malformed or invalid URL '${targetUrl}'`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Security violation: Protocol '${parsed.protocol}' is forbidden. Only HTTP and HTTPS are allowed.`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    BLOCKED_METADATA_HOSTS.has(hostname) ||
    hostname.endsWith('.internal') ||
    hostname.startsWith('169.254.')
  ) {
    throw new Error(`Security violation: Access to cloud metadata endpoint '${hostname}' is strictly blocked (SSRF guard).`);
  }

  return parsed;
}

/**
 * Fetches page HTML and resource headers over HTTP/HTTPS with SSRF guards and timeout.
 */
function fetchUrlText(targetUrl, timeoutMs = 8000, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 3) {
      return reject(new Error('Security violation: Exceeded maximum allowed redirects (max 3)'));
    }

    let parsed;
    try {
      parsed = validateUrlSecurity(targetUrl);
    } catch (err) {
      return reject(err);
    }

    const client = parsed.protocol === 'https:' ? https : http;

    const req = client.get(
      targetUrl,
      {
        headers: {
          'User-Agent': 'PhotoNow-Performance-Auditor/1.0 (Local-First; MCP)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: timeoutMs,
      },
      (res) => {
        // Handle redirects safely
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          try {
            const redirectUrl = new URL(res.headers.location, targetUrl).href;
            validateUrlSecurity(redirectUrl);
            return resolve(fetchUrlText(redirectUrl, timeoutMs, redirectCount + 1));
          } catch (redErr) {
            return reject(redErr);
          }
        }

        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve({ html: data, headers: res.headers, statusCode: res.statusCode }));
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    });
    req.on('error', reject);
  });
}

/**
 * Probes headers/size of a remote or local resource URL with HEAD or GET.
 */
function probeResource(resourceUrl, timeoutMs = 5000) {
  return new Promise((resolve) => {
    try {
      const parsed = validateUrlSecurity(resourceUrl);
      const client = parsed.protocol === 'https:' ? https : http;
      const startTime = Date.now();

      const req = client.request(
        resourceUrl,
        {
          method: 'HEAD',
          headers: { 'User-Agent': 'PhotoNow-Performance-Auditor/1.0' },
          timeout: timeoutMs,
        },
        (res) => {
          const duration = Date.now() - startTime;
          const contentLength = parseInt(res.headers['content-length'] || '0', 10);
          const contentType = res.headers['content-type'] || '';
          const contentEncoding = res.headers['content-encoding'] || 'identity';

          resolve({
            url: resourceUrl,
            sizeBytes: contentLength,
            contentType,
            contentEncoding,
            durationMs: duration,
            statusCode: res.statusCode,
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve({ url: resourceUrl, sizeBytes: 0, durationMs: timeoutMs, error: 'timeout' });
      });
      req.on('error', () => {
        resolve({ url: resourceUrl, sizeBytes: 0, durationMs: 0, error: 'failed' });
      });
      req.end();
    } catch {
      resolve({ url: resourceUrl, sizeBytes: 0, durationMs: 0, error: 'invalid_url' });
    }
  });
}

/**
 * Parses HTML to extract media asset references (img, picture, svg, video, link preload).
 */
export function extractMediaFromHtml(html, baseUrl) {
  const assets = [];

  // Match <img> tags
  const imgRegex = /<img\b([^>]*?)>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const attrs = match[1];
    const srcMatch = attrs.match(/\bsrc=["']([^"']+)["']/i);
    const srcsetMatch = attrs.match(/\bsrcset=["']([^"']+)["']/i);
    const loadingMatch = attrs.match(/\bloading=["']([^"']+)["']/i);
    const fetchPriorityMatch = attrs.match(/\bfetchpriority=["']([^"']+)["']/i);
    const widthMatch = attrs.match(/\bwidth=["']?(\d+)["']?/i);
    const heightMatch = attrs.match(/\bheight=["']?(\d+)["']?/i);
    const altMatch = attrs.match(/\balt=["']([^"']*)["']/i);

    if (srcMatch) {
      let resolvedSrc = srcMatch[1];
      try {
        resolvedSrc = new URL(resolvedSrc, baseUrl).href;
      } catch {
        // keep as is
      }
      assets.push({
        type: 'image',
        url: resolvedSrc,
        rawSrc: srcMatch[1],
        hasSrcset: !!srcsetMatch,
        loading: loadingMatch ? loadingMatch[1].toLowerCase() : 'eager',
        fetchPriority: fetchPriorityMatch ? fetchPriorityMatch[1].toLowerCase() : 'auto',
        width: widthMatch ? parseInt(widthMatch[1], 10) : undefined,
        height: heightMatch ? parseInt(heightMatch[1], 10) : undefined,
        alt: altMatch ? altMatch[1] : undefined,
      });
    }
  }

  // Match <link rel="preload" as="image">
  const preloadRegex = /<link\b([^>]*?)>/gi;
  while ((match = preloadRegex.exec(html)) !== null) {
    const attrs = match[1];
    if (attrs.includes('rel="preload"') || attrs.includes("rel='preload'")) {
      if (attrs.includes('as="image"') || attrs.includes("as='image'")) {
        const hrefMatch = attrs.match(/\bhref=["']([^"']+)["']/i);
        if (hrefMatch) {
          let resolved = hrefMatch[1];
          try {
            resolved = new URL(resolved, baseUrl).href;
          } catch {}
          assets.push({
            type: 'preloaded_image',
            url: resolved,
            rawSrc: hrefMatch[1],
            isPreload: true,
          });
        }
      }
    }
  }

  // Count SVGs
  const svgMatches = html.match(/<svg\b[^>]*>/gi) || [];
  for (let i = 0; i < svgMatches.length; i++) {
    assets.push({
      type: 'inline_svg',
      url: `inline-svg-${i + 1}`,
      rawSrc: `inline-svg-${i + 1}`,
      sizeBytes: 1500, // estimated inline size
    });
  }

  return assets;
}

/**
 * Runs asset-centric web performance test on a URL or local folder.
 */
export async function testWebPerformance(target, options = {}) {
  const testId = `test_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const isUrl = target.startsWith('http://') || target.startsWith('https://');

  if (!isUrl) {
    // If target is local project or HTML file
    const resolvedPath = path.resolve(target);
    const analysis = await analyzeWebAssets(resolvedPath);

    // Find likely LCP candidate
    const lcpCandidate = analysis.assets.find(
      (a) =>
        a.issues.some((i) => i.id === 'POTENTIAL_LCP_ASSET') ||
        (a.width && a.width >= 1200) ||
        a.sizeBytes > 300 * 1024
    ) || analysis.assets[0];

    // Compute estimated mobile 4G transfer time (4 Mbps = 500 KB/sec)
    const transferMs = Math.round((analysis.totalSizeBytes / 500000) * 1000);

    const result = {
      testId,
      target: resolvedPath,
      timestamp: Date.now(),
      score: analysis.score,
      metrics: {
        totalAssetsCount: analysis.totalAssets,
        totalSizeBytes: analysis.totalSizeBytes,
        totalSizeFormatted: analysis.totalSizeFormatted,
        imageCount: analysis.assets.filter((a) => a.format !== 'svg').length,
        svgCount: analysis.assets.filter((a) => a.format === 'svg').length,
        videoCount: 0,
        largestAssets: analysis.assets.slice(0, 5).map((a) => ({
          pathOrUrl: a.relativePath,
          sizeBytes: a.sizeBytes,
          sizeFormatted: a.sizeFormatted,
          format: a.format,
        })),
        estimatedTransferTime4GMs: transferMs,
        ...(lcpCandidate
          ? {
              lcpCandidate: {
                pathOrUrl: lcpCandidate.relativePath,
                sizeBytes: lcpCandidate.sizeBytes,
                sizeFormatted: lcpCandidate.sizeFormatted,
                format: lcpCandidate.format,
                dimensions: lcpCandidate.dimensions,
                reason: 'Largest visible image asset in project directory.',
              },
            }
          : {}),
      },
      issueCount: analysis.issues.length,
      topIssues: analysis.issues.slice(0, 5).map((i) => `${i.id}: ${i.message}`),
      potentialSavingsBytes: analysis.potentialSavingsBytes,
      potentialSavingsFormatted: analysis.potentialSavingsFormatted,
      recommendations: analysis.recommendations,
      nextAction: analysis.issues.length > 0 ? 'generate_optimization_plan' : 'all_assets_optimized',
    };

    engineCache.saveTest(result);
    return result;
  }

  // Remote / Local Dev URL Testing
  const { html } = await fetchUrlText(target);
  const mediaItems = extractMediaFromHtml(html, target);

  // Probe media items to obtain real header sizes
  const probedMedia = [];
  let totalMediaBytes = 0;

  for (const item of mediaItems.slice(0, 20)) {
    if (item.url.startsWith('http')) {
      const probe = await probeResource(item.url);
      const size = probe.sizeBytes || 85000; // fallback reasonable estimate
      totalMediaBytes += size;
      probedMedia.push({
        ...item,
        sizeBytes: size,
        sizeFormatted: formatBytes(size),
        format: probe.contentType ? probe.contentType.split('/')[1] || 'image' : 'image',
        timingMs: probe.durationMs,
      });
    } else {
      probedMedia.push({
        ...item,
        sizeBytes: item.sizeBytes || 2000,
        sizeFormatted: formatBytes(item.sizeBytes || 2000),
        format: 'svg',
        timingMs: 5,
      });
    }
  }

  probedMedia.sort((a, b) => b.sizeBytes - a.sizeBytes);

  // Identify LCP Candidate: Priority to preloaded image or first large image
  let lcpCandidate = probedMedia.find((m) => m.isPreload) || probedMedia.find((m) => m.type === 'image' && (m.width || 800) >= 600) || probedMedia[0];

  // Compute deductions and score
  let formatScore = 25;
  let sizingScore = 25;
  let compressionScore = 20;
  let responsiveScore = 15;
  let svgScore = 15;
  const deductions = [];
  const issues = [];
  let potentialSavingsBytes = 0;

  for (const media of probedMedia) {
    if (media.type === 'image') {
      // Check format
      const fmt = (media.format || '').toLowerCase();
      if (fmt.includes('png') || fmt.includes('jpeg') || fmt.includes('jpg')) {
        const loss = 2;
        formatScore = Math.max(5, formatScore - loss);
        const savings = Math.round(media.sizeBytes * 0.55);
        potentialSavingsBytes += savings;
        issues.push({
          id: 'INEFFICIENT_FORMAT',
          message: `${path.basename(media.url)} uses legacy format (${fmt}). WebP/AVIF would reduce transfer.`,
          savings,
        });
      }

      // Check responsive srcset
      if (!media.hasSrcset && (media.width || 0) > 600) {
        const loss = 2;
        responsiveScore = Math.max(3, responsiveScore - loss);
        issues.push({
          id: 'RESPONSIVE_VARIANT',
          message: `${path.basename(media.url)} is missing responsive srcset variants.`,
          savings: Math.round(media.sizeBytes * 0.35),
        });
      }

      // Check lazy loading on non-hero images
      if (media !== lcpCandidate && media.loading !== 'lazy') {
        responsiveScore = Math.max(3, responsiveScore - 1);
        issues.push({
          id: 'MISSING_LAZY_LOADING',
          message: `${path.basename(media.url)} is missing loading="lazy" attribute.`,
          savings: 0,
        });
      }
    }
  }

  const overall = formatScore + sizingScore + compressionScore + responsiveScore + svgScore;
  const transferTime4GMs = Math.round((totalMediaBytes / 500000) * 1000);

  const testResult = {
    testId,
    target,
    timestamp: Date.now(),
    score: {
      overall,
      breakdown: {
        formatEfficiency: formatScore,
        imageSizing: sizingScore,
        compression: compressionScore,
        responsiveReadiness: responsiveScore,
        svgEfficiency: svgScore,
      },
      deductions,
    },
    metrics: {
      totalAssetsCount: probedMedia.length,
      totalSizeBytes: totalMediaBytes,
      totalSizeFormatted: formatBytes(totalMediaBytes),
      imageCount: probedMedia.filter((m) => m.type === 'image').length,
      svgCount: probedMedia.filter((m) => m.type === 'inline_svg').length,
      videoCount: 0,
      largestAssets: probedMedia.slice(0, 5).map((m) => ({
        pathOrUrl: m.url,
        sizeBytes: m.sizeBytes,
        sizeFormatted: m.sizeFormatted,
        format: m.format,
      })),
      estimatedTransferTime4GMs: transferTime4GMs,
      ...(lcpCandidate
        ? {
            lcpCandidate: {
              pathOrUrl: lcpCandidate.url,
              sizeBytes: lcpCandidate.sizeBytes,
              sizeFormatted: lcpCandidate.sizeFormatted,
              format: lcpCandidate.format,
              reason: lcpCandidate.isPreload
                ? 'Preloaded hero image candidate.'
                : 'Highest-priority visible image above the fold.',
            },
          }
        : {}),
    },
    issueCount: issues.length,
    topIssues: issues.slice(0, 5).map((i) => i.message),
    potentialSavingsBytes,
    potentialSavingsFormatted: formatBytes(potentialSavingsBytes),
    recommendations: [
      'Convert legacy JPEG/PNG images to WebP/AVIF format.',
      'Add loading="lazy" to offscreen images to speed up initial paint.',
      'Supply responsive srcset variants for mobile viewports.',
    ],
    nextAction: issues.length > 0 ? 'generate_optimization_plan' : 'verify_optimization',
  };

  engineCache.saveTest(testResult);
  return testResult;
}

/**
 * Compares two web performance test results (e.g. Before vs After).
 */
export function comparePerformanceTests(beforeTest, afterTest) {
  if (!beforeTest || !afterTest) {
    throw new Error('Both beforeTest and afterTest are required for performance comparison.');
  }

  const beforeBytes = beforeTest.metrics?.totalSizeBytes || 0;
  const afterBytes = afterTest.metrics?.totalSizeBytes || 0;
  const savedBytes = Math.max(0, beforeBytes - afterBytes);
  const reductionPercent = beforeBytes > 0 ? ((savedBytes / beforeBytes) * 100).toFixed(1) : '0';

  const beforeScore = beforeTest.score?.overall || 0;
  const afterScore = afterTest.score?.overall || 0;
  const scoreDelta = afterScore - beforeScore;

  const measuredImprovements = [];
  if (savedBytes > 0) {
    measuredImprovements.push(`Media payload decreased by ${formatBytes(savedBytes)} (${reductionPercent}% reduction).`);
  }
  if (scoreDelta > 0) {
    measuredImprovements.push(`PhotoNow Performance Score improved by +${scoreDelta} points (${beforeScore} -> ${afterScore}).`);
  } else if (scoreDelta === 0) {
    measuredImprovements.push(`Performance Score maintained at ${afterScore}/100.`);
  }

  const beforeTransfer = beforeTest.metrics?.estimatedTransferTime4GMs || 0;
  const afterTransfer = afterTest.metrics?.estimatedTransferTime4GMs || 0;
  if (beforeTransfer > afterTransfer) {
    measuredImprovements.push(
      `Estimated 4G mobile transfer duration reduced from ${beforeTransfer}ms to ${afterTransfer}ms.`
    );
  }

  return {
    beforeTestId: beforeTest.testId,
    afterTestId: afterTest.testId,
    scoreBefore: beforeScore,
    scoreAfter: afterScore,
    scoreDelta,
    mediaBeforeBytes: beforeBytes,
    mediaBeforeFormatted: formatBytes(beforeBytes),
    mediaAfterBytes: afterBytes,
    mediaAfterFormatted: formatBytes(afterBytes),
    savedBytes,
    savedFormatted: formatBytes(savedBytes),
    reductionPercent: `${reductionPercent}%`,
    measuredImprovements,
  };
}
