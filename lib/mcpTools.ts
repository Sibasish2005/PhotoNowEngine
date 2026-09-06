import { McpToolDefinition, ImageConvertOptions, VideoConvertOptions } from './types';

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'convert_image',
    description: 'Converts an image client-side to modern formats (WebP, PNG, JPEG, AVIF) with optional resizing, compression, and monochrome sketch filtering.',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['webp', 'png', 'jpeg', 'avif', 'bmp'],
          description: 'Target image format',
        },
        quality: {
          type: 'number',
          minimum: 0.1,
          maximum: 1.0,
          description: 'Compression quality from 0.1 (smallest) to 1.0 (lossless)',
        },
        maxWidth: {
          type: 'number',
          description: 'Max width in pixels to downscale the image',
        },
        maxHeight: {
          type: 'number',
          description: 'Max height in pixels to downscale the image',
        },
        applySketchFilter: {
          type: 'boolean',
          description: 'Apply hand-drawn monochrome ink sketch filter matching site style',
        },
        applyGrayscale: {
          type: 'boolean',
          description: 'Convert to grayscale',
        },
        rotate: {
          type: 'number',
          enum: [0, 90, 180, 270],
          description: 'Rotate clockwise in degrees',
        },
      },
      required: ['format'],
    },
  },
  {
    name: 'convert_video',
    description: 'Transcodes video to WebM in the browser or extracts poster frames or audio.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['webm', 'poster', 'audio-wav'],
          description: 'Action to perform: transcode to webm, grab poster frame, or extract wav audio',
        },
        posterTime: {
          type: 'number',
          description: 'Timestamp in seconds for poster frame capture (default: 0.5s)',
        },
        posterFormat: {
          type: 'string',
          enum: ['webp', 'jpeg', 'png'],
          description: 'Format for extracted poster frame',
        },
        videoBitrate: {
          type: 'number',
          description: 'Bitrate in bps (e.g., 2000000 for 2 Mbps)',
        },
        videoScale: {
          type: 'number',
          enum: [1.0, 0.75, 0.5],
          description: 'Downscale resolution factor',
        },
        mute: {
          type: 'boolean',
          description: 'Strip audio track from output video',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'extract_poster_frame',
    description: 'Captures a clean frame at any timestamp from a video file as WebP or JPEG.',
    inputSchema: {
      type: 'object',
      properties: {
        timestamp: {
          type: 'number',
          description: 'Seek second in video (e.g. 0.5, 1.0, 5.2)',
        },
        format: {
          type: 'string',
          enum: ['webp', 'jpeg', 'png'],
        },
        quality: {
          type: 'number',
          minimum: 0.1,
          maximum: 1.0,
        },
      },
      required: ['timestamp'],
    },
  },
  {
    name: 'extract_audio',
    description: 'Decodes video audio track and saves directly to uncompressed 16-bit PCM WAV.',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['wav'],
          description: 'Audio format output',
        },
      },
    },
  },
  {
    name: 'list_storage_conversions',
    description: 'Lists all stored media files and conversions saved in the browser IndexedDB.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max number of items to return',
        },
        mediaType: {
          type: 'string',
          enum: ['all', 'image', 'video', 'audio'],
        },
      },
    },
  },
];

/**
 * Natural language intent parser for the Agentic Conversion Bar
 */
export function parseAgentPrompt(prompt: string): {
  type: 'image' | 'video';
  actionSummary: string;
  imageOptions?: ImageConvertOptions;
  videoOptions?: VideoConvertOptions;
  steps: string[];
} {
  const p = prompt.toLowerCase();

  // Check if video-related
  const isVideo = p.includes('video') || p.includes('mp4') || p.includes('webm') || p.includes('poster') || p.includes('audio') || p.includes('wav');

  if (isVideo) {
    if (p.includes('audio') || p.includes('wav') || p.includes('sound') || p.includes('track')) {
      return {
        type: 'video',
        actionSummary: 'EXTRACT AUDIO AS WAV',
        videoOptions: {
          action: 'audio-wav',
        },
        steps: [
          'PARSE AUDIO STREAM VIA WEB AUDIO API',
          'DECODE PCM AUDIO BUFFER (44.1KHZ / 48KHZ)',
          'ENCODE 16-BIT RIFF WAV CONTAINER',
          'COMMIT WAV TO BROWSER LOCAL STORAGE',
        ],
      };
    }

    if (p.includes('poster') || p.includes('thumbnail') || p.includes('frame') || p.includes('snapshot')) {
      let time = 0.5;
      const match = p.match(/(\d+(\.\d+)?)\s*(s|sec|second)?/);
      if (match && parseFloat(match[1]) > 0) {
        time = parseFloat(match[1]);
      }
      return {
        type: 'video',
        actionSummary: `CAPTURE POSTER FRAME AT ${time}S`,
        videoOptions: {
          action: 'poster',
          posterTime: time,
          posterFormat: p.includes('jpg') || p.includes('jpeg') ? 'jpeg' : 'webp',
          posterQuality: 0.85,
        },
        steps: [
          `SEEK VIDEO TO EXACT TIMESTAMP ${time}S`,
          'RENDER ACTIVE FRAME BUFFER TO CANVAS',
          'OPTIMIZE AS WEBP POSTER IMAGE',
          'STORE POSTER IN BROWSER INDEXEDDB',
        ],
      };
    }

    // Video transcode to WebM
    let scale = 1.0;
    if (p.includes('75%') || p.includes('720')) scale = 0.75;
    if (p.includes('50%') || p.includes('half') || p.includes('480')) scale = 0.5;

    const mute = p.includes('mute') || p.includes('no audio') || p.includes('silent');

    return {
      type: 'video',
      actionSummary: `TRANSCODE VIDEO TO WEBM (${Math.round(scale * 100)}% SCALE${mute ? ', MUTED' : ''})`,
      videoOptions: {
        action: 'webm',
        videoScale: scale,
        videoBitrate: p.includes('small') || p.includes('high comp') ? 1200000 : 2500000,
        mute,
      },
      steps: [
        `CONFIGURE CANVAS STREAM AT ${Math.round(scale * 100)}% RESOLUTION`,
        'INITIALIZE CLIENT MEDIARECORDER (VP9/VP8 ENCODER)',
        'PLAY STREAM & CAPTURE CHUNKS IN BROWSER MEMORY',
        'ASSEMBLE FINAL WEBM BLOB AND STORE LOCALLY',
      ],
    };
  }

  // Photo / Image conversion
  let format: 'webp' | 'png' | 'jpeg' | 'avif' | 'bmp' = 'webp';
  if (p.includes('png')) format = 'png';
  else if (p.includes('jpg') || p.includes('jpeg')) format = 'jpeg';
  else if (p.includes('avif')) format = 'avif';
  else if (p.includes('bmp')) format = 'bmp';

  let quality = 0.82;
  const qualMatch = p.match(/(\d+)%/);
  if (qualMatch) {
    quality = parseInt(qualMatch[1], 10) / 100;
  } else if (p.includes('lossless') || p.includes('max') || p.includes('100')) {
    quality = 1.0;
  } else if (p.includes('low') || p.includes('compress') || p.includes('small')) {
    quality = 0.6;
  }

  let maxWidth: number | undefined;
  const widthMatch = p.match(/(\d{3,4})\s*(px|w|width)?/);
  if (widthMatch) {
    maxWidth = parseInt(widthMatch[1], 10);
  } else if (p.includes('1080') || p.includes('fhd')) {
    maxWidth = 1920;
  } else if (p.includes('720') || p.includes('hd')) {
    maxWidth = 1280;
  }

  const applySketchFilter = p.includes('sketch') || p.includes('ink') || p.includes('hand-draw') || p.includes('doodle') || p.includes('monochrome');
  const applyGrayscale = p.includes('grayscale') || p.includes('black and white') || p.includes('b&w');
  const applyInvert = p.includes('invert') || p.includes('negative');

  const steps = [
    'READ IMAGE BITMAP INTO OFFSCREENCANVAS',
    maxWidth ? `RESIZE CANVAS DIMENSION TO MAX ${maxWidth}PX WITH ASPECT LOCK` : 'PRESERVE ORIGINAL DIMENSIONS',
    applySketchFilter ? 'APPLY HAND-DRAWN MONOCHROME INK SHADER' : (applyGrayscale ? 'APPLY GRAYSCALE FILTER' : 'MAINTAIN COLOR PROFILE'),
    `EXPORT AS ${format.toUpperCase()} (QUALITY: ${Math.round(quality * 100)}%)`,
    'WRITE ASSET TO BROWSER LOCAL STORAGE (INDEXEDDB)',
  ];

  return {
    type: 'image',
    actionSummary: `CONVERT TO ${format.toUpperCase()} (${Math.round(quality * 100)}% QUAL${maxWidth ? `, MAX ${maxWidth}PX` : ''}${applySketchFilter ? ', INK SKETCH' : ''})`,
    imageOptions: {
      format,
      quality,
      maxWidth,
      applySketchFilter,
      applyGrayscale,
      applyInvert,
    },
    steps,
  };
}

export const SAMPLE_MCP_CLIENT_CONFIG = {
  mcpServers: {
    photoConvert: {
      url: "https://photonow.vercel.app/api/mcp",
      transport: "http",
      description: "Hand-Drawn Client-Side Photo & Video Converter with Local Storage persistence"
    }
  }
};
