declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface Particle {
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  brightness: number;
  pulseOffset: number;
}

const ParticleBackground = ({ colors, analyser }: { 
  colors: { primary: string, secondary: string },
  analyser: AnalyserNode | null
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number | null>(null);
  const dataArray = useRef<Uint8Array | null>(null);
  const prevBassEnergy = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      }
    };

    if (analyser) {
      dataArray.current = new Uint8Array(analyser.frequencyBinCount);
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    // Initialize firefly particles
    particlesRef.current = Array.from({ length: 15 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.5 + 0.2,
      size: Math.random() * 3 + 5,
      brightness: Math.random() * 0.5 + 0.3,
      pulseOffset: Math.random() * Math.PI * 2
    }));

    return () => window.removeEventListener('resize', handleResize);
  }, [analyser]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Set up canvas for glow effect
    ctx.globalCompositeOperation = 'screen';

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Get audio energy for subtle reactivity
      let bassEnergy = 0;
      if (analyser && dataArray.current) {
        analyser.getByteFrequencyData(dataArray.current);
        bassEnergy = dataArray.current.slice(0, 8).reduce((a, b) => a + b, 0) / (8 * 255);
        bassEnergy = prevBassEnergy.current * 0.8 + bassEnergy * 0.2;
        prevBassEnergy.current = bassEnergy;
      }
      
      // Draw fireflies
      particlesRef.current.forEach(particle => {
        // Update position with smooth wandering motion
        particle.angle += (Math.random() - 0.5) * 0.1;
        particle.x += Math.cos(particle.angle) * particle.speed;
        particle.y += Math.sin(particle.angle) * particle.speed;

        // Wrap around screen edges smoothly
        if (particle.x < -20) particle.x = canvas.width + 20;
        if (particle.x > canvas.width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = canvas.height + 20;
        if (particle.y > canvas.height + 20) particle.y = -20;

        // Calculate pulsing brightness
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 2 + particle.pulseOffset) * 0.3 + 0.7;
        const finalBrightness = particle.brightness * pulse * (1 + bassEnergy * 0.3);

        // Draw glowing firefly
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 8
        );
        
        const color = colors.secondary;
        const alpha = Math.floor(finalBrightness * 255).toString(16).padStart(2, '0');
        
        gradient.addColorStop(0, `${color}${alpha}`);
        gradient.addColorStop(0.4, `${color}${Math.floor(finalBrightness * 0.3 * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${color}00`);

        ctx.fillStyle = gradient;
        ctx.arc(particle.x, particle.y, particle.size * 8, 0, Math.PI * 2);
        ctx.fill();
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [dimensions, colors, analyser]);

  return createPortal(
    <motion.div 
      className="fixed inset-0 pointer-events-none z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 4, ease: "easeInOut" }}
    >
      <div className="absolute inset-0">
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ touchAction: 'none', filter: 'blur(1px)' }}
        />
      </div>
    </motion.div>,
    document.body
  );
};

interface MusicPlayerProps {
  audioUrl: string;
  karaokeUrl: string;  // Add this prop
  isKaraokeMode: boolean;  // Add this prop
  songId: string | number;
  artwork: string;
  colors: {
    primary: string;
    secondary: string;
    text: string;
  };
  hasAudio: boolean;
  title: {
    japanese: string;
    english: string;
  };
  artist: {
    japanese: string;
    english: string;
  };
  hasKaraoke?: boolean;  // Add this new prop
}

interface BottomBarPlayerProps extends Omit<MusicPlayerProps, 'hasAudio'> {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  volume: number;
  onVolumeChange: (value: number) => void;
  onSeek: (value: number) => void;
  karaokeUrl: string;
  isKaraokeMode: boolean;
}

const BottomBarPlayer = ({ 
  artwork, 
  colors, 
  title, 
  artist,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  volume,
  onVolumeChange,
  onSeek
}: BottomBarPlayerProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const previousVolume = useRef(volume);

  useEffect(() => {
    // Check if device is mobile through userAgent
    const checkMobile = () => {
      const ua = navigator.userAgent;
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    };
    setIsMobile(checkMobile());
  }, []);

  const handleVolumeIconClick = () => {
    if (isMuted) {
      // Unmute - restore previous volume
      onVolumeChange(previousVolume.current);
    } else {
      // Mute - store current volume and set to 0
      previousVolume.current = volume;
      onVolumeChange(0);
    }
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return createPortal(
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{ 
        backgroundColor: `${colors.primary}dd`,
        borderTop: `1px solid ${colors.secondary}33`
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Progress Bar */}
        <div className="px-4 pt-2">
          <div className="relative h-2 rounded-full overflow-hidden" 
               style={{ backgroundColor: `${colors.secondary}33` }}>
            <div 
              className="absolute left-0 top-0 bottom-0 transition-all duration-150"
              style={{ 
                width: `${(currentTime / duration) * 100}%`,
                background: `linear-gradient(90deg, ${colors.secondary}, ${colors.secondary}dd)`
              }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 p-4">
          {/* Artwork */}
          <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0 bg-black/20">
            <Image
              src={artwork}
              alt="Cover"
              width={96}
              height={96}
              className="object-cover w-full h-full"
              quality={90}
            />
          </div>

          {/* Title & Artist + Time */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate" style={{ color: colors.text }}>{title.japanese}</p>
            <p className="text-xs truncate opacity-80" style={{ color: colors.text }}>
              {artist.japanese} • {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>

          {/* Controls with horizontal volume */}
          <div className="flex items-center gap-3">
            {/* Volume Control (Horizontal) - Hidden on mobile */}
            {!isMobile && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleVolumeIconClick}
                  className="cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" style={{ color: colors.text }}>
                      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" style={{ color: colors.text }}>
                      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                      <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                    </svg>
                  )}
                </button>
                <div className="relative w-20 md:w-24">
                  <div className="h-1.5 rounded-full overflow-hidden"
                       style={{ backgroundColor: `${colors.secondary}33` }}>
                    <div 
                      className="absolute left-0 top-0 bottom-0 transition-all duration-150"
                      style={{ 
                        width: `${volume * 100}%`,
                        background: colors.secondary
                      }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => {
                        const newVolume = parseFloat(e.target.value);
                        onVolumeChange(newVolume);
                        setIsMuted(newVolume === 0);
                      }}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Play/Pause Button */}
            <button
              onClick={onPlayPause}
              className="w-10 h-10 rounded-full transition-colors flex items-center justify-center"
              style={{ 
                color: colors.text,
                background: `${colors.secondary}33`
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                {isPlaying ? (
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const MusicPlayer = ({ audioUrl, karaokeUrl, isKaraokeMode, songId, artwork, colors, hasAudio, hasKaraoke, title, artist }: MusicPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem('audioVolume');
    return savedVolume ? parseFloat(savedVolume) : 1;
  });
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const bufferingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mainAudioRef = useRef<HTMLAudioElement>(null);
  const karaokeAudioRef = useRef<HTMLAudioElement>(null);
  const prevKaraokeModeRef = useRef(isKaraokeMode);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    // Initialize Web Audio API
    const initAudio = () => {
      if (!mainAudioRef.current || audioContextRef.current) return;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaElementSource(mainAudioRef.current);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
    };

    const audio = mainAudioRef.current;
    const handlePlay = () => {
      if (!audioContextRef.current) {
        initAudio();
      }
    };

    if (audio) {
      audio.addEventListener('play', handlePlay);
    }

    return () => {
      if (audio) {
        audio.removeEventListener('play', handlePlay);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const audio = mainAudioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handleCanPlay = () => setIsLoading(false);
    const handleWaiting = () => setIsLoading(true);
    const handleError = (e: Event) => {
      if (e instanceof ErrorEvent && e.error) {
        console.error('Audio playback error:', e.error);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Add preload initialization
  useEffect(() => {
    if (mainAudioRef.current) {
      mainAudioRef.current.preload = "auto";
    }
  }, [audioUrl]);

  // Enhanced buffering detection
  useEffect(() => {
    const audio = mainAudioRef.current;
    if (!audio) return;

    const handleProgress = () => {
      if (!audio.duration) return;
      
      const buffered = audio.buffered;
      const currentTime = audio.currentTime;
      
      // Check if we have enough buffer ahead
      let hasEnoughBuffer = false;
      for (let i = 0; i < buffered.length; i++) {
        if (buffered.start(i) <= currentTime && buffered.end(i) >= currentTime + 10) {
          hasEnoughBuffer = true;
          break;
        }
      }
      
      if (!hasEnoughBuffer && !isBuffering) {
        setIsBuffering(true);
      } else if (hasEnoughBuffer && isBuffering) {
        // Add a small delay before removing buffer indicator to prevent flashing
        if (bufferingTimeoutRef.current) {
          clearTimeout(bufferingTimeoutRef.current);
        }
        bufferingTimeoutRef.current = setTimeout(() => setIsBuffering(false), 500);
      }
    };

    const handleWaiting = () => {
      setIsBuffering(true);
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
      setIsLoading(false);
    };

    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
      }
    };
  }, [isBuffering]);

  // Initialize audio elements
  useEffect(() => {
    if (!mainAudioRef.current || !hasAudio) return;

    const mainAudio = mainAudioRef.current;
    const karaokeAudio = karaokeAudioRef.current;
    
    // Set initial active audio
    const activeAudio = isKaraokeMode && karaokeAudio ? karaokeAudio : mainAudio;

    const syncAudio = (fromAudio: HTMLAudioElement, toAudio: HTMLAudioElement) => {
      toAudio.currentTime = fromAudio.currentTime;
      if (!fromAudio.paused) {
        const playPromise = toAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => console.error('Error playing synced audio:', error));
        }
      } else {
        toAudio.pause();
      }
    };

    // Sync time between both audio elements
    const handleTimeUpdate = () => {
      if (karaokeAudio && Math.abs(mainAudio.currentTime - karaokeAudio.currentTime) > 0.1) {
        const activeAudio = isKaraokeMode ? karaokeAudio : mainAudio;
        const inactiveAudio = activeAudio === mainAudio ? karaokeAudio : mainAudio;
        syncAudio(activeAudio, inactiveAudio);
      }
    };

    mainAudio.addEventListener('timeupdate', handleTimeUpdate);
    if (karaokeAudio) {
      karaokeAudio.addEventListener('timeupdate', handleTimeUpdate);
    }

    return () => {
      mainAudio.removeEventListener('timeupdate', handleTimeUpdate);
      if (karaokeAudio) {
        karaokeAudio.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, [hasAudio, isKaraokeMode]);

  // Update the audio switching logic
  useEffect(() => {
    if (!mainAudioRef.current || !karaokeAudioRef.current) return;

    const mainAudio = mainAudioRef.current;
    const karaokeAudio = karaokeAudioRef.current;
    const currentTime = mainAudio.currentTime;
    const wasPlaying = !mainAudio.paused;

    // Explicitly reapply volume on both tracks
    mainAudio.volume = volume;
    karaokeAudio.volume = volume * 1.2;

    // Use muted property instead of volume for switching
    mainAudio.muted = isKaraokeMode;
    karaokeAudio.muted = !isKaraokeMode;
    mainAudio.currentTime = currentTime;
    karaokeAudio.currentTime = currentTime;

    // Handle playback
    if (wasPlaying) {
      const playActiveAudio = async () => {
        try {
          if (isKaraokeMode) {
            mainAudio.pause();
            await karaokeAudio.play();
          } else {
            karaokeAudio.pause();
            await mainAudio.play();
          }
        } catch (error) {
          console.error('Error switching audio:', error);
        }
      };
      playActiveAudio();
    } else {
      mainAudio.pause();
      karaokeAudio.pause();
    }
  }, [isKaraokeMode, volume]);

  // Handle volume changes
  useEffect(() => {
    // Apply volume to both tracks
    if (mainAudioRef.current) mainAudioRef.current.volume = volume;
    if (karaokeAudioRef.current) karaokeAudioRef.current.volume = volume * 1.2;
  }, [volume]);

  const togglePlay = async () => {
    const mainAudio = mainAudioRef.current;
    const karaokeAudio = karaokeAudioRef.current;
    if (!mainAudio || (hasKaraoke && !karaokeAudio)) return;

    const targetAudio = isKaraokeMode ? karaokeAudio! : mainAudio;

    if (!hasStartedPlaying) {
      setHasStartedPlaying(true);
    }

    if (isPlaying) {
      mainAudio.pause();
      if (karaokeAudio) karaokeAudio.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      try {
        await targetAudio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Error playing audio:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    localStorage.setItem('audioVolume', newVolume.toString());
    // Apply volume to both tracks
    if (mainAudioRef.current) mainAudioRef.current.volume = newVolume;
    if (karaokeAudioRef.current) karaokeAudioRef.current.volume = newVolume * 1.2;
  };

  // Initialize volume from localStorage when audio element is created
  useEffect(() => {
    if (mainAudioRef.current) {
      mainAudioRef.current.volume = volume;
    }
    if (karaokeAudioRef.current) {
      karaokeAudioRef.current.volume = volume * 1.2;
    }
  }, [volume]);

  const handleSeek = (time: number) => {
    if (!mainAudioRef.current || !karaokeAudioRef.current) return;

    const mainAudio = mainAudioRef.current;
    const karaokeAudio = karaokeAudioRef.current;
    const wasPlaying = !mainAudio.paused;

    setCurrentTime(time);
    mainAudio.currentTime = time;
    karaokeAudio.currentTime = time;

    if (wasPlaying) {
      const activeAudio = isKaraokeMode ? karaokeAudio : mainAudio;
      const playPromise = activeAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error after seeking:', error);
        });
      }
    }
  };

  if (!hasAudio) return null;

  return (
    <>
      <audio ref={mainAudioRef} src={audioUrl} preload="metadata" />
      {hasKaraoke && (
        <audio ref={karaokeAudioRef} src={karaokeUrl} preload="auto" />
      )}
      
      {/* Simple Play Overlay on Artwork */}
      <div 
        className="absolute inset-0 flex items-center justify-center cursor-pointer transition-opacity hover:bg-black/40"
        onClick={togglePlay}
      >
        {isLoading ? (
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isPlaying ? null : (
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-8 h-8 text-white"
            >
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Particles Background when playing */}
      <AnimatePresence>
        {isPlaying && <ParticleBackground colors={colors} analyser={analyserRef.current} />}
      </AnimatePresence>

      {/* Bottom Bar - Always visible after first play */}
      {hasStartedPlaying && (
        <BottomBarPlayer
          audioUrl={audioUrl}
          karaokeUrl={karaokeUrl}
          isKaraokeMode={isKaraokeMode}
          songId={songId}
          artwork={artwork}
          colors={colors}
          title={title}
          artist={artist}
          hasKaraoke={hasKaraoke}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onPlayPause={togglePlay}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          onSeek={handleSeek}
        />
      )}
    </>
  );
};

export default MusicPlayer;
