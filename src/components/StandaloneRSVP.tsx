import React, { useState } from 'react';
import { Heart, User, Users, Mail, Phone, MessageSquare, ArrowLeft, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Guest } from '../types';
import Logo from './Logo';

interface StandaloneRSVPProps {
  onClose: () => void;
  onSuccess: (newGuest: Guest) => void;
}

export default function StandaloneRSVP({ onClose, onSuccess }: StandaloneRSVPProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companionCount, setCompanionCount] = useState(0);
  const [companions, setCompanions] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [message, setMessage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successGuest, setSuccessGuest] = useState<Guest | null>(null);

  const handleCompanionCountChange = (count: number) => {
    setCompanionCount(count);
    if (count > companions.length) {
      const needed = count - companions.length;
      setCompanions([...companions, ...Array(needed).fill('')]);
    } else {
      setCompanions(companions.slice(0, count));
    }
  };

  const handleCompanionNameChange = (index: number, val: string) => {
    const updated = [...companions];
    updated[index] = val;
    setCompanions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor, preencha o seu nome completo.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }
    if (!phone.trim()) {
      setError('Por favor, insira um número de telefone/WhatsApp.');
      return;
    }

    // Validate companions
    if (companionCount > 0) {
      const incomplete = companions.some(c => !c.trim());
      if (incomplete) {
        setError('Por favor, preencha o nome de todos os seus acompanhantes.');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch('/api/guests/public-rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: name.trim(),
          email: email.trim(),
          telefone: phone.trim(),
          acompanhantes: companionCount,
          acompanhantes_nomes: companions.filter(c => c.trim()),
          restricao_alimentar: dietaryRestrictions.trim(),
          mensagem: message.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessGuest(data);
        onSuccess(data);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao salvar sua confirmação de presença.');
      }
    } catch (err) {
      setError('Erro de conexão ao enviar dados. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-x-hidden bg-watercolor px-4 py-16">
      {/* Background radial soft light blobs */}
      <div className="absolute top-1/6 left-1/5 w-80 h-80 bg-gold-200/40 rounded-full filter blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/6 right-1/5 w-96 h-96 bg-gold-300/35 rounded-full filter blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '3s' }} />

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
              duration: Math.random() * 14 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 6
            }}
            className="absolute top-0 left-1/2 w-4 h-4 rounded-tl-full rounded-br-full bg-gold-400/20 border border-gold-500/10"
            style={{ left: `${Math.random() * 100}%` }}
          />
        ))}
      </div>

      {/* Standalone Header Back Button */}
      <button
        onClick={onClose}
        className="absolute top-6 left-6 flex items-center gap-2 text-gold-800 hover:text-gold-950 text-xs uppercase tracking-widest font-bold cursor-pointer transition-all z-30 bg-white/50 hover:bg-white/80 py-2.5 px-5 rounded-full border border-gold-200/50 backdrop-blur-sm shadow-sm"
      >
        <ArrowLeft size={14} />
        Ver Convite Completo
      </button>

      <AnimatePresence mode="wait">
        {!successGuest ? (
          /* RSVP ENTRY FORM */
          <motion.div
            key="rsvp-entry-container"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative z-20 w-full max-w-[550px] bg-white/70 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-white/60 shadow-2xl flex flex-col"
          >
            {/* Elegant Emblem & Monogram header */}
            <div className="w-full flex flex-col items-center mb-4">
              <Logo size="md" className="-mt-2" />
              
              <h2 className="font-serif text-2xl sm:text-3xl text-gold-900 mt-2 tracking-wide font-bold">
                Confirmar Presença
              </h2>
              <p className="text-gold-600/80 text-[11px] mt-1.5 uppercase tracking-widest font-bold font-sans">
                Casamento de Alana & Henderson
              </p>
              <div className="w-12 h-[1px] bg-gold-300 mx-auto mt-3" />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mb-6 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl font-medium"
              >
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 font-sans">
              {/* Name */}
              <div>
                <label className="block text-gold-800 text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5">
                  <User size={13} className="text-gold-500" />
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={loading}
                  className="w-full bg-white/80 border border-gold-200/80 rounded-2xl py-3 px-4 text-gold-950 text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-400/20 transition-all font-medium placeholder:text-gold-400/60"
                />
              </div>

              {/* Grid with Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gold-800 text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5">
                    <Mail size={13} className="text-gold-500" />
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    disabled={loading}
                    className="w-full bg-white/80 border border-gold-200/80 rounded-2xl py-3 px-4 text-gold-950 text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-400/20 transition-all font-medium placeholder:text-gold-400/60"
                  />
                </div>
                <div>
                  <label className="block text-gold-800 text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5">
                    <Phone size={13} className="text-gold-500" />
                    WhatsApp / Celular *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(99) 99999-9999"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (error) setError('');
                    }}
                    disabled={loading}
                    className="w-full bg-white/80 border border-gold-200/80 rounded-2xl py-3 px-4 text-gold-950 text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-400/20 transition-all font-medium placeholder:text-gold-400/60"
                  />
                </div>
              </div>

              {/* Message to the couple (Optional) */}
              <div>
                <label className="block text-gold-800 text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-gold-500" />
                  Mensagem para os Noivos (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Deixe um carinho em palavras para Henderson & Alana..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                  className="w-full bg-white/80 border border-gold-200/80 rounded-2xl py-3 px-4 text-gold-950 text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-400/20 transition-all resize-none font-medium placeholder:text-gold-400/60"
                />
              </div>

              {/* Submit Action */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-4 bg-gold-600 hover:bg-gold-700 text-white font-serif font-bold text-sm tracking-wider uppercase rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enviando Resposta...</span>
                  </div>
                ) : (
                  <>
                    <Heart size={15} fill="currentColor" className="text-white" />
                    <span>Confirmar Presença</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        ) : (
          /* SUCCESS SCREEN */
          <motion.div
            key="rsvp-success-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-20 w-full max-w-[480px] bg-white/70 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-white/60 shadow-2xl flex flex-col items-center text-center text-gold-900"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 text-green-600 border border-green-200 mb-6 shadow-sm">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>

            <h3 className="font-serif text-2xl text-gold-900 font-bold mb-2">Presença Confirmada!</h3>
            <p className="font-serif italic text-gold-600 text-base mb-6">
              Obrigado por celebrar esse momento conosco!
            </p>

            <div className="w-full bg-gold-50/50 border border-gold-200/50 rounded-2xl p-5 mb-8 text-left space-y-3.5 text-xs font-sans">
              <div>
                <p className="text-gold-500 uppercase tracking-widest text-[9px] font-bold">Convidado Principal</p>
                <p className="font-serif text-base text-gold-800 mt-0.5 font-bold">{successGuest.nome}</p>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-3 border-t border-gold-200/30">
                <div>
                  <p className="text-gold-500 uppercase tracking-widest text-[9px] font-bold">Acompanhantes</p>
                  <p className="text-gold-800 font-bold mt-0.5">{successGuest.acompanhantes} {successGuest.acompanhantes === 1 ? 'pessoa' : 'pessoas'}</p>
                </div>
                <div>
                  <p className="text-gold-500 uppercase tracking-widest text-[9px] font-bold">Status</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 border border-green-100 rounded-full px-2.5 py-0.5 mt-0.5">
                    Confirmado
                  </span>
                </div>
              </div>

              {successGuest.acompanhantes_nomes && successGuest.acompanhantes_nomes.length > 0 && (
                <div className="pt-3 border-t border-gold-200/30">
                  <p className="text-gold-500 uppercase tracking-widest text-[9px] font-bold mb-1">Nomes dos Acompanhantes</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {successGuest.acompanhantes_nomes.map((cName, idx) => (
                      <span key={idx} className="bg-white border border-gold-200/60 rounded-lg px-2.5 py-1 text-[10px] text-gold-800 font-medium">
                        {cName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 bg-gold-600 hover:bg-gold-700 text-white font-serif font-bold text-xs tracking-widest uppercase rounded-2xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles size={13} className="text-white" />
              <span>Ver Convite Completo</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
