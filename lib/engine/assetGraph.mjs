/**
 * PhotoNow Asset Dependency Graph
 *
 * Models and queries relationships across:
 * Route -> Component -> SourceFile -> Asset -> Variant -> PerformanceObservation
 *
 * Identifies unused assets, shared assets, responsive opportunities, and LCP candidates.
 */

import path from 'path';
import { formatBytes } from './tokenEconomy.mjs';

/**
 * Normalizes file paths for reliable cross-platform comparison.
 */
function normalizePath(p) {
  if (!p) return '';
  return path.resolve(p).toLowerCase().replace(/\\/g, '/');
}

export class AssetDependencyGraph {
  constructor(projectRoot = '') {
    this.projectRoot = projectRoot;
    /** @type {Map<string, import('./types').AssetGraphNode>} */
    this.nodes = new Map();
    /** @type {import('./types').AssetGraphEdge[]} */
    this.edges = [];
    /** @type {Map<string, Set<string>>} assetPath -> Set<sourceFilePath> */
    this.assetToSourceFiles = new Map();
    /** @type {Map<string, Set<string>>} assetPath -> Set<routePath> */
    this.assetToRoutes = new Map();
    /** @type {Map<string, Set<string>>} assetPath -> Set<componentName> */
    this.assetToComponents = new Map();
    /** @type {Map<string, import('./types').SourceReference[]>} assetPath -> SourceReference[] */
    this.assetToReferences = new Map();
    /** @type {Map<string, import('./types').AssetAnalysis>} */
    this.assets = new Map();
  }

  /**
   * Adds a node to the graph if it doesn't already exist.
   */
  addNode(id, type, label, data = {}) {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, { id, type, label, data });
    }
    return this.nodes.get(id);
  }

  /**
   * Adds a directed edge between two nodes.
   */
  addEdge(from, to, relationship, metadata = {}) {
    this.edges.push({ from, to, relationship, metadata });
  }

  /**
   * Populates the graph with asset analysis results and source references.
   *
   * @param {import('./types').AssetAnalysis[]} assetAnalyses
   * @param {import('./types').SourceReference[]} sourceReferences
   */
  populate(assetAnalyses, sourceReferences) {
    // 1. Add Project Node
    const projectId = 'node:project';
    this.addNode(projectId, 'project', path.basename(this.projectRoot) || 'Project', { root: this.projectRoot });

    // 2. Register all known physical media assets
    for (const asset of assetAnalyses) {
      const normPath = normalizePath(asset.path);
      this.assets.set(normPath, asset);

      const assetNodeId = `node:asset:${normPath}`;
      this.addNode(assetNodeId, 'asset', asset.fileName, {
        path: asset.path,
        relativePath: asset.relativePath,
        format: asset.format,
        sizeBytes: asset.sizeBytes,
        width: asset.width,
        height: asset.height,
        issuesCount: asset.issues.length,
      });
      this.addEdge(projectId, assetNodeId, 'contains');

      this.assetToSourceFiles.set(normPath, new Set());
      this.assetToRoutes.set(normPath, new Set());
      this.assetToComponents.set(normPath, new Set());
      this.assetToReferences.set(normPath, []);
    }

    // 3. Process Source References and connect SourceFiles, Components, and Routes
    for (const ref of sourceReferences) {
      const normSourceFile = normalizePath(ref.filePath);
      const sourceNodeId = `node:source:${normSourceFile}`;
      this.addNode(sourceNodeId, 'source_file', ref.relativePath, { path: ref.filePath });

      if (ref.routePath) {
        const routeNodeId = `node:route:${ref.routePath}`;
        this.addNode(routeNodeId, 'route', ref.routePath, { route: ref.routePath });
        this.addEdge(routeNodeId, sourceNodeId, 'renders');
      }

      if (ref.componentName) {
        const compNodeId = `node:comp:${ref.componentName}`;
        this.addNode(compNodeId, 'component', ref.componentName, { name: ref.componentName });
        this.addEdge(compNodeId, sourceNodeId, 'imports');
      }

      // Match reference to an asset
      const matchedAssetPath = this.matchReferenceToAsset(ref);
      if (matchedAssetPath) {
        const assetNodeId = `node:asset:${matchedAssetPath}`;
        this.addEdge(sourceNodeId, assetNodeId, 'references', {
          line: ref.lineNumber,
          type: ref.tagOrImportType,
          renderedWidth: ref.renderedWidth,
          renderedHeight: ref.renderedHeight,
        });

        // Update lookups
        const sources = this.assetToSourceFiles.get(matchedAssetPath);
        if (sources) sources.add(ref.filePath);

        if (ref.routePath) {
          const routes = this.assetToRoutes.get(matchedAssetPath);
          if (routes) routes.add(ref.routePath);
        }

        if (ref.componentName) {
          const comps = this.assetToComponents.get(matchedAssetPath);
          if (comps) comps.add(ref.componentName);
        }

        const refs = this.assetToReferences.get(matchedAssetPath);
        if (refs) refs.push(ref);
      }
    }
  }

  /**
   * Matches a SourceReference asset string to a physical asset in the graph.
   */
  matchReferenceToAsset(ref) {
    // 1. Direct resolved disk path
    if (ref.resolvedAssetPath) {
      const normResolved = normalizePath(ref.resolvedAssetPath);
      if (this.assets.has(normResolved)) return normResolved;
    }

    // 2. Base file name matching for public root references (e.g. /hero.png)
    const baseName = path.basename(ref.assetRef.split(/[?#]/)[0]).toLowerCase();
    for (const [normPath, asset] of this.assets.entries()) {
      if (asset.fileName.toLowerCase() === baseName) {
        return normPath;
      }
    }

    // 3. Substring matching
    const cleanRef = ref.assetRef.split(/[?#]/)[0].toLowerCase().replace(/^\/+/, '');
    for (const [normPath, asset] of this.assets.entries()) {
      if (asset.relativePath.toLowerCase().replace(/\\/g, '/').endsWith(cleanRef)) {
        return normPath;
      }
    }

    return null;
  }

  /**
   * Queries full usage details for a given asset.
   *
   * @param {string} assetPathOrName
   * @returns {import('./types').AssetUsageInfo | null}
   */
  getAssetUsage(assetPathOrName) {
    const norm = normalizePath(assetPathOrName);
    let matchedPath = norm;

    if (!this.assets.has(matchedPath)) {
      // Try search by base name or relative path
      const queryBase = path.basename(assetPathOrName).toLowerCase();
      for (const [p, a] of this.assets.entries()) {
        if (a.fileName.toLowerCase() === queryBase || a.relativePath.toLowerCase().endsWith(queryBase)) {
          matchedPath = p;
          break;
        }
      }
    }

    const asset = this.assets.get(matchedPath);
    if (!asset) return null;

    const references = this.assetToReferences.get(matchedPath) || [];
    const routes = Array.from(this.assetToRoutes.get(matchedPath) || []);
    const components = Array.from(this.assetToComponents.get(matchedPath) || []);
    const renderedDimensions = references
      .filter((r) => r.renderedWidth || r.renderedHeight)
      .map((r) => ({ width: r.renderedWidth, height: r.renderedHeight }));

    const isLcpCandidate = references.some((r) => r.isLcpCandidate);
    const isShared = routes.length > 1 || components.length > 2;
    const isUnused = references.length === 0;

    let riskRating = 'SAFE';
    if (isShared) riskRating = 'REVIEW_REQUIRED';
    if (isUnused) riskRating = 'DESTRUCTIVE'; // modifying/deleting unreferenced asset requires approval

    return {
      assetPath: asset.path,
      relativePath: asset.relativePath,
      referenceCount: references.length,
      references,
      routes,
      components,
      renderedDimensions,
      isLcpCandidate,
      isShared,
      isUnused,
      riskRating,
    };
  }

  /**
   * Discovers potentially unused assets with confidence classifications.
   *
   * @returns {import('./types').UnusedAssetInfo[]}
   */
  findUnusedAssets() {
    const unused = [];

    for (const [normPath, asset] of this.assets.entries()) {
      const refs = this.assetToReferences.get(normPath) || [];
      if (refs.length === 0) {
        // Evaluate confidence that it is truly dead
        let confidence = 'LIKELY';
        let confidenceScore = 0.85;
        let reason = 'Zero direct references detected across scanned source files.';
        const baseLower = asset.fileName.toLowerCase();

        // Check if it's standard metadata or favicon (uncertain to touch)
        if (
          baseLower.includes('favicon') ||
          baseLower.includes('icon') ||
          baseLower.includes('logo') ||
          baseLower.includes('apple-touch') ||
          baseLower.includes('opengraph') ||
          baseLower.includes('og-image') ||
          baseLower.includes('robots') ||
          baseLower.includes('manifest')
        ) {
          confidence = 'UNCERTAIN';
          confidenceScore = 0.4;
          reason = 'Special convention asset (favicon, app icon, or OpenGraph image). May be loaded via metadata conventions.';
        } else if (asset.relativePath.startsWith('public') || asset.relativePath.startsWith('static')) {
          confidence = 'SAFE';
          confidenceScore = 0.95;
          reason = 'Static public asset with zero references in templates, JSX, CSS, or imports.';
        }

        unused.push({
          assetPath: asset.path,
          relativePath: asset.relativePath,
          sizeBytes: asset.sizeBytes,
          sizeFormatted: asset.sizeFormatted,
          format: asset.format,
          confidence,
          confidenceScore,
          reason,
          recommendedAction: confidence === 'SAFE' ? 'review_for_pruning' : 'keep_or_verify_dynamic_usage',
        });
      }
    }

    // Sort by largest byte waste first
    unused.sort((a, b) => b.sizeBytes - a.sizeBytes);
    return unused;
  }

  /**
   * Discovers shared assets used across multiple routes or components.
   *
   * @returns {import('./types').SharedAssetInfo[]}
   */
  findSharedAssets() {
    const shared = [];

    for (const [normPath, asset] of this.assets.entries()) {
      const routes = Array.from(this.assetToRoutes.get(normPath) || []);
      const components = Array.from(this.assetToComponents.get(normPath) || []);
      const references = this.assetToReferences.get(normPath) || [];

      if (routes.length > 1 || components.length > 1 || references.length > 2) {
        const riskLevel = routes.length >= 3 ? 'HIGH' : (routes.length === 2 ? 'MEDIUM' : 'LOW');
        shared.push({
          assetPath: asset.path,
          relativePath: asset.relativePath,
          sizeBytes: asset.sizeBytes,
          sizeFormatted: asset.sizeFormatted,
          referenceCount: references.length,
          routesCount: routes.length,
          componentsCount: components.length,
          routes,
          components,
          riskLevel,
          recommendation: `Referenced across ${routes.length} routes and ${components.length} components. Optimize format/size with care; do not rename or prune without global source updates.`,
        });
      }
    }

    shared.sort((a, b) => b.routesCount - a.routesCount || b.referenceCount - a.referenceCount);
    return shared;
  }

  /**
   * Returns all media assets associated with a specific route.
   */
  getRouteAssets(routePath) {
    const results = [];
    for (const [normPath, routes] of this.assetToRoutes.entries()) {
      if (routes.has(routePath)) {
        const asset = this.assets.get(normPath);
        if (asset) results.push(asset);
      }
    }
    return results;
  }

  /**
   * Generates graph summary statistics.
   *
   * @returns {import('./types').AssetGraphSummary}
   */
  getSummary() {
    let referencedCount = 0;
    let unreferencedCount = 0;

    for (const refs of this.assetToReferences.values()) {
      if (refs.length > 0) referencedCount++;
      else unreferencedCount++;
    }

    const routeNodes = Array.from(this.nodes.values()).filter((n) => n.type === 'route').length;
    const compNodes = Array.from(this.nodes.values()).filter((n) => n.type === 'component').length;
    const sourceNodes = Array.from(this.nodes.values()).filter((n) => n.type === 'source_file').length;

    return {
      nodesCount: this.nodes.size,
      edgesCount: this.edges.length,
      routesCount: routeNodes,
      componentsCount: compNodes,
      sourceFilesCount: sourceNodes,
      assetsCount: this.assets.size,
      referencedAssetsCount: referencedCount,
      unreferencedAssetsCount: unreferencedCount,
    };
  }

  /**
   * Exports full graph as plain JSON object.
   */
  toJSON() {
    return {
      projectRoot: this.projectRoot,
      summary: this.getSummary(),
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
    };
  }
}

/**
 * Builds and returns a populated AssetDependencyGraph.
 *
 * @param {string} projectRoot
 * @param {import('./types').AssetAnalysis[]} assetAnalyses
 * @param {import('./types').SourceReference[]} sourceReferences
 * @returns {AssetDependencyGraph}
 */
export function buildAssetGraph(projectRoot, assetAnalyses, sourceReferences) {
  const graph = new AssetDependencyGraph(projectRoot);
  graph.populate(assetAnalyses, sourceReferences);
  return graph;
}
