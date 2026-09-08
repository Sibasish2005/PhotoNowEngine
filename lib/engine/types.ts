/**
 * PhotoNow Website Performance Intelligence & Asset Optimization Types
 * Core domain interfaces shared by MCP server, browser UI, and engine CLI.
 */

export type DetailLevel = 'compact' | 'standard' | 'detailed' | 'raw';

export type IssueId =
  | 'OVERSIZED_IMAGE'
  | 'INEFFICIENT_FORMAT'
  | 'DUPLICATE_ASSET'
  | 'HIGH_COMPRESSION_POTENTIAL'
  | 'LARGE_SVG'
  | 'RESPONSIVE_VARIANT'
  | 'POTENTIAL_LCP_ASSET';

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ConfidenceLevel = 'confirmed' | 'likely' | 'possible';

export interface PerformanceIssue {
  id: IssueId;
  severity: IssueSeverity;
  message: string;
  recommendation: string;
  potentialSavingsBytes: number;
  confidence: ConfidenceLevel;
  data?: Record<string, any>;
}

export interface AssetAnalysis {
  path: string;
  relativePath: string;
  fileName: string;
  format: string;
  sizeBytes: number;
  sizeFormatted: string;
  width?: number;
  height?: number;
  dimensions?: string;
  aspectRatio?: string;
  hasAlpha?: boolean;
  isAnimated?: boolean;
  dHash?: string;
  contentHash: string;
  optimizationPotentialBytes: number;
  recommendedFormat?: string;
  issues: PerformanceIssue[];
}

export interface DuplicateGroup {
  id: string;
  representative: string;
  files: Array<{
    path: string;
    relativePath: string;
    sizeBytes: number;
    sizeFormatted: string;
    hash: string;
  }>;
  similarityPercent: number;
  potentialSavingsBytes: number;
  potentialSavingsFormatted: string;
}

export interface ScoreDeduction {
  ruleId: string;
  category: 'formatEfficiency' | 'imageSizing' | 'compression' | 'responsiveReadiness' | 'svgEfficiency';
  pointsLost: number;
  reason: string;
  affectedAssets: string[];
}

export interface PhotoNowScore {
  overall: number; // 0 - 100
  breakdown: {
    formatEfficiency: number; // 0 - 25
    imageSizing: number; // 0 - 25
    compression: number; // 0 - 20
    responsiveReadiness: number; // 0 - 15
    svgEfficiency: number; // 0 - 15
  };
  deductions: ScoreDeduction[];
}

export interface WebPerformanceTestResult {
  testId: string;
  target: string;
  timestamp: number;
  score: PhotoNowScore;
  metrics: {
    totalAssetsCount: number;
    totalSizeBytes: number;
    totalSizeFormatted: string;
    imageCount: number;
    svgCount: number;
    videoCount: number;
    largestAssets: Array<{
      pathOrUrl: string;
      sizeBytes: number;
      sizeFormatted: string;
      format: string;
    }>;
    estimatedTransferTime4GMs: number;
    lcpCandidate?: {
      pathOrUrl: string;
      sizeBytes: number;
      sizeFormatted: string;
      format: string;
      dimensions?: string;
      reason: string;
    };
  };
  issueCount: number;
  topIssues: string[];
  potentialSavingsBytes: number;
  potentialSavingsFormatted: string;
  recommendations: string[];
  nextAction: string;
}

export interface PlanAction {
  actionId: string;
  type: 'convert' | 'resize' | 'compress' | 'svg_clean' | 'deduplicate' | 'responsive_set';
  inputPath: string;
  outputPath: string;
  targetFormat?: string;
  quality?: number;
  targetWidth?: number;
  targetHeight?: number;
  impact: 'high' | 'medium' | 'low';
  estimatedSavingsBytes: number;
  estimatedSavingsFormatted: string;
  reason: string;
}

export interface OptimizationPlan {
  planId: string;
  createdAt: number;
  projectPath: string;
  targetDir: string;
  actionsCount: number;
  impactSummary: {
    high: number;
    medium: number;
    low: number;
  };
  estimatedBeforeBytes: number;
  estimatedBeforeFormatted: string;
  estimatedAfterBytes: number;
  estimatedAfterFormatted: string;
  estimatedSavedBytes: number;
  estimatedSavedFormatted: string;
  estimatedReductionPercent: string;
  actions: PlanAction[];
  note: string;
}

export interface PlanExecutionDetail {
  actionId: string;
  inputPath: string;
  outputPath: string;
  status: 'success' | 'already_optimized' | 'failed';
  beforeBytes: number;
  afterBytes: number;
  savedBytes: number;
  error?: string;
}

export interface OptimizationExecutionResult {
  planId: string;
  completedAt: number;
  totalProcessed: number;
  succeeded: number;
  failed: number;
  alreadyOptimizedCount: number;
  actualBeforeBytes: number;
  actualBeforeFormatted: string;
  actualAfterBytes: number;
  actualAfterFormatted: string;
  actualSavedBytes: number;
  actualSavedFormatted: string;
  actualReductionPercent: string;
  details: PlanExecutionDetail[];
  nextAction: string;
}

export interface VerificationResult {
  planId: string;
  verifiedAt: number;
  mediaBeforeBytes: number;
  mediaBeforeFormatted: string;
  mediaAfterBytes: number;
  mediaAfterFormatted: string;
  savedBytes: number;
  savedFormatted: string;
  reductionPercent: string;
  largestAssetBeforeBytes: number;
  largestAssetAfterBytes: number;
  largestAssetReductionPercent: string;
  scoreBefore?: number;
  scoreAfter?: number;
  scoreDelta?: number;
  measuredImprovements: string[];
  reportSavedPath?: string;
}

export interface TokenBudgetOptions {
  detailLevel?: DetailLevel;
  tokenBudget?: number;
}
