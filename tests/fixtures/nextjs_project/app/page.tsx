import Image from 'next/image';
import { Hero } from '../components/Hero';

export default function HomePage() {
  return (
    <main>
      <h1>Welcome to Next.js Fixture</h1>
      <Image src="/hero_banner.png" width={1280} height={720} priority alt="Hero banner" />
      <Hero />
    </main>
  );
}
