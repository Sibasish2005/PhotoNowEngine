/**
 * PhotoNow Perceptual Image Hashing & Duplicate Asset Detection
 *
 * Implements local difference hashing (dHash) and SHA-256 byte hashing
 * using native Sharp and Node.js crypto. Zero cloud, zero external dependencies.
 */

import crypto from 'crypto';
import sharp from 'sharp';
import { formatBytes } from './tokenEconomy.mjs';

/**
 * Calculates cryptographic SHA-256 hash of a buffer for exact duplicate detection.
 */
export function calculateSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Computes a 64-bit Difference Hash (dHash) using Sharp.
 * Resize to 9x8 grayscale, then compare adjacent pixels horizontally.
 */
export async function computeDHash(bufferOrPath) {
  try {
    const rawBuffer = await sharp(bufferOrPath, { failOn: 'none', limitInputPixels: 100_000_000 })
      .resize(9, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();

    let hashBits = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const left = rawBuffer[row * 9 + col];
        const right = rawBuffer[row * 9 + col + 1];
        hashBits += left > right ? '1' : '0';
      }
    }

    // Convert 64-bit binary string into 16-character hex string
    let hex = '';
    for (let i = 0; i < hashBits.length; i += 4) {
      const chunk = hashBits.slice(i, i + 4);
      hex += parseInt(chunk, 2).toString(16);
    }
    return hex;
  } catch {
    // If not a standard raster image (e.g. SVG or corrupt image), return null
    return null;
  }
}

/**
 * Computes Hamming distance (number of differing bits) between two 16-char hex dHashes.
 */
export function hammingDistance(hex1, hex2) {
  if (!hex1 || !hex2 || hex1.length !== hex2.length) return 64;
  let dist = 0;
  for (let i = 0; i < hex1.length; i++) {
    const val1 = parseInt(hex1[i], 16);
    const val2 = parseInt(hex2[i], 16);
    let xor = val1 ^ val2;
    while (xor > 0) {
      dist += xor & 1;
      xor >>= 1;
    }
  }
  return dist;
}

/**
 * Computes similarity percentage between two dHashes (0% to 100%).
 */
export function calculateSimilarity(hex1, hex2) {
  const dist = hammingDistance(hex1, hex2);
  const similarity = ((64 - dist) / 64) * 100;
  return Math.round(similarity * 10) / 10;
}

/**
 * Groups media assets by exact or perceptual duplicates.
 * @param {Array<{ path: string, relativePath?: string, sizeBytes: number, contentHash: string, dHash?: string }>} assets
 * @param {number} similarityThreshold - Min similarity percentage (default 93.75% = max distance 4)
 * @returns {Array<import('./types.js').DuplicateGroup>}
 */
export function groupDuplicates(assets, similarityThreshold = 93.75) {
  const duplicateGroups = [];
  const visited = new Set();

  for (let i = 0; i < assets.length; i++) {
    const itemA = assets[i];
    if (visited.has(itemA.path)) continue;

    const groupFiles = [itemA];
    let maxSimilarity = 100;

    for (let j = i + 1; j < assets.length; j++) {
      const itemB = assets[j];
      if (visited.has(itemB.path)) continue;

      let isDuplicate = false;
      let similarity = 0;

      // 1. Exact SHA-256 match
      if (itemA.contentHash && itemB.contentHash && itemA.contentHash === itemB.contentHash) {
        isDuplicate = true;
        similarity = 100;
      }
      // 2. Perceptual dHash match
      else if (itemA.dHash && itemB.dHash) {
        similarity = calculateSimilarity(itemA.dHash, itemB.dHash);
        if (similarity >= similarityThreshold) {
          isDuplicate = true;
        }
      }

      if (isDuplicate) {
        visited.add(itemB.path);
        groupFiles.push(itemB);
        if (similarity < maxSimilarity) {
          maxSimilarity = similarity;
        }
      }
    }

    if (groupFiles.length > 1) {
      visited.add(itemA.path);

      // Sort files in group so smallest/cleanest is representative
      groupFiles.sort((a, b) => a.sizeBytes - b.sizeBytes);

      // Potential savings is keeping 1 file and removing the rest
      const totalGroupBytes = groupFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
      const savingsBytes = totalGroupBytes - groupFiles[0].sizeBytes;

      duplicateGroups.push({
        id: `dup_group_${duplicateGroups.length + 1}`,
        representative: groupFiles[0].path,
        files: groupFiles.map((f) => ({
          path: f.path,
          relativePath: f.relativePath || f.path,
          sizeBytes: f.sizeBytes,
          sizeFormatted: formatBytes(f.sizeBytes),
          hash: f.contentHash,
        })),
        similarityPercent: maxSimilarity,
        potentialSavingsBytes: savingsBytes,
        potentialSavingsFormatted: formatBytes(savingsBytes),
      });
    }
  }

  // Sort groups by potential savings descending
  duplicateGroups.sort((a, b) => b.potentialSavingsBytes - a.potentialSavingsBytes);
  return duplicateGroups;
}
