'use client';

import React, { useState, useRef } from 'react';
import { StoredConversion, VideoConvertOptions } from '@/lib/types';
import { extractVideoPoster, extractVideoAudioToWav, transcodeVideoToWebm } from '@/lib/videoConverter';
import { saveConversion, formatBytes } from '@/lib/storage';

interface VideoConverterProps {
  onConversionSuccess: (item: StoredConversion) => void;
}

export const VideoConverter: React.FC<VideoConverterProps> = ({ onConversionSuccess }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0.5);
  const [duration, setDuration] = useState<number>(10);
  const [selectedAction, setSelectedAction] = useState<'poster' | 'audio' | 'webm'>('poster');

  // Poster options
  const [posterFormat, setPosterFormat] = useState<'webp' | 'jpeg' | 'png'>('webp');
  const [posterQuality, setPosterQuality] = useState<number>(85);

  // WebM options
  const [videoScale, setVideoScale] = useState<number>(1.0);
  const [videoBitrate, setVideoBitrate] = useState<number>(2500000);
  const [mute, setMute] = useState<boolean>(false);

  // State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [latestResult, setLatestResult] = useState<StoredConversion | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('video/')) {
      setErrorMsg('PLEASE SELECT A VALID VIDEO FILE (.MP4, .WEBM, .MOV)');
      return;
    }

    setErrorMsg(null);
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setLatestResult(null);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleRunConversion = async () => {
    if (!videoFile || isProcessing) return;
    setIsProcessing(true);
    setProgress(0);
    setErrorMsg(null);

    try {
      let result: StoredConversion;

      if (selectedAction === 'poster') {
        result = await extractVideoPoster(
          videoFile,
          videoFile.name,
          currentTime,
          posterFormat,
          posterQuality / 100
        );
      } else if (selectedAction === 'audio') {
        result = await extractVideoAudioToWav(videoFile, videoFile.name);
      } else {
        const options: VideoConvertOptions = {
          action: 'webm',
          videoScale,
          videoBitrate,
          mute,
        };
        result = await transcodeVideoToWebm(
          videoFile,
          videoFile.name,
          options,
          (pct) => setProgress(pct)
        );
      }

      await saveConversion(result);
      setLatestResult(result);
      onConversionSuccess(result);
    } catch (err: any) {
      console.error('Video conversion failure:', err);
      setErrorMsg(err.message || 'CONVERSION FAILED IN CLIENT ENGINE.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* HEADER */}
      <div className="section-header" style={{
        borderBottom: '2px solid var(--ink)',
        paddingBottom: '8px',
      }}>
        <h2 className="marker-font" style={{ fontSize: '28px' }}>
          VIDEO CONVERTER.
        </h2>
        <span style={{ fontSize: '11px', fontWeight: 700 }}>
          [IN-BROWSER WEBM • POSTER • WAV AUDIO]
        </span>
      </div>

      {/* DROPZONE / VIDEO PREVIEW */}
      {!videoFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="hand-box"
          style={{
            border: '2px dashed var(--ink)',
            padding: '36px 20px',
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleFile(e.target.files)}
            style={{ display: 'none' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <svg width="48" height="40" viewBox="0 0 48 40" fill="none">
              <rect x="2" y="6" width="44" height="30" rx="2" stroke="var(--ink)" strokeWidth="2.5" />
              <polygon points="20,15 32,21 20,27" fill="var(--ink)" />
            </svg>
            <div>
              <span className="marker-font" style={{ fontSize: '20px', display: 'block' }}>
                DROP VIDEO HERE OR CLICK TO BROWSE
              </span>
              <span style={{ fontSize: '11px', color: 'var(--ink-gray)' }}>
                SUPPORTS MP4, WEBM, MOV, OGG • PROCESSED 100% LOCALLY
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="hand-box" style={{ padding: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}>
            <span style={{ fontWeight: 700, fontSize: '12px' }}>
              SOURCE: {videoFile.name} ({formatBytes(videoFile.size)})
            </span>
            <button
              onClick={() => { setVideoFile(null); setVideoUrl(null); setLatestResult(null); }}
              className="hand-btn"
              style={{ padding: '2px 8px', fontSize: '10px' }}
            >
              [CHANGE VIDEO]
            </button>
          </div>

          {videoUrl && (
            <div style={{
              background: '#000000',
              border: '2px solid var(--ink)',
              overflow: 'hidden',
              maxHeight: 'clamp(200px, 40vw, 320px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                style={{ width: '100%', maxHeight: '300px' }}
              />
            </div>
          )}

          {/* TIMELINE SCRUBBER */}
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>CURRENT PLAYHEAD: {currentTime.toFixed(2)}S</span>
              <span>TOTAL DURATION: {duration.toFixed(2)}S</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 10}
              step="0.1"
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
            />
          </div>
        </div>
      )}

      {/* OPERATIONS SELECTOR */}
      {videoFile && (
        <div className="hand-box" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '12px' }}>[CHOOSE CONVERSION ACTION]:</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
            <button
              onClick={() => setSelectedAction('poster')}
              className={`hand-btn ${selectedAction === 'poster' ? 'primary' : ''}`}
              style={{ padding: '8px 12px', fontSize: '11px' }}
            >
              1. POSTER FRAME
            </button>
            <button
              onClick={() => setSelectedAction('audio')}
              className={`hand-btn ${selectedAction === 'audio' ? 'primary' : ''}`}
              style={{ padding: '8px 12px', fontSize: '11px' }}
            >
              2. AUDIO EXTRACT (WAV)
            </button>
            <button
              onClick={() => setSelectedAction('webm')}
              className={`hand-btn ${selectedAction === 'webm' ? 'primary' : ''}`}
              style={{ padding: '8px 12px', fontSize: '11px' }}
            >
              3. WEBM TRANSCODE
            </button>
          </div>

          {/* ACTION 1: POSTER FRAME CONFIG */}
          {selectedAction === 'poster' && (
            <div style={{
              borderTop: '1.5px dashed var(--ink)',
              paddingTop: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div className="section-header">
                <span style={{ fontSize: '11px', fontWeight: 700 }}>
                  CAPTURE FRAME AT SECOND: <span className="marker-font">{currentTime.toFixed(2)}S</span>
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['webp', 'jpeg', 'png'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setPosterFormat(fmt)}
                      className={`hand-btn ${posterFormat === fmt ? 'primary' : ''}`}
                      style={{ padding: '4px 8px', fontSize: '10px' }}
                    >
                      .{fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {posterFormat !== 'png' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                    <span>POSTER QUALITY</span>
                    <span className="marker-font">{posterQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={posterQuality}
                    onChange={(e) => setPosterQuality(Number(e.target.value))}
                  />
                </div>
              )}
            </div>
          )}

          {/* ACTION 2: AUDIO EXTRACT CONFIG */}
          {selectedAction === 'audio' && (
            <div style={{
              borderTop: '1.5px dashed var(--ink)',
              paddingTop: '14px',
              fontSize: '11px',
              color: 'var(--ink-gray)',
              lineHeight: '1.6',
            }}>
              <span style={{ fontWeight: 700, color: 'var(--ink)' }}>16-BIT PCM WAV CONTAINER: </span>
              DECODES AUDIO STREAM DIRECTLY USING WEB AUDIO API. SAVES HIGH-FIDELITY UNCOMPRESSED SOUNDTRACK TO BROWSER LOCAL STORAGE.
            </div>
          )}

          {/* ACTION 3: WEBM TRANSCODE CONFIG */}
          {selectedAction === 'webm' && (
            <div style={{
              borderTop: '1.5px dashed var(--ink)',
              paddingTop: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div className="section-header">
                <span style={{ fontSize: '11px', fontWeight: 700 }}>RESOLUTION DOWNSCALE</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { label: '100% (FULL)', val: 1.0 },
                    { label: '75%', val: 0.75 },
                    { label: '50% (HALF)', val: 0.5 },
                  ].map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setVideoScale(s.val)}
                      className={`hand-btn ${videoScale === s.val ? 'primary' : ''}`}
                      style={{ padding: '4px 8px', fontSize: '10px' }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="section-header">
                <span style={{ fontSize: '11px', fontWeight: 700 }}>VIDEO BITRATE</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { label: '1.2 MBPS', val: 1200000 },
                    { label: '2.5 MBPS', val: 2500000 },
                    { label: '4.0 MBPS', val: 4000000 },
                  ].map((b) => (
                    <button
                      key={b.label}
                      onClick={() => setVideoBitrate(b.val)}
                      className={`hand-btn ${videoBitrate === b.val ? 'primary' : ''}`}
                      style={{ padding: '4px 8px', fontSize: '10px' }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px' }}>
                <input
                  type="checkbox"
                  checked={mute}
                  onChange={(e) => setMute(e.target.checked)}
                  style={{ accentColor: 'var(--ink)' }}
                />
                <span>MUTE AUDIO (STRIP AUDIO TRACK FOR BACKGROUND VIDEO)</span>
              </label>
            </div>
          )}

          {/* PROGRESS INDICATOR */}
          {isProcessing && selectedAction === 'webm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>CLIENT TRANSCODING IN PROGRESS...</span>
                <span className="marker-font">{progress}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--paper-tint)', border: '1.5px solid var(--ink)' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--ink)' }} />
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={{
              background: 'var(--ink)',
              color: 'var(--ink-inverted)',
              padding: '8px 12px',
              fontSize: '11px',
              fontWeight: 700,
            }}>
              [ERROR]: {errorMsg}
            </div>
          )}

          {/* ACTION BUTTON */}
          <button
            onClick={handleRunConversion}
            disabled={isProcessing}
            className="hand-btn primary"
            style={{
              padding: '14px 20px',
              fontSize: '13px',
              letterSpacing: '1px',
            }}
          >
            {isProcessing
              ? 'PROCESSING IN CLIENT MEMORY...'
              : selectedAction === 'poster'
              ? `EXTRACT POSTER FRAME AT ${currentTime.toFixed(2)}S`
              : selectedAction === 'audio'
              ? 'EXTRACT SOUNDTRACK (WAV) [LOCAL]'
              : 'ENCODE WEBM NOW [ZERO SERVER UPLOAD]'}
          </button>
        </div>
      )}

      {/* LATEST RESULT CARD */}
      {latestResult && (
        <div className="hand-box" style={{ padding: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            borderBottom: '1.5px solid var(--ink)',
            paddingBottom: '8px',
          }}>
            <span className="marker-font" style={{ fontSize: '18px' }}>
              VIDEO ARTIFACT GENERATED.
            </span>
            <span style={{
              background: 'var(--ink)',
              color: 'var(--ink-inverted)',
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '2px',
            }}>
              STORED IN INDEXEDDB
            </span>
          </div>

          <div className="result-card">
            {latestResult.mediaType === 'image' && latestResult.previewUrl && (
              <img
                src={latestResult.previewUrl}
                alt={latestResult.fileName}
                style={{ width: '120px', height: '80px', objectFit: 'cover', border: '2px solid var(--ink)' }}
              />
            )}

            {latestResult.mediaType === 'audio' && latestResult.previewUrl && (
              <audio src={latestResult.previewUrl} controls style={{ maxWidth: '240px' }} />
            )}

            {latestResult.mediaType === 'video' && latestResult.previewUrl && (
              <video
                src={latestResult.previewUrl}
                controls
                style={{ width: '140px', height: '90px', objectFit: 'cover', border: '2px solid var(--ink)' }}
              />
            )}

            <div style={{ flex: 1, minWidth: '160px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>{latestResult.fileName}</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-gray)', marginTop: '2px' }}>
                ORIGINAL: {formatBytes(latestResult.originalSize)} ➔ CONVERTED: {formatBytes(latestResult.convertedSize)}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--ink-subtle)', marginTop: '2px' }}>
                SAVED: {formatBytes(latestResult.savedBytes)} ({latestResult.savedBytes >= 0 ? `-${latestResult.percentSaved}%` : `+${latestResult.percentSaved}%`})
              </div>
            </div>

            <a
              href={latestResult.previewUrl}
              download={latestResult.fileName}
              className="hand-btn"
              style={{ padding: '8px 16px', fontSize: '11px' }}
            >
              DOWNLOAD FILE ➔
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
