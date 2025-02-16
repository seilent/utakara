'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useAnimation } from 'framer-motion';
import { Song } from '@/types/song';

interface Props {
  songs: Song[];
}

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  opacity: number;
}

function useParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const touchParticlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Initialize particles
    particlesRef.current = Array.from({ length: 50 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      dx: (Math.random() - 0.5) * 2,
      dy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.3
    }));

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const handleTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Add new particles on touch
      for (let i = 0; i < 5; i++) {
        const angle = (Math.random() * Math.PI * 2);
        const speed = Math.random() * 5 + 2;
        touchParticlesRef.current.push({
          x,
          y,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          size: Math.random() * 4 + 2,
          opacity: 1
        });
      }
    };

    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw regular particles
      particlesRef.current.forEach(particle => {
        particle.x += particle.dx;
        particle.y += particle.dy;

        // Bounce off walls
        if (particle.x <= 0 || particle.x >= canvas.width) {
          particle.dx *= -1;
        }
        if (particle.y <= 0 || particle.y >= canvas.height) {
          particle.dy *= -1;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        ctx.fill();
      });

      // Update and draw touch particles
      touchParticlesRef.current = touchParticlesRef.current.filter(particle => {
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.opacity *= 0.95;
        
        if (particle.opacity < 0.01) return false;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        ctx.fill();

        return true;
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('touchmove', handleTouch);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [dimensions]);

  return canvasRef;
}

export default function SongGrid({ songs }: Props) {
  const [filter, setFilter] = useState('');
  const canvasRef = useParticles();

  const filteredSongs = songs.filter(song => 
    song.title.japanese.toLowerCase().includes(filter.toLowerCase()) ||
    song.title.english.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="relative space-y-6">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-gray-900 to-purple-950">
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
            style={{ touchAction: 'none' }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
            animate={{
              opacity: [0.5, 0.3, 0.5],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>
      </div>

      <div className="max-w-xl mx-auto relative z-10">
        <input
          type="search"
          placeholder="Search songs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border dark:border-gray-700 bg-black/30 backdrop-blur-sm text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/70"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 relative z-10">
        {filteredSongs.map((song, i) => (
          <Link 
            href={`/songs/${song.id}`} 
            key={song.id}
          >
            <motion.div
              className="group relative aspect-square bg-black/30 rounded-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
            >
              <Image
                src={song.artwork}
                alt={song.title.japanese}
                fill
                quality={100}
                unoptimized
                className="object-cover transition-all duration-300 group-hover:brightness-[0.5] group-hover:contrast-100 group-hover:saturate-50 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                priority={i < 8}
                draggable={false}
              />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <div className="w-full">
                  <h2 className="text-white/95 font-bold leading-tight break-all text-shadow-lg drop-shadow-lg">
                    {song.title.japanese}
                  </h2>
                  <p className="text-white/95 text-sm mt-1 break-all text-shadow drop-shadow-lg">
                    {song.title.english}
                  </p>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}