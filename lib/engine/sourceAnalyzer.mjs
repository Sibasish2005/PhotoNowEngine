/**
 * PhotoNow Source Code Asset Reference Analyzer
 *
 * Scans project source files (.tsx, .jsx, .ts, .js, .html, .vue, .svelte, .astro, .css)
 * to discover asset references, rendered dimensions, loading priority, and route mappings.
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

const MEDIA_REGEX_EXTS = /\.(jpe?g|png|webp|avif|svg|gif|bmp|mp4|webm|mov|wav|mp3|ogg)(\?[^"'\s)]*)?$/i;

/**
 * Derives route path from file path.
 * e.g. app/pricing/page.tsx -> /pricing
 *      app/page.tsx -> /
 *      pages/about.jsx -> /about
 *      pages/index.tsx -> /
 */
export function deriveRouteFromFile(filePath, projectRoot) {
  const rel = path.relative(projectRoot, filePath).replace(/\\/g, '/');

  // App router: app/.../page.tsx
  const appMatch = rel.match(/(?:src\/)?app\/(.+?)\/page\.[jt]sx?$/);
  if (appMatch) {
    return '/' + appMatch[1].replace(/\/\(.*?\)/g, ''); // strip route groups e.g. (marketing)
  }
  if (/(?:src\/)?app\/page\.[jt]sx?$/.test(rel)) {
    return '/';
  }

  // Pages router: pages/about.tsx
  const pagesMatch = rel.match(/(?:src\/)?pages\/(.+?)\.[jt]sx?$/);
  if (pagesMatch) {
    const p = pagesMatch[1];
    if (p === 'index') return '/';
    return '/' + p;
  }

  // Astro routes: src/pages/about.astro
  const astroMatch = rel.match(/(?:src\/)?pages\/(.+?)\.astro$/);
  if (astroMatch) {
    const p = astroMatch[1];
    if (p === 'index') return '/';
    return '/' + p;
  }

  // Generic HTML: public/index.html -> /
  if (/index\.html$/i.test(rel)) {
    return '/';
  }
  const htmlMatch = rel.match(/(.+?)\.html$/i);
  if (htmlMatch) {
    return '/' + htmlMatch[1];
  }

  return undefined;
}

/**
 * Derives component name from file path.
 * e.g. components/HeroBanner.tsx -> HeroBanner
 */
export function deriveComponentFromFile(filePath) {
  const base = path.basename(filePath);
  const name = base.replace(/\.[^.]+$/, '');
  if (name.toLowerCase() === 'page' || name.toLowerCase() === 'index' || name.toLowerCase() === 'layout') {
    const parent = path.basename(path.dirname(filePath));
    return `${parent}_${name}`;
  }
  return name;
}

/**
 * Analyzes a single file's content and extracts all media references.
 *
 * @param {string} filePath - Absolute path to file.
 * @param {string} content - File string content.
 * @param {string} projectRoot - Absolute project root.
 * @param {string} [publicDir] - Optional public assets directory name (e.g. 'public').
 * @returns {import('./types').SourceReference[]}
 */
export function extractReferencesFromContent(filePath, content, projectRoot, publicDir = 'public') {
  const references = [];
  const lines = content.split(/\r?\n/);
  const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
  const routePath = deriveRouteFromFile(filePath, projectRoot);
  const componentName = deriveComponentFromFile(filePath);

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const lineNum = lineIdx + 1;

    // 1. Next.js <Image ... /> or general <Image ...> components
    const nextImgMatch = line.matchAll(/<Image\s+([^>]+)>/g);
    for (const match of nextImgMatch) {
      const attrs = match[1];
      const srcMatch = attrs.match(/src=(?:["']([^"']+)["']|{([^}]+)})/);
      if (srcMatch) {
        const rawSrc = (srcMatch[1] || srcMatch[2] || '').trim();
        const widthMatch = attrs.match(/width=(?:["']?(\d+)["']?|{(\d+)})/);
        const heightMatch = attrs.match(/height=(?:["']?(\d+)["']?|{(\d+)})/);
        const hasPriority = /priority(?:={true})?/i.test(attrs) || /fetchPriority=["']high["']/i.test(attrs);
        const isLcp = hasPriority || (routePath === '/' && /hero|banner/i.test(rawSrc));

        references.push({
          filePath,
          relativePath,
          lineNumber: lineNum,
          tagOrImportType: 'next_image',
          rawSnippet: match[0].slice(0, 160),
          assetRef: rawSrc,
          renderedWidth: widthMatch ? parseInt(widthMatch[1] || widthMatch[2], 10) : undefined,
          renderedHeight: heightMatch ? parseInt(heightMatch[1] || heightMatch[2], 10) : undefined,
          hasPriority,
          isLcpCandidate: isLcp,
          componentName,
          routePath,
        });
      }
    }

    // 2. Standard HTML <img ...>
    const imgMatch = line.matchAll(/<img\s+([^>]+)>/gi);
    for (const match of imgMatch) {
      const attrs = match[1];
      const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
      if (srcMatch) {
        const rawSrc = srcMatch[1].trim();
        const widthMatch = attrs.match(/width=["']?(\d+)["']?/i);
        const heightMatch = attrs.match(/height=["']?(\d+)["']?/i);
        const loadingMatch = attrs.match(/loading=["'](lazy|eager)["']/i);
        const hasPriority = /fetchpriority=["']high["']/i.test(attrs);
        const isLcp = hasPriority || (loadingMatch && loadingMatch[1] === 'eager') || (routePath === '/' && /hero|banner/i.test(rawSrc));

        references.push({
          filePath,
          relativePath,
          lineNumber: lineNum,
          tagOrImportType: 'img_tag',
          rawSnippet: match[0].slice(0, 160),
          assetRef: rawSrc,
          renderedWidth: widthMatch ? parseInt(widthMatch[1], 10) : undefined,
          renderedHeight: heightMatch ? parseInt(heightMatch[1], 10) : undefined,
          loadingAttr: loadingMatch ? loadingMatch[1] : undefined,
          hasPriority,
          isLcpCandidate: isLcp,
          componentName,
          routePath,
        });
      }
    }

    // 3. <source srcset="..."> or <picture>
    const sourceMatch = line.matchAll(/<source\s+([^>]+)>/gi);
    for (const match of sourceMatch) {
      const attrs = match[1];
      const srcMatch = attrs.match(/srcset=["']([^"']+)["']/i) || attrs.match(/src=["']([^"']+)["']/i);
      if (srcMatch) {
        references.push({
          filePath,
          relativePath,
          lineNumber: lineNum,
          tagOrImportType: 'source_tag',
          rawSnippet: match[0].slice(0, 160),
          assetRef: srcMatch[1].trim(),
          componentName,
          routePath,
        });
      }
    }

    // 4. <video ... src="..." poster="...">
    const videoMatch = line.matchAll(/<video\s+([^>]+)>/gi);
    for (const match of videoMatch) {
      const attrs = match[1];
      const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
      const posterMatch = attrs.match(/poster=["']([^"']+)["']/i);
      if (srcMatch) {
        references.push({
          filePath,
          relativePath,
          lineNumber: lineNum,
          tagOrImportType: 'video_tag',
          rawSnippet: match[0].slice(0, 160),
          assetRef: srcMatch[1].trim(),
          componentName,
          routePath,
        });
      }
      if (posterMatch) {
        references.push({
          filePath,
          relativePath,
          lineNumber: lineNum,
          tagOrImportType: 'img_tag',
          rawSnippet: match[0].slice(0, 160),
          assetRef: posterMatch[1].trim(),
          componentName,
          routePath,
        });
      }
    }

    // 5. CSS url(...) references
    const cssUrlMatch = line.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi);
    for (const match of cssUrlMatch) {
      const rawUrl = match[1].trim();
      if (MEDIA_REGEX_EXTS.test(rawUrl) && !rawUrl.startsWith('data:')) {
        references.push({
          filePath,
          relativePath,
          lineNumber: lineNum,
          tagOrImportType: 'css_url',
          rawSnippet: match[0].slice(0, 160),
          assetRef: rawUrl,
          componentName,
          routePath,
        });
      }
    }

    // 6. JS / TS Static Imports: import hero from './hero.png' or require(...)
    const importMatch = line.matchAll(/(?:import\s+(?:(?:\*\s+as\s+\w+)|(?:\w+)|(?:{[^}]+}))\s+from\s+["']([^"']+)["'])|(?:require\(["']([^"']+)["']\))/g);
    for (const match of importMatch) {
      const importPath = (match[1] || match[2] || '').trim();
      if (MEDIA_REGEX_EXTS.test(importPath)) {
        references.push({
          filePath,
          relativePath,
          lineNumber: lineNum,
          tagOrImportType: 'js_import',
          rawSnippet: match[0].slice(0, 160),
          assetRef: importPath,
          componentName,
          routePath,
        });
      }
    }

    // 7. new URL('./asset.png', import.meta.url)
    const newUrlMatch = line.matchAll(/new\s+URL\(["']([^"']+)["'],\s*import\.meta\.url\)/g);
    for (const match of newUrlMatch) {
      const raw = match[1].trim();
      if (MEDIA_REGEX_EXTS.test(raw)) {
        references.push({
          filePath,
          relativePath,
          lineNumber: lineNum,
          tagOrImportType: 'js_import',
          rawSnippet: match[0].slice(0, 160),
          assetRef: raw,
          componentName,
          routePath,
        });
      }
    }
  }

  // Resolve file paths for references
  for (const ref of references) {
    ref.resolvedAssetPath = resolveAssetRefToDisk(ref.assetRef, filePath, projectRoot, publicDir);
  }

  return references;
}

/**
 * Resolves an asset reference from source code to a disk path.
 * Handles:
 *  - Absolute public paths: /hero.png -> <projectRoot>/public/hero.png
 *  - Relative imports: ./assets/icon.svg -> <fileDir>/assets/icon.svg
 */
export function resolveAssetRefToDisk(assetRef, sourceFilePath, projectRoot, publicDir = 'public') {
  if (!assetRef || assetRef.startsWith('http://') || assetRef.startsWith('https://') || assetRef.startsWith('data:')) {
    return undefined;
  }

  // Strip query params or hash
  const cleanRef = assetRef.split(/[?#]/)[0];

  // 1. Root relative /hero.png -> <projectRoot>/<publicDir>/hero.png
  if (cleanRef.startsWith('/')) {
    const trimmed = cleanRef.slice(1);
    const candidate1 = path.join(projectRoot, publicDir, trimmed);
    const candidate2 = path.join(projectRoot, trimmed);
    return candidate1; // Primary convention
  }

  // 2. Relative to source file ./hero.png -> path.resolve(dir, cleanRef)
  const sourceDir = path.dirname(sourceFilePath);
  return path.resolve(sourceDir, cleanRef);
}

/**
 * Recursively scans project source code and discovers all media references.
 *
 * @param {string} projectRoot - Absolute project root path.
 * @param {string} [publicDir] - Public directory name.
 * @returns {Promise<import('./types').SourceReference[]>}
 */
export async function scanProjectSourceReferences(projectRoot, publicDir = 'public') {
  const references = [];

  async function walk(dir, depth = 0) {
    if (depth > 8) return;
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (IGNORED_DIRECTORIES.has(entry.name)) continue;
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await walk(fullPath, depth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (SOURCE_EXTENSIONS.has(ext)) {
            try {
              const content = await fs.readFile(fullPath, 'utf8');
              const fileRefs = extractReferencesFromContent(fullPath, content, projectRoot, publicDir);
              references.push(...fileRefs);
            } catch {
              // Ignore unreadable files
            }
          }
        }
      }
    } catch {
      // Ignore unreadable directory
    }
  }

  await walk(projectRoot);
  return references;
}
