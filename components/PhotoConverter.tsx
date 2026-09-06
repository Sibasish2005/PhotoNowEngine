'use client';

import React, { useState, useRef } from 'react';
import { ImageFormat, ImageConvertOptions, StoredConversion } from '@/lib/types';
import { convertImage } from '@/lib/imageConverter';
import { saveConversion, formatBytes } from '@/lib/storage';

interface PhotoConverterProps {
  onConversionSuccess: (item: StoredConversion) => void;
}

export const PhotoConverter: React.FC<PhotoConverterProps> = ({ onConversionSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string }>({});
  const [format, setFormat] = useState<ImageFormat>('webp');
  const [quality, setQuality] = useState<number>(82);
  const [maxDimension, setMaxDimension] = useState<number | 'original'>('original');
  const [applySketch, setApplySketch] = useState<boolean>(false);
  const [applyGrayscale, setApplyGrayscale] = useState<boolean>(false);
  const [applyInvert, setApplyInvert] = useState<boolean>(false);
  const [rotate, setRotate] = useState<number>(0);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [latestResults, setLatestResults] = useState<StoredConversion[]>([]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (list.length === 0) return;

    setSelectedFiles(list);

    // Create object URLs for previews
    const newPreviews: { [key: string]: string } = {};
    list.forEach((f) => {
      newPreviews[f.name] = URL.createObjectURL(f);
    });

    // Revoke previous URLs before setting new ones
    setPreviewUrls((prev) => {
      Object.values(prev).forEach((u) => URL.revokeObjectURL(u));
      return newPreviews;
    });
    setLatestResults([]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0 || isConverting) return;
    setIsConverting(true);
    setLatestResults([]);

    const results: StoredConversion[] = [];

    for (const file of selectedFiles) {
      try {
        const options: ImageConvertOptions = {
          format,
          quality: quality / 100,
          maxWidth: maxDimension === 'original' ? undefined : maxDimension,
          maxHeight: maxDimension === 'original' ? undefined : maxDimension,
          applySketchFilter: applySketch,
          applyGrayscale,
          applyInvert,
          rotate,
        };

        const result = await convertImage(file, options, file.name);
        await saveConversion(result);
        results.push(result);
        onConversionSuccess(result);
      } catch (err: any) {
        console.error('Image conversion error:', err);
      }
    }

    setLatestResults(results);
    setIsConverting(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* SECTION HEADER */}
      <div className="section-header" style={{
        borderBottom: '2px solid var(--ink)',
        paddingBottom: '8px',
      }}>
        <h2 className="marker-font" style={{ fontSize: '28px' }}>
          PHOTO CONVERTER.
        </h2>
        <span style={{ fontSize: '11px', fontWeight: 700 }}>
          [CANVAS2D ENGINE • 100% IN BROWSER]
        </span>
      </div>

      {/* DROPZONE */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="hand-box"
        style={{
          border: isDragOver ? '3px dashed var(--ink)' : '2px dashed var(--ink)',
          background: isDragOver ? 'var(--paper-tint)' : 'var(--bg-paper)',
          padding: '36px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <input
          id="photo-file-input"
          aria-label="Upload photos to convert"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          {/* CAMERA ICON DOODLE */}
          <svg width="48" height="40" viewBox="0 0 48 40" fill="none">
            <rect x="2" y="10" width="44" height="28" rx="2" stroke="var(--ink)" strokeWidth="2.5" />
            <path d="M14 10 L18 4 L30 4 L34 10" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="24" cy="24" r="9" stroke="var(--ink)" strokeWidth="2.5" />
            <circle cx="24" cy="24" r="4" fill="var(--ink)" />
          </svg>

          <div>
            <span className="marker-font" style={{ fontSize: '20px', display: 'block' }}>
              {selectedFiles.length > 0
                ? `${selectedFiles.length} FILE(S) SELECTED`
                : 'DROP PHOTOS HERE OR CLICK TO BROWSE'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--ink-gray)' }}>
              SUPPORTS PNG, JPG, WEBP, AVIF, GIF, BMP, SVG (BATCH FRIENDLY)
            </span>
          </div>

          {selectedFiles.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              justifyContent: 'center',
              marginTop: '8px',
            }}>
              {selectedFiles.slice(0, 5).map((f) => (
                <span
                  key={f.name}
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    background: 'var(--ink)',
                    color: 'var(--ink-inverted)',
                    borderRadius: '2px',
                  }}
                >
                  {f.name} ({formatBytes(f.size)})
                </span>
              ))}
              {selectedFiles.length > 5 && (
                <span style={{ fontSize: '10px', fontWeight: 700 }}>
                  +{selectedFiles.length - 5} MORE
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CONVERSION CONTROLS */}
      <div className="hand-box" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '12px' }}>[1. TARGET FORMAT]</span>
          <span style={{ fontSize: '11px', color: 'var(--ink-gray)' }}>CURRENT: {format.toUpperCase()}</span>
        </div>

        {/* FORMAT SELECTION PILLS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(['webp', 'png', 'jpeg', 'avif', 'bmp'] as ImageFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`hand-btn ${format === f ? 'primary' : ''}`}
              style={{ padding: '6px 14px', fontSize: '11px' }}
            >
              .{f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* QUALITY SLIDER (ONLY FOR LOSSY FORMATS) */}
        {['webp', 'jpeg', 'avif'].includes(format) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <label htmlFor="photo-quality-slider" style={{ fontWeight: 700, cursor: 'pointer' }}>
                [2. COMPRESSION QUALITY]
              </label>
              <span className="marker-font" style={{ fontSize: '14px' }}>{quality}%</span>
            </div>
            <input
              id="photo-quality-slider"
              aria-label="Compression Quality Percentage"
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--ink-gray)' }}>
              <span>SMALLER FILE (10%)</span>
              <span>BALANCED (80%)</span>
              <span>MAX QUALITY (100%)</span>
            </div>
          </div>
        )}

        {/* DIMENSION RESIZING */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ fontWeight: 700 }}>[3. RESIZE SCALE]</span>
            <span style={{ color: 'var(--ink-gray)' }}>
              {maxDimension === 'original' ? 'ORIGINAL SIZE' : `MAX ${maxDimension}PX`}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              { label: 'ORIGINAL', val: 'original' as const },
              { label: '1920PX (FHD)', val: 1920 },
              { label: '1280PX (HD)', val: 1280 },
              { label: '800PX (WEB)', val: 800 },
              { label: '400PX (THUMB)', val: 400 },
            ].map((d) => (
              <button
                key={d.label}
                onClick={() => setMaxDimension(d.val)}
                className={`hand-btn ${maxDimension === d.val ? 'primary' : ''}`}
                style={{ padding: '4px 10px', fontSize: '10px' }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* ARTISTIC & COLOR FILTERS */}
        <div className="responsive-action-row" style={{
          borderTop: '1.5px dashed var(--ink)',
          paddingTop: '14px',
        }}>
          <span style={{ fontWeight: 700, fontSize: '11px' }}>[4. MONOCHROME STYLES]:</span>

          <button
            onClick={() => setApplySketch(!applySketch)}
            className={`hand-btn ${applySketch ? 'primary' : ''}`}
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              position: 'relative',
            }}
          >
            ★ INK SKETCH FILTER
            {applySketch && (
              <span style={{ fontSize: '9px', marginLeft: '4px' }}>[ON]</span>
            )}
          </button>

          <button
            onClick={() => setApplyGrayscale(!applyGrayscale)}
            disabled={applySketch}
            className={`hand-btn ${applyGrayscale ? 'primary' : ''}`}
            style={{ padding: '6px 12px', fontSize: '10px' }}
          >
            GRAYSCALE
          </button>

          <button
            onClick={() => setApplyInvert(!applyInvert)}
            disabled={applySketch}
            className={`hand-btn ${applyInvert ? 'primary' : ''}`}
            style={{ padding: '6px 12px', fontSize: '10px' }}
          >
            INVERT
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '10px', fontWeight: 700 }}>ROTATE:</span>
            {[0, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                onClick={() => setRotate(deg)}
                className={`hand-btn ${rotate === deg ? 'primary' : ''}`}
                style={{ padding: '3px 8px', fontSize: '10px' }}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>

        {/* ACTION CONVERT BUTTON */}
        <button
          onClick={handleConvert}
          disabled={selectedFiles.length === 0 || isConverting}
          className="hand-btn primary"
          style={{
            padding: '14px 24px',
            fontSize: '14px',
            letterSpacing: '1px',
            width: '100%',
            marginTop: '4px',
          }}
        >
          {isConverting
            ? `CONVERTING IN-BROWSER... (${selectedFiles.length} FILES)`
            : `CONVERT ${selectedFiles.length || 0} PHOTO(S) NOW [100% LOCAL]`}
        </button>
      </div>

      {/* RECENT CONVERSION RESULTS */}
      {latestResults.length > 0 && (
        <div className="hand-box" style={{ padding: '20px', background: 'var(--bg-paper)' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            borderBottom: '1.5px solid var(--ink)',
            paddingBottom: '8px',
          }}>
            <span className="marker-font" style={{ fontSize: '18px' }}>
              CONVERSION COMPLETE ({latestResults.length})
            </span>
            <span style={{
              background: 'var(--ink)',
              color: 'var(--ink-inverted)',
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '2px',
            }}>
              STORED IN BROWSER INDEXEDDB
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {latestResults.map((item) => (
              <div
                key={item.id}
                className="result-card"
                style={{
                  border: '1.5px solid var(--ink)',
                  padding: '12px',
                }}
              >
                {/* PREVIEW THUMBNAIL */}
                {item.previewUrl && (
                  <img
                    src={item.previewUrl}
                    alt={item.fileName}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'contain',
                      border: '1.5px solid var(--ink)',
                      background: '#FFFFFF',
                    }}
                  />
                )}

                {/* FILE METRICS */}
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{ fontWeight: 700, fontSize: '12px' }}>
                    {item.fileName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-gray)', marginTop: '2px' }}>
                    {formatBytes(item.originalSize)} ➔ {formatBytes(item.convertedSize)}{' '}
                    <span style={{ fontWeight: 700, color: 'var(--ink)' }}>
                      ({item.savedBytes >= 0 ? `-${item.percentSaved}%` : `+${item.percentSaved}%`})
                    </span>
                  </div>
                  {item.dimensions && (
                    <div style={{ fontSize: '10px', color: 'var(--ink-subtle)' }}>
                      DIMENSIONS: {item.dimensions.width} × {item.dimensions.height} PX
                    </div>
                  )}
                </div>

                {/* DOWNLOAD ACTION */}
                <a
                  href={item.previewUrl}
                  download={item.fileName}
                  className="hand-btn"
                  style={{ padding: '6px 14px', fontSize: '11px' }}
                >
                  DOWNLOAD FILE ➔
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
