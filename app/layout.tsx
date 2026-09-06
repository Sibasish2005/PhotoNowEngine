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
  title: 'PHOTONOW — HAND-DRAWN CLIENT-SIDE PHOTO & VIDEO CONVERTER',
  description: '100% IN-BROWSER PHOTO AND VIDEO CONVERTER. ZERO SERVER UPLOADS. CLIENT STORAGE PERSISTENCE WITH AGENTIC MCP TOOL INTERFACE.',
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
