'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Song } from '@/types/song';

interface SongGridProps {
  songs: Song[];
}

const SongGrid = ({ songs }: SongGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {songs.map((song) => (
        <Link key={song.id} href={`/songs/${song.id}`}>
          <motion.div
            className="relative group cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="aspect-square relative bg-gray-200 dark:bg-gray-700">
              <Image
                src={song.artwork}
                alt={`${song.title.japanese} - ${song.artist.japanese}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4">
              <h2 className="text-white font-bold">
                {song.title.japanese}
                <span className="block text-sm text-gray-300">
                  {song.title.english}
                </span>
              </h2>
              <p className="text-gray-300 text-sm">
                {song.artist.japanese} / {song.artist.english}
              </p>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  );
};

export default SongGrid;