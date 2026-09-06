import { convertImageFromBase64, base64ToBlob, blobToBase64 } from './imageConverter';
import { extractVideoPoster, extractVideoAudioToWav } from './videoConverter';
import { saveConversion, getAllConversions, clearAllConversions } from './storage';
import { ImageFormat, ImageConvertOptions, StoredConversion } from './types';

export interface AgentConvertImageParams {
  base64: string;
  format?: ImageFormat;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  applySketchFilter?: boolean;
  applyGrayscale?: boolean;
  applyInvert?: boolean;
  rotate?: 0 | 90 | 180 | 270;
  fileName?: string;
  autoSaveToIndexedDb?: boolean;
}

export interface AgentConvertResult {
  success: boolean;
  base64: string;
  fileName: string;
  format: string;
  width: number;
  height: number;
  originalSize: number;
  convertedSize: number;
  percentSaved: string;
  mimeType: string;
  storedConversionId?: string;
}

export type AgentActionListener = (action: {
  type: string;
  summary: string;
  timestamp: number;
}) => void;

class BrowserAgentApi {
  public version = '1.0.0';
  public engine = 'PhotoNow In-Browser Zero-Cloud Engine';
  private listeners: Set<AgentActionListener> = new Set();

  public subscribe(listener: AgentActionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(type: string, summary: string) {
    const event = { type, summary, timestamp: Date.now() };
    this.listeners.forEach((fn) => {
      try {
        fn(event);
      } catch (e) {
        console.error('Agent listener error:', e);
      }
    });
  }

  /**
   * Convert an image entirely inside the browser's Canvas context without any cloud calls.
   * Can be invoked directly by AI browser agents, Puppeteer, Chrome DevTools MCP, or console scripts.
   */
  public async convertImage(params: AgentConvertImageParams): Promise<AgentConvertResult> {
    const format = params.format || 'webp';
    const quality = params.quality !== undefined ? params.quality : 0.82;
    const fileName = params.fileName || `agent_photo_${Date.now()}.${format}`;

    this.notify('convert_image_start', `Converting ${fileName} to ${format.toUpperCase()} (${Math.round(quality * 100)}% quality)`);

    const options: ImageConvertOptions = {
      format,
      quality,
      maxWidth: params.maxWidth,
      maxHeight: params.maxHeight,
      applySketchFilter: params.applySketchFilter,
      applyGrayscale: params.applyGrayscale,
      applyInvert: params.applyInvert,
      rotate: params.rotate,
    };

    const res = await convertImageFromBase64(params.base64, options, fileName);

    let storedId: string | undefined;
    if (params.autoSaveToIndexedDb !== false) {
      await saveConversion(res.storedConversion);
      storedId = res.storedConversion.id;
    }

    this.notify(
      'convert_image_complete',
      `Converted ${res.storedConversion.fileName} (${res.storedConversion.percentSaved}% saved, ${res.width}x${res.height})`
    );

    return {
      success: true,
      base64: res.base64,
      fileName: res.storedConversion.fileName,
      format: res.format,
      width: res.width,
      height: res.height,
      originalSize: res.storedConversion.originalSize,
      convertedSize: res.storedConversion.convertedSize,
      percentSaved: res.storedConversion.percentSaved,
      mimeType: res.storedConversion.mimeType,
      storedConversionId: storedId,
    };
  }

  /**
   * Extract a video poster frame inside the browser's HTML5 video context.
   */
  public async extractPoster(params: {
    videoBase64: string;
    timestamp?: number;
    format?: 'webp' | 'jpeg' | 'png';
    quality?: number;
    fileName?: string;
  }): Promise<AgentConvertResult> {
    const time = params.timestamp || 0.5;
    const format = params.format || 'webp';
    const quality = params.quality || 0.85;
    const fileName = params.fileName || `video_${Date.now()}.mp4`;

    this.notify('extract_poster_start', `Extracting poster frame from ${fileName} at ${time}s`);

    const videoBlob = await base64ToBlob(params.videoBase64);
    const converted = await extractVideoPoster(videoBlob, fileName, time, format, quality);
    await saveConversion(converted);

    const base64 = await blobToBase64(converted.blob);

    this.notify('extract_poster_complete', `Extracted poster ${converted.fileName}`);

    return {
      success: true,
      base64,
      fileName: converted.fileName,
      format: converted.format,
      width: converted.dimensions?.width ?? 0,
      height: converted.dimensions?.height ?? 0,
      originalSize: converted.originalSize,
      convertedSize: converted.convertedSize,
      percentSaved: converted.percentSaved,
      mimeType: converted.mimeType,
      storedConversionId: converted.id,
    };
  }

  /**
   * Extract video soundtrack to uncompressed 16-bit WAV inside Web Audio API.
   */
  public async extractAudio(params: {
    videoBase64: string;
    fileName?: string;
  }): Promise<{ success: boolean; base64: string; fileName: string; sizeBytes: number }> {
    const fileName = params.fileName || `video_${Date.now()}.mp4`;
    this.notify('extract_audio_start', `Decoding soundtrack to 16-bit PCM WAV`);

    const videoBlob = await base64ToBlob(params.videoBase64);
    const converted = await extractVideoAudioToWav(videoBlob, fileName);
    await saveConversion(converted);

    const base64 = await blobToBase64(converted.blob);
    this.notify('extract_audio_complete', `Extracted audio ${converted.fileName}`);

    return {
      success: true,
      base64,
      fileName: converted.fileName,
      sizeBytes: converted.convertedSize,
    };
  }

  /**
   * Query all locally stored conversions in IndexedDB.
   */
  public async listConversions(): Promise<StoredConversion[]> {
    return getAllConversions();
  }

  /**
   * Purge local conversions from IndexedDB.
   */
  public async clearHistory(): Promise<void> {
    await clearAllConversions();
    this.notify('history_cleared', 'IndexedDB history purged');
  }
}

export const browserAgentApi = new BrowserAgentApi();

declare global {
  interface Window {
    __photoConvertAgent?: BrowserAgentApi;
  }
}

export function initBrowserAgentApi(): BrowserAgentApi {
  if (typeof window !== 'undefined') {
    window.__photoConvertAgent = browserAgentApi;
  }
  return browserAgentApi;
}
