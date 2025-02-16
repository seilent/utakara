'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import * as Vibrant from 'node-vibrant';

interface PageProps {
  params: {
    id: string;
  };
}

export default function SongPage({ params }: PageProps) {
  const [showRomaji, setShowRomaji] = useState(true);
  const [colors, setColors] = useState<{
    primary: string;
    secondary: string;
    text: string;
  }>({
    primary: 'rgb(15 23 42)', // Default dark background
    secondary: 'rgb(51 65 85)',
    text: 'rgb(255 255 255)'
  });

  const song = getSongById(parseInt(params.id));
  
  if (!song) {
    notFound();
  }

  // Split lyrics into sections (double newlines) and then into lines
  const japaneseSections = song.lyrics.japanese.split('\n\n').map(section => section.split('\n'));
  const romajiSections = song.lyrics.romaji.split('\n\n').map(section => section.split('\n'));

  useEffect(() => {
    // Extract colors from artwork
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = song.artwork;
    img.onload = async () => {
      try {
        const palette = await Vibrant.from(img).getPalette();
        setColors({
          primary: palette.DarkVibrant?.hex || colors.primary,
          secondary: palette.Vibrant?.hex || colors.secondary,
          text: palette.LightVibrant?.hex || colors.text
        });
      } catch (error) {
        console.error('Error extracting colors:', error);
      }
    };
  }, [song.artwork]);

  return (
    <main 
      className="min-h-screen p-4 sm:p-8 transition-colors duration-500"
      style={{ backgroundColor: colors.primary }}
    >
      <div className="max-w-4xl mx-auto">
        <Link 
          href="/"
          className="inline-block mb-8 text-blue-400 hover:text-blue-300 transition-colors"
        >
          ← Back to songs
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <motion.div 
              className="aspect-square relative bg-gray-800/50 rounded-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Image
                src={song.artwork}
                alt={`${song.title.japanese} - ${song.artist.japanese}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </motion.div>

            <motion.div 
              className="mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
                {song.title.japanese}
                <span className="block text-lg opacity-75" style={{ color: colors.text }}>
                  {song.title.english}
                </span>
              </h1>

              <p className="mt-2" style={{ color: colors.text }}>
                {song.artist.japanese}
                <span className="block opacity-75" style={{ color: colors.text }}>
                  {song.artist.english}
                </span>
              </p>
            </motion.div>
          </div>

          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold" style={{ color: colors.text }}>Lyrics</h2>
              <button
                onClick={() => setShowRomaji(prev => !prev)}
                className="px-3 py-1 rounded transition-colors"
                style={{ 
                  backgroundColor: colors.secondary,
                  color: colors.text
                }}
              >
                {showRomaji ? 'Show Japanese' : 'Show Romaji'}
              </button>
            </div>

            <div className="space-y-8">
              {(showRomaji ? romajiSections : japaneseSections).map((section, sectionIndex) => (
                <motion.div
                  key={`${sectionIndex}-${showRomaji}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: sectionIndex * 0.1 }}
                  className="space-y-2"
                >
                  {section.map((line, lineIndex) => (
                    <p 
                      key={lineIndex} 
                      className="text-lg leading-relaxed"
                      style={{ color: colors.text }}
                    >
                      {line || '\u00A0'}
                    </p>
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}