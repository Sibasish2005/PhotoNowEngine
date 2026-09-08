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

export * from './types';

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
