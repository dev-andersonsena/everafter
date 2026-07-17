import { useState, useEffect } from 'react';
import { Menu, X, Heart, Shield, Sparkles, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Hero from './components/Hero';
import Details from './components/Details';
import RSVP from './components/RSVP';
import Gifts from './components/Gifts';
import MusicPlayer from './components/MusicPlayer';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import CheckInPortal from './components/CheckInPortal';
import StandaloneRSVP from './components/StandaloneRSVP';
import RSVPSuccess from './components/RSVPSuccess';
import VoiceChatbot from './components/VoiceChatbot';
import { Guest } from './types';

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Custom Dynamic State Manager
  const [guest, setGuest] = useState<Guest | null>(null);
  const [rsvpSuccessGuest, setRsvpSuccessGuest] = useState<Guest | null>(null);
  const [viewMode, setViewMode] = useState<'invite' | 'admin' | 'recepcao' | 'rsvp' | 'rsvp_success'>('invite');
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_authenticated') === 'true' : false;
  });
  const [isRecepcaoLoggedIn, setIsRecepcaoLoggedIn] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('recepcao_authenticated') === 'true' : false;
  });

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

  // Parse URL routing triggers
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const guestId = params.get('i') || params.get('invite');
    const isAdmin = params.get('admin') === 'true';
    const isRecepcao = params.get('recepcao') === 'true' || params.get('checkin') === 'true';
    const isRsvp = params.get('rsvp') === 'new';

    if (isAdmin) {
      setViewMode('admin');
    } else if (isRecepcao) {
      setViewMode('recepcao');
    } else if (isRsvp) {
      setViewMode('rsvp');
    } else if (guestId) {
      setLoadingGuest(true);
      fetch(`/api/guests/${guestId}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Convidado não encontrado');
        })
        .then((data) => {
          setGuest(data);
        })
        .catch((err) => {
          console.warn("Nenhum convite correspondente ao token ativo no banco.", err);
        })
        .finally(() => {
          setLoadingGuest(false);
        });
    }
  }, []);

  // Orchestrate floating MusicPlayer and VoiceChatbot
  const [musicState, setMusicState] = useState<'initial' | 'hidden' | 'beside'>('initial');
  const [chatbotVisible, setChatbotVisible] = useState<boolean>(false);

  useEffect(() => {
    let t1: NodeJS.Timeout;
    let t2: NodeJS.Timeout;
    let loopTimeout: NodeJS.Timeout;

    // Phase 1: MusicPlayer is initially visible for 5s (0s-5s). Chatbot is hidden.
    
    // Phase 2: At 5s, MusicPlayer disappears, and VoiceChatbot appears in its place.
    t1 = setTimeout(() => {
      setMusicState('hidden');
      setChatbotVisible(true);

      // Phase 3: At 7s (after a 2s gap), MusicPlayer appears beside the Chatbot for 5s.
      t2 = setTimeout(() => {
        setMusicState('beside');
        let isMusicCurrentlyVisible = true;

        // Loop: Keep appearing beside Chatbot for 5s, then hide for 30s, and repeat.
        const runLoop = () => {
          if (isMusicCurrentlyVisible) {
            setMusicState('hidden');
            isMusicCurrentlyVisible = false;
            loopTimeout = setTimeout(runLoop, 30000); // Hide for 30s
          } else {
            setMusicState('beside');
            isMusicCurrentlyVisible = true;
            loopTimeout = setTimeout(runLoop, 5000); // Show beside for 5s
          }
        };

        // Schedule next change (hide) in 5s
        loopTimeout = setTimeout(runLoop, 5000);
      }, 2000);
    }, 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(loopTimeout);
    };
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (id === 'rsvp') {
      setViewMode('rsvp');
      window.history.pushState({}, '', '?rsvp=new');
      return;
    }
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

  if (viewMode === 'admin') {
    if (!isAdminLoggedIn) {
      return (
        <AdminLogin 
          onLoginSuccess={() => setIsAdminLoggedIn(true)} 
          onClose={() => setViewMode('invite')} 
        />
      );
    }
    return (
      <AdminDashboard 
        onClose={() => setViewMode('invite')} 
        onLogout={() => {
          setIsAdminLoggedIn(false);
          setViewMode('invite');
        }}
      />
    );
  }

  if (viewMode === 'recepcao') {
    if (!isRecepcaoLoggedIn) {
      return (
        <AdminLogin 
          onLoginSuccess={() => setIsRecepcaoLoggedIn(true)} 
          onClose={() => setViewMode('invite')} 
          isRecepcao={true}
        />
      );
    }
    return (
      <CheckInPortal 
        onClose={() => setViewMode('invite')} 
        onLogout={() => {
          setIsRecepcaoLoggedIn(false);
          localStorage.removeItem('recepcao_authenticated');
          setViewMode('invite');
        }}
      />
    );
  }

  if (viewMode === 'rsvp') {
    return (
      <StandaloneRSVP 
        onClose={() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          setViewMode('invite');
        }} 
        onSuccess={(newGuest) => {
          setGuest(newGuest);
          setRsvpSuccessGuest(newGuest);
          setViewMode('rsvp_success');
        }}
      />
    );
  }

  if (viewMode === 'rsvp_success' && rsvpSuccessGuest) {
    return (
      <RSVPSuccess 
        guest={rsvpSuccessGuest} 
        onClose={() => {
          setRsvpSuccessGuest(null);
          setViewMode('invite');
          window.history.replaceState({}, document.title, window.location.pathname);
        }} 
      />
    );
  }

  return (
    <div id="app-root" className="min-h-screen bg-gold-50 font-sans text-gold-950 antialiased selection:bg-gold-200 selection:text-gold-950">
      

      {/* Navigation Header */}
      <header
        id="main-navigation"
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled 
            ? 'bg-gold-50/95 backdrop-blur-md border-b border-gold-200/20 py-3 shadow-sm' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          
          {/* Initials Logo */}
          <button 
            onClick={() => scrollToSection('inicio')}
            className={`font-serif font-medium text-sm tracking-[0.25em] uppercase cursor-pointer select-none transition-colors duration-300 ${
              isScrolled ? 'text-gold-800 hover:text-gold-950' : 'text-gold-700 hover:text-gold-900'
            }`}
          >
            A <span className="font-handwriting text-base text-gold-500 lowercase font-normal normal-case italic">e</span> H
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`font-sans text-xs uppercase tracking-widest font-semibold cursor-pointer select-none relative py-1 transition-colors duration-300 ${
                  isScrolled 
                    ? 'text-gold-700 hover:text-gold-900' 
                    : 'text-gold-600/90 hover:text-gold-800'
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
              isScrolled ? 'text-gold-800' : 'text-gold-600'
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
            className="fixed top-[52px] left-0 right-0 z-35 bg-gold-50 border-b border-gold-200/20 shadow-xl overflow-hidden md:hidden font-sans"
          >
            <nav className="flex flex-col p-6 space-y-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-left text-gold-800 hover:text-gold-600 font-semibold text-sm py-2 tracking-wider uppercase cursor-pointer"
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
        <RSVP 
          guest={guest} 
          onRsvpSubmit={(updated) => {
            setGuest(updated);
            if (updated && updated.confirmado === true) {
              setRsvpSuccessGuest(updated);
              setViewMode('rsvp_success');
            }
          }} 
          onRequestStandaloneRSVP={() => {
            setViewMode('rsvp');
            window.history.pushState({}, '', '?rsvp=new');
          }}
        />
      </main>

      {/* Elegant, Sweet Footer */}
      <footer id="app-footer" className="bg-gold-100/50 py-16 text-center border-t border-gold-200/30 px-4 font-sans text-xs text-gold-700">
        <div className="max-w-md mx-auto flex flex-col items-center gap-4">
          <Heart size={16} className="text-gold-500 fill-current animate-pulse mb-1" />
          <p className="font-serif uppercase tracking-[0.18em] text-gold-800 text-sm font-medium">Alana &amp; Henderson</p>
          <p className="tracking-wider">Feito com amor • 07 de Setembro de 2026</p>
          
          {/* Admin and Reception Desk Shortcuts */}
          <div className="flex gap-4 items-center justify-center pt-6 border-t border-gold-200/40 w-full mt-4 text-[10px] uppercase tracking-widest font-semibold text-gold-600">
            <button 
              onClick={() => setViewMode('admin')} 
              className="hover:text-gold-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Shield size={12} />
              Painel Noivos (Admin)
            </button>
            <span>•</span>
            <button 
              onClick={() => setViewMode('recepcao')} 
              className="hover:text-gold-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CheckSquare size={12} />
              Portaria (Check-In)
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Music Controller */}
      <MusicPlayer displayState={musicState} />

      {/* Floating Voice Assistant Chatbot */}
      <VoiceChatbot visible={chatbotVisible} />

    </div>
  );
}
