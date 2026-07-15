import { useState, useEffect, useRef } from 'react';
import { Music, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create the audio element with downloaded Tenerife Sea mp3
    const audio = new Audio('/tenerife_sea.mp3');
    audio.loop = true;
    audio.volume = 0.35; // slightly softer default volume for an elegant ambient feel
    audioRef.current = audio;

    // Remove tooltip after 6 seconds
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 6000);

    return () => {
      audio.pause();
      audioRef.current = null;
      clearTimeout(timer);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setShowTooltip(false);
      }).catch(err => {
        console.log('Autoplay blocked or playback failed:', err);
      });
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div id="music-player-container" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-2 bg-stone-900 text-stone-100 text-xs py-1.5 px-3 rounded-lg shadow-lg border border-stone-800 font-sans tracking-wide max-w-xs text-center select-none"
          >
            Clique para ouvir nossa música de fundo 🎵
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        {/* Play/Pause Button */}
        <motion.button
          onClick={togglePlay}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg cursor-pointer transition-colors duration-300 ${
            isPlaying 
              ? 'bg-gold-500 hover:bg-gold-600 text-white' 
              : 'bg-stone-100 hover:bg-stone-200 text-gold-600 border border-gold-200'
          }`}
          aria-label={isPlaying ? 'Pausar música' : 'Tocar música'}
        >
          {isPlaying ? (
            <div className="flex items-center gap-0.5 justify-center">
              {/* Animated visualizer bars */}
              <motion.span 
                animate={{ height: [10, 22, 10] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                className="w-0.5 bg-white rounded-full" 
              />
              <motion.span 
                animate={{ height: [14, 8, 14] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
                className="w-0.5 bg-white rounded-full" 
              />
              <motion.span 
                animate={{ height: [8, 18, 8] }}
                transition={{ repeat: Infinity, duration: 1.0, ease: "easeInOut" }}
                className="w-0.5 bg-white rounded-full" 
              />
              <motion.span 
                animate={{ height: [12, 6, 12] }}
                transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut" }}
                className="w-0.5 bg-white rounded-full" 
              />
            </div>
          ) : (
            <Play size={18} fill="currentColor" className="ml-0.5" />
          )}
        </motion.button>

        {/* Volume/Mute controls (Only show when playing) */}
        <AnimatePresence>
          {isPlaying && (
            <motion.button
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              onClick={toggleMute}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-stone-900 border border-stone-800 text-gold-300 shadow-lg cursor-pointer"
              aria-label={isMuted ? 'Desmutar' : 'Mutar'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
