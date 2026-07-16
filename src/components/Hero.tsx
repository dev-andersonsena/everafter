import { useState, useEffect } from 'react';
import { ChevronDown, Calendar, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { weddingDetails } from '../data';
import Logo from './Logo';

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
      className="relative flex flex-col items-center justify-between min-h-screen text-center overflow-hidden bg-watercolor px-4 pt-24 pb-12"
    >
      {/* Delicate floating peachy petal particles for atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              y: -50, 
              x: Math.random() * 400 - 200, 
              rotate: 0,
              scale: Math.random() * 0.5 + 0.3
            }}
            animate={{ 
              opacity: [0, 0.7, 0.7, 0],
              y: '105vh',
              x: `calc(100% + ${Math.random() * 120 - 60}px)`,
              rotate: 360
            }}
            transition={{
              duration: Math.random() * 12 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 8
            }}
            className="absolute top-0 left-1/2 w-4 h-4 rounded-tl-full rounded-br-full bg-gold-400/20 border border-gold-500/10"
            style={{ left: `${Math.random() * 100}%` }}
          />
        ))}
      </div>

      {/* Main Invitation Layout Container */}
      <div className="z-20 max-w-2xl mx-auto flex flex-col items-center my-auto py-6">
        
        {/* Monogram Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="mb-6 flex flex-col items-center"
        >
          <Logo size="xl" />
        </motion.div>

        {/* Parents Blessing */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="mb-8 px-4"
        >
          <p className="font-handwriting text-gold-600 text-3xl md:text-4xl">
            Com a Benção de Deus e de nossos pais;
          </p>
        </motion.div>

        {/* Parent Names Columns */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="grid grid-cols-2 gap-8 sm:gap-16 w-full max-w-lg mb-10 px-4"
        >
          <div className="text-center">
            <p className="font-serif text-xs sm:text-sm uppercase tracking-[0.2em] font-medium text-gold-800 leading-relaxed">
              Eva Ferreira
            </p>
            <p className="font-serif text-xs sm:text-sm uppercase tracking-[0.2em] font-medium text-gold-800 leading-relaxed mt-1.5">
              Francisco Matos
            </p>
          </div>
          <div className="text-center">
            <p className="font-serif text-xs sm:text-sm uppercase tracking-[0.2em] font-medium text-gold-800 leading-relaxed">
              Fátima Brasil
            </p>
            <p className="font-serif text-xs sm:text-sm uppercase tracking-[0.2em] font-medium text-gold-800 leading-relaxed mt-1.5">
              Anderson Brasil
            </p>
          </div>
        </motion.div>

        {/* Big elegant couple names */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="mb-6 px-4"
        >
          <h1 className="font-serif text-gold-800 uppercase leading-none">
            <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-[0.18em]">Alana Letícia</span>
            <span className="block text-4xl sm:text-5xl font-handwriting my-5 text-gold-500 normal-case">e</span>
            <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-[0.18em]">Henderson Venicius</span>
          </h1>
        </motion.div>

        {/* Invitation Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 1.2, delay: 0.7 }}
          className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-gold-600 font-semibold my-6 px-4"
        >
          Convidamos você para nosso casamento
        </motion.p>

        {/* Elegant Date Dividers */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.8 }}
          className="flex items-center justify-center gap-6 sm:gap-10 font-serif text-2xl sm:text-4xl text-gold-800 my-4 py-4 border-y border-gold-300/20 max-w-xs mx-auto w-48"
        >
          <span>07</span>
          <span className="w-[1px] h-8 bg-gold-400/30" />
          <span>09</span>
          <span className="w-[1px] h-8 bg-gold-400/30" />
          <span>26</span>
        </motion.div>


      </div>

      {/* Countdown and Details row */}
      <div className="z-20 w-full max-w-3xl flex flex-col items-center gap-6 mt-6">
        
        {/* Short info row */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 1.0 }}
          className="flex flex-col sm:flex-row items-center gap-4 sm:gap-12 bg-white/70 backdrop-blur-md border border-gold-300/20 px-8 py-4 rounded-2xl w-full text-gold-900 shadow-sm"
        >
          <div className="flex items-center gap-3 w-full justify-center sm:justify-start">
            <Calendar className="text-gold-500 shrink-0" size={18} />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-widest text-gold-500 font-semibold">Quando</p>
              <p className="font-serif font-medium text-xs sm:text-sm text-gold-800">Domingo, 07 de Setembro de 2026 às 15:00</p>
            </div>
          </div>
          
          <div className="hidden sm:block w-[1px] h-8 bg-gold-300/20 shrink-0" />
          
          <div className="flex items-center gap-3 w-full justify-center sm:justify-start border-t border-gold-300/10 pt-3 sm:pt-0 sm:border-0">
            <MapPin className="text-gold-500 shrink-0" size={18} />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-widest text-gold-500 font-semibold">Onde</p>
              <p className="font-serif font-medium text-xs sm:text-sm text-gold-800">Prime Eventos • R. Deoclécio Brito, 3399 - Planalto</p>
            </div>
          </div>
        </motion.div>

        {/* Countdown Timer */}
        {!timeLeft.isOver && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 1.1 }}
            className="grid grid-cols-4 gap-3 sm:gap-4 max-w-xs w-full"
          >
            {/* Days */}
            <div className="flex flex-col items-center bg-white/70 backdrop-blur-sm border border-gold-300/15 rounded-xl p-2 sm:p-3 shadow-sm">
              <span className="font-serif text-xl sm:text-2xl font-semibold text-gold-600">{timeLeft.days}</span>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-gold-500 font-bold mt-0.5">Dias</span>
            </div>

            {/* Hours */}
            <div className="flex flex-col items-center bg-white/70 backdrop-blur-sm border border-gold-300/15 rounded-xl p-2 sm:p-3 shadow-sm">
              <span className="font-serif text-xl sm:text-2xl font-semibold text-gold-600">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-gold-500 font-bold mt-0.5">Horas</span>
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center bg-white/70 backdrop-blur-sm border border-gold-300/15 rounded-xl p-2 sm:p-3 shadow-sm">
              <span className="font-serif text-xl sm:text-2xl font-semibold text-gold-600">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-gold-500 font-bold mt-0.5">Min</span>
            </div>

            {/* Seconds */}
            <div className="flex flex-col items-center bg-white/70 backdrop-blur-sm border border-gold-300/15 rounded-xl p-2 sm:p-3 shadow-sm">
              <span className="font-serif text-xl sm:text-2xl font-semibold text-gold-600">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-gold-500 font-bold mt-0.5">Seg</span>
            </div>
          </motion.div>
        )}

        {/* Scroll button */}
        <motion.button 
          onClick={() => scrollToSection('evento')}
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut" }}
          className="mt-2 text-gold-600/80 hover:text-gold-800 flex flex-col items-center gap-1 text-[10px] tracking-widest cursor-pointer uppercase select-none font-sans font-semibold"
        >
          <span>Ver Detalhes</span>
          <ChevronDown size={14} className="text-gold-500" />
        </motion.button>

      </div>
    </section>
  );
}
