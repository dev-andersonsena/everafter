import React, { useState, useEffect } from 'react';
import { Check, Heart, User, Users, Calendar, AlertCircle, MessageSquare, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RSVPResponse } from '../types';

export default function RSVP() {
  const [rsvp, setRsvp] = useState<RSVPResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [isAttending, setIsAttending] = useState<boolean | null>(null);
  const [companionCount, setCompanionCount] = useState(0);
  const [companions, setCompanions] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Load RSVP from localStorage on mount
    const savedRSVP = localStorage.getItem('henderson_alana_wedding_rsvp');
    if (savedRSVP) {
      try {
        const parsed = JSON.parse(savedRSVP) as RSVPResponse;
        setRsvp(parsed);
        // Pre-populate form states
        setFullName(parsed.fullName);
        setIsAttending(parsed.isAttending);
        setCompanionCount(parsed.companionCount);
        setCompanions(parsed.companions);
        setPhone(parsed.phone || '');
        setDietaryRestrictions(parsed.dietaryRestrictions || '');
        setMessage(parsed.message || '');
      } catch (err) {
        console.error('Error loading local RSVP:', err);
      }
    }
  }, []);

  const handleCompanionCountChange = (count: number) => {
    setCompanionCount(count);
    // Expand or shrink companions array
    if (count > companions.length) {
      const needed = count - companions.length;
      setCompanions([...companions, ...Array(needed).fill('')]);
    } else {
      setCompanions(companions.slice(0, count));
    }
  };

  const handleCompanionNameChange = (index: number, name: string) => {
    const updated = [...companions];
    updated[index] = name;
    setCompanions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Por favor, informe seu nome completo.');
      return;
    }

    if (isAttending === null) {
      setError('Por favor, confirme se você comparecerá ao evento.');
      return;
    }

    // Validate companion names if attending and has companions
    if (isAttending && companionCount > 0) {
      const incomplete = companions.some(c => !c.trim());
      if (incomplete) {
        setError('Por favor, preencha o nome de todos os seus acompanhantes.');
        return;
      }
    }

    setLoading(true);

    // Simulate small API delay for polished UX
    setTimeout(() => {
      const response: RSVPResponse = {
        id: rsvp?.id || 'rsvp_' + Math.random().toString(36).substr(2, 9),
        fullName: fullName.trim(),
        isAttending,
        companionCount: isAttending ? companionCount : 0,
        companions: isAttending ? companions.filter(c => c.trim()) : [],
        phone: phone.trim() || undefined,
        dietaryRestrictions: dietaryRestrictions.trim() || undefined,
        message: message.trim() || undefined,
        submittedAt: new Date().toISOString()
      };

      localStorage.setItem('henderson_alana_wedding_rsvp', JSON.stringify(response));
      setRsvp(response);
      setIsEditing(false);
      setLoading(false);
    }, 1200);
  };

  const handleDelete = () => {
    if (confirm('Tem certeza de que deseja remover sua confirmação de presença?')) {
      localStorage.removeItem('henderson_alana_wedding_rsvp');
      setRsvp(null);
      // Reset form states
      setFullName('');
      setIsAttending(null);
      setCompanionCount(0);
      setCompanions([]);
      setPhone('');
      setDietaryRestrictions('');
      setMessage('');
      setIsEditing(false);
    }
  };

  return (
    <section id="rsvp" className="py-20 sm:py-28 bg-stone-900 px-4 text-stone-200">
      <div className="max-w-3xl mx-auto">
        
        {/* Header section */}
        <div className="text-center mb-16">
          <span className="text-gold-300 uppercase tracking-[0.2em] text-xs font-semibold block mb-3">RSVP</span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-stone-100 tracking-tight">Confirmar Presença</h2>
          <div className="w-16 h-[1px] bg-gold-400 mx-auto mt-4" />
          <p className="text-stone-400 font-sans text-sm sm:text-base max-w-md mx-auto mt-4 leading-relaxed">
            Por favor, confirme sua presença até o dia <span className="text-gold-200 font-medium">10 de Setembro de 2026</span> para planejarmos cada detalhe com muito amor.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {rsvp && !isEditing ? (
            
            /* SUCCESS / CONFIRMED CARD */
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6 }}
              className="bg-stone-950/50 border border-gold-300/10 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xl relative overflow-hidden"
            >
              {/* Soft decorative elements */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-gold-400/5 rounded-full filter blur-3xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full filter blur-3xl" />

              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-100/10 text-gold-300 mb-6 border border-gold-300/20">
                <Heart size={28} className="fill-current animate-pulse text-gold-400" />
              </div>

              <h3 className="font-serif text-2xl text-stone-100 mb-2">Presença Confirmada!</h3>
              <p className="text-stone-400 text-sm mb-8 font-sans">Obrigado por responder ao nosso convite especial.</p>

              <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6 mb-8 text-left space-y-4 font-sans text-sm">
                <div>
                  <p className="text-stone-500 text-xs uppercase tracking-widest">Convidado</p>
                  <p className="font-serif text-lg text-gold-200 mt-0.5">{rsvp.fullName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-800/60">
                  <div>
                    <p className="text-stone-500 text-xs uppercase tracking-widest">Presença</p>
                    <p className={`font-serif text-base mt-0.5 font-medium ${rsvp.isAttending ? 'text-green-400' : 'text-red-400'}`}>
                      {rsvp.isAttending ? 'Sim, comparecerei!' : 'Infelizmente não poderei'}
                    </p>
                  </div>

                  {rsvp.isAttending && (
                    <div>
                      <p className="text-stone-500 text-xs uppercase tracking-widest">Acompanhantes</p>
                      <p className="font-serif text-base mt-0.5 text-stone-200 font-medium">{rsvp.companionCount}</p>
                    </div>
                  )}
                </div>

                {rsvp.isAttending && rsvp.companionCount > 0 && (
                  <div className="pt-3 border-t border-stone-800/60">
                    <p className="text-stone-500 text-xs uppercase tracking-widest mb-1">Nomes dos acompanhantes</p>
                    <ul className="list-disc pl-4 text-xs text-stone-300 space-y-1 font-serif">
                      {rsvp.companions.map((comp, idx) => (
                        <li key={idx}>{comp}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {rsvp.message && (
                  <div className="pt-3 border-t border-stone-800/60">
                    <p className="text-stone-500 text-xs uppercase tracking-widest mb-1">Seu recado aos noivos</p>
                    <p className="text-stone-300 italic text-xs font-serif leading-relaxed">"{rsvp.message}"</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gold-300/20 hover:border-gold-300/40 text-gold-300 text-xs uppercase tracking-wider font-medium cursor-pointer transition-colors"
                >
                  <Edit2 size={13} />
                  Alterar Resposta
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/10 hover:border-red-500/30 text-red-400 text-xs uppercase tracking-wider font-medium cursor-pointer transition-colors"
                >
                  <Trash2 size={13} />
                  Remover
                </motion.button>
              </div>

            </motion.div>
          ) : (
            
            /* RSVP FORM */
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-stone-950/30 border border-gold-300/10 rounded-3xl p-6 sm:p-10 shadow-xl max-w-xl mx-auto font-sans"
            >
              <div className="space-y-6">
                
                {/* Error Banner */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-4 rounded-xl"
                  >
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Name */}
                <div>
                  <label htmlFor="fullname" className="block text-stone-300 text-xs uppercase tracking-widest font-semibold mb-2">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      id="fullname"
                      type="text"
                      placeholder="Como está escrito em seu convite"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading}
                      className="w-full bg-stone-900/60 border border-stone-800 rounded-xl py-3 pl-12 pr-4 text-stone-100 text-sm focus:outline-none focus:border-gold-300 focus:ring-1 focus:ring-gold-300/20 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Confirm Presence Selection */}
                <div>
                  <label className="block text-stone-300 text-xs uppercase tracking-widest font-semibold mb-3">
                    Você comparecerá?
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAttending(true);
                        setError('');
                      }}
                      disabled={loading}
                      className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border text-sm font-medium tracking-wide transition-all duration-300 cursor-pointer ${
                        isAttending === true
                          ? 'bg-gold-500 text-white border-gold-400 shadow-md shadow-gold-500/10'
                          : 'bg-stone-900/40 border-stone-800 text-stone-400 hover:text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <Check size={16} />
                      Sim, com certeza!
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAttending(false);
                        handleCompanionCountChange(0);
                        setError('');
                      }}
                      disabled={loading}
                      className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border text-sm font-medium tracking-wide transition-all duration-300 cursor-pointer ${
                        isAttending === false
                          ? 'bg-stone-800 text-stone-200 border-stone-700 shadow-md'
                          : 'bg-stone-900/40 border-stone-800 text-stone-400 hover:text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      Infelizmente não poderei ir
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isAttending === true && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-6 overflow-hidden"
                    >
                      {/* Phone */}
                      <div>
                        <label htmlFor="phone" className="block text-stone-300 text-xs uppercase tracking-widest font-semibold mb-2">
                          Celular / WhatsApp
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          placeholder="(00) 00000-0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={loading}
                          className="w-full bg-stone-900/60 border border-stone-800 rounded-xl py-3 px-4 text-stone-100 text-sm focus:outline-none focus:border-gold-300 focus:ring-1 focus:ring-gold-300/20 transition-all duration-300"
                        />
                      </div>

                      {/* Companion Selector */}
                      <div>
                        <label className="block text-stone-300 text-xs uppercase tracking-widest font-semibold mb-3">
                          Levará acompanhantes? (Limites de convites individuais)
                        </label>
                        <div className="flex gap-2">
                          {[0, 1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleCompanionCountChange(num)}
                              disabled={loading}
                              className={`flex-1 py-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                                companionCount === num
                                  ? 'bg-stone-100 text-stone-950 border-white'
                                  : 'bg-stone-900/30 border-stone-800/80 text-stone-400 hover:text-stone-300'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Companion Names Sub-Form */}
                      {companionCount > 0 && (
                        <div className="space-y-3 bg-stone-900/30 border border-stone-800/50 p-4 rounded-xl">
                          <p className="text-xs text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-semibold">
                            <Users size={14} className="text-gold-300" />
                            Nome dos Acompanhantes
                          </p>
                          {companions.map((companion, idx) => (
                            <div key={idx} className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-serif font-semibold">
                                #{idx + 1}
                              </span>
                              <input
                                type="text"
                                placeholder={`Nome completo do acompanhante ${idx + 1}`}
                                value={companion}
                                onChange={(e) => handleCompanionNameChange(idx, e.target.value)}
                                disabled={loading}
                                className="w-full bg-stone-900/60 border border-stone-800 rounded-lg py-2.5 pl-10 pr-4 text-stone-100 text-xs focus:outline-none focus:border-gold-300 transition-all duration-300"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Dietary restrictions */}
                      <div>
                        <label htmlFor="dietary" className="block text-stone-300 text-xs uppercase tracking-widest font-semibold mb-2">
                          Restrição alimentar / Alergias (Opcional)
                        </label>
                        <input
                          id="dietary"
                          type="text"
                          placeholder="Ex: Vegetariano, Vegano, Sem Glúten, Alergia a camarão"
                          value={dietaryRestrictions}
                          onChange={(e) => setDietaryRestrictions(e.target.value)}
                          disabled={loading}
                          className="w-full bg-stone-900/60 border border-stone-800 rounded-xl py-3 px-4 text-stone-100 text-sm focus:outline-none focus:border-gold-300 transition-all duration-300"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Recado para os Noivos */}
                <div>
                  <label htmlFor="message" className="block text-stone-300 text-xs uppercase tracking-widest font-semibold mb-2 flex items-center gap-1">
                    <MessageSquare size={13} className="text-gold-300" />
                    Enviar mensagem aos noivos (Opcional)
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    placeholder="Deixe uma palavra de carinho ou felicitação para o nosso início de jornada!"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                    className="w-full bg-stone-900/60 border border-stone-800 rounded-xl py-3 px-4 text-stone-100 text-sm focus:outline-none focus:border-gold-300 transition-all duration-300 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 px-6 rounded-xl bg-gold-400 hover:bg-gold-500 text-stone-950 font-serif font-medium text-sm sm:text-base tracking-wide shadow-lg shadow-gold-500/10 cursor-pointer transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                        <span>Enviando confirmação...</span>
                      </div>
                    ) : (
                      <>
                        <Heart size={16} fill="currentColor" className="text-stone-950" />
                        <span>Confirmar Presença</span>
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Edit Mode Cancel */}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                    className="w-full py-2.5 text-stone-400 hover:text-stone-300 text-xs uppercase tracking-wider font-semibold cursor-pointer text-center"
                  >
                    Voltar / Cancelar Alteração
                  </button>
                )}

              </div>
            </motion.form>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
