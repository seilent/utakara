'use client';

import { use } from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import MusicPlayer from '@/components/MusicPlayer';

// Utility functions for color contrast
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(r: number, g: number, b: number) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(l1: number, l2: number) {
  const lightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (lightest + 0.05) / (darkest + 0.05);
}

function adjustColorForContrast(bgHex: string, textHex: string, minContrast = 4.5) {
  const bg = hexToRgb(bgHex);
  const text = hexToRgb(textHex);
  
  if (!bg || !text) return textHex;
  
  const bgLum = getLuminance(bg.r, bg.g, bg.b);
  const textLum = getLuminance(text.r, text.g, text.b);
  const contrast = getContrastRatio(bgLum, textLum);
  
  if (contrast >= minContrast) return textHex;
  
  // If contrast is insufficient, adjust the text color
  if (bgLum > 0.5) {
    // Dark text on light background
    return '#000000';
  } else {
    // Light text on dark background
    return '#ffffff';
  }
}

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
  youtube_url?: string;
}

export default function SongPage({ params }: PageProps) {
  const { id } = use(params);
  const [song, setSong] = useState<Song | null>(null);
  const [showRomaji, setShowRomaji] = useState(true);
  const [hasAudio, setHasAudio] = useState(false);
  const [hasKaraoke, setHasKaraoke] = useState(false);
  const [isKaraokeMode, setIsKaraokeMode] = useState(false);
  const [colors, setColors] = useState<{
    primary: string;
    secondary: string;
    text: string;
  }>({
    primary: 'rgb(15 23 42)',
    secondary: 'rgb(51 65 85)',
    text: 'rgb(255 255 255)'
  });

  // Effect for checking audio and karaoke availability
  useEffect(() => {
    const checkAudioAndUpdateStatus = async () => {
      if (!id) return;
      
      try {
        // Check original audio
        const existsResponse = await fetch(`/api/songs/${id}/exists`);
        const existsData = await existsResponse.json();
        setHasAudio(existsData.exists);

        // Check karaoke version
        const karaokeResponse = await fetch(`/api/songs/${id}/karaoke/exists`);
        const karaokeData = await karaokeResponse.json();
        setHasKaraoke(karaokeData.exists);
        
        if (existsData.exists) {
          const statusResponse = await fetch(`/api/songs/${id}/audio/status`);
          const statusData = await statusResponse.json();
          
          if (statusData.status === 'error') {
            await fetch(`/api/songs/${id}/audio/status`, { method: 'POST' });
          }
        }
      } catch (error) {
        console.error('Error checking audio status:', error);
        setHasAudio(false);
      }
    };

    checkAudioAndUpdateStatus();
  }, [id]);

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
        
        const primaryColor = palette.DarkVibrant?.hex || colors.primary;
        const secondaryColor = palette.Vibrant?.hex || colors.secondary;
        let textColor = palette.LightVibrant?.hex || colors.text;
        
        // Ensure text has good contrast against the background
        textColor = adjustColorForContrast(primaryColor, textColor);
        
        const newColors = {
          primary: primaryColor,
          secondary: secondaryColor,
          text: textColor
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
      style={{ 
        backgroundColor: colors.primary,
        paddingBottom: hasAudio ? 'calc(2rem + 85px)' : '2rem' // Account for bottom bar height
      }}
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
                priority
                className="object-cover pointer-events-none"
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
              />
              {hasAudio && (
                <MusicPlayer
                  audioUrl={`/api/music/${id}`}  // Pass base URL only
                  karaokeUrl={`/api/music/${id}/karaoke`}  // Pass karaoke URL
                  isKaraokeMode={isKaraokeMode}  // Pass as prop instead of constructing URL
                  songId={id}
                  artwork={song.artwork}
                  colors={colors}
                  hasAudio={hasAudio}
                  hasKaraoke={hasKaraoke}
                  title={song.title}
                  artist={song.artist}
                />
              )}
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
                {hasKaraoke && (
                  <button
                    onClick={() => setIsKaraokeMode(!isKaraokeMode)}
                    className="w-12 h-12 rounded-lg transition-colors flex items-center justify-center bg-black/20 hover:bg-black/30"
                    style={{ color: colors.text }}
                    aria-label={isKaraokeMode ? 'Switch to Original' : 'Switch to Karaoke'}
                    title={isKaraokeMode ? 'Switch to Original' : 'Switch to Karaoke'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                      <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                    </svg>
                  </button>
                )}
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
                {song.youtube_url && (
                  <a
                    href={song.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-lg transition-colors flex items-center justify-center bg-black/20 hover:bg-black/30"
                    style={{ color: colors.text }}
                    aria-label="Watch on YouTube"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path fillRule="evenodd" d="M19,2 C20.6568542,2 22,3.34314575 22,5 L22,19 C22,20.6568542 20.6568542,22 19,22 L5,22 C3.34314575,22 2,20.6568542 2,19 L2,5 C2,3.34314575 3.34314575,2 5,2 L19,2 Z M4,17 L4,19 C4,19.5522847 4.44771525,20 5,20 L6,20 L6,17 L4,17 Z M16,13 L8,13 L8,20 L16,20 L16,13 Z M20,17 L18,17 L18,20 L19,20 C19.5522847,20 20,19.5522847 20,19 L20,17 Z M20,9 L18,9 L18,15 L20,15 L20,9 Z M16,4 L8,4 L8,11 L16,11 L16,4 Z M19,4 L18,4 L18,7 L20,7 L20,5 C20,4.44771525 19.5522847,4 19,4 Z M6,4 L5,4 C4.44771525,4 4,4.44771525 4,5 L4,7 L6,7 L6,4 Z M4,15 L6,15 L6,9 L4,9 L4,15 Z" />
                    </svg>
                  </a>
                )}
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