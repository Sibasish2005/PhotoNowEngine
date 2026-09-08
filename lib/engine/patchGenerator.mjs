/**
 * PhotoNow Source Code Patch Generator & Applicator
 *
 * Generates unified diffs to update source files when assets are optimized,
 * adds responsive srcset attributes, applies patches with automated backups,
 * and maintains machine-readable manifests for complete rollback support.
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Checks if a path exists.
 */
async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates a unified diff string for a single file edit.
 */
function createUnifiedDiff(filePath, originalLines, modifiedLines) {
  const relPath = filePath.replace(/\\/g, '/');
  let diff = `--- a/${relPath}\n+++ b/${relPath}\n@@ -1,${originalLines.length} +1,${modifiedLines.length} @@\n`;

  const maxLen = Math.max(originalLines.length, modifiedLines.length);
  for (let i = 0; i < maxLen; i++) {
    const orig = originalLines[i];
    const mod = modifiedLines[i];

    if (orig === mod) {
      diff += ` ${orig || ''}\n`;
    } else {
      if (orig !== undefined) diff += `-${orig}\n`;
      if (mod !== undefined) diff += `+${mod}\n`;
    }
  }

  return diff;
}

/**
 * Generates source-code patch actions for an optimization plan using the asset graph.
 *
 * @param {import('./types').OptimizationPlan} plan
 * @param {import('./assetGraph').AssetDependencyGraph} assetGraph
 * @param {object} [options]
 * @param {boolean} [options.dryRun=true]
 * @returns {Promise<import('./types').SourcePatch>}
 */
export async function generateSourcePatch(plan, assetGraph, options = {}) {
  const patchId = `patch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const isDryRun = options.dryRun !== false;
  const actions = [];
  const affectedFilesSet = new Set();
  let fullUnifiedDiff = '';

  for (const action of plan.actions) {
    const usage = assetGraph.getAssetUsage(action.inputPath);
    if (!usage || usage.references.length === 0) continue;

    const oldBase = path.basename(action.inputPath);
    const newBase = path.basename(action.outputPath);
    if (oldBase === newBase) continue; // No filename change needed

    for (const ref of usage.references) {
      try {
        const fileContent = await fs.readFile(ref.filePath, 'utf8');
        const lines = fileContent.split(/\r?\n/);
        const lineIdx = ref.lineNumber - 1;
        const origLine = lines[lineIdx];

        if (origLine && origLine.includes(oldBase)) {
          const replacedLine = origLine.replace(new RegExp(escapeRegExp(oldBase), 'g'), newBase);

          const patchAction = {
            actionId: `action_${actions.length + 1}`,
            type: 'replace_source',
            filePath: ref.filePath,
            relativePath: ref.relativePath,
            lineStart: ref.lineNumber,
            lineEnd: ref.lineNumber,
            originalCode: origLine,
            replacementCode: replacedLine,
            description: `Update asset reference: ${oldBase} -> ${newBase}`,
            risk: 'REVIEW_REQUIRED',
          };

          actions.push(patchAction);
          affectedFilesSet.add(ref.filePath);

          // Build preview diff snippet
          fullUnifiedDiff += `--- a/${ref.relativePath}\n+++ b/${ref.relativePath}\n@@ -${ref.lineNumber},1 +${ref.lineNumber},1 @@\n-${origLine}\n+${replacedLine}\n\n`;
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  return {
    patchId,
    createdAt: Date.now(),
    description: `Update ${actions.length} source reference(s) across ${affectedFilesSet.size} file(s) for optimization ${plan.planId}.`,
    actions,
    unifiedDiff: fullUnifiedDiff.trim(),
    affectedFiles: Array.from(affectedFilesSet),
    isDryRun,
  };
}

/**
 * Escapes regex special characters.
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Safely applies a generated source patch with automated file backups and manifest generation.
 *
 * @param {import('./types').SourcePatch} patch
 * @param {object} options
 * @param {string} options.projectRoot
 * @param {boolean} [options.dryRun=false]
 * @returns {Promise<import('./types').PatchManifest>}
 */
export async function applySourcePatch(patch, options = {}) {
  const projectRoot = path.resolve(/*turbopackIgnore: true*/ options.projectRoot || process.cwd());
  const isDryRun = !!options.dryRun;
  const operationId = `op_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const backupDir = path.join(/*turbopackIgnore: true*/ projectRoot, '.photonow', 'backups', operationId);

  const manifest = {
    operationId,
    timestamp: Date.now(),
    projectPath: projectRoot,
    backupDir,
    sourcePatches: [],
    assetTransformations: [],
    canRollback: true,
  };

  if (isDryRun) {
    return manifest;
  }

  // Ensure backup directory exists
  await fs.mkdir(backupDir, { recursive: true });

  // Group actions by file path
  const actionsByFile = new Map();
  for (const action of patch.actions) {
    if (!actionsByFile.has(action.filePath)) {
      actionsByFile.set(action.filePath, []);
    }
    actionsByFile.get(action.filePath).push(action);
  }

  for (const [filePath, fileActions] of actionsByFile.entries()) {
    // 1. Create backup of original file
    const rel = path.relative(projectRoot, filePath);
    const backupFilePath = path.join(backupDir, rel);
    await fs.mkdir(path.dirname(backupFilePath), { recursive: true });
    await fs.copyFile(filePath, backupFilePath);

    // 2. Read and apply line modifications
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    // Sort descending by line number so earlier lines don't shift
    fileActions.sort((a, b) => b.lineStart - a.lineStart);

    let appliedForFile = 0;
    for (const action of fileActions) {
      const idx = action.lineStart - 1;
      if (lines[idx] && lines[idx].trim() === action.originalCode.trim()) {
        lines[idx] = action.replacementCode;
        appliedForFile++;
      } else if (lines[idx] && lines[idx].includes(path.basename(action.originalCode))) {
        // Line content shifted slightly; attempt direct string replace on that line
        const oldToken = action.originalCode.trim();
        const newToken = action.replacementCode.trim();
        lines[idx] = lines[idx].replace(oldToken, newToken);
        appliedForFile++;
      }
    }

    // 3. Write back modified content safely
    await fs.writeFile(filePath, lines.join('\n'), 'utf8');

    manifest.sourcePatches.push({
      file: filePath,
      backupFile: backupFilePath,
      actionsApplied: appliedForFile,
    });
  }

  // 4. Save manifest for rollback
  const manifestsDir = path.join(/*turbopackIgnore: true*/ projectRoot, '.photonow', 'manifests');
  await fs.mkdir(manifestsDir, { recursive: true });
  const manifestPath = path.join(/*turbopackIgnore: true*/ manifestsDir, `manifest_${operationId}.json`);
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  return manifest;
}

/**
 * Rolls back an operation using its manifest file.
 *
 * @param {string} operationId - Operation ID (e.g. op_abc123)
 * @param {string} projectRoot - Absolute project root
 * @returns {Promise<{ success: boolean; restoredSourcesCount: number; restoredAssetsCount: number; message: string }>}
 */
export async function rollbackOperation(operationId, projectRoot = process.cwd()) {
  if (!operationId || typeof operationId !== 'string' || !/^op_[a-zA-Z0-9_-]+$/.test(operationId)) {
    throw new Error(`Security violation: Invalid operation ID '${operationId}'. Must match format ^op_[a-zA-Z0-9_-]+$`);
  }

  const resolvedRoot = path.resolve(/*turbopackIgnore: true*/ projectRoot);
  const manifestsDir = path.join(/*turbopackIgnore: true*/ resolvedRoot, '.photonow', 'manifests');
  const manifestPath = path.join(/*turbopackIgnore: true*/ manifestsDir, `manifest_${operationId}.json`);

  // Path containment check
  if (!manifestPath.startsWith(manifestsDir)) {
    throw new Error('Security violation: Directory traversal attempt detected in manifest path.');
  }

  if (!(await pathExists(manifestPath))) {
    throw new Error(`Rollback manifest not found for operation ID: ${operationId} at ${manifestPath}`);
  }

  const rawManifest = await fs.readFile(manifestPath, 'utf8');
  /** @type {import('./types').PatchManifest} */
  const manifest = JSON.parse(rawManifest);

  let restoredSources = 0;
  let restoredAssets = 0;

  const backupsBaseDir = path.join(/*turbopackIgnore: true*/ resolvedRoot, '.photonow', 'backups');

  // 1. Restore source code files with boundary verification
  for (const patch of (manifest.sourcePatches || [])) {
    const targetFile = path.resolve(patch.file);
    const backupFile = path.resolve(patch.backupFile);

    // Boundary check: cannot write outside project root
    if (!targetFile.startsWith(resolvedRoot)) {
      throw new Error(`Security violation: Attempted restore outside project root: ${targetFile}`);
    }
    if (!backupFile.startsWith(backupsBaseDir)) {
      throw new Error(`Security violation: Backup file outside authorized backup directory: ${backupFile}`);
    }

    if (await pathExists(backupFile)) {
      await fs.copyFile(backupFile, targetFile);
      restoredSources++;
    }
  }

  // 2. Restore assets if any were backed up
  for (const asset of (manifest.assetTransformations || [])) {
    if (asset.backupFile && (await pathExists(asset.backupFile))) {
      const targetAsset = path.resolve(asset.source);
      const backupAsset = path.resolve(asset.backupFile);

      if (!targetAsset.startsWith(resolvedRoot) || !backupAsset.startsWith(backupsBaseDir)) {
        throw new Error('Security violation: Asset restore path boundary violation.');
      }

      await fs.copyFile(backupAsset, targetAsset);
      restoredAssets++;
    }
  }

  return {
    success: true,
    restoredSourcesCount: restoredSources,
    restoredAssetsCount: restoredAssets,
    message: `Rollback completed successfully for ${operationId}. Restored ${restoredSources} source files and ${restoredAssets} asset files.`,
  };
}
