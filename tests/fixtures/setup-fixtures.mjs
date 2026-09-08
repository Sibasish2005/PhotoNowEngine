/**
 * PhotoNow Test Fixture Generator
 * Creates realistic test project repositories (Next.js, Vite, Generic HTML)
 * containing intentionally unoptimized, shared, and unused media assets.
 */

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export const FIXTURES_ROOT = path.resolve('./tests/fixtures');

export async function setupTestFixtures() {
  await fs.mkdir(FIXTURES_ROOT, { recursive: true });

  // -------------------------------------------------------------
  // 1. Next.js App Router Fixture
  // -------------------------------------------------------------
  const nextDir = path.join(FIXTURES_ROOT, 'nextjs_project');
  await fs.mkdir(path.join(nextDir, 'app', 'pricing'), { recursive: true });
  await fs.mkdir(path.join(nextDir, 'components'), { recursive: true });
  await fs.mkdir(path.join(nextDir, 'public'), { recursive: true });

  await fs.writeFile(
    path.join(nextDir, 'package.json'),
    JSON.stringify({ name: 'fixture-nextjs', dependencies: { next: '15.1.0', react: '^19.0.0' } }, null, 2),
    'utf8'
  );

  await fs.writeFile(
    path.join(nextDir, 'next.config.ts'),
    `export default { images: { formats: ['image/avif', 'image/webp'] } };\n`,
    'utf8'
  );

  await fs.writeFile(
    path.join(nextDir, 'app', 'page.tsx'),
    `import Image from 'next/image';
import { Hero } from '../components/Hero';

export default function HomePage() {
  return (
    <main>
      <h1>Welcome to Next.js Fixture</h1>
      <Image src="/hero_banner.png" width={1280} height={720} priority alt="Hero banner" />
      <Hero />
    </main>
  );
}\n`,
    'utf8'
  );

  await fs.writeFile(
    path.join(nextDir, 'app', 'pricing', 'page.tsx'),
    `export default function PricingPage() {
  return (
    <div>
      <img src="/logo.svg" width="120" height="40" alt="Logo" />
      <h2>Pricing Plans</h2>
      <img src="/shared_badge.png" width="400" height="200" alt="Trust badge" />
    </div>
  );
}\n`,
    'utf8'
  );

  await fs.writeFile(
    path.join(nextDir, 'components', 'Hero.tsx'),
    `export function Hero() {
  return (
    <section>
      <img src="/shared_badge.png" width="400" height="200" alt="Shared trust badge" />
    </section>
  );
}\n`,
    'utf8'
  );

  // Generate synthetic assets
  // 1a. Oversized photographic PNG hero (3000x2000)
  await sharp({
    create: {
      width: 3000,
      height: 2000,
      channels: 3,
      background: { r: 70, g: 110, b: 210 },
    },
  })
    .png({ compressionLevel: 2 })
    .toFile(path.join(nextDir, 'public', 'hero_banner.png'));

  // 1b. Shared trust badge (1200x800)
  await sharp({
    create: {
      width: 1200,
      height: 800,
      channels: 3,
      background: { r: 40, g: 180, b: 90 },
    },
  })
    .png()
    .toFile(path.join(nextDir, 'public', 'shared_badge.png'));

  // 1c. Unused / dead asset (2000x1200 JPEG)
  await sharp({
    create: {
      width: 2000,
      height: 1200,
      channels: 3,
      background: { r: 180, g: 70, b: 70 },
    },
  })
    .jpeg({ quality: 90 })
    .toFile(path.join(nextDir, 'public', 'dead_hero_archive.jpg'));

  // 1d. Vector logo
  await fs.writeFile(
    path.join(nextDir, 'public', 'logo.svg'),
    `<svg width="120" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="40" fill="#000"/><text x="10" y="25" fill="#fff" font-family="sans-serif" font-size="14">LOGO</text></svg>`,
    'utf8'
  );

  // -------------------------------------------------------------
  // 2. Vite / React Project Fixture
  // -------------------------------------------------------------
  const viteDir = path.join(FIXTURES_ROOT, 'vite_project');
  await fs.mkdir(path.join(viteDir, 'src', 'assets'), { recursive: true });

  await fs.writeFile(
    path.join(viteDir, 'package.json'),
    JSON.stringify({ name: 'fixture-vite', devDependencies: { vite: '^6.0.0' } }, null, 2),
    'utf8'
  );

  await fs.writeFile(
    path.join(viteDir, 'src', 'App.tsx'),
    `import banner from './assets/banner.png';
export default function App() {
  return <img src={banner} alt="Vite banner" />;
}\n`,
    'utf8'
  );

  await sharp({
    create: {
      width: 1600,
      height: 900,
      channels: 3,
      background: { r: 240, g: 150, b: 40 },
    },
  })
    .png()
    .toFile(path.join(viteDir, 'src', 'assets', 'banner.png'));

  return { nextDir, viteDir };
}

// Allow standalone execution
if (process.argv[1]?.endsWith('setup-fixtures.mjs')) {
  setupTestFixtures().then(() => console.log('✓ Realistic test fixtures generated at tests/fixtures/'));
}
