/**
 * Shared utility functions for PhotoNow
 * Centralized source of truth for formatting, string sanitization, and conversions.
 */

/**
 * Format bytes into human-readable string (e.g., "1.45 MB", "320 KB")
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(i === 0 ? 0 : decimals)} ${sizes[i] || 'B'}`;
}

/**
 * Sanitizes file names to eliminate directory traversal sequences (e.g. '../', '..\\')
 * and control characters that could trigger Zip Slip or file system exploit vectors.
 */
export function sanitizeFileName(rawName: string): string {
  if (!rawName) return 'file';
  return rawName
    .replace(/[\0\r\n\t]/g, '')           // Strip control characters & null bytes
    .replace(/\.\.+[/\\]+/g, '')          // Strip path traversal sequences (../../)
    .replace(/[/\\]+/g, '_')              // Replace path separators with underscores
    .replace(/[<>:"|?*]/g, '_')           // Replace Windows invalid file characters
    .replace(/^[.\s]+/, '')               // Remove leading dots or whitespace
    .trim() || 'converted_media';
}

/**
 * Splits a file name safely into baseName and lowercase extension
 */
export function getBaseNameAndExt(fileName: string): { baseName: string; ext: string } {
  const sanitized = sanitizeFileName(fileName);
  const match = sanitized.match(/^(.*?)(\.[a-zA-Z0-9]+)?$/);
  const baseName = match && match[1] ? match[1] : sanitized;
  const ext = match && match[2] ? match[2].toLowerCase() : '';
  return { baseName, ext };
}

/**
 * Normalizes quality input: accepts decimal (0.1 - 1.0) or percentage (1 - 100)
 */
export function normalizeQuality(rawQuality?: number, fallback: number = 82): number {
  if (rawQuality === undefined || rawQuality === null || isNaN(rawQuality)) return fallback;
  if (rawQuality <= 1.0 && rawQuality > 0) {
    return Math.round(rawQuality * 100);
  }
  return Math.min(Math.max(Math.round(rawQuality), 1), 100);
}
