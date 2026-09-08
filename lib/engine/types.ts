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

// -------------------------------------------------------------
// Phase 1: Project Understanding & Source Analysis Types
// -------------------------------------------------------------

export type FrameworkType =
  | 'nextjs'
  | 'vite'
  | 'nuxt'
  | 'astro'
  | 'gatsby'
  | 'hugo'
  | 'modern_web'
  | 'unknown';

export interface ProjectStructure {
  projectRoot: string;
  framework: FrameworkType;
  frameworkVariant?: 'app_router' | 'pages_router' | 'static' | 'standard';
  routesDir?: string;
  componentsDir?: string;
  publicDir?: string;
  configFile?: string;
  packageJsonPath?: string;
  sourceFilesCount: number;
  assetFilesCount: number;
  frameworkConfidence: number; // 0.0 - 1.0
}

export interface SourceReference {
  filePath: string;
  relativePath: string;
  lineNumber: number;
  column?: number;
  tagOrImportType: 'img_tag' | 'picture_tag' | 'source_tag' | 'css_url' | 'js_import' | 'next_image' | 'video_tag' | 'svg_ref' | 'meta_tag';
  rawSnippet: string;
  assetRef: string;
  resolvedAssetPath?: string;
  renderedWidth?: number;
  renderedHeight?: number;
  isLcpCandidate?: boolean;
  hasPriority?: boolean;
  hasPreload?: boolean;
  loadingAttr?: string;
  componentName?: string;
  routePath?: string;
}

// -------------------------------------------------------------
// Phase 1: Asset Dependency Graph Types
// -------------------------------------------------------------

export type GraphNodeType =
  | 'project'
  | 'route'
  | 'component'
  | 'source_file'
  | 'asset'
  | 'variant'
  | 'runtime_resource';

export interface AssetGraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  data: Record<string, any>;
}

export type GraphEdgeRelationship =
  | 'contains'
  | 'imports'
  | 'references'
  | 'renders'
  | 'has_variant'
  | 'observed_by';

export interface AssetGraphEdge {
  from: string;
  to: string;
  relationship: GraphEdgeRelationship;
  metadata?: Record<string, any>;
}

export interface AssetGraphSummary {
  nodesCount: number;
  edgesCount: number;
  routesCount: number;
  componentsCount: number;
  sourceFilesCount: number;
  assetsCount: number;
  referencedAssetsCount: number;
  unreferencedAssetsCount: number;
}

export interface AssetUsageInfo {
  assetPath: string;
  relativePath: string;
  referenceCount: number;
  references: SourceReference[];
  routes: string[];
  components: string[];
  renderedDimensions: Array<{ width?: number; height?: number }>;
  isLcpCandidate: boolean;
  isShared: boolean;
  isUnused: boolean;
  riskRating: 'SAFE' | 'REVIEW_REQUIRED' | 'DESTRUCTIVE';
}

// -------------------------------------------------------------
// Phase 2: Asset Intelligence Types (Unused, Shared, Responsive)
// -------------------------------------------------------------

export type DeadAssetConfidence = 'SAFE' | 'LIKELY' | 'UNCERTAIN';

export interface UnusedAssetInfo {
  assetPath: string;
  relativePath: string;
  sizeBytes: number;
  sizeFormatted: string;
  format: string;
  confidence: DeadAssetConfidence;
  confidenceScore: number; // 0.0 - 1.0
  reason: string;
  recommendedAction: string;
}

export interface SharedAssetInfo {
  assetPath: string;
  relativePath: string;
  sizeBytes: number;
  sizeFormatted: string;
  referenceCount: number;
  routesCount: number;
  componentsCount: number;
  routes: string[];
  components: string[];
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
}

export interface ResponsiveVariantProposal {
  width: number;
  format: string;
  outputSuffix: string;
  quality?: number;
}

export interface ResponsiveOpportunity {
  assetPath: string;
  relativePath: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  renderedWidth?: number;
  renderedHeight?: number;
  sizeBytes: number;
  sizeFormatted: string;
  proposedVariants: ResponsiveVariantProposal[];
  estimatedSavingsBytes: number;
  estimatedSavingsFormatted: string;
}

// -------------------------------------------------------------
// Phase 3: Source Code Patching & Manifest Types
// -------------------------------------------------------------

export type PatchRisk = 'SAFE' | 'REVIEW_REQUIRED' | 'DESTRUCTIVE';

export interface PatchAction {
  actionId: string;
  type: 'replace_source' | 'add_srcset' | 'convert_next_image';
  filePath: string;
  relativePath: string;
  lineStart: number;
  lineEnd: number;
  originalCode: string;
  replacementCode: string;
  description: string;
  risk: PatchRisk;
}

export interface SourcePatch {
  patchId: string;
  createdAt: number;
  description: string;
  actions: PatchAction[];
  unifiedDiff: string;
  affectedFiles: string[];
  isDryRun: boolean;
}

export interface PatchManifest {
  operationId: string;
  timestamp: number;
  projectPath: string;
  backupDir: string;
  sourcePatches: Array<{
    file: string;
    backupFile: string;
    actionsApplied: number;
  }>;
  assetTransformations: Array<{
    source: string;
    output: string;
    backupFile?: string;
    beforeBytes: number;
    afterBytes: number;
    savedBytes: number;
  }>;
  canRollback: boolean;
}

// -------------------------------------------------------------
// Phase 4: Real Browser & Runtime Verification Types
// -------------------------------------------------------------

export interface BrowserPerformanceResult {
  measurementType: 'SIMULATED' | 'OBSERVED';
  url: string;
  timestamp: number;
  lcpMs?: number;
  fcpMs?: number;
  cls?: number;
  totalLoadMs?: number;
  mediaTransferBytes: number;
  mediaTransferFormatted: string;
  mediaRequestCount: number;
  resources: Array<{
    name: string;
    transferBytes: number;
    durationMs: number;
    initiatorType: string;
  }>;
  lcpElement?: {
    tag: string;
    src?: string;
    renderTimeMs?: number;
    sizeBytes?: number;
  };
}

// -------------------------------------------------------------
// Phase 5: Developer Workflow & Git Integration Types
// -------------------------------------------------------------

export interface PerformanceBudgetConfig {
  media?: {
    maxPageBytes?: number;
    maxImageBytes?: number;
    maxHeroBytes?: number;
    maxSvgBytes?: number;
  };
  performance?: {
    lcp?: number; // ms
    fcp?: number; // ms
  };
}

export interface BudgetCheckItem {
  rule: string;
  category: 'media' | 'performance';
  limit: number;
  limitFormatted: string;
  actual: number;
  actualFormatted: string;
  passed: boolean;
  severity: 'error' | 'warning';
  exceededBy: number;
  exceededByFormatted: string;
}

export interface BudgetEvaluation {
  status: 'PASS' | 'WARN' | 'FAIL';
  target: string;
  evaluatedAt: number;
  checks: BudgetCheckItem[];
  failedCount: number;
  warningCount: number;
  passedCount: number;
  nextAction: string;
}

export interface GitRegressionReport {
  hasGit: boolean;
  branch?: string;
  headCommit?: string;
  changedMediaCount: number;
  changedMediaFiles: Array<{
    path: string;
    status: 'added' | 'modified' | 'deleted';
    sizeBytes: number;
    sizeFormatted: string;
  }>;
  payloadBeforeBytes: number;
  payloadBeforeFormatted: string;
  payloadAfterBytes: number;
  payloadAfterFormatted: string;
  payloadDeltaBytes: number;
  payloadDeltaFormatted: string;
  payloadDeltaPercent: string;
  status: 'improvement' | 'regression' | 'unchanged' | 'unknown';
  primaryRegressors: string[];
}

// -------------------------------------------------------------
// Phase 6: Autonomous High-Level Mission Types
// -------------------------------------------------------------

export interface MissionOptions {
  projectPath: string;
  targetUrl?: string;
  mode?: 'safe' | 'review' | 'aggressive';
  dryRun?: boolean;
  format?: 'webp' | 'avif' | 'keep';
  maxDimension?: number;
  quality?: number;
  tokenBudget?: number;
  detailLevel?: DetailLevel;
  applySourcePatches?: boolean;
}

export interface MissionResult {
  status: 'verified' | 'attention_required' | 'dry_run_complete' | 'failed';
  missionId: string;
  completedAt: number;
  scoreBefore: number;
  scoreAfter: number;
  scoreDelta: number;
  assetsAnalyzed: number;
  assetsOptimized: number;
  bytesBefore: number;
  bytesBeforeFormatted: string;
  bytesAfter: number;
  bytesAfterFormatted: string;
  bytesSaved: number;
  bytesSavedFormatted: string;
  assetReductionPercent: string;
  lcpBefore?: number;
  lcpAfter?: number;
  lcpImprovementPercent?: string;
  regression: boolean;
  sourcePatchesCount: number;
  appliedPatchesCount: number;
  manifestId?: string;
  rollbackAvailable: boolean;
  nextAction: string | null;
}

