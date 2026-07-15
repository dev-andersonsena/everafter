import React, { useState, useEffect } from 'react';
import { Heart, CheckCircle2, Clock, ArrowLeft, Sparkles, AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Guest } from '../types';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';

interface RSVPSuccessProps {
  guest: Guest;
  onClose: () => void;
}

export default function RSVPSuccess({ guest, onClose }: RSVPSuccessProps) {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    // Start 30 seconds countdown as requested by the user
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose(); // Auto redirect to main page
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-x-hidden bg-watercolor px-4 py-16">
      
      {/* High-fidelity Vector Representation of the custom Alana & Henderson Monogram Logo in the Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] sm:opacity-[0.08] pointer-events-none select-none z-0 overflow-hidden">
        <svg viewBox="0 0 500 500" className="w-[85vw] h-[85vw] max-w-[550px] max-h-[550px] text-gold-700 stroke-current fill-none">
          {/* Inner dashed ellipse */}
          <ellipse cx="250" cy="235" rx="145" ry="175" strokeWidth="1.5" strokeDasharray="4 3" />
          {/* Outer elegant solid ellipse */}
          <ellipse cx="250" cy="235" rx="153" ry="183" strokeWidth="2" />
          
          {/* Top/Bottom Leafy branch motifs mirroring the uploaded image */}
          <g strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold-600">
            {/* Top accent */}
            <path d="M 250 40 C 255 45, 262 45, 265 40 C 262 35, 255 35, 250 40 Z" fill="currentColor" />
            <path d="M 250 40 C 245 45, 238 45, 235 40 C 238 35, 245 35, 250 40 Z" fill="currentColor" />
            
            {/* Left accent leaf */}
            <path d="M 85 235 C 80 230, 80 223, 85 220 C 90 223, 90 230, 85 235 Z" fill="currentColor" />
            
            {/* Right accent leaf */}
            <path d="M 415 235 C 420 230, 420 223, 415 220 C 410 223, 410 230, 415 235 Z" fill="currentColor" />

            {/* Bottom beautiful petal loop */}
            <path d="M 250 425 C 247 433, 240 435, 236 430 C 240 423, 247 421, 250 425" fill="currentColor" />
            <path d="M 250 425 C 253 433, 260 435, 264 430 C 260 423, 253 421, 250 425" fill="currentColor" />
          </g>

          {/* Centered Serif Logo letters "A & H" */}
          <text x="175" y="260" fontFamily="'Playfair Display', 'Didot', 'Georgia', serif" fontSize="105" fill="currentColor" stroke="none" fontWeight="300">A</text>
          <text x="238" y="278" fontFamily="'Playfair Display', 'Didot', 'Georgia', serif" fontSize="62" fill="currentColor" stroke="none" fontWeight="300" fontStyle="italic" className="opacity-80">&amp;</text>
          <text x="278" y="302" fontFamily="'Playfair Display', 'Didot', 'Georgia', serif" fontSize="105" fill="currentColor" stroke="none" fontWeight="300">H</text>

          {/* Subtexts under the logo frame */}
          <text x="250" y="455" textAnchor="middle" fontFamily="'Inter', sans-serif" fontSize="14" fill="currentColor" stroke="none" letterSpacing="6" fontWeight="600" className="uppercase">Alana &amp; Henderson</text>
          <text x="250" y="478" textAnchor="middle" fontFamily="'Inter', sans-serif" fontSize="10" fill="currentColor" stroke="none" letterSpacing="4" fontWeight="500" className="uppercase opacity-75">Para Sempre</text>
        </svg>
      </div>

      {/* Floating floral/peachy leaf particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              y: -50, 
              x: Math.random() * 400 - 200, 
              rotate: 0,
              scale: Math.random() * 0.4 + 0.2
            }}
            animate={{ 
              opacity: [0, 0.5, 0.5, 0],
              y: '110vh',
              x: `calc(100% + ${Math.random() * 120 - 60}px)`,
              rotate: 360
            }}
            transition={{
              duration: Math.random() * 12 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5
            }}
            className="absolute top-0 left-1/2 w-4 h-4 rounded-tl-full rounded-br-full bg-gold-400/20 border border-gold-500/10"
            style={{ left: `${Math.random() * 100}%` }}
          />
        ))}
      </div>

      <div className="relative z-20 w-full max-w-[500px] flex flex-col items-center">
        
        {/* Outer card with subtle glassmorphism overlay */}
        <motion.div
          key="rsvp-success-card"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full bg-white/75 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-white/60 shadow-2xl flex flex-col items-center text-center text-gold-900 relative overflow-hidden"
        >
          {/* Card background subtle decoration */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-gold-300/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-gold-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Icon Badge */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 text-green-600 border border-green-200 mb-6 shadow-md"
          >
            <CheckCircle2 size={40} className="text-green-500" />
          </motion.div>

          {/* Monogram Logo in the Header of the Card itself */}
          <div className="mb-4">
            <svg viewBox="0 0 200 200" className="w-16 h-16 text-gold-500 fill-none stroke-current mx-auto">
              <ellipse cx="100" cy="95" rx="55" ry="65" strokeWidth="1" strokeDasharray="3 2" className="text-gold-400/30" />
              <ellipse cx="100" cy="95" rx="52" ry="62" strokeWidth="1" className="text-gold-500/60" />
              
              <text x="69" y="105" fontFamily="var(--font-serif)" fontSize="40" fill="currentColor" stroke="none" fontWeight="300" className="text-gold-700">A</text>
              <text x="96" y="112" fontFamily="var(--font-serif)" fontSize="26" fill="currentColor" stroke="none" fontWeight="300" fontStyle="italic" className="text-gold-500">&amp;</text>
              <text x="111" y="122" fontFamily="var(--font-serif)" fontSize="40" fill="currentColor" stroke="none" fontWeight="300" className="text-gold-700">H</text>
            </svg>
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl text-gold-900 font-bold mb-2">
            Presença Confirmada!
          </h3>
          <p className="font-serif italic text-gold-600 text-sm mb-6 max-w-sm">
            Obrigado por registrar sua presença. Sua participação tornará o nosso dia ainda mais inesquecível!
          </p>

          {/* Detailed confirmation panel */}
          <div className="w-full bg-gold-50/60 border border-gold-200/50 rounded-2xl p-5 mb-6 text-left space-y-4 text-xs font-sans shadow-sm">
            <div>
              <p className="text-gold-500 uppercase tracking-widest text-[9px] font-bold">Convidado Principal</p>
              <p className="font-serif text-base text-gold-900 mt-0.5 font-bold">{guest.nome}</p>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-3 border-t border-gold-200/30">
              <div>
                <p className="text-gold-500 uppercase tracking-widest text-[9px] font-bold">Acompanhantes</p>
                <p className="text-gold-900 font-bold mt-0.5 text-xs">
                  {guest.acompanhantes} {guest.acompanhantes === 1 ? 'acompanhante' : 'acompanhantes'}
                </p>
              </div>
              <div>
                <p className="text-gold-500 uppercase tracking-widest text-[9px] font-bold">Status do Convite</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 rounded-full px-2.5 py-0.5 mt-0.5">
                  Confirmado
                </span>
              </div>
            </div>

            {guest.acompanhantes_nomes && guest.acompanhantes_nomes.length > 0 && (
              <div className="pt-3 border-t border-gold-200/30">
                <p className="text-gold-500 uppercase tracking-widest text-[9px] font-bold mb-1.5">Acompanhantes Confirmados</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {guest.acompanhantes_nomes.map((cName, idx) => (
                    <span key={idx} className="bg-white border border-gold-200/50 rounded-lg px-2.5 py-1 text-[10px] text-gold-800 font-medium">
                      {cName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {guest.restricao_alimentar && (
              <div className="pt-3 border-t border-gold-200/30 text-xs">
                <p className="text-gold-500 uppercase tracking-widest text-[9px] font-bold mb-1">Restrições Alimentares</p>
                <p className="text-gold-800 font-serif font-medium">{guest.restricao_alimentar}</p>
              </div>
            )}
            
            {guest.mesa && (
              <div className="pt-3 border-t border-gold-200/30 flex items-center gap-1.5 text-xs text-gold-600 font-bold">
                <span>📍 Mesa designada:</span>
                <strong className="font-serif font-bold text-sm text-gold-800">{guest.mesa}</strong>
              </div>
            )}
          </div>

          {/* Add to Calendar / Lembretes */}
          <div className="w-full bg-stone-50 border border-stone-200/40 rounded-2xl p-4 mb-6 text-center shadow-sm">
            <span className="text-[10px] font-sans uppercase tracking-widest text-gold-600 font-extrabold mb-1.5 block">
              🔔 ALERTAS
            </span>
            <p className="text-stone-800 font-serif text-xs font-semibold mb-1">
              LISTA DE DIAS INCLUSO:
            </p>
            <p className="text-[10px] font-sans text-stone-500 mb-3 leading-relaxed">
              <strong>45, 30, 7, 5 e 2 dias antes</strong> + <strong>no dia exato</strong>.<br />
              <span className="text-amber-600 font-bold block mt-1.5 text-center">
                agende
              </span>
            </p>
            <div className="flex gap-2 justify-center flex-wrap sm:flex-nowrap">
              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 bg-white hover:bg-gold-50/50 border border-stone-200 text-stone-800 hover:text-gold-900 hover:border-gold-300 rounded-xl text-[11px] font-sans font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Calendar size={13} className="text-gold-600" />
                Google Agenda
              </a>
              <button
                onClick={downloadIcsFile}
                className="flex-1 py-2 px-3 bg-white hover:bg-gold-50/50 border border-stone-200 text-stone-800 hover:text-gold-900 hover:border-gold-300 rounded-xl text-[11px] font-sans font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Calendar size={13} className="text-gold-600" />
                Apple / Outlook
              </button>
            </div>
          </div>

          {/* Countdown indicator with animated progress */}
          <div className="w-full flex flex-col items-center justify-center py-3 bg-gold-500/5 rounded-2xl border border-gold-200/30 gap-1 mb-6">
            <div className="flex items-center gap-2 text-gold-700 font-semibold text-xs uppercase tracking-widest">
              <Clock size={13} className="animate-spin text-gold-500" style={{ animationDuration: '4s' }} />
              <span>Redirecionando em {countdown}s</span>
            </div>
            
            {/* Visual countdown progress line bar */}
            <div className="w-4/5 h-[3px] bg-gold-200/40 rounded-full overflow-hidden mt-1.5">
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 30, ease: 'linear' }}
                className="h-full bg-gold-500 rounded-full"
              />
            </div>
          </div>

          {/* Return immediately button */}
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 bg-gold-600 hover:bg-gold-700 text-white font-serif font-bold text-xs tracking-widest uppercase rounded-2xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowLeft size={13} className="text-white" />
            <span>Voltar Agora</span>
          </motion.button>

        </motion.div>
      </div>
    </div>
  );
}
