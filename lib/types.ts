export type ImageFormat = 'webp' | 'png' | 'jpeg' | 'avif' | 'bmp';
export type VideoFormat = 'webm' | 'poster' | 'audio-wav';

export interface ImageConvertOptions {
  format: ImageFormat;
  quality: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
  applySketchFilter?: boolean;
  applyGrayscale?: boolean;
  applyInvert?: boolean;
  rotate?: number; // 0, 90, 180, 270
}

export interface VideoConvertOptions {
  action: 'webm' | 'poster' | 'audio-wav';
  posterTime?: number; // seconds
  posterFormat?: 'webp' | 'jpeg' | 'png';
  posterQuality?: number;
  videoBitrate?: number; // bps e.g. 2500000
  videoScale?: number; // 1, 0.75, 0.5
  mute?: boolean;
}

export interface StoredConversion {
  id: string;
  fileName: string;
  originalName: string;
  originalSize: number;
  convertedSize: number;
  savedBytes: number;
  percentSaved: string;
  mimeType: string;
  format: string;
  mediaType: 'image' | 'video' | 'audio';
  timestamp: number;
  blob: Blob;
  previewUrl?: string;
  dimensions?: { width: number; height: number };
  duration?: number; // for video/audio
}

export interface AgentStep {
  id: string;
  type: 'plan' | 'tool_call' | 'processing' | 'done' | 'error';
  title: string;
  detail?: string;
  timestamp: number;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  domain?: 'Autonomous Missions' | 'Auditing & Diagnostics' | 'Asset Graph & AST' | 'Multimedia Foundation' | 'Execution & Patching' | 'Budget & Runtime';
  promptExample?: string;
  detailedGuide?: string;
  safety?: string;
  outputSample?: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

