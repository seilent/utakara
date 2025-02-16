'use client';

import { useState, useEffect } from 'react';
import SongGrid from '@/components/SongGrid';

export default function Home() {
  const [songs, setSongs] = useState([]);
  
  useEffect(() => {
    fetch('/api/songs/get')
      .then(res => res.json())
      .then(data => setSongs(data))
      .catch(error => console.error('Error fetching songs:', error));
  }, []);
  
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
