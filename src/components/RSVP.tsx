import React, { useState, useEffect } from 'react';
import { Check, Heart, User, Users, AlertCircle, MessageSquare, Trash2, Edit2, Search, ArrowRight, Sparkles, QrCode, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Guest } from '../types';

interface RSVPProps {
  guest?: Guest | null;
  onRsvpSubmit?: (updatedGuest: Guest) => void;
}

export default function RSVP({ guest, onRsvpSubmit }: RSVPProps) {
  const [activeGuest, setActiveGuest] = useState<Guest | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Search Guest Flow State
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);

  // Form states
  const [isAttending, setIsAttending] = useState<boolean | null>(null);
  const [companionCount, setCompanionCount] = useState(0);
  const [companions, setCompanions] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Public Registration/QR Code states
  const [isPublicRegister, setIsPublicRegister] = useState(false);
  const [publicName, setPublicName] = useState('');
  const [publicEmail, setPublicEmail] = useState('');
  const [publicPhone, setPublicPhone] = useState('');

  // Handle URL parameters on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('rsvp') === 'new') {
      setIsPublicRegister(true);
      setTimeout(() => {
        const rsvpSec = document.getElementById('rsvp');
        if (rsvpSec) {
          rsvpSec.scrollIntoView({ behavior: 'smooth' });
        }
      }, 600);
    }
  }, []);

  // Sync with guest prop
  useEffect(() => {
    if (guest) {
      setActiveGuest(guest);
      prefillForm(guest);
    } else {
      setActiveGuest(null);
    }
  }, [guest]);

  const prefillForm = (g: Guest) => {
    setIsAttending(g.confirmado);
    setCompanionCount(g.confirmado ? g.acompanhantes : 0);
    setCompanions(g.confirmado ? g.acompanhantes_nomes : []);
    setDietaryRestrictions(g.restricao_alimentar || '');
    setMessage(g.mensagem || '');
    setIsEditing(g.confirmado === null); // edit by default if not answered yet
  };

  const handleCompanionCountChange = (count: number) => {
    setCompanionCount(count);
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

  // Name Search Flow
  const handleSearchInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setSearchResults([]);
    
    if (!searchName.trim() || searchName.trim().length < 3) {
      setSearchError('Por favor, digite ao menos 3 letras do seu nome.');
      return;
    }

    setSearching(true);
    try {
      const res = await fetch('/api/guests');
      if (res.ok) {
        const allGuests: Guest[] = await res.json();
        const query = searchName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        const filtered = allGuests.filter(g => {
          const normalizedGuestName = g.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return normalizedGuestName.includes(query);
        });

        if (filtered.length === 0) {
          setSearchError('Nenhum convite encontrado com este nome. Por favor, verifique a grafia ou entre em contato com os noivos.');
        } else {
          setSearchResults(filtered);
        }
      } else {
        setSearchError('Erro ao consultar a lista de convidados.');
      }
    } catch (err) {
      setSearchError('Erro de conexão ao buscar convite.');
    } finally {
      setSearching(false);
    }
  };

  const selectSearchedGuest = (g: Guest) => {
    setActiveGuest(g);
    prefillForm(g);
    setSearchName('');
    setSearchResults([]);
    
    // Log visit in database implicitly
    fetch(`/api/guests/${g.id}`).then(res => res.json()).then(updated => {
      setActiveGuest(updated);
      prefillForm(updated);
    }).catch(() => {});
  };

  // Submit RSVP to Postgres Backend API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!activeGuest) return;

    if (isAttending === null) {
      setError('Por favor, selecione se você comparecerá ao casamento.');
      return;
    }

    // Validate companions
    if (isAttending && companionCount > 0) {
      const incomplete = companions.some(c => !c.trim());
      if (incomplete) {
        setError('Por favor, informe o nome de todos os seus acompanhantes.');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/guests/${activeGuest.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmado: isAttending,
          acompanhantes: isAttending ? companionCount : 0,
          acompanhantes_nomes: isAttending ? companions.filter(c => c.trim()) : [],
          restricao_alimentar: isAttending ? dietaryRestrictions.trim() : "",
          mensagem: message.trim()
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setActiveGuest(updated);
        setIsEditing(false);
        if (onRsvpSubmit) onRsvpSubmit(updated);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao salvar sua confirmação de presença.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!publicName.trim()) {
      setError('Por favor, preencha o seu nome completo.');
      return;
    }
    if (!publicEmail.trim()) {
      setError('Por favor, preencha o seu e-mail.');
      return;
    }
    if (!publicPhone.trim()) {
      setError('Por favor, preencha o seu telefone.');
      return;
    }

    // Validate companions
    if (companionCount > 0) {
      const incomplete = companions.some(c => !c.trim());
      if (incomplete) {
        setError('Por favor, informe o nome de todos os seus acompanhantes.');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch('/api/guests/public-rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: publicName.trim(),
          email: publicEmail.trim(),
          telefone: publicPhone.trim(),
          acompanhantes: companionCount,
          acompanhantes_nomes: companions.filter(c => c.trim()),
          restricao_alimentar: dietaryRestrictions.trim(),
          mensagem: message.trim()
        })
      });

      if (res.ok) {
        const newGuest = await res.json();
        setActiveGuest(newGuest);
        setIsPublicRegister(false);
        setIsEditing(false);
        if (onRsvpSubmit) onRsvpSubmit(newGuest);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao registrar sua presença geral no banco.');
      }
    } catch (err) {
      setError('Erro de conexão ao enviar confirmação geral.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineOrDelete = async () => {
    if (!activeGuest) return;
    if (confirm('Deseja realmente remover ou alterar sua confirmação de presença?')) {
      setIsEditing(true);
      setIsAttending(null);
    }
  };

  // Generate companion buttons up to limit dynamically
  const getCompanionOptions = (limit: number) => {
    const options = [];
    for (let i = 0; i <= limit; i++) {
      options.push(i);
    }
    return options;
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
            Confirme sua presença para que possamos organizar tudo com carinho.
          </p>
        </div>

        <AnimatePresence mode="wait">
          
          {/* FLOW 1: SEARCH INVITE BY NAME OR SCAN QR CODE (IF GUEST NOT SELECTED AND NOT IN PUBLIC REGISTER FORM) */}
          {!activeGuest && !isPublicRegister && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch font-sans">
              
              {/* Option 1: Search name on official guest list */}
              <motion.div
                key="search-invite-column"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.3 }}
                className="bg-stone-950/30 border border-gold-300/10 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="text-center mb-6">
                    <div className="inline-flex p-3 bg-gold-400/5 text-gold-300 rounded-2xl border border-gold-400/10 mb-3">
                      <Search size={22} />
                    </div>
                    <h3 className="font-serif text-lg text-stone-100 font-bold">Localize seu Convite</h3>
                    <p className="text-stone-400 text-xs mt-1">Busque seu nome completo na lista de convidados pré-cadastrada pelos noivos.</p>
                  </div>

                  <form onSubmit={handleSearchInvite} className="space-y-4">
                    {searchError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-3 rounded-xl">
                        {searchError}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Nome completo (ex: Carlos Henrique)"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="flex-1 bg-stone-900/60 border border-stone-800 rounded-xl py-3 px-4 text-stone-100 text-xs focus:outline-none focus:border-gold-300 focus:ring-1 focus:ring-gold-300/10"
                      />
                      <button
                        type="submit"
                        disabled={searching}
                        className="px-4 bg-gold-400 hover:bg-gold-500 text-stone-950 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1"
                      >
                        {searching ? '...' : 'Buscar'}
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </form>

                  {/* Search Results list */}
                  {searchResults.length > 0 && (
                    <div className="mt-6 border-t border-stone-800/80 pt-4 space-y-2">
                      <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-2">Selecione seu nome da lista:</p>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {searchResults.map(result => (
                          <button
                            key={result.id}
                            onClick={() => selectSearchedGuest(result)}
                            className="w-full text-left p-3 rounded-xl border border-stone-850 bg-stone-950/45 text-stone-200 text-xs hover:border-gold-400/35 hover:text-white transition-colors cursor-pointer flex justify-between items-center"
                          >
                            <span className="font-serif font-semibold">{result.nome}</span>
                            <span className="text-[9px] text-stone-400 font-mono">
                              {result.confirmado !== null ? 'Visualizar Confirmação' : 'Confirmar Presença'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Option 2: General QR Code RSVP */}
              <motion.div
                key="qrcode-invite-column"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.3 }}
                className="bg-stone-950/30 border border-gold-300/10 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col items-center justify-between text-center"
              >
                <div>
                  <div className="inline-flex p-3 bg-gold-400/5 text-gold-300 rounded-2xl border border-gold-400/10 mb-3">
                    <QrCode size={22} />
                  </div>
                  <h3 className="font-serif text-lg text-stone-100 font-bold">Confirmar via QR Code</h3>
                  <p className="text-stone-400 text-xs mt-1 mb-5">Escaneie o QR Code abaixo com a câmera do seu celular para abrir o formulário geral de presença direta.</p>
                  
                  {/* Dynamic Interactive QR Code */}
                  <div className="inline-block p-3.5 bg-white rounded-2xl border-2 border-gold-400/30 shadow-inner mb-4 transition-all duration-300 hover:scale-103 hover:border-gold-400/60">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?rsvp=new` : '')}&color=28-25-23&bgcolor=255-255-255`}
                      alt="QR Code RSVP"
                      className="w-32 h-32 select-none"
                    />
                  </div>
                  <p className="text-[9px] text-gold-300/80 font-mono tracking-wider uppercase mb-5">Acesso Geral • ?rsvp=new</p>
                </div>

                <div className="w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPublicRegister(true);
                      setSearchName('');
                      setSearchResults([]);
                      setSearchError('');
                    }}
                    className="w-full py-3.5 bg-stone-900/60 hover:bg-stone-850 text-gold-300 hover:text-gold-200 border border-gold-300/10 hover:border-gold-300/30 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Sparkles size={14} className="text-gold-300" />
                    <span>Preencher Formulário Direto</span>
                  </button>
                </div>
              </motion.div>

            </div>
          )}

          {/* FLOW 4: GENERAL DIRECT RSVP FORM (FOR QR CODE SCANS) */}
          {!activeGuest && isPublicRegister && (
            <motion.form
              key="public-rsvp-form"
              onSubmit={handlePublicSubmit}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-stone-950/30 border border-gold-300/10 rounded-3xl p-6 sm:p-10 shadow-xl max-w-xl mx-auto font-sans"
            >
              <div className="space-y-6">
                
                <div className="text-center pb-4 border-b border-stone-800/40">
                  <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-gold-400/10 text-gold-300 text-[10px] font-semibold uppercase tracking-widest rounded-full mb-2">
                    <Sparkles size={11} />
                    Confirmação Geral de Presença
                  </div>
                  <h3 className="font-serif text-xl text-stone-100 font-bold">Preencha seus dados</h3>
                  <p className="text-stone-400 text-xs mt-1">Insira suas informações abaixo para confirmar sua presença no nosso casamento.</p>
                </div>

                {error && (
                  <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-4 rounded-xl">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label htmlFor="pub-name" className="block text-stone-300 text-xs uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5">
                    <User size={13} className="text-gold-300" />
                    Nome Completo *
                  </label>
                  <input
                    id="pub-name"
                    type="text"
                    required
                    placeholder="Seu nome completo"
                    value={publicName}
                    onChange={(e) => {
                      setPublicName(e.target.value);
                      setError('');
                    }}
                    disabled={loading}
                    className="w-full bg-stone-900/60 border border-stone-800 rounded-xl py-3 px-4 text-stone-100 text-sm focus:outline-none focus:border-gold-300"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="pub-email" className="block text-stone-300 text-xs uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5">
                    <Mail size={13} className="text-gold-300" />
                    E-mail *
                  </label>
                  <input
                    id="pub-email"
                    type="email"
                    required
                    placeholder="seu.email@provedor.com"
                    value={publicEmail}
                    onChange={(e) => {
                      setPublicEmail(e.target.value);
                      setError('');
                    }}
                    disabled={loading}
                    className="w-full bg-stone-900/60 border border-stone-800 rounded-xl py-3 px-4 text-stone-100 text-sm focus:outline-none focus:border-gold-300"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="pub-phone" className="block text-stone-300 text-xs uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5">
                    <Phone size={13} className="text-gold-300" />
                    Telefone *
                  </label>
                  <input
                    id="pub-phone"
                    type="tel"
                    required
                    placeholder="(99) 99999-9999"
                    value={publicPhone}
                    onChange={(e) => {
                      setPublicPhone(e.target.value);
                      setError('');
                    }}
                    disabled={loading}
                    className="w-full bg-stone-900/60 border border-stone-800 rounded-xl py-3 px-4 text-stone-100 text-sm focus:outline-none focus:border-gold-300"
                  />
                </div>

                {/* Companion count (up to 5) */}
                <div>
                  <label className="block text-stone-300 text-xs uppercase tracking-widest font-semibold mb-3">
                    Quantidade de acompanhantes *
                  </label>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleCompanionCountChange(num)}
                        disabled={loading}
                        className={`flex-1 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                          companionCount === num
                            ? 'bg-stone-100 text-stone-950 border-white shadow-md'
                            : 'bg-stone-900/30 border-stone-800/80 text-stone-400 hover:text-stone-300'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Companion Names (dynamic fields) */}
                {companionCount > 0 && (
                  <div className="space-y-3 bg-stone-900/30 border border-stone-800/50 p-4 rounded-xl">
                    <p className="text-xs text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-semibold">
                      <Users size={14} className="text-gold-300" />
                      Nome completo dos acompanhantes
                    </p>
                    {companions.map((companion, idx) => (
                      <div key={idx} className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-semibold">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          placeholder={`Nome do acompanhante ${idx + 1}`}
                          value={companion}
                          onChange={(e) => handleCompanionNameChange(idx, e.target.value)}
                          disabled={loading}
                          className="w-full bg-stone-900/60 border border-stone-800 rounded-lg py-2.5 pl-10 pr-4 text-stone-100 text-xs focus:outline-none focus:border-gold-300"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Dietary restrictions */}
                <div>
                  <label htmlFor="pub-dietary" className="block text-stone-300 text-xs uppercase tracking-widest font-semibold mb-2">
                    Restrições alimentares / Alergias (Opcional)
                  </label>
                  <input
                    id="pub-dietary"
                    type="text"
                    placeholder="Vegetariano, Vegano, Sem glúten, Lactose, etc."
                    value={dietaryRestrictions}
                    onChange={(e) => setDietaryRestrictions(e.target.value)}
                    disabled={loading}
                    className="w-full bg-stone-900/60 border border-stone-800 rounded-xl py-3 px-4 text-stone-100 text-sm focus:outline-none focus:border-gold-300"
                  />
                </div>

                {/* Message to couple */}
                <div>
                  <label htmlFor="pub-message" className="block text-stone-300 text-xs uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-gold-300" />
                    Recado especial para os noivos (Opcional)
                  </label>
                  <textarea
                    id="pub-message"
                    rows={3}
                    placeholder="Deixe uma mensagem carinhosa para Henderson & Alana..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                    className="w-full bg-stone-900/60 border border-stone-800 rounded-xl py-3 px-4 text-stone-100 text-sm focus:outline-none focus:border-gold-300 resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPublicRegister(false);
                      setPublicName('');
                      setPublicEmail('');
                      setPublicPhone('');
                      setCompanionCount(0);
                      setCompanions([]);
                      setDietaryRestrictions('');
                      setMessage('');
                      setError('');
                    }}
                    disabled={loading}
                    className="flex-1 py-4 px-6 rounded-xl border border-stone-850 hover:border-stone-800 text-stone-400 hover:text-stone-300 text-sm font-semibold cursor-pointer transition-all text-center"
                  >
                    Voltar
                  </button>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-[2] py-4 px-6 rounded-xl bg-gold-400 hover:bg-gold-500 text-stone-950 font-serif font-medium text-sm tracking-wide shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                        <span>Salvando...</span>
                      </div>
                    ) : (
                      <>
                        <Heart size={16} fill="currentColor" className="text-stone-950" />
                        <span>Confirmar Presença</span>
                      </>
                    )}
                  </motion.button>
                </div>

              </div>
            </motion.form>
          )}

          {/* FLOW 2: GUEST RSVP COMPLETED & DETAILED CARD */}
          {activeGuest && !isEditing && (
            <motion.div
              key="confirmed-details"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-stone-950/50 border border-gold-300/10 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-32 h-32 bg-gold-400/5 rounded-full filter blur-3xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full filter blur-3xl" />

              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-100/10 text-gold-300 mb-6 border border-gold-300/20">
                <Heart size={28} className="fill-current animate-pulse text-gold-400" />
              </div>

              <h3 className="font-serif text-2xl text-stone-100 mb-1">Olá, {activeGuest.nome.split(' ')[0]}!</h3>
              <p className="text-stone-400 text-xs mb-8 font-sans">
                {activeGuest.confirmado === true 
                  ? 'Sua presença foi confirmada com sucesso!' 
                  : 'Registramos sua resposta. Sentiremos sua falta!'}
              </p>

              <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6 mb-8 text-left space-y-4 font-sans text-sm">
                <div>
                  <p className="text-stone-500 text-[10px] uppercase tracking-widest font-semibold">Convidado Titular</p>
                  <p className="font-serif text-lg text-gold-200 mt-0.5 font-bold">{activeGuest.nome}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-800/60">
                  <div>
                    <p className="text-stone-500 text-[10px] uppercase tracking-widest font-semibold">Status de RSVP</p>
                    <p className={`font-serif text-base mt-0.5 font-bold ${activeGuest.confirmado ? 'text-green-400' : 'text-red-400'}`}>
                      {activeGuest.confirmado ? 'Presença Confirmada' : 'Não Comparecerá'}
                    </p>
                  </div>

                  {activeGuest.confirmado && (
                    <div>
                      <p className="text-stone-500 text-[10px] uppercase tracking-widest font-semibold">Acompanhantes</p>
                      <p className="font-serif text-base mt-0.5 text-stone-200 font-bold">{activeGuest.acompanhantes}</p>
                    </div>
                  )}
                </div>

                {activeGuest.confirmado && activeGuest.acompanhantes_nomes.length > 0 && (
                  <div className="pt-3 border-t border-stone-800/60">
                    <p className="text-stone-500 text-[10px] uppercase tracking-widest mb-1 font-semibold">Acompanhantes Confirmados</p>
                    <ul className="list-disc pl-4 text-xs text-stone-300 space-y-1 font-serif">
                      {activeGuest.acompanhantes_nomes.map((comp, idx) => (
                        <li key={idx}>{comp}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {activeGuest.restricao_alimentar && (
                  <div className="pt-3 border-t border-stone-800/60 text-xs">
                    <p className="text-stone-500 text-[10px] uppercase tracking-widest mb-1 font-semibold">Restrições alimentares</p>
                    <p className="text-stone-300 font-serif">{activeGuest.restricao_alimentar}</p>
                  </div>
                )}

                {activeGuest.mensagem && (
                  <div className="pt-3 border-t border-stone-800/60">
                    <p className="text-stone-500 text-[10px] uppercase tracking-widest mb-1 font-semibold">Sua mensagem aos noivos</p>
                    <p className="text-stone-300 italic text-xs font-serif leading-relaxed">"{activeGuest.mensagem}"</p>
                  </div>
                )}

                {activeGuest.mesa && (
                  <div className="pt-3 border-t border-stone-800/60 flex items-center gap-1.5 text-xs text-gold-300">
                    <span>📍 Mesa designada no evento:</span>
                    <strong className="font-serif font-bold text-sm">{activeGuest.mesa}</strong>
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeclineOrDelete}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gold-300/20 hover:border-gold-300/40 text-gold-300 text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors"
                >
                  <Edit2 size={12} />
                  Alterar Resposta
                </motion.button>
                
                {/* Close/Deselect action if searched manually */}
                {!guest && (
                  <button
                    onClick={() => setActiveGuest(null)}
                    className="text-stone-500 hover:text-stone-300 text-xs font-semibold cursor-pointer"
                  >
                    Sair do Convite
                  </button>
                )}
              </div>

            </motion.div>
          )}

          {/* FLOW 3: DETAILED RSVP SUBMISSION FORM */}
          {activeGuest && isEditing && (
            <motion.form
              key="rsvp-submit-form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-stone-950/30 border border-gold-300/10 rounded-3xl p-6 sm:p-10 shadow-xl max-w-xl mx-auto font-sans"
            >
              <div className="space-y-6">
                
                <div className="text-center pb-4 border-b border-stone-800/40">
                  <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-gold-400/10 text-gold-300 text-[10px] font-semibold uppercase tracking-widest rounded-full mb-2">
                    <Sparkles size={11} />
                    Convite Personalizado
                  </div>
                  <h3 className="font-serif text-xl text-stone-100 font-bold">Olá, {activeGuest.nome}!</h3>
                  <p className="text-stone-400 text-xs mt-1">Você foi convidado para o casamento de Henderson & Alana.</p>
                </div>

                {error && (
                  <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-4 rounded-xl">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Presence buttons */}
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
                          ? 'bg-gold-500 text-white border-gold-400 shadow-md'
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
                      Não poderei ir
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isAttending === true && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6 overflow-hidden"
                    >
                      
                      {/* Companion Selector - DYNAMIC BASED ON GUEST LIMIT */}
                      {activeGuest.acompanhantes_limite > 0 ? (
                        <div>
                          <label className="block text-stone-300 text-xs uppercase tracking-widest font-semibold mb-3">
                            Confirmar acompanhantes (Máximo de {activeGuest.acompanhantes_limite})
                          </label>
                          <div className="flex gap-2">
                            {getCompanionOptions(activeGuest.acompanhantes_limite).map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handleCompanionCountChange(num)}
                                disabled={loading}
                                className={`flex-1 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
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
                      ) : (
                        <div className="bg-stone-900/45 p-3.5 rounded-xl border border-stone-800 text-stone-400 text-xs leading-relaxed">
                          ℹ️ Este convite é individual e intransferível (0 acompanhantes adicionais).
                        </div>
                      )}

                      {/* Companion Names input fields */}
                      {companionCount > 0 && (
                        <div className="space-y-3 bg-stone-900/30 border border-stone-800/50 p-4 rounded-xl">
                          <p className="text-xs text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-semibold">
                            <Users size={14} className="text-gold-300" />
                            Nome dos acompanhantes na lista
                          </p>
                          {companions.map((companion, idx) => (
                            <div key={idx} className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-semibold">
                                #{idx + 1}
                              </span>
                              <input
                                type="text"
                                required
                                placeholder={`Nome completo do acompanhante ${idx + 1}`}
                                value={companion}
                                onChange={(e) => handleCompanionNameChange(idx, e.target.value)}
                                disabled={loading}
                                className="w-full bg-stone-900/60 border border-stone-800 rounded-lg py-2.5 pl-10 pr-4 text-stone-100 text-xs focus:outline-none focus:border-gold-300"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Dietary restrictions */}
                      <div>
                        <label htmlFor="dietary" className="block text-stone-300 text-xs uppercase tracking-widest font-semibold mb-2">
                          Restrições alimentares / Alergias (Opcional)
                        </label>
                        <input
                          id="dietary"
                          type="text"
                          placeholder="Vegetariano, Vegano, Sem glúten, etc."
                          value={dietaryRestrictions}
                          onChange={(e) => setDietaryRestrictions(e.target.value)}
                          disabled={loading}
                          className="w-full bg-stone-900/60 border border-stone-800 rounded-xl py-3 px-4 text-stone-100 text-sm focus:outline-none focus:border-gold-300"
                        />
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message to couple */}
                <div>
                  <label htmlFor="message" className="block text-stone-300 text-xs uppercase tracking-widest font-semibold mb-2 flex items-center gap-1">
                    <MessageSquare size={13} className="text-gold-300" />
                    Recado especial para os noivos (Opcional)
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    placeholder="Envie uma mensagem de carinho aos noivos!"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                    className="w-full bg-stone-900/60 border border-stone-800 rounded-xl py-3 px-4 text-stone-100 text-sm focus:outline-none focus:border-gold-300 resize-none"
                  />
                </div>

                <div className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 px-6 rounded-xl bg-gold-400 hover:bg-gold-500 text-stone-950 font-serif font-medium text-sm tracking-wide shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                        <span>Enviando confirmação...</span>
                      </div>
                    ) : (
                      <>
                        <Heart size={16} fill="currentColor" className="text-stone-950" />
                        <span>Confirmar no Banco de Dados</span>
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Cancel editing */}
                {activeGuest.confirmado !== null && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                    className="w-full py-2.5 text-stone-400 hover:text-stone-300 text-xs uppercase tracking-wider font-semibold cursor-pointer text-center"
                  >
                    Cancelar Alteração
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
