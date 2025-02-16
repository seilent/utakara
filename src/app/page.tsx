import Link from 'next/link';
import Image from 'next/image';
import { getAllSongs } from '@/lib/db';
import SongGrid from '@/components/SongGrid';

export default async function Home() {
  const songs = await getAllSongs();
  
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <h1 className="text-4xl font-bold mb-8 text-center relative">
        <span className="inline-block px-6 py-3 rounded-lg text-white text-shadow-lg">
          歌カラ
          <span className="block text-xl mt-1 text-white/90 font-medium">
            UtaKara
          </span>
        </span>
      </h1>
      
      <SongGrid songs={songs} />
    </main>
  );
}
