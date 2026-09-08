/**
 * PhotoNow Project Scanner
 *
 * Scans web project structures, accurately identifies frameworks (Next.js, Vite,
 * Nuxt, Astro, Gatsby, Hugo, Modern Web), discovers route trees, component directories,
 * and public media roots.
 */

import fs from 'fs/promises';
import path from 'path';

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.next',
  '.nuxt',
  '.astro',
  '.cache',
  'dist',
  'build',
  'out',
  '.photonow',
  'coverage',
]);

const SOURCE_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.vue',
  '.svelte',
  '.astro',
  '.html',
  '.css',
  '.scss',
  '.sass',
  '.less',
]);

const MEDIA_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.gif',
  '.svg',
  '.bmp',
  '.mp4',
  '.webm',
  '.mov',
  '.wav',
  '.mp3',
]);

/**
 * Checks if a file or directory exists.
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
 * Recursively counts files in a directory up to maxDepth.
 */
async function countFiles(dir, depth = 0, maxDepth = 6) {
  if (depth > maxDepth) return { sourceCount: 0, assetCount: 0 };
  let sourceCount = 0;
  let assetCount = 0;

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORED_DIRECTORIES.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const sub = await countFiles(fullPath, depth + 1, maxDepth);
        sourceCount += sub.sourceCount;
        assetCount += sub.assetCount;
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SOURCE_EXTENSIONS.has(ext)) {
          sourceCount++;
        } else if (MEDIA_EXTENSIONS.has(ext)) {
          assetCount++;
        }
      }
    }
  } catch {
    // Ignore read permission errors
  }

  return { sourceCount, assetCount };
}

/**
 * Scans a project directory and extracts framework, structure, routes, and components.
 *
 * @param {string} projectRoot - Absolute or relative project directory path.
 * @returns {Promise<import('./types').ProjectStructure>}
 */
export async function scanProjectStructure(projectRoot) {
  const resolvedRoot = path.resolve(/*turbopackIgnore: true*/ projectRoot);
  const rootExists = await pathExists(resolvedRoot);
  if (!rootExists) {
    throw new Error(`Project directory does not exist: ${resolvedRoot}`);
  }

  // 1. Read package.json if present
  let pkg = null;
  const pkgPath = path.join(/*turbopackIgnore: true*/ resolvedRoot, 'package.json');
  if (await pathExists(pkgPath)) {
    try {
      const rawPkg = await fs.readFile(pkgPath, 'utf8');
      pkg = JSON.parse(rawPkg);
    } catch {
      // Malformed package.json
    }
  }

  const allDeps = {
    ...(pkg?.dependencies || {}),
    ...(pkg?.devDependencies || {}),
    ...(pkg?.peerDependencies || {}),
  };

  // 2. Discover routes directory
  let routesDir = null;
  let frameworkVariant = 'standard';
  const possibleRouteDirs = [
    { path: 'app', variant: 'app_router' },
    { path: path.join('src', 'app'), variant: 'app_router' },
    { path: 'pages', variant: 'pages_router' },
    { path: path.join('src', 'pages'), variant: 'pages_router' },
    { path: path.join('src', 'routes'), variant: 'standard' },
    { path: 'routes', variant: 'standard' },
  ];

  for (const candidate of possibleRouteDirs) {
    const full = path.join(/*turbopackIgnore: true*/ resolvedRoot, candidate.path);
    if (await pathExists(full)) {
      routesDir = candidate.path;
      frameworkVariant = candidate.variant;
      break;
    }
  }

  // 3. Discover components directory
  let componentsDir = null;
  const possibleComponentDirs = [
    'components',
    path.join('src', 'components'),
    'ui',
    path.join('src', 'ui'),
  ];
  for (const candidate of possibleComponentDirs) {
    const full = path.join(/*turbopackIgnore: true*/ resolvedRoot, candidate);
    if (await pathExists(full)) {
      componentsDir = candidate;
      break;
    }
  }

  // 4. Discover public / static media directories
  let publicDir = null;
  const possiblePublicDirs = [
    'public',
    'static',
    'assets',
    path.join('src', 'assets'),
  ];
  for (const candidate of possiblePublicDirs) {
    const full = path.join(/*turbopackIgnore: true*/ resolvedRoot, candidate);
    if (await pathExists(full)) {
      publicDir = candidate;
      break;
    }
  }

  // 5. Detect framework and config files
  let framework = 'unknown';
  let frameworkConfidence = 0.0;
  let configFile = null;

  if (allDeps['next'] || (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'next.config.js'))) || (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'next.config.ts'))) || (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'next.config.mjs')))) {
    framework = 'nextjs';
    frameworkConfidence = allDeps['next'] ? 1.0 : 0.9;
    configFile = (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'next.config.ts')))
      ? 'next.config.ts'
      : ((await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'next.config.mjs')))
        ? 'next.config.mjs'
        : 'next.config.js');
  } else if (allDeps['astro'] || (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'astro.config.mjs'))) || (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'astro.config.ts')))) {
    framework = 'astro';
    frameworkConfidence = allDeps['astro'] ? 1.0 : 0.9;
    configFile = (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'astro.config.mjs'))) ? 'astro.config.mjs' : 'astro.config.ts';
  } else if (allDeps['nuxt'] || (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'nuxt.config.ts'))) || (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'nuxt.config.js')))) {
    framework = 'nuxt';
    frameworkConfidence = allDeps['nuxt'] ? 1.0 : 0.9;
    configFile = (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'nuxt.config.ts'))) ? 'nuxt.config.ts' : 'nuxt.config.js';
  } else if (allDeps['gatsby'] || (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'gatsby-config.js'))) || (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'gatsby-config.ts')))) {
    framework = 'gatsby';
    frameworkConfidence = allDeps['gatsby'] ? 1.0 : 0.9;
    configFile = (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'gatsby-config.ts'))) ? 'gatsby-config.ts' : 'gatsby-config.js';
  } else if (allDeps['vite'] || (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'vite.config.ts'))) || (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'vite.config.js')))) {
    framework = 'vite';
    frameworkConfidence = allDeps['vite'] ? 1.0 : 0.9;
    configFile = (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'vite.config.ts'))) ? 'vite.config.ts' : 'vite.config.js';
  } else if (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'config.toml')) || await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'config.yaml')) || await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'hugo.toml'))) {
    framework = 'hugo';
    frameworkConfidence = 0.85;
    configFile = 'hugo.toml';
  } else if (pkg || (await pathExists(path.join(/*turbopackIgnore: true*/ resolvedRoot, 'index.html')))) {
    framework = 'modern_web';
    frameworkConfidence = 0.7;
    configFile = (await pathExists(path.join(resolvedRoot, 'index.html'))) ? 'index.html' : null;
  }

  // 6. Count source and asset files
  const { sourceCount, assetCount } = await countFiles(resolvedRoot);

  return {
    projectRoot: resolvedRoot,
    framework,
    frameworkVariant,
    routesDir: routesDir || undefined,
    componentsDir: componentsDir || undefined,
    publicDir: publicDir || undefined,
    configFile: configFile || undefined,
    packageJsonPath: pkg ? pkgPath : undefined,
    sourceFilesCount: sourceCount,
    assetFilesCount: assetCount,
    frameworkConfidence,
  };
}
