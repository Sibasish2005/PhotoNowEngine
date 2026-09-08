import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeWebAssets,
  analyzeSingleMediaAsset,
  testWebPerformance,
  comparePerformanceTests,
  generateOptimizationPlan,
  executeOptimizationPlan,
  verifyOptimization,
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'analyze';
    const rawTarget = typeof body.targetPath === 'string' ? body.targetPath.replace(/^["']|["']$/g, '').trim() : '';

    // Check if user submitted a Windows drive path (e.g. C:\...) on a Linux environment (e.g. Vercel /var/task)
    if (rawTarget && /^[a-zA-Z]:[\\/]/.test(rawTarget) && process.platform !== 'win32') {
      return NextResponse.json({
        success: false,
        error: `Cloud server cannot access local drive "${rawTarget}". You are viewing PhotoNow on a remote cloud server (Vercel). To audit local folders on your computer, run PhotoNow locally via 'npm run dev' and visit http://localhost:3000. In this cloud preview, please click [Demo Fixture] or [Root: .] to test the engine.`,
      }, { status: 400 });
    }

    const targetPath = rawTarget ? path.resolve(rawTarget) : process.cwd();

    if (action === 'analyze') {
      const result = await analyzeWebAssets(targetPath, body.recursive !== false);
      return NextResponse.json({ success: true, result });
    }

    if (action === 'inspect') {
      const structure = await scanProjectStructure(targetPath);
      return NextResponse.json({ success: true, structure });
    }

    if (action === 'graph' || action === 'unused' || action === 'shared') {
      const structure = await scanProjectStructure(targetPath);
      const sourceRefs = await scanProjectSourceReferences(targetPath, structure.publicDir);
      const analysis = await analyzeWebAssets(targetPath);
      const graph = buildAssetGraph(targetPath, analysis.assets, sourceRefs);

      if (action === 'unused') {
        const unused = graph.findUnusedAssets();
        return NextResponse.json({ success: true, unused });
      }
      if (action === 'shared') {
        const shared = graph.findSharedAssets();
        return NextResponse.json({ success: true, shared });
      }
      return NextResponse.json({ success: true, graph: graph.toJSON() });
    }

    if (action === 'usage') {
      const structure = await scanProjectStructure(targetPath);
      const sourceRefs = await scanProjectSourceReferences(targetRootOrPath(body), structure.publicDir);
      const analysis = await analyzeWebAssets(targetPath);
      const graph = buildAssetGraph(targetPath, analysis.assets, sourceRefs);
      const usage = graph.getAssetUsage(body.assetPath);
      return NextResponse.json({ success: true, usage });
    }

    if (action === 'budget') {
      const analysis = await analyzeWebAssets(targetPath);
      const budgetConfig = body.budget || (await loadProjectBudget(targetPath));
      let lcpMs = 0;
      if (body.targetUrl) {
        const runtime = await verifyRuntimePerformance(body.targetUrl);
        lcpMs = runtime.lcpMs || 0;
      }
      const evaluation = evaluatePerformanceBudget({
        target: body.targetUrl || targetPath,
        assets: analysis.assets,
        totalSizeBytes: analysis.totalSizeBytes,
        lcpMs,
        budgetConfig,
      });
      return NextResponse.json({ success: true, evaluation });
    }

    if (action === 'runtime') {
      const targetUrl = body.targetUrl || 'http://localhost:3000';
      const result = await verifyRuntimePerformance(targetUrl, { timeoutMs: body.timeoutMs || 8000 });
      return NextResponse.json({ success: true, result });
    }

    if (action === 'test') {
      const target = body.url || targetPath;
      const result = await testWebPerformance(target);
      return NextResponse.json({ success: true, result });
    }

    if (action === 'plan') {
      const plan = await generateOptimizationPlan(targetPath, {
        targetDir: body.targetDir ? path.resolve(body.targetDir) : undefined,
        format: body.format || 'webp',
        quality: Number(body.quality) || 82,
        maxDimension: Number(body.maxDimension) || 1920,
      });
      return NextResponse.json({ success: true, plan });
    }

    if (action === 'patch') {
      const structure = await scanProjectStructure(targetPath);
      const sourceRefs = await scanProjectSourceReferences(targetPath, structure.publicDir);
      const analysis = await analyzeWebAssets(targetPath);
      const graph = buildAssetGraph(targetPath, analysis.assets, sourceRefs);
      const plan = body.plan || (await generateOptimizationPlan(targetPath, body));
      const patch = await generateSourcePatch(plan, graph, { dryRun: body.dryRun !== false });
      return NextResponse.json({ success: true, patch });
    }

    if (action === 'apply_patch') {
      if (!body.confirmApply) {
        return NextResponse.json({ success: false, error: 'confirmApply must be true' }, { status: 400 });
      }
      const manifest = await applySourcePatch(body.patch, { projectRoot: targetPath, dryRun: !!body.dryRun });
      return NextResponse.json({ success: true, manifest });
    }

    if (action === 'rollback') {
      const result = await rollbackOperation(body.operationId, targetPath);
      return NextResponse.json({ success: true, result });
    }

    if (action === 'optimize') {
      const target = body.planId || targetPath;
      const execution = await executeOptimizationPlan(target, {
        overwriteSource: !!body.overwriteSource,
      });
      return NextResponse.json({ success: true, execution });
    }

    if (action === 'mission') {
      const result = await optimizeProject({
        projectPath: targetPath,
        mode: body.mode || 'safe',
        dryRun: !!body.dryRun,
        format: body.format || 'webp',
        maxDimension: Number(body.maxDimension) || 1920,
        quality: Number(body.quality) || 82,
        applySourcePatches: !!body.applySourcePatches,
      });
      return NextResponse.json({ success: true, result });
    }

    if (action === 'verify') {
      const target = body.planId || targetPath;
      const verification = await verifyOptimization(target);
      let reportPath = null;
      if (body.generateReport !== false) {
        reportPath = await saveLocalReport(verification, body.reportFormat || 'html');
        verification.reportSavedPath = reportPath;
      }
      return NextResponse.json({ success: true, verification });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

function targetRootOrPath(body: any) {
  return body.targetPath ? path.resolve(body.targetPath) : process.cwd();
}
