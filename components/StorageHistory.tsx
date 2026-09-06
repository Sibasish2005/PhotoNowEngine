'use client';

import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { StoredConversion } from '@/lib/types';
import { getAllConversions, deleteConversion, clearAllConversions, formatBytes, getStorageStats, sanitizeFileName } from '@/lib/storage';

interface StorageHistoryProps {
  onStorageUpdated: () => void;
}

export const StorageHistory: React.FC<StorageHistoryProps> = ({ onStorageUpdated }) => {
  const [items, setItems] = useState<StoredConversion[]>([]);
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [storageStats, setStorageStats] = useState<{ count: number; totalBytes: number; quotaBytes?: number }>({
    count: 0,
    totalBytes: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getAllConversions();
      // Revoke any previous preview URLs to prevent memory leaks
      setItems((prevItems) => {
        prevItems.forEach((p) => {
          if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
        });
        // Ensure fresh preview URLs exist for display
        return list.map((item) => {
          if (!item.previewUrl && item.blob) {
            return { ...item, previewUrl: URL.createObjectURL(item.blob) };
          }
          return item;
        });
      });

      const stats = await getStorageStats();
      setStorageStats(stats);
    } catch (err) {
      console.error('Failed to load conversions from IndexedDB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Cleanup allocated URLs on unmount
    return () => {
      setItems((currentItems) => {
        currentItems.forEach((p) => {
          if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
        });
        return [];
      });
    };
  }, []);

  const handleDelete = async (id: string) => {
    await deleteConversion(id);
    await loadData();
    onStorageUpdated();
  };

  const handleClearAll = async () => {
    if (confirm('ARE YOU SURE YOU WANT TO CLEAR ALL CONVERSIONS FROM BROWSER LOCAL STORAGE?')) {
      await clearAllConversions();
      await loadData();
      onStorageUpdated();
    }
  };

  const handleDownloadZip = async () => {
    if (items.length === 0 || isZipping) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder('photonow_conversions');

      items.forEach((item) => {
        // Sanitize filename to prevent directory traversal / Zip Slip vulnerability
        const safeName = sanitizeFileName(item.fileName);
        folder?.file(safeName, item.blob);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `photonow_bundle_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to create ZIP package:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return item.mediaType === filter;
  });

  const totalSavedBytes = items.reduce((acc, curr) => acc + (curr.savedBytes > 0 ? curr.savedBytes : 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* HEADER */}
      <div className="section-header" style={{
        borderBottom: '2px solid var(--ink)',
        paddingBottom: '8px',
      }}>
        <h2 className="marker-font" style={{ fontSize: '28px' }}>
          BROWSER LOCAL STORAGE.
        </h2>
        <span style={{ fontSize: '11px', fontWeight: 700 }}>
          [INDEXEDDB PERSISTENCE • ZERO CLOUD]
        </span>
      </div>

      {/* STATS OVERVIEW BAR */}
      <div className="hand-box stats-grid" style={{
        padding: '16px 20px',
      }}>
        <div>
          <span style={{ fontSize: '10px', color: 'var(--ink-gray)' }}>STORED ASSETS</span>
          <div className="marker-font" style={{ fontSize: '24px' }}>
            {storageStats.count} FILES
          </div>
        </div>

        <div>
          <span style={{ fontSize: '10px', color: 'var(--ink-gray)' }}>PAYLOAD OCCUPIED</span>
          <div className="marker-font" style={{ fontSize: '24px' }}>
            {formatBytes(storageStats.totalBytes)}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '10px', color: 'var(--ink-gray)' }}>BANDWIDTH SAVED</span>
          <div className="marker-font" style={{ fontSize: '24px' }}>
            {formatBytes(totalSavedBytes)}
          </div>
        </div>

        <div className="responsive-action-row" style={{ justifyContent: 'center' }}>
          <button
            onClick={handleDownloadZip}
            disabled={items.length === 0 || isZipping}
            className="hand-btn primary"
            style={{ padding: '6px 12px', fontSize: '11px' }}
          >
            {isZipping ? 'PACKING ZIP...' : 'DOWNLOAD ALL (.ZIP) ➔'}
          </button>
          <button
            onClick={handleClearAll}
            disabled={items.length === 0}
            className="hand-btn"
            style={{ padding: '4px 10px', fontSize: '10px' }}
          >
            CLEAR STORAGE [DELETE]
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 700 }}>FILTER:</span>
        {(['all', 'image', 'video', 'audio'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`hand-btn ${filter === f ? 'primary' : ''}`}
            style={{ padding: '4px 10px', fontSize: '10px' }}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* CONVERSIONS LIST */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', fontSize: '12px' }}>
          READING BROWSER INDEXEDDB...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="hand-box" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div className="marker-font" style={{ fontSize: '22px', marginBottom: '6px' }}>
            STORAGE IS CURRENTLY EMPTY.
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ink-gray)' }}>
            CONVERT A PHOTO OR EXTRACT A VIDEO ARTIFACT TO PERSIST IT HERE IN YOUR BROWSER.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="hand-box result-card"
              style={{
                padding: '14px 18px',
              }}
            >
              {/* MEDIA PREVIEW */}
              {item.mediaType === 'image' && item.previewUrl && (
                <img
                  src={item.previewUrl}
                  alt={item.fileName}
                  style={{
                    width: '56px',
                    height: '56px',
                    objectFit: 'contain',
                    border: '1.5px solid var(--ink)',
                    background: '#FFFFFF',
                  }}
                />
              )}

              {item.mediaType === 'audio' && (
                <div style={{
                  width: '56px',
                  height: '56px',
                  border: '1.5px solid var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  background: 'var(--ink)',
                  color: 'var(--ink-inverted)',
                }}>
                  WAV
                </div>
              )}

              {item.mediaType === 'video' && item.previewUrl && (
                <video
                  src={item.previewUrl}
                  style={{
                    width: '64px',
                    height: '56px',
                    objectFit: 'cover',
                    border: '1.5px solid var(--ink)',
                  }}
                />
              )}

              {/* DETAILS */}
              <div style={{ flex: 1, minWidth: '180px' }}>
                <div style={{ fontWeight: 700, fontSize: '12px' }}>
                  {item.fileName}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ink-gray)', marginTop: '2px' }}>
                  ORIGINAL: {formatBytes(item.originalSize)} ➔ CONVERTED: {formatBytes(item.convertedSize)}
                  {item.savedBytes > 0 && (
                    <span style={{ fontWeight: 700, marginLeft: '6px' }}>
                      (SAVED {formatBytes(item.savedBytes)} / -{item.percentSaved}%)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--ink-subtle)', marginTop: '2px' }}>
                  DATE: {new Date(item.timestamp).toLocaleString()} • FORMAT: {item.format.toUpperCase()}
                  {item.dimensions && ` • ${item.dimensions.width}x${item.dimensions.height}`}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="responsive-action-row" style={{ justifyContent: 'flex-end' }}>
                <a
                  href={item.previewUrl}
                  download={item.fileName}
                  className="hand-btn"
                  style={{ padding: '6px 12px', fontSize: '11px' }}
                >
                  SAVE FILE ➔
                </a>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="hand-btn"
                  style={{ padding: '6px 10px', fontSize: '10px' }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
