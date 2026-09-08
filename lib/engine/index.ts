/**
 * PhotoNow Core Engine - Unified TypeScript API Bridge
 * Provides typed exports for Next.js API routes, browser UI, and tests
 * while keeping the underlying ESM modules directly executable by Node.js.
 */

// @ts-ignore
import * as analyzerMjs from './analyzer.mjs';
// @ts-ignore
import * as testerMjs from './performanceTester.mjs';
// @ts-ignore
import * as boosterMjs from './booster.mjs';
// @ts-ignore
import * as hashMjs from './perceptualHash.mjs';
// @ts-ignore
import * as tokenMjs from './tokenEconomy.mjs';
// @ts-ignore
import * as cacheMjs from './cache.mjs';
// @ts-ignore
import * as reportMjs from './reporting.mjs';
// @ts-ignore
import * as scannerMjs from './projectScanner.mjs';
// @ts-ignore
import * as sourceMjs from './sourceAnalyzer.mjs';
// @ts-ignore
import * as graphMjs from './assetGraph.mjs';
// @ts-ignore
import * as patchMjs from './patchGenerator.mjs';
// @ts-ignore
import * as browserMjs from './browserVerifier.mjs';
// @ts-ignore
import * as regressionMjs from './regression.mjs';
// @ts-ignore
import * as budgetMjs from './budget.mjs';
// @ts-ignore
import * as missionMjs from './mission.mjs';

export * from './types';

// Original / Core Performance Exports
export const analyzeSingleMediaAsset: (filePath: string, baseDir?: string) => Promise<any> =
  analyzerMjs.analyzeSingleMediaAsset;

export const analyzeWebAssets: (targetPath: string, recursive?: boolean) => Promise<any> =
  analyzerMjs.analyzeWebAssets;

export const testWebPerformance: (target: string, options?: any) => Promise<any> =
  testerMjs.testWebPerformance;

export const comparePerformanceTests: (before: any, after: any) => any =
  testerMjs.comparePerformanceTests;

export const generateOptimizationPlan: (targetPath: string, options?: any) => Promise<any> =
  boosterMjs.generateOptimizationPlan;

export const executeOptimizationPlan: (planIdOrOptions: any, options?: any) => Promise<any> =
  boosterMjs.executeOptimizationPlan;

export const verifyOptimization: (planIdOrPath: any, options?: any) => Promise<any> =
  boosterMjs.verifyOptimization;

export const groupDuplicates: (assets: any[], threshold?: number) => any[] =
  hashMjs.groupDuplicates;

export const formatMcpResponse: (options: any) => any =
  tokenMjs.formatMcpResponse;

export const formatBytes: (bytes: number) => string =
  tokenMjs.formatBytes;

export const engineCache: any =
  cacheMjs.engineCache;

export const saveLocalReport: (data: any, format?: string, dir?: any) => Promise<string> =
  reportMjs.saveLocalReport;

// Project Understanding & Asset Dependency Graph Exports
export const scanProjectStructure: (projectRoot: string) => Promise<any> =
  scannerMjs.scanProjectStructure;

export const scanProjectSourceReferences: (projectRoot: string, publicDir?: string) => Promise<any[]> =
  sourceMjs.scanProjectSourceReferences;

export const extractReferencesFromContent: (filePath: string, content: string, projectRoot: string, publicDir?: string) => any[] =
  sourceMjs.extractReferencesFromContent;

export const buildAssetGraph: (projectRoot: string, assetAnalyses: any[], sourceReferences: any[]) => any =
  graphMjs.buildAssetGraph;

export const AssetDependencyGraph: any =
  graphMjs.AssetDependencyGraph;

// Source Patching & Rollback Exports
export const generateSourcePatch: (plan: any, assetGraph: any, options?: any) => Promise<any> =
  patchMjs.generateSourcePatch;

export const applySourcePatch: (patch: any, options?: any) => Promise<any> =
  patchMjs.applySourcePatch;

export const rollbackOperation: (operationId: string, projectRoot?: string) => Promise<any> =
  patchMjs.rollbackOperation;

// Runtime Verification Exports
export const verifyRuntimePerformance: (targetUrl: string, options?: any) => Promise<any> =
  browserMjs.verifyRuntimePerformance;

// Git & Budget Exports
export const checkGitPerformanceRegression: (projectRoot: string) => Promise<any> =
  regressionMjs.checkGitPerformanceRegression;

export const saveBaseline: (projectRoot: string, data: any) => Promise<string> =
  regressionMjs.saveBaseline;

export const compareWithBaseline: (projectRoot: string, currentMetrics: any) => Promise<any> =
  regressionMjs.compareWithBaseline;

export const evaluatePerformanceBudget: (params: any) => any =
  budgetMjs.evaluatePerformanceBudget;

export const loadProjectBudget: (projectRoot: string) => Promise<any> =
  budgetMjs.loadProjectBudget;

// Autonomous High-Level Mission Export
export const optimizeProject: (options: any) => Promise<any> =
  missionMjs.optimizeProject;
