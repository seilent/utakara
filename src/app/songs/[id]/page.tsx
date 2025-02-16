'use client';

import { use } from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

async function getSong(id: number) {
  const res = await fetch(`/api/songs/get?id=${id}`);
  if (!res.ok) return null;
  return res.json();
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface Song {
  artwork: string;
  title: {
    japanese: string;
    english: string;
  };
  artist: {
    japanese: string;
    english: string;
  };
  lyrics: {
    japanese: string;
    romaji: string;
  };
}

export default function SongPage({ params }: PageProps) {
  const { id } = use(params);
  const [song, setSong] = useState<Song | null>(null);
  const [showRomaji, setShowRomaji] = useState(true);
  const [colors, setColors] = useState<{
    primary: string;
    secondary: string;
    text: string;
  }>({
    primary: 'rgb(15 23 42)',
    secondary: 'rgb(51 65 85)',
    text: 'rgb(255 255 255)'
  });

  // Effect for fetching song data
  useEffect(() => {
    getSong(parseInt(id)).then(data => {
      if (!data) notFound();
      setSong(data);
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
  }, [song?.artwork, colors.primary, colors.secondary, colors.text]);

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
  const japaneseSections = song.lyrics.japanese.split(/\n\n/).map((section: string) => 
    section.split(/\n/).map((line: string) => line.trim())
  );
  const romajiSections = song.lyrics.romaji.split(/\n\n/).map((section: string) => 
    section.split(/\n/).map((line: string) => line.trim())
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
                quality={100}
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </motion.div>
            <div className="mt-6">
              <h1 className="text-3xl font-bold" style={{ color: colors.text }}>
                {song.title.japanese}
              </h1>
              <h2 className="text-xl mt-1" style={{ color: colors.text }}>
                {song.title.english}
              </h2>
              <div className="mt-4" style={{ color: colors.text }}>
                <p>{song.artist.japanese}</p>
                <p className="text-sm">{song.artist.english}</p>
              </div>
              <div className="mt-6 flex gap-2">
                <Link
                  href="/"
                  className="w-12 h-12 rounded-lg transition-colors flex items-center justify-center bg-black/20 hover:bg-black/30"
                  style={{ color: colors.text }}
                  aria-label="Return to Home"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                    <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                  </svg>
                </Link>
                <Link
                  href={`/admin/${id}`}
                  className="w-12 h-12 rounded-lg transition-colors flex items-center justify-center bg-black/20 hover:bg-black/30"
                  style={{ color: colors.text }}
                  aria-label="Edit Song"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
                  </svg>
                </Link>
                <button
                  onClick={() => setShowRomaji(!showRomaji)}
                  className="w-12 h-12 rounded-lg transition-colors flex items-center justify-center bg-black/20 hover:bg-black/30"
                  style={{ color: colors.text }}
                  aria-label={showRomaji ? 'Show Japanese' : 'Show Romaji'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M9 2.25a.75.75 0 01.75.75v1.506a49.38 49.38 0 015.343.371.75.75 0 11-.186 1.489c-.66-.083-1.323-.151-1.99-.206a18.67 18.67 0 01-2.969 6.323c.317.384.65.753.998 1.107a.75.75 0 11-1.07 1.052A18.902 18.902 0 019 13.687a18.823 18.823 0 01-5.656 4.482.75.75 0 11-.688-1.333 17.323 17.323 0 005.396-4.353A18.72 18.72 0 015.89 8.598a.75.75 0 011.388-.568A17.21 17.21 0 009 11.224a17.17 17.17 0 002.391-5.165 48.038 48.038 0 00-8.298.307.75.75 0 01-.186-1.489 49.159 49.159 0 015.343-.371V3A.75.75 0 019 2.25zM15.75 9a.75.75 0 01.68.433l5.25 11.25a.75.75 0 01-1.36.634l-1.198-2.567h-6.744l-1.198 2.567a.75.75 0 01-1.36-.634l5.25-11.25A.75.75 0 0115.75 9zm-2.672 8.25h5.344l-2.672-5.726-2.672 5.726z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {(showRomaji ? romajiSections : japaneseSections).map((section: string[], sectionIndex: number) => (
                  <motion.div
                    key={`${sectionIndex}-${showRomaji}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: sectionIndex * 0.05 }}
                    className="space-y-2"
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