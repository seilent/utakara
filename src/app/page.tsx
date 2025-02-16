import Link from 'next/link';
import Image from 'next/image';
import { getAllSongs } from '@/lib/db';
import SongGrid from '@/components/SongGrid';

export default async function Home() {
  const songs = await getAllSongs();
  
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <h1 className="text-4xl font-bold mb-8 text-center relative">
        <span className="inline-block px-6 py-3 rounded-lg bg-black/30 backdrop-blur-sm shadow-lg relative z-10">
          <span className="relative inline-block text-white mix-blend-difference">
            歌カラ
            <span className="block text-xl mt-1 text-white/90 font-medium mix-blend-difference">
              UtaKara
            </span>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-gradient rounded-lg"></div>
        </span>
      </h1>
      
      <SongGrid songs={songs} />
    </main>
  );
}
