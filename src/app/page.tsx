import Link from 'next/link';
import Image from 'next/image';
import { getAllSongs } from '@/lib/db';
import SongGrid from '@/components/SongGrid';

export default async function Home() {
  const songs = await getAllSongs();
  
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">
        歌カラ
        <span className="block text-xl text-gray-600 dark:text-gray-400">
          UtaKara
        </span>
      </h1>
      
      <SongGrid songs={songs} />
    </main>
  );
}
