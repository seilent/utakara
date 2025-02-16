'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { use } from 'react';

// Remove client-side database import
async function getSong(id: number) {
  const res = await fetch(`/api/songs/get?id=${id}`);
  if (!res.ok) return null;
  return res.json();
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function SongPage({ params }: PageProps) {
  const id = use(params).id;
  const [song, setSong] = useState<any>(null);
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

  // Effect for fetching song data
  useEffect(() => {
    getSong(parseInt(id)).then(data => {
      if (!data) notFound();
      setSong(data);
      // Set the document background color
      document.body.style.backgroundColor = colors.primary;
    });
  }, [id, colors.primary]);

  // Effect for color extraction
  useEffect(() => {
    if (!song?.artwork) return;
    
    // Extract colors from artwork
    const img = document.createElement('img');
    img.crossOrigin = 'Anonymous';
    img.src = song.artwork;
    img.onload = async () => {
      try {
        const { Vibrant } = await import('node-vibrant/browser');
        const palette = await Vibrant.from(img).getPalette();
        const newColors = {
          primary: palette.DarkVibrant?.hex || colors.primary,
          secondary: palette.Vibrant?.hex || colors.secondary,
          text: palette.LightVibrant?.hex || colors.text
        };
        setColors(newColors);
      } catch (error) {
        console.error('Error extracting colors:', error);
      }
    };
  }, [song?.artwork]);

  // Effect to cleanup document background color
  useEffect(() => {
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  if (!song) {
    return null; // Loading state
  }

  // Split lyrics into sections (double line breaks) and lines
  const japaneseSections = song.lyrics.japanese.split(/\n\n/).map(section => 
    section.split(/\n/).map(line => line.trim())
  );
  const romajiSections = song.lyrics.romaji.split(/\n\n/).map(section => 
    section.split(/\n/).map(line => line.trim())
  );

  return (
    <main 
      className="min-h-screen p-4 sm:p-8 transition-colors duration-500"
      style={{ backgroundColor: colors.primary }}
    >
      <div className="max-w-4xl mx-auto">
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
                priority
              />
            </motion.div>

            <motion.div 
              className="mt-4 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div>
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
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRomaji(prev => !prev)}
                  className="w-12 h-12 rounded-lg transition-colors flex items-center justify-center text-lg font-bold"
                  style={{ 
                    backgroundColor: colors.secondary,
                    color: colors.text
                  }}
                  aria-label={showRomaji ? 'Show Japanese' : 'Show Romaji'}
                >
                  {showRomaji ? 'あ' : 'A'}
                </button>

                <Link 
                  href={`/admin/${song.id}`}
                  className="px-4 h-12 rounded-lg transition-colors flex items-center justify-center"
                  style={{ 
                    backgroundColor: colors.secondary,
                    color: colors.text
                  }}
                >
                  Edit Song
                </Link>
              </div>
            </motion.div>
          </div>

          <div className="md:col-span-2">
            <div className="space-y-8 mt-4">
              <AnimatePresence mode="wait">
                {(showRomaji ? romajiSections : japaneseSections).map((section: string[], sectionIndex: number) => (
                  <motion.div
                    key={`${sectionIndex}-${showRomaji}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: sectionIndex * 0.05 }}
                    className="space-y-4"
                  >
                    {section.map((line: string, lineIndex: number) => (
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
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}