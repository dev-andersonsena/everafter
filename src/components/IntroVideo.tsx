import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface IntroVideoProps {
  onComplete: () => void;
}

export default function IntroVideo({ onComplete }: IntroVideoProps) {
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Attempt autoplay with muted by default to ensure browser compatibility
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log('Autoplay play error, keeping muted and retrying:', err);
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch((e) => console.log('Autoplay fully blocked:', e));
        }
      });
    }

    // Redirect automatically after exactly 10 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const newMuted = !muted;
      videoRef.current.muted = newMuted;
      setMuted(newMuted);
    }
  };

  const handleEnded = () => {
    onComplete();
  };

  const handleError = () => {
    console.warn("Erro ao carregar o vídeo de introdução. Redirecionando direto para o site.");
    onComplete();
  };

  return (
    <div id="intro-video-container" className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden font-sans select-none">
      {/* Video element */}
      <video
        ref={videoRef}
        src="/wedding_intro.mp4"
        className="absolute inset-0 w-full h-full object-cover z-0"
        playsInline
        autoPlay
        muted={muted}
        onEnded={handleEnded}
        onError={handleError}
      />

      {/* Subtle floating controls */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 z-10 pointer-events-none">
        {/* Top Right: Skip button */}
        <div className="flex justify-end w-full pointer-events-auto">
          <button
            id="skip-video-button"
            onClick={onComplete}
            className="bg-black/30 hover:bg-black/50 text-white border border-white/10 backdrop-blur-md font-semibold text-[10px] sm:text-xs py-2 px-4 rounded-full tracking-widest uppercase transition-all duration-300 active:scale-95 cursor-pointer"
          >
            Pular
          </button>
        </div>

        {/* Bottom Right: Mute/Unmute toggle */}
        <div className="flex justify-end w-full pointer-events-auto">
          <button
            id="mute-video-toggle-button"
            onClick={handleMuteToggle}
            className="bg-black/30 hover:bg-gold-500 hover:text-black text-white p-3 rounded-full border border-white/10 backdrop-blur-md transition-all duration-300 active:scale-95 cursor-pointer"
            aria-label={muted ? "Ativar som" : "Desativar som"}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
