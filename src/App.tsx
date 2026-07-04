import { useState, useEffect } from 'react';
import { Menu, X, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Hero from './components/Hero';
import Details from './components/Details';
import RSVP from './components/RSVP';
import Gifts from './components/Gifts';
import MusicPlayer from './components/MusicPlayer';

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { name: 'Início', id: 'inicio' },
    { name: 'O Evento', id: 'evento' },
    { name: 'Lista de Presentes', id: 'presentes' },
    { name: 'Confirmar Presença', id: 'rsvp' },
  ];

  return (
    <div id="app-root" className="min-h-screen bg-stone-900 font-sans text-stone-800 antialiased selection:bg-gold-200 selection:text-stone-900">
      
      {/* Navigation Header */}
      <header
        id="main-navigation"
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled 
            ? 'bg-white/85 backdrop-blur-md border-b border-gold-300/10 py-3 shadow-sm' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          
          {/* Initials Logo */}
          <button 
            onClick={() => scrollToSection('inicio')}
            className={`font-serif italic font-medium text-lg tracking-widest cursor-pointer select-none transition-colors duration-300 ${
              isScrolled ? 'text-stone-900' : 'text-gold-200'
            }`}
          >
            H <span className="text-xs">&</span> A
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`font-sans text-xs uppercase tracking-widest font-semibold cursor-pointer select-none relative py-1 transition-colors duration-300 ${
                  isScrolled 
                    ? 'text-stone-600 hover:text-stone-900' 
                    : 'text-stone-200/90 hover:text-white'
                }`}
              >
                {link.name}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-1.5 rounded-lg cursor-pointer transition-colors ${
              isScrolled ? 'text-stone-800' : 'text-gold-200'
            }`}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-[52px] left-0 right-0 z-35 bg-white border-b border-stone-100 shadow-xl overflow-hidden md:hidden font-sans"
          >
            <nav className="flex flex-col p-6 space-y-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-left text-stone-700 hover:text-gold-600 font-semibold text-sm py-2 tracking-wider uppercase cursor-pointer"
                >
                  {link.name}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Sections */}
      <main>
        {/* Hero Section */}
        <Hero />

        {/* Event Details Section */}
        <Details />

        {/* Gift List Section */}
        <Gifts />

        {/* RSVP Section */}
        <RSVP />
      </main>

      {/* Elegant, Sweet Footer */}
      <footer id="app-footer" className="bg-stone-950 py-12 text-center border-t border-gold-300/5 px-4 font-sans text-xs">
        <div className="max-w-md mx-auto flex flex-col items-center gap-4">
          <Heart size={16} className="text-gold-400 fill-current animate-pulse" />
          <p className="font-serif italic text-gold-200 text-base">Henderson & Alana</p>
          <p className="text-stone-500 tracking-wider">Feito com amor • 10 de Outubro de 2026</p>
        </div>
      </footer>

      {/* Floating Music Controller */}
      <MusicPlayer />

    </div>
  );
}
