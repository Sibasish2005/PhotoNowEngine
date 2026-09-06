import { ImageConvertOptions, ImageFormat, StoredConversion } from './types';
import { sanitizeFileName } from './storage';

export function getMimeType(format: ImageFormat): string {
  switch (format) {
    case 'webp':
      return 'image/webp';
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'avif':
      return 'image/avif';
    case 'bmp':
      return 'image/bmp';
    default:
      return 'image/webp';
  }
}

export async function loadImageFromFile(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image: ' + err));
    };
    img.src = url;
  });
}

/**
 * Apply a custom hand-drawn monochrome ink-sketch filter
 * Transmutes any photograph into a high-contrast ink line-drawing on #F2F2F0 paper
 */
export function applyInkSketchEffect(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;

  // 1. Convert to grayscale luminance
  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; i < len; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // 2. Simple Sobel Edge Detection for ink contours
  const edges = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx =
        -1 * gray[idx - width - 1] + 1 * gray[idx - width + 1] +
        -2 * gray[idx - 1] + 2 * gray[idx + 1] +
        -1 * gray[idx + width - 1] + 1 * gray[idx + width + 1];

      const gy =
        -1 * gray[idx - width - 1] - 2 * gray[idx - width] - 1 * gray[idx - width + 1] +
         1 * gray[idx + width - 1] + 2 * gray[idx + width] + 1 * gray[idx + width + 1];

      edges[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // 3. Composite into ink sketch:
  // Background: #F2F2F0 (242, 242, 240)
  // Ink Lines: #0A0A0A (10, 10, 10)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const i = p * 4;
      const g = gray[p];
      const edge = edges[p];

      // If edge is strong, draw dark ink line. Otherwise, dither dark shadows with crosshatch pattern
      const isEdge = edge > 45;
      const isDarkShadow = g < 75;
      const isMidShadow = g < 135 && (x + y) % 4 === 0;
      const isDither = g < 185 && (x % 3 === 0 && y % 3 === 0);

      if (isEdge || isDarkShadow || isMidShadow || isDither) {
        // Ink black
        data[i] = 10;
        data[i + 1] = 10;
        data[i + 2] = 10;
      } else {
        // Paper off-white #F2F2F0
        data[i] = 242;
        data[i + 1] = 242;
        data[i + 2] = 240;
      }
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

export function applyGrayscaleEffect(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = avg;
    data[i + 1] = avg;
    data[i + 2] = avg;
  }
  ctx.putImageData(imgData, 0, 0);
}

export function applyInvertEffect(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  ctx.putImageData(imgData, 0, 0);
}

export async function convertImage(
  source: Blob,
  options: ImageConvertOptions,
  originalFileName: string
): Promise<StoredConversion> {
  const img = await loadImageFromFile(source);

  let targetWidth = img.naturalWidth || img.width;
  let targetHeight = img.naturalHeight || img.height;

  // Defensive safeguard: clamp max dimension to 8192px to prevent canvas decompression bombs
  const ABSOLUTE_MAX_DIMENSION = 8192;
  if (targetWidth > ABSOLUTE_MAX_DIMENSION || targetHeight > ABSOLUTE_MAX_DIMENSION) {
    const scaleFactor = Math.min(ABSOLUTE_MAX_DIMENSION / targetWidth, ABSOLUTE_MAX_DIMENSION / targetHeight);
    targetWidth = Math.round(targetWidth * scaleFactor);
    targetHeight = Math.round(targetHeight * scaleFactor);
  }

  // Downscale if exceeds user-defined max bounds
  if (options.maxWidth && targetWidth > options.maxWidth) {
    const ratio = options.maxWidth / targetWidth;
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  if (options.maxHeight && targetHeight > options.maxHeight) {
    const ratio = options.maxHeight / targetHeight;
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  const canvas = document.createElement('canvas');
  const rotate = options.rotate || 0;

  if (rotate === 90 || rotate === 270) {
    canvas.width = targetHeight;
    canvas.height = targetWidth;
  } else {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get canvas context');

  // Background white for transparent PNG when converting to JPEG
  if (options.format === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.save();
  if (rotate === 90) {
    ctx.translate(canvas.width, 0);
    ctx.rotate((90 * Math.PI) / 180);
  } else if (rotate === 180) {
    ctx.translate(canvas.width, canvas.height);
    ctx.rotate((180 * Math.PI) / 180);
  } else if (rotate === 270) {
    ctx.translate(0, canvas.height);
    ctx.rotate((270 * Math.PI) / 180);
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  ctx.restore();

  // Filters
  if (options.applySketchFilter) {
    applyInkSketchEffect(ctx, canvas.width, canvas.height);
  } else {
    if (options.applyGrayscale) {
      applyGrayscaleEffect(ctx, canvas.width, canvas.height);
    }
    if (options.applyInvert) {
      applyInvertEffect(ctx, canvas.width, canvas.height);
    }
  }

  const mimeType = getMimeType(options.format);
  const quality = Math.min(Math.max(options.quality || 0.8, 0.05), 1.0);

  const convertedBlob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas export failed'));
      },
      mimeType,
      quality
    );
  });

  const cleanOriginalName = sanitizeFileName(originalFileName);
  const baseName = cleanOriginalName.replace(/\.[^/.]+$/, '');
  const outFileName = `${baseName}_converted.${options.format}`;
  const origSize = source.size;
  const newSize = convertedBlob.size;
  const saved = origSize - newSize;
  const percentSaved = origSize > 0 ? ((saved / origSize) * 100).toFixed(1) : '0';

  const previewUrl = URL.createObjectURL(convertedBlob);

  return {
    id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    fileName: outFileName,
    originalName: originalFileName,
    originalSize: origSize,
    convertedSize: newSize,
    savedBytes: saved,
    percentSaved,
    mimeType,
    format: options.format,
    mediaType: 'image',
    timestamp: Date.now(),
    blob: convertedBlob,
    previewUrl,
    dimensions: { width: canvas.width, height: canvas.height },
  };
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function base64ToBlob(base64: string): Promise<Blob> {
  let mimeType = 'image/png';
  let b64Data = base64;
  if (base64.startsWith('data:')) {
    const parts = base64.split(';base64,');
    mimeType = parts[0].replace('data:', '');
    b64Data = parts[1] || '';
  }
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: mimeType });
}

export async function convertImageFromBase64(
  base64: string,
  options: ImageConvertOptions,
  fileName: string = 'agent_image.png'
): Promise<{
  storedConversion: StoredConversion;
  base64: string;
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
}> {
  const blob = await base64ToBlob(base64);
  const storedConversion = await convertImage(blob, options, fileName);
  const resultBase64 = await blobToBase64(storedConversion.blob);
  return {
    storedConversion,
    base64: resultBase64,
    width: storedConversion.dimensions?.width ?? 0,
    height: storedConversion.dimensions?.height ?? 0,
    format: storedConversion.format,
    sizeBytes: storedConversion.convertedSize,
  };
}
