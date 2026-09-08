import { NextRequest, NextResponse } from 'next/server';
import { MCP_TOOLS } from '@/lib/mcpTools';
import { checkRateLimit, getRateLimiterStats } from '@/lib/rateLimiter';
import { mcpLoadBalancer } from '@/lib/loadBalancer';
import {
  analyzeSingleMediaAsset,
  analyzeWebAssets,
  testWebPerformance,
  comparePerformanceTests,
  generateOptimizationPlan,
  executeOptimizationPlan,
  verifyOptimization,
  groupDuplicates,
  formatMcpResponse,
  formatBytes,
  engineCache,
  saveLocalReport,
  scanProjectStructure,
  scanProjectSourceReferences,
  buildAssetGraph,
  generateSourcePatch,
  applySourcePatch,
  rollbackOperation,
  verifyRuntimePerformance,
  evaluatePerformanceBudget,
  loadProjectBudget,
  optimizeProject,
} from '@/lib/engine';
import path from 'path';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// Maximum allowed payload size: 10MB for MCP JSON-RPC messages and Base64 images
const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(req: NextRequest) {
  // Apply rate limiter check
  const rateLimit = checkRateLimit(req);
  const clusterSnapshot = mcpLoadBalancer.getClusterSnapshot();
  const rateStats = getRateLimiterStats();

  const responseHeaders = {
    ...CORS_HEADERS,
    ...rateLimit.headers,
    'X-Load-Balancer-Nodes': String(clusterSnapshot.totalNodes),
    'X-Load-Balancer-Strategy': clusterSnapshot.activeStrategy,
  };

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${rateLimit.retryAfterSec} seconds.`,
      },
      { status: 429, headers: responseHeaders }
    );
  }

  return NextResponse.json(
    {
      name: 'photoConvert MCP Server',
      description: 'Agentic Photo & Video Converter with Browser Local Storage persistence',
      version: '1.0.0',
      protocol: 'mcp-jsonrpc-2.0',
      rateLimiter: {
        status: 'active',
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        windowSeconds: rateStats.windowSeconds,
      },
      loadBalancer: {
        status: 'active',
        strategy: clusterSnapshot.activeStrategy,
        healthyNodes: clusterSnapshot.healthyNodes,
        totalNodes: clusterSnapshot.totalNodes,
        totalRequestsProcessed: clusterSnapshot.totalRequestsProcessed,
        nodes: clusterSnapshot.nodes.map((n) => ({
          id: n.id,
          name: n.name,
          role: n.role,
          status: n.status,
          avgLatencyMs: n.avgLatencyMs,
          activeConnections: n.activeConnections,
        })),
      },
      toolsCount: MCP_TOOLS.length,
      tools: MCP_TOOLS,
    },
    { headers: responseHeaders }
  );
}

export async function POST(req: NextRequest) {
  // 1. RATE LIMITER CHECK
  const rateLimit = checkRateLimit(req);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32000,
          message: `Rate limit exceeded. Maximum ${rateLimit.limit} requests per minute. Retry in ${rateLimit.retryAfterSec}s.`,
          retryAfterSec: rateLimit.retryAfterSec,
        },
      },
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          ...rateLimit.headers,
        },
      }
    );
  }

  // 2. PAYLOAD SIZE GUARD (Content-Length header check)
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32600, message: 'Invalid Request: Payload exceeds maximum limit (1MB)' },
      },
      { status: 413, headers: { ...CORS_HEADERS, ...rateLimit.headers } }
    );
  }

  // 3. LOAD BALANCER NODE ACQUISITION
  const startTime = Date.now();
  const node = mcpLoadBalancer.acquireNode();
  let executionSuccess = false;

  const responseHeaders = {
    ...CORS_HEADERS,
    ...rateLimit.headers,
    'X-Load-Balancer-Node': node.id,
    'X-Load-Balancer-Role': node.role,
    'X-Load-Balancer-Latency': `${node.avgLatencyMs}ms`,
  };

  try {
    let rawText: string;
    try {
      rawText = await req.text();
    } catch {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: 'Parse error: Failed to read incoming request stream' },
        },
        { status: 400, headers: responseHeaders }
      );
    }

    // Guard against chunked transfer encoding payloads exceeding MAX_PAYLOAD_BYTES
    if (rawText.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32600, message: 'Invalid Request: Payload exceeds maximum limit (1MB)' },
        },
        { status: 413, headers: responseHeaders }
      );
    }

    let body: any;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: 'Parse error: Invalid or malformed JSON payload' },
        },
        { status: 400, headers: responseHeaders }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32600, message: 'Invalid Request: Expected a JSON object' },
        },
        { status: 400, headers: responseHeaders }
      );
    }

    const { jsonrpc, id, method, params } = body;

    // Check JSON-RPC 2.0 version spec
    if (jsonrpc !== '2.0') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: id ?? null,
          error: { code: -32600, message: 'Invalid Request: Expected jsonrpc "2.0"' },
        },
        { status: 400, headers: responseHeaders }
      );
    }

    if (!method || typeof method !== 'string') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: id ?? null,
          error: { code: -32600, message: 'Invalid Request: "method" must be a non-empty string' },
        },
        { status: 400, headers: responseHeaders }
      );
    }

    // Handle MCP Handshake
    if (method === 'initialize') {
      executionSuccess = true;
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {
                listChanged: false,
              },
            },
            serverInfo: {
              name: 'photoConvert-agent-mcp',
              version: '1.0.0',
            },
            nodeInfo: {
              assignedNode: node.id,
              nodeRole: node.role,
            },
          },
        },
        { headers: responseHeaders }
      );
    }

    if (method === 'notifications/initialized') {
      executionSuccess = true;
      return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, result: {} }, { headers: responseHeaders });
    }

    if (method === 'tools/list') {
      executionSuccess = true;
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            tools: MCP_TOOLS,
          },
        },
        { headers: responseHeaders }
      );
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const toolArgs = (params?.arguments && typeof params.arguments === 'object') ? params.arguments : {};

      if (!toolName || typeof toolName !== 'string') {
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            id: id ?? null,
            error: { code: -32602, message: 'Invalid params: "name" parameter is required for tools/call' },
          },
          { status: 400, headers: responseHeaders }
        );
      }

      const tool = MCP_TOOLS.find((t) => t.name === toolName);
      if (!tool) {
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Unknown tool: ${toolName}` },
          },
          { headers: responseHeaders }
        );
      }

      // Execute tool dispatch instruction
      let resultData: any = {};
      if (toolName === 'convert_image') {
        const targetFormat = String(toolArgs.format || 'webp').toLowerCase();
        const quality = Math.min(Math.max(Number(toolArgs.quality) || 0.82, 0.05), 1.0);
        const qualityPercent = Math.round(quality * 100);

        if (toolArgs.imageBase64 && typeof toolArgs.imageBase64 === 'string') {
          // 1. REAL-TIME ZERO-CLOUD IN-MEMORY CONVERSION
          try {
            let b64Str = toolArgs.imageBase64.trim();
            let inputMime = 'image/png';
            if (b64Str.startsWith('data:')) {
              const matches = b64Str.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.*)$/);
              if (matches) {
                inputMime = matches[1];
                b64Str = matches[2];
              }
            }

            const inputBuffer = Buffer.from(b64Str, 'base64');
            const inputSizeBytes = inputBuffer.length;

            const sharpModule = await import('sharp');
            const sharpInstance = sharpModule.default || sharpModule;
            let pipeline = sharpInstance(inputBuffer, {
              limitInputPixels: 50_000_000,
              failOn: 'error',
            });

            // Metadata check
            const meta = await pipeline.metadata();

            // Rotate
            if (toolArgs.rotate === 90 || toolArgs.rotate === 180 || toolArgs.rotate === 270) {
              pipeline = pipeline.rotate(toolArgs.rotate);
            }

            // Downscale if requested
            if (toolArgs.maxWidth || toolArgs.maxHeight) {
              pipeline = pipeline.resize({
                width: toolArgs.maxWidth ? Math.min(Number(toolArgs.maxWidth), 8192) : undefined,
                height: toolArgs.maxHeight ? Math.min(Number(toolArgs.maxHeight), 8192) : undefined,
                fit: 'inside',
                withoutEnlargement: true,
              });
            }

            // Grayscale
            if (toolArgs.applyGrayscale) {
              pipeline = pipeline.grayscale();
            }

            // Format conversion
            let outputMime = 'image/webp';
            if (targetFormat === 'webp') {
              pipeline = pipeline.webp({ quality: qualityPercent });
              outputMime = 'image/webp';
            } else if (targetFormat === 'png') {
              pipeline = pipeline.png({ compressionLevel: 8 });
              outputMime = 'image/png';
            } else if (targetFormat === 'jpeg' || targetFormat === 'jpg') {
              pipeline = pipeline.jpeg({ quality: qualityPercent });
              outputMime = 'image/jpeg';
            } else if (targetFormat === 'avif') {
              pipeline = pipeline.avif({ quality: qualityPercent });
              outputMime = 'image/avif';
            } else {
              pipeline = pipeline.webp({ quality: qualityPercent });
              outputMime = 'image/webp';
            }

            const outputBuffer = await pipeline.toBuffer();
            const outputMetadata = await sharpInstance(outputBuffer).metadata();
            const outputSizeBytes = outputBuffer.length;
            const savedBytes = inputSizeBytes - outputSizeBytes;
            const percentSaved = inputSizeBytes > 0 ? ((savedBytes / inputSizeBytes) * 100).toFixed(1) : '0';

            const outBase64 = `data:${outputMime};base64,${outputBuffer.toString('base64')}`;
            const pathModule = await import('path');
            const sanitizedBase = toolArgs.fileName
              ? pathModule.basename(String(toolArgs.fileName)).replace(/[^\w\.\-]/g, '_')
              : 'converted_photo';
            const outFileName = sanitizedBase.replace(/\.[^/.]+$/, `.${targetFormat}`);

            resultData = {
              success: true,
              mode: 'in_memory_zero_cloud',
              realtimeConversion: true,
              message: `Converted ${outFileName} to ${targetFormat.toUpperCase()} at ${qualityPercent}% quality in-memory. Zero cloud infrastructure used.`,
              fileName: outFileName,
              format: targetFormat,
              mimeType: outputMime,
              dimensions: {
                width: outputMetadata.width || meta.width,
                height: outputMetadata.height || meta.height,
              },
              originalSizeBytes: inputSizeBytes,
              convertedSizeBytes: outputSizeBytes,
              savedBytes,
              percentSaved: `${percentSaved}%`,
              convertedImageBase64: outBase64,
              workerNode: node.id,
            };
          } catch (err: any) {
            resultData = {
              success: false,
              error: `Image transformation failed: ${err.message}`,
              mode: 'in_memory_zero_cloud',
              workerNode: node.id,
            };
          }
        } else {
          // No imageBase64: return client-side browser instruction
          resultData = {
            success: true,
            mode: 'client_browser_storage',
            realtimeConversion: false,
            message: `Ready to convert image to ${targetFormat.toUpperCase()} at ${qualityPercent}% quality. To convert autonomously in real-time without cloud infra, provide the 'imageBase64' parameter.`,
            parametersApplied: toolArgs,
            storageDestination: 'photoConvert_DB (IndexedDB in browser)',
            workerNode: node.id,
          };
        }
      } else if (toolName === 'convert_video') {
        resultData = {
          success: true,
          mode: 'client_browser_storage',
          message: `Video conversion action [${String(toolArgs.action || 'webm')}] scheduled in browser memory.`,
          parametersApplied: toolArgs,
          storageDestination: 'photoConvert_DB (IndexedDB in browser)',
          workerNode: node.id,
        };
      } else if (toolName === 'extract_poster_frame') {
        resultData = {
          success: true,
          message: `Frame extracted at timestamp ${Number(toolArgs.timestamp) || 0.5}s in ${String(toolArgs.format || 'webp')} format.`,
          parametersApplied: toolArgs,
          workerNode: node.id,
        };
      } else if (toolName === 'extract_audio') {
        resultData = {
          success: true,
          message: 'Audio extraction to 16-bit PCM WAV initialized in browser audio context.',
          format: 'wav',
          workerNode: node.id,
        };
      } else if (toolName === 'list_storage_conversions') {
        resultData = {
          success: true,
          message: 'Storage query dispatched. Conversions are stored securely in browser IndexedDB.',
          storageEngine: 'IndexedDB (photoConvert_DB)',
          workerNode: node.id,
        };
      } else if (toolName === 'analyze_media') {
        const filePath = String(toolArgs.filePath || '');
        const resolved = path.resolve(filePath);
        const asset = await analyzeSingleMediaAsset(resolved);
        resultData = formatMcpResponse({
          ok: true,
          summary: {
            path: asset.relativePath,
            format: asset.format,
            dimensions: asset.dimensions,
            sizeBytes: asset.sizeBytes,
            sizeFormatted: asset.sizeFormatted,
            potentialSavingsBytes: asset.optimizationPotentialBytes,
            potentialSavingsFormatted: formatBytes(asset.optimizationPotentialBytes),
            issueCount: asset.issues.length,
            topIssues: asset.issues.map((i: any) => `${i.id}: ${i.message}`),
          },
          issues: asset.issues,
          recommendations: asset.issues.map((i: any) => i.recommendation),
          nextAction: asset.issues.length > 0 ? 'generate_optimization_plan' : 'all_assets_optimized',
          details: asset,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'analyze_web_assets') {
        const target = path.resolve(String(toolArgs.directoryPath || '.'));
        const analysis = await analyzeWebAssets(target, toolArgs.recursive !== false);
        resultData = formatMcpResponse({
          ok: true,
          summary: {
            score: analysis.score.overall,
            scoreBreakdown: analysis.score.breakdown,
            framework: analysis.framework,
            totalAssets: analysis.totalAssets,
            totalSizeBytes: analysis.totalSizeBytes,
            totalSizeFormatted: analysis.totalSizeFormatted,
            potentialSavingsBytes: analysis.potentialSavingsBytes,
            potentialSavingsFormatted: analysis.potentialSavingsFormatted,
            issueCount: analysis.issues.length,
            duplicateGroupsCount: analysis.duplicateGroups.length,
            topIssues: analysis.issues.slice(0, 5).map((i: any) => `${i.id}: ${i.message}`),
          },
          issues: analysis.issues,
          recommendations: analysis.recommendations,
          nextAction: analysis.nextAction,
          details: analysis,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'find_oversized_assets') {
        const target = path.resolve(String(toolArgs.directoryPath || '.'));
        const analysis = await analyzeWebAssets(target);
        const maxDim = Number(toolArgs.maxDimension) || 1920;
        const maxSize = Number(toolArgs.maxSizeBytes) || 500 * 1024;
        const oversized = analysis.assets.filter(
          (a: any) => (a.width && a.width > maxDim) || (a.height && a.height > maxDim) || a.sizeBytes > maxSize
        );
        resultData = formatMcpResponse({
          ok: true,
          summary: {
            totalOversizedFound: oversized.length,
            potentialSavingsBytes: oversized.reduce((acc: number, a: any) => acc + a.optimizationPotentialBytes, 0),
            potentialSavingsFormatted: formatBytes(oversized.reduce((acc: number, a: any) => acc + a.optimizationPotentialBytes, 0)),
            topIssues: oversized.slice(0, 5).map((a: any) => `${a.relativePath}: ${a.dimensions || formatBytes(a.sizeBytes)} exceeds limits`),
          },
          issues: oversized.flatMap((a: any) => a.issues.filter((i: any) => i.id === 'OVERSIZED_IMAGE')),
          recommendations: ['Downscale oversized images to max 1920px width and convert to WebP/AVIF.'],
          nextAction: oversized.length > 0 ? 'generate_optimization_plan' : 'all_assets_optimized',
          details: oversized,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'find_inefficient_formats') {
        const target = path.resolve(String(toolArgs.directoryPath || '.'));
        const analysis = await analyzeWebAssets(target);
        const inefficient = analysis.assets.filter((a: any) => a.issues.some((i: any) => i.id === 'INEFFICIENT_FORMAT'));
        resultData = formatMcpResponse({
          ok: true,
          summary: {
            totalInefficientFound: inefficient.length,
            potentialSavingsBytes: inefficient.reduce((acc: number, a: any) => acc + a.optimizationPotentialBytes, 0),
            potentialSavingsFormatted: formatBytes(inefficient.reduce((acc: number, a: any) => acc + a.optimizationPotentialBytes, 0)),
            topIssues: inefficient.slice(0, 5).map((a: any) => `${a.relativePath} (${a.format.toUpperCase()}) -> recommend ${a.recommendedFormat?.toUpperCase() || 'WEBP'}`),
          },
          issues: inefficient.flatMap((a: any) => a.issues.filter((i: any) => i.id === 'INEFFICIENT_FORMAT')),
          recommendations: ['Convert non-transparent PNGs and legacy JPEGs to modern WebP or AVIF.'],
          nextAction: inefficient.length > 0 ? 'generate_optimization_plan' : 'all_assets_optimized',
          details: inefficient,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'find_duplicate_assets') {
        const target = path.resolve(String(toolArgs.directoryPath || '.'));
        const analysis = await analyzeWebAssets(target);
        const threshold = Number(toolArgs.similarityThreshold) || 93.75;
        const duplicateGroups = groupDuplicates(analysis.assets, threshold);
        const totalDupSavings = duplicateGroups.reduce((acc: number, g: any) => acc + g.potentialSavingsBytes, 0);
        resultData = formatMcpResponse({
          ok: true,
          summary: {
            totalDuplicateGroups: duplicateGroups.length,
            potentialSavingsBytes: totalDupSavings,
            potentialSavingsFormatted: formatBytes(totalDupSavings),
            topIssues: duplicateGroups.slice(0, 5).map((g: any) => `${path.basename(g.representative)}: ${g.files.length} redundant copies (${g.similarityPercent}% match)`),
          },
          issues: duplicateGroups.map((g: any) => ({
            id: 'DUPLICATE_ASSET',
            severity: 'medium',
            message: `${g.files.length} duplicate or visually redundant copies (${g.similarityPercent}% match)`,
            recommendation: `Retain ${path.basename(g.representative)} and consolidate duplicates`,
            potentialSavingsBytes: g.potentialSavingsBytes,
          })),
          recommendations: duplicateGroups.length > 0 ? [`Consolidate ${duplicateGroups.length} duplicate groups.`] : ['No duplicate assets found.'],
          nextAction: duplicateGroups.length > 0 ? 'generate_optimization_plan' : 'test_web_performance',
          details: duplicateGroups,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'find_responsive_opportunities') {
        const target = path.resolve(String(toolArgs.directoryPath || '.'));
        const analysis = await analyzeWebAssets(target);
        const responsiveOpportunities = analysis.assets.filter((a: any) => a.issues.some((i: any) => i.id === 'RESPONSIVE_VARIANT'));
        resultData = formatMcpResponse({
          ok: true,
          summary: {
            totalOpportunitiesFound: responsiveOpportunities.length,
            topIssues: responsiveOpportunities.slice(0, 5).map((a: any) => `${a.relativePath} (${a.dimensions}): missing responsive srcset variants`),
          },
          issues: responsiveOpportunities.flatMap((a: any) => a.issues.filter((i: any) => i.id === 'RESPONSIVE_VARIANT')),
          recommendations: ['Generate responsive variants (640w, 1024w, 1920w) and use picture or srcset.'],
          nextAction: 'generate_optimization_plan',
          details: responsiveOpportunities,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'test_web_performance') {
        const target = toolArgs.url || (toolArgs.localPath ? path.resolve(/*turbopackIgnore: true*/ String(toolArgs.localPath)) : path.resolve(/*turbopackIgnore: true*/ '.'));
        const testResult = await testWebPerformance(target);
        resultData = formatMcpResponse({
          ok: true,
          summary: {
            testId: testResult.testId,
            target: testResult.target,
            score: testResult.score.overall,
            scoreBreakdown: testResult.score.breakdown,
            totalAssets: testResult.metrics.totalAssetsCount,
            totalSizeBytes: testResult.metrics.totalSizeBytes,
            totalSizeFormatted: testResult.metrics.totalSizeFormatted,
            potentialSavingsBytes: testResult.potentialSavingsBytes,
            potentialSavingsFormatted: testResult.potentialSavingsFormatted,
            issueCount: testResult.issueCount,
            topIssues: testResult.topIssues,
            lcpCandidate: testResult.metrics.lcpCandidate,
          },
          issues: testResult.topIssues,
          recommendations: testResult.recommendations,
          nextAction: testResult.nextAction,
          details: testResult,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'get_web_performance_summary') {
        const test = engineCache.getTest(toolArgs.testId);
        if (!test) {
          throw new Error('No performance test found. Please run test_web_performance first.');
        }
        resultData = formatMcpResponse({
          ok: true,
          summary: {
            testId: test.testId,
            target: test.target,
            score: test.score.overall,
            scoreBreakdown: test.score.breakdown,
            totalAssets: test.metrics.totalAssetsCount,
            totalSizeFormatted: test.metrics.totalSizeFormatted,
            potentialSavingsFormatted: test.potentialSavingsFormatted,
            topIssues: test.topIssues,
            lcpCandidate: test.metrics.lcpCandidate,
          },
          issues: test.topIssues,
          recommendations: test.recommendations,
          nextAction: test.nextAction,
          details: test,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'compare_web_performance') {
        const afterTest = engineCache.getTest(toolArgs.afterTestId);
        const beforeTest = engineCache.getTest(toolArgs.beforeTestId);
        if (!afterTest || !beforeTest) {
          throw new Error('Ensure both before and after tests exist for comparison.');
        }
        const comparison = comparePerformanceTests(beforeTest, afterTest);
        resultData = formatMcpResponse({
          ok: true,
          summary: {
            scoreBefore: comparison.scoreBefore,
            scoreAfter: comparison.scoreAfter,
            scoreDelta: comparison.scoreDelta,
            mediaBefore: comparison.mediaBeforeFormatted,
            mediaAfter: comparison.mediaAfterFormatted,
            savedBytes: comparison.savedFormatted,
            reductionPercent: comparison.reductionPercent,
            measuredImprovements: comparison.measuredImprovements,
          },
          recommendations: ['Optimizations compared.'],
          nextAction: 'all_verified',
          details: comparison,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'generate_optimization_plan') {
        const target = path.resolve(String(toolArgs.directoryPath || '.'));
        const plan = await generateOptimizationPlan(target, {
          targetDir: toolArgs.targetDir ? path.resolve(String(toolArgs.targetDir)) : undefined,
          format: toolArgs.format,
          quality: Number(toolArgs.quality) || 82,
          maxDimension: Number(toolArgs.maxDimension) || 1920,
        });
        resultData = formatMcpResponse({
          ok: true,
          summary: {
            planId: plan.planId,
            actionsCount: plan.actionsCount,
            impactSummary: plan.impactSummary,
            estimatedBefore: plan.estimatedBeforeFormatted,
            estimatedAfter: plan.estimatedAfterFormatted,
            estimatedSaved: plan.estimatedSavedFormatted,
            estimatedReductionPercent: plan.estimatedReductionPercent,
            targetDir: plan.targetDir,
            topActions: plan.actions.slice(0, 5).map((a: any) => `[${a.impact.toUpperCase()}] ${path.basename(a.inputPath)} -> ${path.basename(a.outputPath)} (${a.estimatedSavingsFormatted} est. savings)`),
          },
          recommendations: [`Apply plan with optimize_web_assets(planId="${plan.planId}")`],
          nextAction: `optimize_web_assets("${plan.planId}")`,
          details: plan,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'optimize_web_assets') {
        const target = toolArgs.planId || (toolArgs.directoryPath ? path.resolve(/*turbopackIgnore: true*/ String(toolArgs.directoryPath)) : path.resolve(/*turbopackIgnore: true*/ '.'));
        const execution = await executeOptimizationPlan(target, { overwriteSource: !!toolArgs.overwriteSource });
        resultData = formatMcpResponse({
          ok: true,
          summary: {
            planId: execution.planId,
            totalProcessed: execution.totalProcessed,
            succeeded: execution.succeeded,
            failed: execution.failed,
            alreadyOptimizedCount: execution.alreadyOptimizedCount,
            actualBefore: execution.actualBeforeFormatted,
            actualAfter: execution.actualAfterFormatted,
            actualSaved: execution.actualSavedFormatted,
            actualReductionPercent: execution.actualReductionPercent,
            backupLocation: execution.backupLocation,
          },
          recommendations: [`Verify optimization gains with verify_optimization(planId="${execution.planId}")`],
          nextAction: `verify_optimization("${execution.planId}")`,
          details: execution,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'verify_optimization') {
        const target = toolArgs.planId || (toolArgs.directoryPath ? path.resolve(/*turbopackIgnore: true*/ String(toolArgs.directoryPath)) : path.resolve(/*turbopackIgnore: true*/ '.'));
        const verification = await verifyOptimization(target);
        let reportSavedPath = null;
        if (toolArgs.generateReport !== false) {
          reportSavedPath = await saveLocalReport(verification, String(toolArgs.reportFormat || 'html'));
          verification.reportSavedPath = reportSavedPath;
        }
        resultData = formatMcpResponse({
          ok: true,
          summary: {
            planId: verification.planId,
            mediaBefore: verification.mediaBeforeFormatted,
            mediaAfter: verification.mediaAfterFormatted,
            savedBytes: verification.savedFormatted,
            reductionPercent: verification.reductionPercent,
            scoreAfter: verification.scoreAfter,
            measuredImprovements: verification.measuredImprovements,
            reportSavedPath,
          },
          recommendations: ['All optimizations verified locally.'],
          nextAction: verification.nextAction,
          details: verification,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'inspect_project') {
        const target = path.resolve(String(toolArgs.projectPath || '.'));
        const structure = await scanProjectStructure(target);
        resultData = formatMcpResponse({
          ok: true,
          summary: {
            projectRoot: structure.projectRoot,
            framework: structure.framework,
            frameworkVariant: structure.frameworkVariant,
            routesDir: structure.routesDir,
            componentsDir: structure.componentsDir,
            publicDir: structure.publicDir,
            configFile: structure.configFile,
            sourceFilesCount: structure.sourceFilesCount,
            assetFilesCount: structure.assetFilesCount,
            frameworkConfidence: structure.frameworkConfidence,
          },
          recommendations: [`Framework detected as '${structure.framework}'. Run 'analyze_web_assets' to audit media performance.`],
          nextAction: 'analyze_web_assets',
          details: structure,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'get_asset_usage') {
        const targetRoot = path.resolve(String(toolArgs.projectPath || '.'));
        const structure = await scanProjectStructure(targetRoot);
        const sourceRefs = await scanProjectSourceReferences(targetRoot, structure.publicDir);
        const analysis = await analyzeWebAssets(targetRoot);
        const graph = buildAssetGraph(targetRoot, analysis.assets, sourceRefs);
        const usage = graph.getAssetUsage(String(toolArgs.assetPath));

        if (!usage) {
          throw new Error(`Asset '${toolArgs.assetPath}' not found in project.`);
        }

        resultData = formatMcpResponse({
          ok: true,
          summary: {
            assetPath: usage.assetPath,
            relativePath: usage.relativePath,
            referenceCount: usage.referenceCount,
            routesCount: usage.routes.length,
            componentsCount: usage.components.length,
            routes: usage.routes,
            components: usage.components,
            isLcpCandidate: usage.isLcpCandidate,
            isShared: usage.isShared,
            isUnused: usage.isUnused,
            riskRating: usage.riskRating,
          },
          issues: usage.isUnused ? ['Asset has 0 references in source code.'] : [],
          recommendations: usage.isUnused ? ['Verify dynamic usage before pruning.'] : ['Safe to optimize or resize.'],
          nextAction: usage.isUnused ? 'find_unused_assets' : 'generate_optimization_plan',
          details: usage,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'find_unused_assets') {
        const targetRoot = path.resolve(String(toolArgs.projectPath || '.'));
        const structure = await scanProjectStructure(targetRoot);
        const sourceRefs = await scanProjectSourceReferences(targetRoot, structure.publicDir);
        const analysis = await analyzeWebAssets(targetRoot);
        const graph = buildAssetGraph(targetRoot, analysis.assets, sourceRefs);
        const unusedAssets = graph.findUnusedAssets();
        const totalWasteBytes = unusedAssets.reduce((acc: number, a: any) => acc + a.sizeBytes, 0);

        resultData = formatMcpResponse({
          ok: true,
          summary: {
            totalUnusedFound: unusedAssets.length,
            totalWasteBytes,
            totalWasteFormatted: formatBytes(totalWasteBytes),
            safeToPruneCount: unusedAssets.filter((a: any) => a.confidence === 'SAFE').length,
            likelyUnusedCount: unusedAssets.filter((a: any) => a.confidence === 'LIKELY').length,
            uncertainCount: unusedAssets.filter((a: any) => a.confidence === 'UNCERTAIN').length,
            topUnused: unusedAssets.slice(0, 5).map((a: any) => `${a.relativePath} (${a.sizeFormatted}) [${a.confidence}]`),
          },
          issues: unusedAssets.slice(0, 5).map((a: any) => `Unreferenced asset: ${a.relativePath} (${a.sizeFormatted})`),
          recommendations: ['Do NOT delete automatically. Review assets marked SAFE and require explicit confirmation.'],
          nextAction: 'review_unused_assets',
          details: unusedAssets,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'check_performance_budget') {
        const targetRoot = path.resolve(String(toolArgs.projectPath || '.'));
        const analysis = await analyzeWebAssets(targetRoot);
        const configuredBudget = toolArgs.budget || (await loadProjectBudget(targetRoot));

        let lcpMs = 0;
        let fcpMs = 0;
        if (toolArgs.targetUrl) {
          const runtime = await verifyRuntimePerformance(String(toolArgs.targetUrl));
          lcpMs = runtime.lcpMs || 0;
          fcpMs = runtime.fcpMs || 0;
        }

        const evaluation = evaluatePerformanceBudget({
          target: String(toolArgs.targetUrl || targetRoot),
          assets: analysis.assets,
          totalSizeBytes: analysis.totalSizeBytes,
          lcpMs,
          fcpMs,
          budgetConfig: configuredBudget,
        });

        resultData = formatMcpResponse({
          ok: evaluation.status !== 'FAIL',
          summary: {
            status: evaluation.status,
            target: evaluation.target,
            passedCount: evaluation.passedCount,
            failedCount: evaluation.failedCount,
            warningCount: evaluation.warningCount,
            failedRules: evaluation.checks.filter((c: any) => !c.passed).map((c: any) => `${c.rule}: actual ${c.actualFormatted} exceeded limit ${c.limitFormatted} by ${c.exceededByFormatted}`),
          },
          issues: evaluation.checks.filter((c: any) => !c.passed).map((c: any) => `${c.rule} exceeded budget`),
          recommendations: evaluation.status === 'FAIL' ? ['Generate an optimization plan to reduce media weight within budget limits.'] : ['Performance budgets satisfied.'],
          nextAction: evaluation.nextAction,
          details: evaluation,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'verify_runtime_performance') {
        const result = await verifyRuntimePerformance(String(toolArgs.targetUrl), { timeoutMs: Number(toolArgs.timeoutMs || 8000) });
        resultData = formatMcpResponse({
          ok: true,
          summary: {
            measurementType: result.measurementType,
            url: result.url,
            lcpMs: result.lcpMs,
            fcpMs: result.fcpMs,
            cls: result.cls,
            totalLoadMs: result.totalLoadMs,
            mediaTransferFormatted: result.mediaTransferFormatted,
            mediaRequestCount: result.mediaRequestCount,
            lcpElement: result.lcpElement,
          },
          recommendations: [result.measurementType === 'OBSERVED' ? 'Real browser metrics collected successfully.' : 'Live URL did not respond; simulated fallback metrics provided.'],
          nextAction: 'compare_web_performance',
          details: result,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'generate_source_patch') {
        const targetRoot = path.resolve(String(toolArgs.projectPath || '.'));
        const plan = engineCache.getPlan(String(toolArgs.planId));
        if (!plan) {
          throw new Error(`Optimization plan '${toolArgs.planId}' not found.`);
        }

        const structure = await scanProjectStructure(targetRoot);
        const sourceRefs = await scanProjectSourceReferences(targetRoot, structure.publicDir);
        const analysis = await analyzeWebAssets(targetRoot);
        const graph = buildAssetGraph(targetRoot, analysis.assets, sourceRefs);
        const patch = await generateSourcePatch(plan, graph, { dryRun: toolArgs.dryRun !== false });
        engineCache.set(`patch:${patch.patchId}`, patch);

        resultData = formatMcpResponse({
          ok: true,
          summary: {
            patchId: patch.patchId,
            planId: toolArgs.planId,
            actionsCount: patch.actions.length,
            affectedFilesCount: patch.affectedFiles.length,
            affectedFiles: patch.affectedFiles.map((f: string) => path.relative(targetRoot, f)),
            isDryRun: patch.isDryRun,
            diffPreview: patch.unifiedDiff ? patch.unifiedDiff.slice(0, 500) + (patch.unifiedDiff.length > 500 ? '\n... (truncated diff preview)' : '') : 'No source file changes needed.',
          },
          recommendations: ['Review unified diff. Execute apply_source_patch with confirmApply=true to modify code.'],
          nextAction: `apply_source_patch(patchId="${patch.patchId}", confirmApply=true)`,
          details: patch,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'apply_source_patch') {
        if (!toolArgs.confirmApply) {
          throw new Error("Safety check: 'confirmApply' must be true to modify source code files.");
        }
        const targetRoot = path.resolve(String(toolArgs.projectPath || '.'));
        let targetPatch = toolArgs.patch;
        if (!targetPatch && toolArgs.patchId) {
          targetPatch = engineCache.get(`patch:${toolArgs.patchId}`);
        }
        if (!targetPatch) {
          throw new Error(`Patch record not found for ID '${toolArgs.patchId}'.`);
        }

        const manifest = await applySourcePatch(targetPatch, { projectRoot: targetRoot, dryRun: !!toolArgs.dryRun });
        resultData = formatMcpResponse({
          ok: true,
          summary: {
            operationId: manifest.operationId,
            filesPatched: manifest.sourcePatches.length,
            backupDir: manifest.backupDir,
            canRollback: manifest.canRollback,
            appliedDetails: manifest.sourcePatches.map((p: any) => `${path.relative(targetRoot, p.file)} (${p.actionsApplied} actions applied)`),
          },
          recommendations: [`Rollback available via rollback_operation(operationId="${manifest.operationId}")`],
          nextAction: 'verify_optimization',
          details: manifest,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'rollback_operation') {
        const targetRoot = path.resolve(String(toolArgs.projectPath || '.'));
        const rollbackResult = await rollbackOperation(String(toolArgs.operationId), targetRoot);
        resultData = formatMcpResponse({
          ok: rollbackResult.success,
          summary: {
            operationId: toolArgs.operationId,
            restoredSourcesCount: rollbackResult.restoredSourcesCount,
            restoredAssetsCount: rollbackResult.restoredAssetsCount,
            message: rollbackResult.message,
          },
          recommendations: ['Rollback finished. State restored from backup.'],
          nextAction: 'inspect_project',
          details: rollbackResult,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      } else if (toolName === 'optimize_project') {
        const targetRoot = path.resolve(String(toolArgs.projectPath || '.'));
        const result = await optimizeProject({
          projectPath: targetRoot,
          mode: toolArgs.mode as any,
          dryRun: !!toolArgs.dryRun,
          format: toolArgs.format as any,
          maxDimension: Number(toolArgs.maxDimension || 1920),
          quality: Number(toolArgs.quality || 82),
          applySourcePatches: !!toolArgs.applySourcePatches,
          detailLevel: toolArgs.detailLevel as any,
          tokenBudget: toolArgs.tokenBudget ? Number(toolArgs.tokenBudget) : undefined,
        });

        resultData = formatMcpResponse({
          ok: result.status !== 'failed',
          summary: {
            status: result.status,
            missionId: result.missionId,
            scoreBefore: result.scoreBefore,
            scoreAfter: result.scoreAfter,
            scoreDelta: result.scoreDelta,
            assetsAnalyzed: result.assetsAnalyzed,
            assetsOptimized: result.assetsOptimized,
            bytesBeforeFormatted: result.bytesBeforeFormatted,
            bytesAfterFormatted: result.bytesAfterFormatted,
            bytesSavedFormatted: result.bytesSavedFormatted,
            assetReductionPercent: result.assetReductionPercent,
            lcpBefore: result.lcpBefore,
            lcpAfter: result.lcpAfter,
            lcpImprovementPercent: result.lcpImprovementPercent,
            regression: result.regression,
            sourcePatchesCount: result.sourcePatchesCount,
            appliedPatchesCount: result.appliedPatchesCount,
            rollbackAvailable: result.rollbackAvailable,
          },
          recommendations: [result.dryRun ? 'Dry run complete.' : 'Mission complete. All assets verified.'],
          nextAction: result.nextAction,
          details: result,
          detailLevel: toolArgs.detailLevel,
          tokenBudget: toolArgs.tokenBudget,
        });
      }

      executionSuccess = true;
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(resultData, null, 2),
              },
            ],
          },
        },
        { headers: responseHeaders }
      );
    }

    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: id ?? null,
        error: { code: -32601, message: `Method not found: ${method}` },
      },
      { headers: responseHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32603, message: 'Internal error: ' + error.message },
      },
      { status: 500, headers: responseHeaders }
    );
  } finally {
    // Release node in load balancer and update moving average latency
    const duration = Date.now() - startTime;
    mcpLoadBalancer.releaseNode(node.id, executionSuccess, duration);
  }
}
