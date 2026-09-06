import type { Metadata } from 'next';
import { Permanent_Marker, Space_Mono } from 'next/font/google';
import './globals.css';

const markerFont = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-marker',
  display: 'swap',
});

const monoFont = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PHOTONOW — Hand-Drawn Client-Side Photo & Video Converter',
  description: '100% in-browser photo and video converter workbench. Zero server uploads. Client-side WebP, AVIF, WebM transcoding, and WAV audio extraction with MCP Agent integration.',
  keywords: [
    'photo converter',
    'video converter',
    'client-side image converter',
    'offline webp converter',
    'browser video transcode',
    'extract audio from video wav',
    'sobel sketch filter',
    'mcp tool server',
    'model context protocol',
    'indexeddb media storage',
  ],
  authors: [{ name: 'PhotoNow Engine' }],
  creator: 'PhotoNow Engine',
  openGraph: {
    title: 'PHOTONOW — Hand-Drawn Client-Side Photo & Video Converter',
    description: '100% in-browser photo and video converter workbench. Zero server uploads. Full client storage persistence with MCP Agent interface.',
    type: 'website',
    locale: 'en_US',
    siteName: 'PhotoNow Engine',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PHOTONOW — Client-Side Photo & Video Converter',
    description: 'Zero server uploads. 100% private in-browser photo & video converter with hand-drawn aesthetic and MCP Agent support.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${markerFont.variable} ${monoFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
