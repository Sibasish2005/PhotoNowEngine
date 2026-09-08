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
} from '@/lib/engine';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'analyze';

    if (action === 'analyze') {
      const targetPath = body.targetPath ? path.resolve(body.targetPath) : process.cwd();
      const result = await analyzeWebAssets(targetPath, body.recursive !== false);
      return NextResponse.json({ success: true, result });
    }

    if (action === 'test') {
      const target = body.url || (body.localPath ? path.resolve(body.localPath) : process.cwd());
      const result = await testWebPerformance(target);
      return NextResponse.json({ success: true, result });
    }

    if (action === 'plan') {
      const targetPath = body.targetPath ? path.resolve(body.targetPath) : process.cwd();
      const plan = await generateOptimizationPlan(targetPath, {
        targetDir: body.targetDir ? path.resolve(body.targetDir) : undefined,
        format: body.format || 'webp',
        quality: Number(body.quality) || 82,
        maxDimension: Number(body.maxDimension) || 1920,
      });
      return NextResponse.json({ success: true, plan });
    }

    if (action === 'optimize') {
      const target = body.planId || (body.targetPath ? path.resolve(body.targetPath) : process.cwd());
      const execution = await executeOptimizationPlan(target, {
        overwriteSource: !!body.overwriteSource,
      });
      return NextResponse.json({ success: true, execution });
    }

    if (action === 'verify') {
      const target = body.planId || (body.targetPath ? path.resolve(body.targetPath) : process.cwd());
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
