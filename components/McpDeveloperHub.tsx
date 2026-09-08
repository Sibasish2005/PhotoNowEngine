'use client';

import React, { useState, useMemo } from 'react';
import {
  SAMPLE_MCP_CLIENT_CONFIG,
  SAMPLE_STDIO_MCP_CONFIG,
  SAMPLE_NPX_MCP_CONFIG,
} from '@/lib/mcpTools';

export interface DeveloperTool {
  name: string;
  domain: 'Autonomous Missions' | 'Auditing & Diagnostics' | 'Asset Graph & AST' | 'Multimedia Foundation' | 'Execution & Patching' | 'Budget & Runtime';
  tagline: string;
  whatItDoes: string;
  promptExample: string;
  safety: 'Safe (Read-Only)' | 'Safe (Non-Destructive)' | 'Safe (Atomic Rollback)' | 'Safe (Restores Original Files)' | 'Configurable Output' | string;
  keyParams: { name: string; type: string; required?: boolean; description: string; default?: string }[];
  outputSample: string;
}

export const MCP_DEVELOPER_CATALOG: DeveloperTool[] = [
  {
    name: 'optimize_project',
    domain: 'Autonomous Missions',
    tagline: 'End-to-End Autonomous Performance Engineering in 1 Prompt',
    whatItDoes: 'The flagship autonomous agent mission. Runs a 10-step full-lifecycle optimization: scans project structure, audits media, builds asset dependency graph, computes potential savings, downscales images, converts to WebP/AVIF, generates source AST diffs for JSX/TSX, verifies reductions, checks regression guard, and returns a <200 token executive briefing with rollback capability.',
    promptExample: 'Run an autonomous performance mission on my project in safe review mode. Audit all media, project size savings, and generate safe source diffs without breaking existing layouts.',
    safety: 'Safe (Non-Destructive)',
    keyParams: [
      { name: 'projectPath', type: 'string', required: true, description: 'Project root directory path (e.g. . or C:/my-app)' },
      { name: 'mode', type: 'string', default: 'safe', description: 'Execution mode: "safe" (non-destructive), "review" (dry-run diffs), "aggressive" (overwrite source)' },
      { name: 'dryRun', type: 'boolean', default: 'false', description: 'When true, simulates full mission without modifying any disk files' },
      { name: 'format', type: 'string', default: 'webp', description: 'Target modern format ("webp" or "avif")' },
      { name: 'maxDimension', type: 'number', default: '1920', description: 'Max width/height in px for downscaling oversized assets' },
      { name: 'quality', type: 'number', default: '82', description: 'Compression quality from 1 to 100' },
      { name: 'applySourcePatches', type: 'boolean', default: 'false', description: 'Automatically apply generated source code diffs to JSX/TSX' },
      { name: 'detailLevel', type: 'string', default: 'compact', description: 'Token budget preset: "compact" (<200 tokens), "standard", "detailed", "raw"' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "status": "dry_run_complete",
    "missionId": "mission_mtspub_9x",
    "scoreBefore": 86,
    "scoreAfter": 96,
    "scoreDelta": 10,
    "assetsAnalyzed": 10,
    "assetsOptimized": 3,
    "bytesSavedFormatted": "52.5 KB",
    "assetReductionPercent": "89.2%",
    "lcpBefore": "1450ms",
    "lcpAfter": "620ms",
    "rollbackAvailable": true
  }
}`
  },
  {
    name: 'analyze_web_assets',
    domain: 'Auditing & Diagnostics',
    tagline: 'Comprehensive Media Performance Audit & Score (0-100)',
    whatItDoes: 'Recursively scans all media assets in a project or directory, computes an overall media performance score (0-100), detects oversized images, inefficient formats, missing responsive srcset opportunities, visual duplicates, and calculates exact potential byte savings.',
    promptExample: 'Audit all media assets in ./public and tell me my website\'s media performance score, potential byte savings, and Largest Contentful Paint candidates.',
    safety: 'Safe (Read-Only)',
    keyParams: [
      { name: 'directoryPath', type: 'string', description: 'Project directory or asset directory to analyze. Defaults to current directory.' },
      { name: 'recursive', type: 'boolean', default: 'true', description: 'Whether to recursively scan nested subdirectories' },
      { name: 'detailLevel', type: 'string', default: 'compact', description: 'Detail level: compact (default), standard, detailed, raw' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "score": 86,
    "framework": "modern_web",
    "totalAssets": 10,
    "totalSizeFormatted": "76.5 KB",
    "potentialSavingsFormatted": "52.5 KB",
    "issueCount": 8,
    "nextAction": "generate_optimization_plan"
  }
}`
  },
  {
    name: 'find_unused_assets',
    domain: 'Asset Graph & AST',
    tagline: 'Dead Asset Intelligence & Safe Pruning Verification',
    whatItDoes: 'Builds an AST dependency graph mapping Routes -> Components -> Image Imports. Detects all dead, orphaned, or unreferenced images in ./public, categorizing them by safety rating (SAFE, LIKELY, UNCERTAIN) to prevent breaking dynamic runtime URLs.',
    promptExample: 'Scan our codebase AST and find all dead, orphaned, or unreferenced images in ./public that are safe to delete.',
    safety: 'Safe (Read-Only)',
    keyParams: [
      { name: 'projectPath', type: 'string', required: true, description: 'Project root directory path' },
      { name: 'detailLevel', type: 'string', default: 'compact', description: 'Token budget preset: compact, standard, detailed' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "totalUnusedFound": 11,
    "totalWasteFormatted": "35.1 KB",
    "confidenceLevel": "SAFE",
    "nextAction": "prune_or_archive"
  }
}`
  },
  {
    name: 'get_asset_usage',
    domain: 'Asset Graph & AST',
    tagline: 'Trace Asset References Across Components, Routes & LCP',
    whatItDoes: 'Inspects a specific image asset in the project graph: traces every page route and component that references it, rendered dimensions in JSX, whether it is flagged as the LCP priority element, and calculates a risk rating (LOW/MEDIUM/HIGH) for modifying it.',
    promptExample: 'Check the usage of hero.png across our codebase: which pages and components use it, and is it an LCP candidate?',
    safety: 'Safe (Read-Only)',
    keyParams: [
      { name: 'projectPath', type: 'string', required: true, description: 'Project root directory path' },
      { name: 'assetPath', type: 'string', required: true, description: 'Path or file name of the asset to inspect (e.g. hero.png)' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "assetPath": "sample_photo1.png",
    "referenceCount": 1,
    "routes": ["/"],
    "components": ["src/Header.jsx"],
    "isLcpCandidate": false,
    "riskRating": "LOW"
  }
}`
  },
  {
    name: 'find_oversized_assets',
    domain: 'Auditing & Diagnostics',
    tagline: 'Detect Images Exceeding Viewport Bounds & Byte Limits',
    whatItDoes: 'Identifies all images whose pixel width/height or file size exceed responsive web thresholds (default: >1920px or >500KB), reporting exact bandwidth waste caused by serving raw desktop photos to web users.',
    promptExample: 'Find all oversized images exceeding 1920px or 500KB in ./public and calculate how much bandwidth we can save by downscaling them.',
    safety: 'Safe (Read-Only)',
    keyParams: [
      { name: 'directoryPath', type: 'string', description: 'Directory path to inspect (defaults to current directory)' },
      { name: 'maxDimension', type: 'number', default: '1920', description: 'Maximum allowable pixel dimension' },
      { name: 'maxSizeBytes', type: 'number', default: '512000', description: 'Maximum file size in bytes (default: 500 KB)' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "totalOversizedFound": 6,
    "potentialSavingsFormatted": "45.2 KB",
    "recommendations": ["Downscale oversized images to max 1920px width and convert to WebP/AVIF."]
  }
}`
  },
  {
    name: 'find_inefficient_formats',
    domain: 'Auditing & Diagnostics',
    tagline: 'Locate Legacy PNG/JPEG Assets for Modern Codec Migration',
    whatItDoes: 'Scans for non-transparent PNGs, uncompressed JPEGs, and legacy bitmaps that can be dramatically reduced (typically 60-90%) by modernizing to WebP or AVIF formats.',
    promptExample: 'Identify all legacy PNG and JPEG assets in ./public that should be converted to modern WebP or AVIF formats.',
    safety: 'Safe (Read-Only)',
    keyParams: [
      { name: 'directoryPath', type: 'string', description: 'Directory path to inspect' },
      { name: 'detailLevel', type: 'string', default: 'compact', description: 'compact, standard, detailed' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "totalInefficientFound": 3,
    "potentialSavingsFormatted": "52.5 KB",
    "topIssues": ["sample_photo1.png (PNG) -> recommend WEBP"]
  }
}`
  },
  {
    name: 'find_duplicate_assets',
    domain: 'Auditing & Diagnostics',
    tagline: 'Perceptual Visual Duplicate Detection via 64-bit dHash',
    whatItDoes: 'Employs perceptual difference hashing (dHash) to group visually duplicate, resized, or identical assets across folders, finding redundant files even if file names or binary byte hashes differ.',
    promptExample: 'Use perceptual hashing to find duplicate or visually identical images across my project folders so we can eliminate redundant copies.',
    safety: 'Safe (Read-Only)',
    keyParams: [
      { name: 'directoryPath', type: 'string', description: 'Directory path to inspect' },
      { name: 'similarityThreshold', type: 'number', default: '93.75', description: 'Perceptual similarity percentage threshold (default: 93.75%)' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "totalDuplicateGroups": 1,
    "potentialSavingsFormatted": "12.4 KB",
    "topIssues": ["sample_photo1.png: 2 redundant copies (100% similarity)"]
  }
}`
  },
  {
    name: 'find_responsive_opportunities',
    domain: 'Auditing & Diagnostics',
    tagline: 'Identify High-Res Images Missing Responsive Srcset Variants',
    whatItDoes: 'Detects single-resolution desktop assets that serve full multi-megabyte payloads to mobile screens, calculating potential cellular transfer savings from generating 640w, 1024w, and 1920w responsive variants.',
    promptExample: 'Find all images in ./public that lack responsive srcset variants and are serving oversized desktop payloads to mobile devices.',
    safety: 'Safe (Read-Only)',
    keyParams: [
      { name: 'directoryPath', type: 'string', description: 'Directory path to inspect' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "totalOpportunitiesFound": 6,
    "topIssues": ["sample_photo1.png (1920x1080): missing responsive srcset variants"]
  }
}`
  },
  {
    name: 'test_web_performance',
    domain: 'Auditing & Diagnostics',
    tagline: 'Simulated 4G Mobile Performance & LCP Bottleneck Audit',
    whatItDoes: 'Audits local project directories or live websites, calculating overall performance scores, total payload weights, simulated 4G mobile cellular download latencies, and pinpointing Largest Contentful Paint (LCP) candidates.',
    promptExample: 'Run a simulated 4G mobile performance test on this project and report estimated LCP and bandwidth bottlenecks.',
    safety: 'Safe (Read-Only)',
    keyParams: [
      { name: 'url', type: 'string', description: 'Target website URL (e.g. http://localhost:3000 or https://example.com)' },
      { name: 'localPath', type: 'string', description: 'Local project folder or HTML build directory to test' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "testId": "test_mtspva50_9npz",
    "score": 86,
    "totalSizeFormatted": "76.5 KB",
    "potentialSavingsFormatted": "52.5 KB",
    "estimatedTransferTime4GMs": 157
  }
}`
  },
  {
    name: 'get_web_performance_summary',
    domain: 'Auditing & Diagnostics',
    tagline: 'Instant In-Memory Retrieval of Past Performance Audit',
    whatItDoes: 'Instantly fetches cached audit score breakdowns and metric summaries for any previous test ID without re-executing disk or network scans.',
    promptExample: 'Retrieve the performance test summary and score breakdown for our previous test run.',
    safety: 'Safe (Read-Only)',
    keyParams: [
      { name: 'testId', type: 'string', description: 'Test ID of previous audit. Defaults to most recent test.' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "testId": "test_mtspva50_9npz",
    "score": 86,
    "totalAssets": 10,
    "potentialSavingsFormatted": "52.5 KB"
  }
}`
  },
  {
    name: 'compare_web_performance',
    domain: 'Auditing & Diagnostics',
    tagline: 'Before-and-After Metric Diffing & Verified Gains',
    whatItDoes: 'Compares two performance audit IDs, computing net score deltas, total byte savings, percentage payload reduction, and Core Web Vitals improvements.',
    promptExample: 'Compare our baseline performance test with our latest post-optimization test and report the net improvements.',
    safety: 'Safe (Read-Only)',
    keyParams: [
      { name: 'beforeTestId', type: 'string', required: true, description: 'Test ID before optimization' },
      { name: 'afterTestId', type: 'string', required: true, description: 'Test ID after optimization' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "scoreBefore": 86,
    "scoreAfter": 96,
    "scoreDelta": 10,
    "savedBytes": "52.5 KB",
    "reductionPercent": "68.6%"
  }
}`
  },
  {
    name: 'inspect_project',
    domain: 'Asset Graph & AST',
    tagline: 'Framework Discovery, Route Structure & Asset Resolution',
    whatItDoes: 'Inspects project root, detects framework (Next.js App/Pages Router, Vite, Astro, Remix, Nuxt), identifies source routes, component directories, public asset roots, and indexes source code references.',
    promptExample: 'Inspect this repository to detect the framework, route structure, public asset folders, and component tree.',
    safety: 'Safe (Read-Only)',
    keyParams: [
      { name: 'projectPath', type: 'string', required: true, description: 'Project root directory path' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "framework": "modern_web",
    "frameworkVariant": "react",
    "routesDir": "src",
    "componentsDir": "src",
    "sourceFilesCount": 1,
    "assetFilesCount": 15
  }
}`
  },
  {
    name: 'check_performance_budget',
    domain: 'Budget & Runtime',
    tagline: 'CI/CD & PR Budget Guard: Prevent Performance Regressions',
    whatItDoes: 'Evaluates project media payload against configurable performance budget thresholds (max total size, max individual asset size, max LCP candidate size, minimum WebP/AVIF adoption). Returns PASS / WARN / FAIL status.',
    promptExample: 'Evaluate our project\'s media assets against our performance budget thresholds and fail if total payload exceeds limits.',
    safety: 'Safe (Read-Only)',
    keyParams: [
      { name: 'projectPath', type: 'string', required: true, description: 'Project root directory path' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "status": "PASS",
    "passedCount": 2,
    "warnCount": 0,
    "failCount": 0,
    "rules": [
      { "metric": "totalMediaSize", "actual": "76.5 KB", "limit": "500 KB", "status": "PASS" }
    ]
  }
}`
  },
  {
    name: 'verify_runtime_performance',
    domain: 'Budget & Runtime',
    tagline: 'Real Runtime Core Web Vitals (LCP, FCP, CLS)',
    whatItDoes: 'Measures live Largest Contentful Paint (LCP), First Contentful Paint (FCP), and Cumulative Layout Shift (CLS) via headless browser session, with transparent fallback to SIMULATED measurement if headless browser is unavailable.',
    promptExample: 'Measure real runtime Core Web Vitals (LCP, FCP, CLS) for our homepage.',
    safety: 'Safe (Read-Only)',
    keyParams: [
      { name: 'targetUrl', type: 'string', required: true, description: 'URL to evaluate (e.g. http://localhost:3000)' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "measurementType": "SIMULATED",
    "lcpMs": 1450,
    "fcpMs": 850,
    "cls": 0.02
  }
}`
  },
  {
    name: 'generate_optimization_plan',
    domain: 'Execution & Patching',
    tagline: 'Non-Destructive Optimization Blueprint with Actionable Plan ID',
    whatItDoes: 'Creates a deterministic optimization plan without modifying source files. Calculates target formats, downscale factors, compression quality, and projected byte savings per file, generating an immutable planId.',
    promptExample: 'Generate a non-destructive optimization plan for ./public converting images to WebP at 82% quality with a max width of 1920px.',
    safety: 'Safe (Non-Destructive)',
    keyParams: [
      { name: 'directoryPath', type: 'string', description: 'Directory path to optimize' },
      { name: 'format', type: 'string', default: 'webp', description: 'Preferred format (webp or avif)' },
      { name: 'quality', type: 'number', default: '82', description: 'Compression quality 1-100' },
      { name: 'maxDimension', type: 'number', default: '1920', description: 'Max width/height for downscaling' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "planId": "plan_mtspva5j_g1t1",
    "actionsCount": 3,
    "estimatedBefore": "58.9 KB",
    "estimatedAfter": "6.4 KB",
    "estimatedReductionPercent": "89.2%",
    "nextAction": "optimize_web_assets"
  }
}`
  },
  {
    name: 'optimize_web_assets',
    domain: 'Execution & Patching',
    tagline: 'Batch Engine Execution with Automated Pre-Execution Backups',
    whatItDoes: 'Executes an optimization plan. By default writes non-destructively to ./.photonow/optimized. If overwriteSource is enabled, automatically creates timestamped backups in ./.photonow/backups/ before replacing files.',
    promptExample: 'Execute optimization plan <planId> and save the compressed images to our safe output directory.',
    safety: 'Safe (Non-Destructive)',
    keyParams: [
      { name: 'planId', type: 'string', required: true, description: 'Plan ID generated by generate_optimization_plan' },
      { name: 'overwriteSource', type: 'boolean', default: 'false', description: 'If true, creates backup and replaces original files' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "planId": "plan_mtspva5j_g1t1",
    "totalProcessed": 3,
    "succeeded": 3,
    "actualSaved": "52.5 KB",
    "actualReductionPercent": "89.2%"
  }
}`
  },
  {
    name: 'verify_optimization',
    domain: 'Execution & Patching',
    tagline: 'Post-Execution Validation & Self-Contained HTML Report',
    whatItDoes: 'Validates actual on-disk byte reductions after optimization, ensures visual fidelity, and optionally generates a self-contained local HTML or Markdown performance audit report.',
    promptExample: 'Verify the byte savings from our recent optimization plan and generate a local HTML performance report.',
    safety: 'Safe (Read-Only)',
    keyParams: [
      { name: 'planId', type: 'string', required: true, description: 'Plan ID to verify' },
      { name: 'generateReport', type: 'boolean', default: 'true', description: 'Generate local HTML report' },
      { name: 'reportFormat', type: 'string', default: 'html', description: 'html, markdown, or json' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "planId": "plan_mtspva5j_g1t1",
    "reductionPercent": "89.2%",
    "savedBytes": "52.5 KB",
    "reportSavedPath": ".photonow/reports/performance_report_1788874678825.html"
  }
}`
  },
  {
    name: 'generate_source_patch',
    domain: 'Execution & Patching',
    tagline: 'AST-Based Unified Diffs for JSX, TSX & HTML Image References',
    whatItDoes: 'Parses codebase source files using Babel AST to locate references to optimized images (e.g. <img src="..."> or next/image), generating git-style unified diffs updating extensions to .webp/.avif.',
    promptExample: 'Generate unified diffs updating our JSX/TSX image imports and src tags to point to the newly optimized WebP assets.',
    safety: 'Safe (Non-Destructive)',
    keyParams: [
      { name: 'projectPath', type: 'string', required: true, description: 'Project root directory path' },
      { name: 'planId', type: 'string', required: true, description: 'Optimization plan ID' },
      { name: 'dryRun', type: 'boolean', default: 'false', description: 'Generate preview diff without caching patch' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "patchId": "patch_mtspvaex_sa04",
    "actionsCount": 2,
    "affectedFilesCount": 1,
    "affectedFiles": ["src/Header.jsx"],
    "diffPreview": "--- src/Header.jsx\\n+++ src/Header.jsx\\n@@ -6,2 +6,2 @@\\n-      <img src=\\"sample_photo1.png\\"\\n+      <img src=\\"sample_photo1.webp\\""
  }
}`
  },
  {
    name: 'apply_source_patch',
    domain: 'Execution & Patching',
    tagline: 'Safe Patch Applicator with Atomic Rollback Manifests',
    whatItDoes: 'Applies generated unified diffs to source files on disk. Automatically backs up every modified file in .photonow/backups/<operationId>/ and writes an atomic rollback manifest.',
    promptExample: 'Apply source patch <patchId> to our codebase with automated backups enabled so we can rollback if needed.',
    safety: 'Safe (Atomic Rollback)',
    keyParams: [
      { name: 'projectPath', type: 'string', required: true, description: 'Project root directory path' },
      { name: 'patchId', type: 'string', required: true, description: 'Patch ID from generate_source_patch' },
      { name: 'confirmApply', type: 'boolean', required: true, description: 'Must be true to confirm source modification' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "operationId": "op_mtspvaf0_3wlv",
    "filesPatched": 1,
    "backupDir": ".photonow/backups/op_mtspvaf0_3wlv",
    "canRollback": true
  }
}`
  },
  {
    name: 'rollback_operation',
    domain: 'Execution & Patching',
    tagline: '1-Click Atomic Rollback: Restores Original Code & Media',
    whatItDoes: 'Reads the operation manifest for an operationId and restores all original source code files and media assets from timestamped backups, returning the workspace to its exact prior state.',
    promptExample: 'Rollback operation <operationId> and restore all original source files and images from backup.',
    safety: 'Safe (Restores Original Files)',
    keyParams: [
      { name: 'projectPath', type: 'string', required: true, description: 'Project root directory path' },
      { name: 'operationId', type: 'string', required: true, description: 'Operation ID to rollback (e.g. op_abc123)' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "operationId": "op_mtspvaf0_3wlv",
    "restoredSourcesCount": 1,
    "restoredAssetsCount": 0,
    "message": "Rollback completed successfully. Restored 1 source files."
  }
}`
  },
  {
    name: 'convert_image',
    domain: 'Multimedia Foundation',
    tagline: 'High-Performance Sharp Image Conversion (WebP, AVIF, PNG, JPEG)',
    whatItDoes: 'Converts any single image to modern WebP, AVIF, PNG, or JPEG format with customizable quality, downscaling dimensions, rotation, grayscale, or ink sketch filters using native libvips Sharp.',
    promptExample: 'Convert hero.png to modern WebP format at 80% quality with a maximum width of 1920px.',
    safety: 'Configurable Output',
    keyParams: [
      { name: 'inputPath', type: 'string', required: true, description: 'Path to source image file' },
      { name: 'format', type: 'string', default: 'webp', description: 'Target format: webp, png, jpeg, avif' },
      { name: 'quality', type: 'number', default: '82', description: 'Quality 1-100 or 0.1-1.0' },
      { name: 'maxWidth', type: 'number', description: 'Downscale max width in px' }
    ],
    outputSample: `{
  "status": "success",
  "message": "Successfully converted hero.png to WEBP at 80% quality (91.2% size reduction)",
  "convertedPath": "hero.webp",
  "savedBytes": 39295
}`
  },
  {
    name: 'convert_batch',
    domain: 'Multimedia Foundation',
    tagline: 'Recursive Multi-Threaded Batch Media Converter',
    whatItDoes: 'High-throughput batch conversion tool that processes entire directory trees in parallel with recursive scanning, automatically ignoring .git, node_modules, and cache folders.',
    promptExample: 'Batch convert all PNG and JPEG images in ./assets to WebP at 85% quality into a new /optimized folder.',
    safety: 'Configurable Output',
    keyParams: [
      { name: 'directoryPath', type: 'string', description: 'Folder containing images to batch convert' },
      { name: 'outputDir', type: 'string', description: 'Destination folder for converted files' },
      { name: 'format', type: 'string', default: 'webp', description: 'Target format (webp, png, jpeg, avif)' },
      { name: 'quality', type: 'number', default: '82', description: 'Compression quality' }
    ],
    outputSample: `{
  "status": "success",
  "summary": {
    "totalScanned": 4,
    "succeeded": 4,
    "failed": 0,
    "totalSaved": "52.5 KB",
    "totalSavedPercent": "83.9%"
  }
}`
  },
  {
    name: 'convert_video',
    domain: 'Multimedia Foundation',
    tagline: 'FFmpeg Video Transcoding to WebM/MP4 with Downscaling & Bitrate Control',
    whatItDoes: 'Transcodes video files (MP4, MOV, MKV, AVI) to high-efficiency WebM or MP4 using bundled static FFmpeg binaries, supporting downscaling, custom bitrates, and audio stripping.',
    promptExample: 'Convert promo_video.mov to WebM with 720p resolution and 1.5 Mbps bitrate for web streaming.',
    safety: 'Configurable Output',
    keyParams: [
      { name: 'inputPath', type: 'string', required: true, description: 'Path to source video file' },
      { name: 'format', type: 'string', default: 'webm', description: 'Target format: webm, mp4, mkv' },
      { name: 'preset', type: 'string', default: 'fast', description: 'Encoding preset (ultrafast, fast, medium, slow)' },
      { name: 'maxWidth', type: 'number', description: 'Downscale maximum width' }
    ],
    outputSample: `{
  "status": "success",
  "message": "Successfully converted video sample_video.mp4 to WEBM in 0.33s",
  "outputPath": "sample_video.webm"
}`
  },
  {
    name: 'convert_audio',
    domain: 'Multimedia Foundation',
    tagline: 'High-Fidelity Audio Transcoding (MP3, WAV, AAC, M4A, FLAC, OGG)',
    whatItDoes: 'Transcodes audio tracks between MP3, WAV, AAC, M4A, FLAC, and OGG formats with customizable bitrates (128k, 192k, 320k) and sample rates (44100Hz, 48000Hz).',
    promptExample: 'Convert voiceover.wav to compact 192kbps MP3 audio.',
    safety: 'Configurable Output',
    keyParams: [
      { name: 'inputPath', type: 'string', required: true, description: 'Path to source audio file' },
      { name: 'format', type: 'string', default: 'mp3', description: 'Target format: mp3, wav, aac, flac, ogg' },
      { name: 'bitrate', type: 'string', default: '192k', description: 'Target bitrate (e.g. 128k, 192k, 320k)' }
    ],
    outputSample: `{
  "status": "success",
  "message": "Successfully converted audio sample_audio.mp3 to WAV in 0.06s",
  "outputPath": "sample_audio.wav"
}`
  },
  {
    name: 'extract_audio',
    domain: 'Multimedia Foundation',
    tagline: 'Direct Audio Track Demuxing from Video Streams',
    whatItDoes: 'Extracts the audio stream from any video file (MP4, MKV, MOV, WebM) and encodes it directly into MP3, WAV, or AAC without re-encoding the video.',
    promptExample: 'Extract the audio from meeting_recording.mp4 and save it as a high-quality MP3.',
    safety: 'Configurable Output',
    keyParams: [
      { name: 'inputPath', type: 'string', required: true, description: 'Path to source video file' },
      { name: 'outputFormat', type: 'string', default: 'mp3', description: 'Audio format: mp3, wav, aac, m4a, flac, ogg' },
      { name: 'bitrate', type: 'string', default: '192k', description: 'Bitrate (e.g. 192k)' }
    ],
    outputSample: `{
  "status": "success",
  "message": "Successfully extracted MP3 audio (stereo, 192k) from sample_video.mp4 in 0.20s",
  "outputPath": "sample_video.mp3"
}`
  },
  {
    name: 'extract_poster_frame',
    domain: 'Multimedia Foundation',
    tagline: 'Video Thumbnail Extraction at Exact Seconds Timestamp',
    whatItDoes: 'Captures a high-resolution video frame at any specified timestamp (e.g. 0.5s, 2.0s) and outputs a crisp, compressed WebP or JPEG poster thumbnail for web video players.',
    promptExample: 'Extract a poster thumbnail frame from demo.mp4 at 1.5 seconds as a WebP image.',
    safety: 'Configurable Output',
    keyParams: [
      { name: 'inputPath', type: 'string', required: true, description: 'Path to source video file' },
      { name: 'timestamp', type: 'number', default: '0.5', description: 'Timestamp in seconds' },
      { name: 'format', type: 'string', default: 'webp', description: 'Output format (webp, jpeg, png)' }
    ],
    outputSample: `{
  "status": "success",
  "message": "Successfully extracted poster frame at 0.5s as WEBP (3.0 KB)",
  "outputPath": "demo_poster_0.5s.webp"
}`
  },
  {
    name: 'get_media_info',
    domain: 'Multimedia Foundation',
    tagline: 'Unified Media Inspector (Sharp Dimensions + FFprobe Codecs)',
    whatItDoes: 'Inspects any image, video, or audio file: extracts dimensions, channels, EXIF, alpha transparency, codec, sample rate, duration, and stream bitrate.',
    promptExample: 'Inspect the exact video codec, resolution, audio channels, and bitrate of video_asset.mp4.',
    safety: 'Safe (Read-Only)',
    keyParams: [
      { name: 'filePath', type: 'string', required: true, description: 'Path to media file to inspect' }
    ],
    outputSample: `{
  "mediaType": "image",
  "format": "png",
  "dimensions": "1920x1080",
  "fileSizeFormatted": "42.1 KB",
  "hasAlpha": true
}`
  },
  {
    name: 'optimize_for_agent',
    domain: 'Multimedia Foundation',
    tagline: 'AI Vision Context Optimizer: Downscale Screenshots to Save Tokens',
    whatItDoes: 'Downscales high-resolution UI screenshots or photos into compact WebP under a specified maximum dimension (default: 1280px) to drastically reduce vision model token consumption in Claude, Cursor, and Antigravity context windows.',
    promptExample: 'Downscale this full-page screenshot for your AI vision context window so it consumes minimal tokens while keeping text legible.',
    safety: 'Safe (Non-Destructive)',
    keyParams: [
      { name: 'inputPath', type: 'string', required: true, description: 'Path to high-resolution screenshot or image' },
      { name: 'maxDimension', type: 'number', default: '1280', description: 'Max width/height in px for LLM vision models' }
    ],
    outputSample: `{
  "status": "success",
  "message": "Image optimized for AI context window: 5.8 KB -> 856.0 B (85.5% savings)",
  "optimizedFilePath": "screenshot_agent_opt.webp"
}`
  },
  {
    name: 'analyze_media',
    domain: 'Auditing & Diagnostics',
    tagline: 'Single Asset Deep Inspector & Core Web Vitals Flagging',
    whatItDoes: 'Deep analysis of a single asset file on disk: detects whether it is an LCP candidate, checks for missing responsive variants, and estimates byte savings if converted to WebP or downscaled.',
    promptExample: 'Inspect hero-banner.png and tell me if its dimensions or format are hurting our Core Web Vitals.',
    safety: 'Safe (Read-Only)',
    keyParams: [
      { name: 'filePath', type: 'string', required: true, description: 'Path to image file to analyze' },
      { name: 'detailLevel', type: 'string', default: 'compact', description: 'compact, standard, detailed' }
    ],
    outputSample: `{
  "ok": true,
  "summary": {
    "path": "sample_photo1.png",
    "format": "png",
    "dimensions": "1920x1080",
    "potentialSavingsFormatted": "35.2 KB",
    "issueCount": 2
  }
}`
  }
];

export const McpDeveloperHub: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [copiedConfig, setCopiedConfig] = useState<boolean>(false);
  const [configTab, setConfigTab] = useState<'claude' | 'cursor' | 'antigravity' | 'npx'>('claude');
  const [expandedTool, setExpandedTool] = useState<string | null>('optimize_project');

  // Live RPC Test states
  const [rpcTool, setRpcTool] = useState<string>('test_web_performance');
  const [rpcLoading, setRpcLoading] = useState<boolean>(false);
  const [rpcResult, setRpcResult] = useState<string | null>(null);

  const domains = ['All', 'Autonomous Missions', 'Auditing & Diagnostics', 'Asset Graph & AST', 'Execution & Patching', 'Multimedia Foundation', 'Budget & Runtime'];

  const filteredTools = useMemo(() => {
    return MCP_DEVELOPER_CATALOG.filter((t) => {
      const matchDomain = selectedDomain === 'All' || t.domain === selectedDomain;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        t.name.toLowerCase().includes(q) ||
        t.tagline.toLowerCase().includes(q) ||
        t.whatItDoes.toLowerCase().includes(q) ||
        t.promptExample.toLowerCase().includes(q);
      return matchDomain && matchQuery;
    });
  }, [selectedDomain, searchQuery]);

  const handleCopyPrompt = (prompt: string, toolName: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(toolName);
    setTimeout(() => setCopiedPrompt(null), 2500);
  };

  const getClientConfig = () => {
    if (configTab === 'claude') {
      return {
        mcpServers: {
          photoConvert: {
            command: 'node',
            args: ['./bin/mcp-server.mjs']
          }
        }
      };
    }
    if (configTab === 'cursor') {
      return {
        mcpServers: {
          photoConvert: {
            command: 'node',
            args: ['c:/Users/sibas/OneDrive/Desktop/Projects/photoNow/bin/mcp-server.mjs']
          }
        }
      };
    }
    if (configTab === 'antigravity') {
      return {
        mcpServers: {
          photoNow: {
            command: 'npx',
            args: ['-y', 'photo-convert-mcp']
          }
        }
      };
    }
    return { command: 'npx photo-convert-mcp' };
  };

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(getClientConfig(), null, 2));
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const handleRunLiveRpc = async () => {
    setRpcLoading(true);
    setRpcResult(null);
    try {
      const payload = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: rpcTool,
          arguments: rpcTool === 'test_web_performance'
            ? { url: 'https://example.com' }
            : rpcTool === 'convert_image'
            ? { format: 'webp', quality: 0.85 }
            : rpcTool === 'inspect_project'
            ? { projectPath: '.' }
            : { directoryPath: '.' }
        }
      };
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setRpcResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setRpcResult(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setRpcLoading(false);
    }
  };

  return (
    <div className="hand-box" style={{ padding: 'clamp(16px, 3vw, 28px)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* HEADER NOTICE */}
      <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ background: 'var(--ink)', color: 'var(--ink-inverted)', padding: '2px 8px', fontSize: '11px', fontWeight: 700, borderRadius: '2px' }}>
                [MCP-FIRST SYSTEM]
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-gray)' }}>
                LOCAL DISK AST & ZERO-PERMISSION TOOLCALLING
              </span>
            </div>
            <h2 className="marker-font" style={{ fontSize: 'clamp(22px, 3vw, 28px)', margin: 0 }}>
              DEVELOPER MCP HUB: WHAT TOOL CALLING DOES WHAT.
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, background: 'var(--paper-tint)', padding: '4px 10px', border: '1px solid var(--ink)', borderRadius: '2px' }}>
              29 MCP TOOLS VERIFIED
            </span>
          </div>
        </div>

        {/* MCP EXCLUSIVE ARCHITECTURE CALLOUT */}
        <div style={{
          marginTop: '14px',
          padding: '12px 14px',
          background: 'var(--paper-tint)',
          borderLeft: '4px solid var(--ink)',
          fontSize: '12px',
          lineHeight: '1.5',
        }}>
          <strong>⚡ Why Performance is MCP-Only:</strong> Web apps in browser tabs and cloud serverless lambdas lack direct filesystem permissions to parse local ASTs, update your React component imports, or execute atomic disk rollbacks. PhotoNow runs natively on your machine via the <strong>Model Context Protocol (MCP)</strong>. Point your AI agent (Claude Desktop, Cursor, Antigravity) to PhotoNow and prompt it naturally—the agent invokes the exact tools below with zero manual terminal approvals.
        </div>
      </div>

      {/* QUICK CLIENT SETUP TABS */}
      <div style={{ border: '2px solid var(--ink)', padding: '16px', background: '#FAFAF8', borderRadius: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '13px' }}>
            [1. CONNECT MCP SERVER TO YOUR AGENT IN 30 SECONDS]
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['claude', 'cursor', 'antigravity', 'npx'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setConfigTab(tab)}
                className={`hand-btn ${configTab === tab ? 'active' : ''}`}
                style={{ padding: '3px 10px', fontSize: '11px', textTransform: 'uppercase' }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <pre style={{
            background: '#0A0A0A',
            color: '#F2F2F0',
            padding: '14px 16px',
            fontSize: '12px',
            borderRadius: '4px',
            overflowX: 'auto',
            fontFamily: 'var(--font-mono), monospace',
            margin: 0,
          }}>
            {JSON.stringify(getClientConfig(), null, 2)}
          </pre>
          <button
            onClick={handleCopyConfig}
            className="hand-btn"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '4px 12px',
              fontSize: '10px',
              background: copiedConfig ? 'var(--ink)' : '#222',
              color: '#fff',
              border: '1px solid #444',
            }}
          >
            {copiedConfig ? '✓ COPIED!' : 'COPY CONFIG'}
          </button>
        </div>
      </div>

      {/* SEARCH AND DOMAIN FILTER BAR */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search tools by name or prompt (e.g. unused, webp, lcp, budget, patch, video, mission)..."
            style={{
              flex: 1,
              minWidth: '260px',
              padding: '10px 14px',
              border: '2px solid var(--ink)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono), monospace',
              background: 'var(--bg-paper)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="hand-btn"
              style={{ padding: '8px 14px', fontSize: '11px' }}
            >
              [CLEAR]
            </button>
          )}
        </div>

        {/* DOMAIN BUTTONS */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {domains.map((dom) => (
            <button
              key={dom}
              onClick={() => setSelectedDomain(dom)}
              className={`hand-btn ${selectedDomain === dom ? 'active' : ''}`}
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              {dom === 'All' ? `ALL (${MCP_DEVELOPER_CATALOG.length})` : dom}
            </button>
          ))}
        </div>
      </div>

      {/* TOOL CARDS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-gray)' }}>
          SHOWING {filteredTools.length} OF {MCP_DEVELOPER_CATALOG.length} TOOLS:
        </div>

        {filteredTools.map((tool, idx) => {
          const isExpanded = expandedTool === tool.name;
          const isCopied = copiedPrompt === tool.name;

          return (
            <div
              key={tool.name}
              style={{
                border: '2px solid var(--ink)',
                borderRadius: '4px',
                background: isExpanded ? '#FFF' : '#FCFCF9',
                boxShadow: isExpanded ? '3px 3px 0 var(--ink)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {/* CARD TOP BAR */}
              <div
                onClick={() => setExpandedTool(isExpanded ? null : tool.name)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  borderBottom: isExpanded ? '1px dashed var(--ink-light)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-gray)', width: '24px' }}>
                    #{String(idx + 1).padStart(2, '0')}
                  </span>
                  <code style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    background: 'var(--paper-tint)',
                    padding: '3px 8px',
                    border: '1px solid var(--ink)',
                    borderRadius: '2px',
                  }}>
                    {tool.name}
                  </code>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-gray)' }}>
                    {tool.tagline}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    border: '1px solid var(--ink-light)',
                    borderRadius: '2px',
                    background: tool.safety.includes('Read-Only') ? '#E8F5E9' : tool.safety.includes('Non-Destructive') ? '#E3F2FD' : '#FFF3E0',
                  }}>
                    {tool.safety}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 700, background: 'var(--ink)', color: '#fff', padding: '2px 6px', borderRadius: '2px' }}>
                    {tool.domain}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* EXPANDED CONTENT */}
              {isExpanded && (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* WHAT IT DOES */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-gray)', marginBottom: '4px' }}>
                      [WHAT IT DOES IN DETAIL]:
                    </div>
                    <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
                      {tool.whatItDoes}
                    </p>
                  </div>

                  {/* EXACT PROMPT TO USE */}
                  <div style={{
                    background: '#F6F6F2',
                    border: '2px solid var(--ink)',
                    padding: '12px 14px',
                    borderRadius: '3px',
                    position: 'relative',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink)' }}>
                        💬 WHAT PROMPT TO GIVE YOUR AI AGENT (CLAUDE / CURSOR / ANTIGRAVITY):
                      </span>
                      <button
                        onClick={() => handleCopyPrompt(tool.promptExample, tool.name)}
                        className="hand-btn"
                        style={{
                          padding: '3px 10px',
                          fontSize: '10px',
                          background: isCopied ? 'var(--ink)' : 'var(--bg-paper)',
                          color: isCopied ? 'var(--ink-inverted)' : 'var(--ink)',
                        }}
                      >
                        {isCopied ? '✓ PROMPT COPIED!' : '📋 COPY PROMPT'}
                      </button>
                    </div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      fontStyle: 'italic',
                      lineHeight: '1.5',
                      color: 'var(--ink)',
                    }}>
                      &ldquo;{tool.promptExample}&rdquo;
                    </div>
                  </div>

                  {/* PARAMETERS TABLE */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-gray)', marginBottom: '8px' }}>
                      [TOOL ARGUMENTS / PARAMETERS]:
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'var(--paper-tint)', borderBottom: '1px solid var(--ink)' }}>
                            <th style={{ padding: '6px 8px' }}>Param</th>
                            <th style={{ padding: '6px 8px' }}>Type</th>
                            <th style={{ padding: '6px 8px' }}>Required</th>
                            <th style={{ padding: '6px 8px' }}>Default</th>
                            <th style={{ padding: '6px 8px' }}>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tool.keyParams.map((p) => (
                            <tr key={p.name} style={{ borderBottom: '1px solid var(--ink-light)' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{p.name}</td>
                              <td style={{ padding: '6px 8px', color: 'var(--ink-gray)' }}>{p.type}</td>
                              <td style={{ padding: '6px 8px', fontWeight: p.required ? 700 : 400 }}>{p.required ? 'YES' : 'No'}</td>
                              <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)' }}>{p.default || '-'}</td>
                              <td style={{ padding: '6px 8px' }}>{p.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SAMPLE OUTPUT */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-gray)', marginBottom: '4px' }}>
                      [SAMPLE GROUND-TRUTH RESPONSE]:
                    </div>
                    <pre style={{
                      background: '#0F0F0F',
                      color: '#E0E0DC',
                      padding: '10px 12px',
                      fontSize: '11px',
                      borderRadius: '3px',
                      overflowX: 'auto',
                      fontFamily: 'var(--font-mono)',
                      margin: 0,
                    }}>
                      {tool.outputSample}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* LIVE JSON-RPC TESTER ON HTTP */}
      <div style={{
        marginTop: '12px',
        border: '2px solid var(--ink)',
        background: '#FAF9F6',
        padding: '16px',
        borderRadius: '4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 800, margin: 0 }}>
              [2. INTERACTIVE MCP TOOLCALLING TESTER (/api/mcp)]
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--ink-gray)' }}>
              Test any tool call directly against the live JSON-RPC 2.0 endpoint in real-time.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={rpcTool}
              onChange={(e) => setRpcTool(e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid var(--ink)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                background: '#FFF',
              }}
            >
              {MCP_DEVELOPER_CATALOG.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.domain})
                </option>
              ))}
            </select>

            <button
              onClick={handleRunLiveRpc}
              disabled={rpcLoading}
              className="hand-btn"
              style={{ padding: '6px 14px', fontSize: '11px' }}
            >
              {rpcLoading ? '[CALLING MCP...]' : '[EXECUTE TOOLCALL]'}
            </button>
          </div>
        </div>

        {rpcResult && (
          <pre style={{
            background: '#000',
            color: '#A3E635',
            padding: '12px',
            fontSize: '11px',
            borderRadius: '4px',
            overflowX: 'auto',
            fontFamily: 'var(--font-mono)',
            maxHeight: '260px',
            margin: 0,
          }}>
            {rpcResult}
          </pre>
        )}
      </div>
    </div>
  );
};
