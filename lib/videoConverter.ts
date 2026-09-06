import { StoredConversion, VideoConvertOptions } from './types';
import { sanitizeFileName } from './storage';

/**
 * Loads a video file into an HTMLVideoElement and prepares it for processing
 */
export function loadVideoFromFile(file: Blob): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      resolve(video);
    };

    video.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video: ' + err));
    };
  });
}

/**
 * Extracts a single poster frame from the video at the given timestamp (seconds)
 */
export async function extractVideoPoster(
  file: Blob,
  originalFileName: string,
  timestamp: number = 0.5,
  format: 'webp' | 'jpeg' | 'png' = 'webp',
  quality: number = 0.85
): Promise<StoredConversion> {
  const video = await loadVideoFromFile(file);

  // Clamp timestamp within video duration
  const targetTime = Math.min(Math.max(timestamp, 0), video.duration || 1);
  video.currentTime = targetTime;

  await new Promise<void>((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };
    video.addEventListener('seeked', onSeeked);
  });

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas 2d context');

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const mimeType = format === 'webp' ? 'image/webp' : format === 'png' ? 'image/png' : 'image/jpeg';

  const posterBlob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Poster frame capture failed'));
      },
      mimeType,
      quality
    );
  });

  // Cleanup video object url
  URL.revokeObjectURL(video.src);

  const cleanOriginalName = sanitizeFileName(originalFileName);
  const baseName = cleanOriginalName.replace(/\.[^/.]+$/, '');
  const outFileName = `${baseName}_poster_${targetTime.toFixed(1)}s.${format}`;
  const origSize = file.size;
  const newSize = posterBlob.size;
  const saved = origSize - newSize;
  const percentSaved = origSize > 0 ? ((saved / origSize) * 100).toFixed(1) : '0';

  return {
    id: `poster_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    fileName: outFileName,
    originalName: originalFileName,
    originalSize: origSize,
    convertedSize: newSize,
    savedBytes: saved,
    percentSaved,
    mimeType,
    format,
    mediaType: 'image',
    timestamp: Date.now(),
    blob: posterBlob,
    previewUrl: URL.createObjectURL(posterBlob),
    dimensions: { width: canvas.width, height: canvas.height },
  };
}

/**
 * Extracts audio track from video and encodes to 16-bit PCM WAV in browser memory
 */
export async function extractVideoAudioToWav(
  file: Blob,
  originalFileName: string
): Promise<StoredConversion> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch (err: any) {
    await audioCtx.close();
    throw new Error('Could not decode audio from video. The file might not contain an audio track: ' + err.message);
  }

  // Convert AudioBuffer to WAV Blob
  const wavBlob = audioBufferToWavBlob(audioBuffer);
  await audioCtx.close();

  const cleanOriginalName = sanitizeFileName(originalFileName);
  const baseName = cleanOriginalName.replace(/\.[^/.]+$/, '');
  const outFileName = `${baseName}_audio.wav`;
  const origSize = file.size;
  const newSize = wavBlob.size;
  const saved = origSize - newSize;
  const percentSaved = origSize > 0 ? ((saved / origSize) * 100).toFixed(1) : '0';

  return {
    id: `audio_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    fileName: outFileName,
    originalName: originalFileName,
    originalSize: origSize,
    convertedSize: newSize,
    savedBytes: saved,
    percentSaved,
    mimeType: 'audio/wav',
    format: 'wav',
    mediaType: 'audio',
    timestamp: Date.now(),
    blob: wavBlob,
    previewUrl: URL.createObjectURL(wavBlob),
    duration: audioBuffer.duration,
  };
}

/**
 * Transcodes video to optimized WebM directly in the browser via Canvas + MediaRecorder
 */
export async function transcodeVideoToWebm(
  file: Blob,
  originalFileName: string,
  options: VideoConvertOptions,
  onProgress?: (progressPercent: number) => void
): Promise<StoredConversion> {
  const video = await loadVideoFromFile(file);

  const scale = options.videoScale || 1.0;
  const targetWidth = Math.round((video.videoWidth || 1280) * scale);
  const targetHeight = Math.round((video.videoHeight || 720) * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas context');

  // Set up MediaStream from canvas
  const stream = canvas.captureStream(30); // 30 fps
  let audioCtx: AudioContext | null = null;

  try {
    // If video has audio and not muted, route audio stream into output
    if (!options.mute) {
      try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination);
        dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
      } catch {
        // Audio capture stream fallback if already routed or cross-origin
      }
    }

    // Find best supported mimeType
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    let selectedMimeType = 'video/webm';
    for (const m of mimeTypes) {
      if (MediaRecorder.isTypeSupported(m)) {
        selectedMimeType = m;
        break;
      }
    }

    const bitrate = options.videoBitrate || 2000000; // 2.0 Mbps default
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: bitrate,
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    const recordingPromise = new Promise<Blob>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };
      mediaRecorder.onerror = (err) => reject(err);
    });

    // Start recording
    mediaRecorder.start(100);
    video.currentTime = 0;
    await video.play();

    // Draw loop
    const totalDuration = video.duration || 10;
    let isCancelled = false;

    const drawFrame = () => {
      if (video.ended || video.paused || isCancelled) return;
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      if (onProgress) {
        const pct = Math.min(Math.round((video.currentTime / totalDuration) * 100), 99);
        onProgress(pct);
      }
      requestAnimationFrame(drawFrame);
    };

    requestAnimationFrame(drawFrame);

    // Wait until playback ends with fallback timeout guard
    await new Promise<void>((resolve) => {
      let resolved = false;
      const onDone = () => {
        if (!resolved) {
          resolved = true;
          isCancelled = true;
          resolve();
        }
      };
      video.onended = onDone;
      // Fallback timeout in case playback stalls or fails to fire onended
      const timeoutMs = Math.max(5000, Math.ceil((totalDuration + 2) * 1000));
      setTimeout(onDone, timeoutMs);
    });

    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    const convertedBlob = await recordingPromise;

    if (onProgress) onProgress(100);

    const cleanOriginalName = sanitizeFileName(originalFileName);
    const baseName = cleanOriginalName.replace(/\.[^/.]+$/, '');
    const outFileName = `${baseName}_optimized.webm`;
    const origSize = file.size;
    const newSize = convertedBlob.size;
    const saved = origSize - newSize;
    const percentSaved = origSize > 0 ? ((saved / origSize) * 100).toFixed(1) : '0';

    return {
      id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      fileName: outFileName,
      originalName: originalFileName,
      originalSize: origSize,
      convertedSize: newSize,
      savedBytes: saved,
      percentSaved,
      mimeType: 'video/webm',
      format: 'webm',
      mediaType: 'video',
      timestamp: Date.now(),
      blob: convertedBlob,
      previewUrl: URL.createObjectURL(convertedBlob),
      dimensions: { width: targetWidth, height: targetHeight },
      duration: totalDuration,
    };
  } finally {
    // Teardown stream tracks & hardware audio context to prevent resource leaks
    stream.getTracks().forEach((track) => track.stop());
    if (audioCtx) {
      try {
        await audioCtx.close();
      } catch {
        // Ignored
      }
    }
    URL.revokeObjectURL(video.src);
  }
}

/**
 * Utility: Converts an AudioBuffer to a valid RIFF WAV Blob (16-bit PCM)
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = result.length * bytesPerSample;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
