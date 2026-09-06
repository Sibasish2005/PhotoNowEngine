'use client';

import React, { useState, useRef } from 'react';
import { parseAgentPrompt } from '@/lib/mcpTools';
import { convertImage } from '@/lib/imageConverter';
import { extractVideoPoster, extractVideoAudioToWav, transcodeVideoToWebm } from '@/lib/videoConverter';
import { saveConversion, formatBytes } from '@/lib/storage';
import { StoredConversion, AgentStep } from '@/lib/types';

interface AgenticPanelProps {
  onConversionSuccess: (item: StoredConversion) => void;
}

export const AgenticPanel: React.FC<AgenticPanelProps> = ({ onConversionSuccess }) => {
  const [prompt, setPrompt] = useState<string>('Convert this image to WebP at 80% quality with ink sketch filter');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<StoredConversion | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const PRESETS = [
    'Convert image to WebP 80% quality with max 1200px width',
    'Apply monochrome ink sketch filter to photo and save as PNG',
    'Extract poster frame from video at 1.0 second as WebP',
    'Extract video soundtrack as uncompressed 16-bit WAV',
    'Compress video to WebM at 50% scale with muted audio',
  ];

  const handleRunAgent = async () => {
    if (!mediaFile || isRunning) return;
    setIsRunning(true);
    setResult(null);
    setSteps([]);

    const addStep = (title: string, detail?: string, type: AgentStep['type'] = 'processing') => {
      const step: AgentStep = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        title,
        detail,
        timestamp: Date.now(),
      };
      setSteps((prev) => [...prev, step]);
    };

    try {
      addStep('[INTENT ANALYSIS]', `PARSING PROMPT: "${prompt.toUpperCase()}"`, 'plan');
      await new Promise((r) => setTimeout(r, 400));

      const plan = parseAgentPrompt(prompt);
      addStep('[EXECUTION PLAN READY]', `ACTION: ${plan.actionSummary}`, 'plan');
      await new Promise((r) => setTimeout(r, 300));

      let converted: StoredConversion;

      if (plan.type === 'video' && mediaFile.type.startsWith('video/')) {
        if (plan.videoOptions?.action === 'audio-wav') {
          addStep('[DISPATCHING MCP TOOL: extract_audio]', 'DECODING AUDIO BUFFER VIA BROWSER AUDIO CONTEXT');
          converted = await extractVideoAudioToWav(mediaFile, mediaFile.name);
        } else if (plan.videoOptions?.action === 'poster') {
          const time = plan.videoOptions.posterTime || 0.5;
          addStep(`[DISPATCHING MCP TOOL: extract_poster_frame]`, `SEEKING FRAME AT ${time}S`);
          converted = await extractVideoPoster(
            mediaFile,
            mediaFile.name,
            time,
            plan.videoOptions.posterFormat || 'webp',
            plan.videoOptions.posterQuality || 0.85
          );
        } else {
          addStep('[DISPATCHING MCP TOOL: convert_video]', 'INITIALIZING CANVAS MEDIARECORDER VP9 PIPELINE');
          converted = await transcodeVideoToWebm(mediaFile, mediaFile.name, plan.videoOptions || { action: 'webm' });
        }
      } else {
        // Fallback or Image Conversion
        addStep('[DISPATCHING MCP TOOL: convert_image]', `TARGET FORMAT: ${plan.imageOptions?.format.toUpperCase()}`);
        converted = await convertImage(
          mediaFile,
          plan.imageOptions || { format: 'webp', quality: 0.82 },
          mediaFile.name
        );
      }

      addStep('[LOCAL STORAGE COMMIT]', 'SAVING BINARY BLOB TO BROWSER INDEXEDDB');
      await saveConversion(converted);

      addStep('[EXECUTION COMPLETE]', `SAVED AS ${converted.fileName} (${formatBytes(converted.convertedSize)})`, 'done');
      setResult(converted);
      onConversionSuccess(converted);
    } catch (err: any) {
      console.error('Agent execution failure:', err);
      addStep('[EXECUTION ERROR]', err.message || 'PROCESS FAILED', 'error');
    } finally {
      setIsRunning(false);
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
          AGENTIC CONVERTER.
        </h2>
        <span style={{ fontSize: '11px', fontWeight: 700 }}>
          [AUTONOMOUS MCP TOOL ENGINE]
        </span>
      </div>

      {/* MEDIA INPUT SELECTION */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="hand-box"
        style={{
          border: '2px dashed var(--ink)',
          padding: '24px 16px',
          textAlign: 'center',
          cursor: 'pointer',
        }}
      >
        <input
          id="agent-media-input"
          aria-label="Upload media file for AI agent analysis"
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setMediaFile(e.target.files[0]);
              setResult(null);
            }
          }}
          style={{ display: 'none' }}
        />
        {mediaFile ? (
          <div>
            <span className="marker-font" style={{ fontSize: '18px' }}>
              TARGET ATTACHED: {mediaFile.name}
            </span>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--ink-gray)', marginTop: '4px' }}>
              SIZE: {formatBytes(mediaFile.size)} • TYPE: {mediaFile.type.toUpperCase()} (CLICK TO SWAP FILE)
            </span>
          </div>
        ) : (
          <div>
            <span className="marker-font" style={{ fontSize: '18px' }}>
              SELECT MEDIA FILE FOR AGENT
            </span>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--ink-gray)', marginTop: '4px' }}>
              DROP ANY PHOTO (JPG, PNG, WEBP) OR VIDEO (MP4, WEBM)
            </span>
          </div>
        )}
      </div>

      {/* PROMPT BOX & PRESETS */}
      <div className="hand-box" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="section-header" style={{ fontSize: '11px' }}>
          <span style={{ fontWeight: 700 }}>[NATURAL LANGUAGE CONVERSION PROMPT]</span>
          <span style={{ color: 'var(--ink-gray)' }}>DESCRIBE YOUR DESIRED TRANSFORMATION</span>
        </div>

        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.G. CONVERT TO WEBP AT 85% AND APPLY INK SKETCH FILTER..."
          style={{ resize: 'vertical' }}
        />

        {/* QUICK PRESET CHIPS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700 }}>OR SELECT A PRESET:</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                className="hand-btn"
                style={{ padding: '4px 8px', fontSize: '9px', textAlign: 'left' }}
              >
                + {p}
              </button>
            ))}
          </div>
        </div>

        {/* RUN AGENT BUTTON */}
        <button
          onClick={handleRunAgent}
          disabled={!mediaFile || isRunning}
          className="hand-btn primary"
          style={{
            padding: '14px 20px',
            fontSize: '13px',
            letterSpacing: '1px',
            marginTop: '4px',
          }}
        >
          {isRunning ? 'AGENT EXECUTING CONVERSION...' : 'RUN AGENTIC CONVERSION [DISPATCH MCP] ➔'}
        </button>
      </div>

      {/* AGENTIC STEP-BY-STEP TRACE / TERMINAL */}
      {steps.length > 0 && (
        <div className="hand-box hand-box-invert" style={{ padding: '18px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            borderBottom: '1px solid var(--ink-inverted)',
            paddingBottom: '6px',
            fontSize: '11px',
            fontWeight: 700,
          }}>
            <span>[AGENT REASONING & MCP TOOL TRACE]</span>
            <span>STATUS: {isRunning ? 'EXECUTING' : 'COMPLETED'}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', wordBreak: 'break-word' }}>
            {steps.map((s, idx) => (
              <div key={s.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--ink-subtle)' }}>[{idx + 1}]</span>
                <div>
                  <span style={{ fontWeight: 700 }}>{s.title}</span>
                  {s.detail && (
                    <span style={{ display: 'block', opacity: 0.8, fontSize: '10px' }}>
                      {s.detail}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESULT DISPLAY */}
      {result && (
        <div className="hand-box" style={{ padding: '20px' }}>
          <div className="section-header" style={{
            marginBottom: '12px',
            borderBottom: '1.5px solid var(--ink)',
            paddingBottom: '8px',
          }}>
            <span className="marker-font" style={{ fontSize: '18px' }}>
              AGENT CONVERSION COMPLETE.
            </span>
            <span style={{
              background: 'var(--ink)',
              color: 'var(--ink-inverted)',
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '2px',
            }}>
              SAVED IN LOCAL STORAGE
            </span>
          </div>

          <div className="result-card">
            {result.previewUrl && result.mediaType === 'image' && (
              <img
                src={result.previewUrl}
                alt={result.fileName}
                style={{ width: '80px', height: '80px', objectFit: 'contain', border: '1.5px solid var(--ink)', background: '#FFFFFF' }}
              />
            )}

            {result.previewUrl && result.mediaType === 'audio' && (
              <audio src={result.previewUrl} controls style={{ maxWidth: '220px' }} />
            )}

            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>{result.fileName}</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-gray)', marginTop: '2px' }}>
                PAYLOAD: {formatBytes(result.originalSize)} ➔ {formatBytes(result.convertedSize)}
                {result.savedBytes > 0 && (
                  <span style={{ fontWeight: 700, marginLeft: '6px' }}>
                    (-{result.percentSaved}%)
                  </span>
                )}
              </div>
            </div>

            <a
              href={result.previewUrl}
              download={result.fileName}
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
