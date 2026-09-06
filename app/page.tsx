'use client';

import React, { useState, useEffect } from 'react';
import { HeaderNav } from '@/components/HeaderNav';
import { LeftHeroIllustration } from '@/components/LeftHeroIllustration';
import { PhotoConverter } from '@/components/PhotoConverter';
import { VideoConverter } from '@/components/VideoConverter';
import { StorageHistory } from '@/components/StorageHistory';
import { AgenticPanel } from '@/components/AgenticPanel';
import { McpPlayground } from '@/components/McpPlayground';
import { RightVerticalTabStrip, FooterStamps } from '@/components/DoodleDecorations';
import { getStorageStats } from '@/lib/storage';
import { StoredConversion } from '@/lib/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'photo' | 'video' | 'storage' | 'agent' | 'mcp'>('photo');
  const [storageCount, setStorageCount] = useState<number>(0);

  const refreshStorageStats = async () => {
    try {
      const stats = await getStorageStats();
      setStorageCount(stats.count);
    } catch {
      // Ignored if unmounted
    }
  };

  useEffect(() => {
    refreshStorageStats();
  }, []);

  const handleConversionSuccess = (_item: StoredConversion) => {
    refreshStorageStats();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* FIXED VERTICAL TAB STRIP ON RIGHT EDGE AS PER DESIGN.MD */}
      <RightVerticalTabStrip />

      {/* TOP HEADER WITH BRACKETED LINKS */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        storageCount={storageCount}
      />

      {/* MAIN TWO-COLUMN SPLIT CONTAINER (40% LEFT / 60% RIGHT AS PER DESIGN.MD) */}
      <main style={{
        flex: 1,
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '32px 24px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'start',
        }}>
          {/* LEFT 40% HERO COLUMN: HAND-DRAWN VECTOR CHARACTER & HUGE NAME */}
          <aside style={{ flex: '0 0 38%' }}>
            <LeftHeroIllustration />
          </aside>

          {/* RIGHT 60% INTERACTIVE ENGINE COLUMN */}
          <section style={{ flex: '1 1 58%', minWidth: 0 }}>
            {activeTab === 'photo' && (
              <PhotoConverter onConversionSuccess={handleConversionSuccess} />
            )}

            {activeTab === 'video' && (
              <VideoConverter onConversionSuccess={handleConversionSuccess} />
            )}

            {activeTab === 'agent' && (
              <AgenticPanel onConversionSuccess={handleConversionSuccess} />
            )}

            {activeTab === 'storage' && (
              <StorageHistory onStorageUpdated={refreshStorageStats} />
            )}

            {activeTab === 'mcp' && (
              <McpPlayground />
            )}
          </section>
        </div>
      </main>

      {/* FOOTER STAMPS */}
      <FooterStamps />
    </div>
  );
}
