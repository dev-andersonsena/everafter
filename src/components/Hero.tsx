import { useState, useEffect } from 'react';
import { ChevronDown, Calendar, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { weddingDetails } from '../data';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOver: boolean;
}

export default function Hero() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false
  });

  useEffect(() => {
    const targetDate = new Date(weddingDetails.date).getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isOver: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format date elegantly: "10 de Outubro de 2026"
  const formattedDate = "10.10.2026";

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="inicio" 
      className="relative flex flex-col items-center justify-between min-h-screen text-center overflow-hidden bg-stone-900 px-4 pt-16 pb-8"
    >
      {/* Background Image with Dark & Warm Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center scale-105 filter brightness-45"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop')` 
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-transparent to-stone-950/90 z-0" />

      {/* Floating Petals/Leaves Effect (Micro-interactions) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              y: -50, 
              x: Math.random() * 400 - 200, 
              rotate: 0,
              scale: Math.random() * 0.6 + 0.4
            }}
            animate={{ 
              opacity: [0, 0.6, 0.6, 0],
              y: '105vh',
              x: `calc(100% + ${Math.random() * 100 - 50}px)`,
              rotate: 360
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10
            }}
            className="absolute top-0 left-1/2 w-4 h-4 rounded-tl-full rounded-br-full bg-gold-100/10 border border-gold-200/5"
            style={{ left: `${Math.random() * 100}%` }}
          />
        ))}
      </div>

      {/* Header Wording */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.2 }}
        className="z-20 mt-8"
      >
        <span className="text-gold-200 uppercase tracking-[0.3em] text-[10px] sm:text-xs font-medium block mb-2">
          Salvem esta data • Convite Especial
        </span>
        <div className="w-12 h-[1px] bg-gold-300/40 mx-auto" />
      </motion.div>

      {/* Main Couple Names */}
      <div className="z-20 my-auto flex flex-col items-center">
        <motion.p
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="font-handwriting text-gold-200 text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-wide select-none drop-shadow-md"
        >
          Henderson
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="font-serif italic text-white text-xl sm:text-2xl my-2"
        >
          &
        </motion.p>
        <motion.p
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
          className="font-handwriting text-gold-200 text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-wide select-none drop-shadow-md"
        >
          Alana
        </motion.p>

        {/* Elegant Quote */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 1.2, delay: 0.8 }}
          className="font-serif italic text-stone-300 text-sm sm:text-base max-w-md mx-auto mt-6 px-4 leading-relaxed tracking-wider"
        >
          "Assim, eles já não são dois, mas uma só carne. Portanto, o que Deus uniu, ninguém o separe."
          <span className="block text-[11px] uppercase tracking-widest text-gold-300/70 mt-2 font-sans not-italic">
            Mateus 19:6
          </span>
        </motion.p>
      </div>

      {/* Countdown and Details bar */}
      <div className="z-20 w-full max-w-3xl flex flex-col items-center gap-6 mt-auto">
        
        {/* Short info row */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.9 }}
          className="flex flex-col sm:flex-row items-center gap-4 sm:gap-12 bg-stone-900/40 backdrop-blur-md border border-gold-300/10 px-8 py-4 rounded-2xl w-full text-stone-200"
        >
          <div className="flex items-center gap-3 w-full justify-center sm:justify-start">
            <Calendar size={18} className="text-gold-300 shrink-0" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-widest text-stone-400">Quando</p>
              <p className="font-serif font-medium text-sm sm:text-base text-gold-100">Sábado, 10 de Outubro de 2026 às 16:00</p>
            </div>
          </div>
          
          <div className="hidden sm:block w-[1px] h-8 bg-gold-300/20 shrink-0" />
          
          <div className="flex items-center gap-3 w-full justify-center sm:justify-start border-t border-gold-300/10 pt-3 sm:pt-0 sm:border-0">
            <MapPin size={18} className="text-gold-300 shrink-0" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-widest text-stone-400">Onde</p>
              <p className="font-serif font-medium text-sm sm:text-base text-gold-100">Capela das Hortênsias • Gramado, RS</p>
            </div>
          </div>
        </motion.div>

        {/* Countdown Timer */}
        {!timeLeft.isOver && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 1.0 }}
            className="grid grid-cols-4 gap-3 sm:gap-6 max-w-md w-full"
          >
            {/* Days */}
            <div className="flex flex-col items-center bg-stone-950/65 backdrop-blur-md border border-gold-300/10 rounded-xl p-3 sm:p-4 shadow-xl">
              <span className="font-serif text-2xl sm:text-3xl font-semibold text-gold-200">{timeLeft.days}</span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-stone-400 mt-1">Dias</span>
            </div>

            {/* Hours */}
            <div className="flex flex-col items-center bg-stone-950/65 backdrop-blur-md border border-gold-300/10 rounded-xl p-3 sm:p-4 shadow-xl">
              <span className="font-serif text-2xl sm:text-3xl font-semibold text-gold-200">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-stone-400 mt-1">Horas</span>
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center bg-stone-950/65 backdrop-blur-md border border-gold-300/10 rounded-xl p-3 sm:p-4 shadow-xl">
              <span className="font-serif text-2xl sm:text-3xl font-semibold text-gold-200">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-stone-400 mt-1">Min</span>
            </div>

            {/* Seconds */}
            <div className="flex flex-col items-center bg-stone-950/65 backdrop-blur-md border border-gold-300/10 rounded-xl p-3 sm:p-4 shadow-xl">
              <span className="font-serif text-2xl sm:text-3xl font-semibold text-gold-200">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-stone-400 mt-1">Seg</span>
            </div>
          </motion.div>
        )}

        {/* Scroll button */}
        <motion.button 
          onClick={() => scrollToSection('evento')}
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut" }}
          className="mt-2 text-gold-200/80 hover:text-gold-200 flex flex-col items-center gap-1 text-xs tracking-widest cursor-pointer uppercase select-none font-sans"
        >
          <span>Ver Detalhes</span>
          <ChevronDown size={16} />
        </motion.button>

      </div>
    </section>
  );
}
