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
      transition={{ duration: 0.6, ease: "easeInOut" }}
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
}

interface BottomBarPlayerProps extends Omit<MusicPlayerProps, 'hasAudio'> {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  volume: number;
  onVolumeChange: (value: number) => void;
  onSeek: (value: number) => void;
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
              width={48}
              height={48}
              className="object-cover w-full h-full"
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
            {/* Volume Control (Horizontal) - Now visible on mobile */}
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
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

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

const MusicPlayer = ({ audioUrl, songId, artwork, colors, hasAudio, title, artist }: MusicPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem('audioVolume');
    return savedVolume ? parseFloat(savedVolume) : 1;
  });
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    // Initialize Web Audio API
    const initAudio = () => {
      if (!audioRef.current || audioContextRef.current) return;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaElementSource(audioRef.current);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
    };

    const audio = audioRef.current;
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
    const audio = audioRef.current;
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

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (!hasStartedPlaying) {
      setHasStartedPlaying(true);
    }
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
        setIsLoading(false);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    localStorage.setItem('audioVolume', newVolume.toString());
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Initialize volume from localStorage when audio element is created
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  if (!hasAudio) return null;

  return (
    <>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
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
          songId={songId}
          artwork={artwork}
          colors={colors}
          title={title}
          artist={artist}
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