import React, { useState, useEffect } from 'react';
import { 
  Users, Check, Search, ShieldCheck, MapPin, Smartphone, Calendar, Clock, ArrowLeft, RefreshCw, AlertTriangle, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Guest } from '../types';

interface CheckInPortalProps {
  onClose: () => void;
}

export default function CheckInPortal({ onClose }: CheckInPortalProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Selected Guest for Check-in Details
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInError, setCheckInError] = useState('');

  // Simulated QR Code Scan input
  const [simulatedUrl, setSimulatedUrl] = useState('');

  const fetchGuestsData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/guests');
      if (res.ok) {
        const data = await res.json();
        setGuests(data);
      }
    } catch (err) {
      console.error("Erro ao buscar convidados:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGuestsData();
  }, []);

  const handleSearchSelect = (guest: Guest) => {
    setSelectedGuest(guest);
    setCheckInSuccess(false);
    setCheckInError('');
  };

  const handleSimulatedScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckInSuccess(false);
    setCheckInError('');

    if (!simulatedUrl.trim()) return;

    // Try to extract the guest ID from the URL or code
    // Matches patterns like `?i=guest_xxx` or `guest_xxx`
    let extractedId = simulatedUrl.trim();
    if (simulatedUrl.includes('?i=')) {
      extractedId = simulatedUrl.split('?i=')[1].split('&')[0];
    } else if (simulatedUrl.includes('/invite/')) {
      extractedId = simulatedUrl.split('/invite/')[1].split('?')[0];
    }

    const found = guests.find(g => g.id === extractedId);
    if (found) {
      setSelectedGuest(found);
      setSimulatedUrl('');
    } else {
      alert('QR Code ou Link inválido! Nenhum convidado correspondente encontrado no banco de dados.');
    }
  };

  const handlePerformCheckIn = async (guestId: string) => {
    setCheckingIn(true);
    setCheckInError('');
    setCheckInSuccess(false);

    try {
      const res = await fetch(`/api/guests/${guestId}/checkin`, {
        method: 'POST'
      });

      const data = await res.json();

      if (res.ok) {
        setCheckInSuccess(true);
        // Refresh local data
        await fetchGuestsData(true);
        // Update selected guest state
        setSelectedGuest(data.guest);
      } else if (data.alreadyCheckedIn) {
        setCheckInError(`Este convidado já realizou check-in às ${new Date(data.guest.check_in_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`);
        setSelectedGuest(data.guest);
      } else {
        setCheckInError(data.error || 'Erro ao realizar check-in.');
      }
    } catch (err) {
      setCheckInError('Erro de conexão ao realizar o check-in.');
    } finally {
      setCheckingIn(false);
    }
  };

  // Filter guests based on search query
  const filteredGuests = guests.filter(guest => {
    return guest.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (guest.email && guest.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
           (guest.telefone && guest.telefone.includes(searchQuery));
  });

  const formatCheckInTime = (isoString: string | null) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-gold-300 font-semibold tracking-widest uppercase mb-1">
              <Sparkles size={14} className="text-gold-400" />
              Recepção do Evento • Dia do Casamento
            </div>
            <h1 className="font-serif text-3xl text-stone-100">Check-In de Convidados</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchGuestsData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-stone-950 border border-stone-850 text-stone-300 hover:text-white flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Sincronizar
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gold-400 hover:bg-gold-500 text-stone-950 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all shadow-md"
            >
              <ArrowLeft size={14} />
              Voltar ao Convite
            </button>
          </div>
        </div>

        {/* Check-In Grid */}
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Column: Guest Search & Directory (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Interactive Simulated QR Reader */}
            <div className="bg-stone-950/40 border border-stone-800 p-5 rounded-3xl">
              <h3 className="font-serif text-sm text-stone-200 mb-3 flex items-center gap-1.5">
                📸 Leitor de QR Code Simulado
              </h3>
              <p className="text-stone-400 text-xs leading-relaxed mb-4">
                Cole a URL do convite ou o ID do convidado para simular o escaneamento do QR Code impresso no convite ou celular!
              </p>
              
              <form onSubmit={handleSimulatedScanSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Cole o link ou ID (Ex: 6f4d8f30...)"
                  value={simulatedUrl}
                  onChange={(e) => setSimulatedUrl(e.target.value)}
                  className="flex-1 bg-stone-900 border border-stone-800 rounded-xl py-2 px-3 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-gold-300"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gold-400 hover:bg-gold-500 text-stone-950 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Escanear
                </button>
              </form>
            </div>

            {/* Quick Filter Search list */}
            <div className="bg-stone-950/20 border border-stone-800 rounded-3xl p-5 space-y-4">
              <h3 className="font-serif text-sm text-stone-200">
                🔍 Buscar por Nome na Lista
              </h3>
              
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  placeholder="Digite o nome do convidado..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-850 rounded-xl py-2 pl-9 pr-3 text-xs text-stone-200 focus:outline-none focus:border-gold-300/40"
                />
              </div>

              {/* Guests Results List */}
              <div className="overflow-y-auto max-h-[350px] space-y-2 pr-1">
                {loading ? (
                  <p className="text-stone-500 text-xs text-center py-10">Carregando convidados...</p>
                ) : filteredGuests.length === 0 ? (
                  <p className="text-stone-500 text-xs text-center py-10">Nenhum convidado encontrado.</p>
                ) : (
                  filteredGuests.map(g => (
                    <button
                      key={g.id}
                      onClick={() => handleSearchSelect(g)}
                      className={`w-full text-left p-3 rounded-xl border text-xs flex justify-between items-center transition-all cursor-pointer ${
                        selectedGuest?.id === g.id
                          ? 'bg-stone-800 border-gold-300/40 text-stone-100 shadow-md'
                          : 'bg-stone-900/40 border-stone-850 text-stone-300 hover:bg-stone-900/70 hover:text-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-stone-200 text-sm">{g.nome}</p>
                        <p className="text-stone-500 font-mono text-[10px]">
                          {g.confirmado === true ? '✅ Confirmado' : g.confirmado === false ? '❌ Recusado' : '⏳ Pendente'}
                          {g.mesa ? ` • 📍 ${g.mesa}` : ''}
                        </p>
                      </div>

                      {g.check_in ? (
                        <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase shrink-0">
                          Checked-In
                        </span>
                      ) : (
                        <span className="text-stone-500 shrink-0 font-bold">→</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Active Check-In Console (7 cols) */}
          <div className="lg:col-span-7">
            
            <AnimatePresence mode="wait">
              {selectedGuest ? (
                <motion.div
                  key={selectedGuest.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-stone-950/40 border border-stone-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden h-full flex flex-col justify-between"
                >
                  
                  {/* Decorative ambient color spots */}
                  {selectedGuest.check_in ? (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full filter blur-3xl" />
                  ) : selectedGuest.confirmado === false ? (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full filter blur-3xl" />
                  ) : (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full filter blur-3xl" />
                  )}

                  <div>
                    {/* State Icon Indicator */}
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-800/60">
                      <div>
                        <span className="text-stone-500 text-[10px] uppercase tracking-widest font-bold">Ficha de Portaria</span>
                        <h4 className="font-serif text-stone-100 text-xl font-bold mt-1">Status de Entrada</h4>
                      </div>
                      
                      {selectedGuest.check_in ? (
                        <span className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold py-1.5 px-3.5 rounded-full uppercase tracking-wider">
                          <Check size={14} />
                          Check-In Concluído
                        </span>
                      ) : selectedGuest.confirmado === true ? (
                        <span className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold py-1.5 px-3.5 rounded-full uppercase tracking-wider">
                          <Check size={14} />
                          Apto para Entrar
                        </span>
                      ) : selectedGuest.confirmado === false ? (
                        <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold py-1.5 px-3.5 rounded-full uppercase tracking-wider">
                          ⚠️ Não Confirmado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold py-1.5 px-3.5 rounded-full uppercase tracking-wider">
                          ⏳ RSVP Pendente
                        </span>
                      )}
                    </div>

                    {/* Guest Information card */}
                    <div className="space-y-6 font-sans">
                      
                      <div>
                        <p className="text-stone-500 text-[10px] uppercase tracking-widest font-semibold">Nome do Convidado Titular</p>
                        <p className="text-2xl font-serif text-stone-100 font-bold mt-0.5">{selectedGuest.nome}</p>
                      </div>

                      {/* Info Cards Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-stone-900/60 border border-stone-800/50 rounded-2xl p-4">
                          <p className="text-stone-500 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1">
                            <MapPin size={11} className="text-gold-400" />
                            Mesa Reservada
                          </p>
                          <p className="text-lg font-serif text-gold-200 mt-1 font-bold">
                            {selectedGuest.mesa ? selectedGuest.mesa : 'Não atribuída'}
                          </p>
                        </div>

                        <div className="bg-stone-900/60 border border-stone-800/50 rounded-2xl p-4">
                          <p className="text-stone-500 text-[10px] uppercase tracking-wider font-semibold">Acompanhantes Confirmados</p>
                          <p className="text-lg font-serif text-stone-100 mt-1 font-bold">
                            {selectedGuest.confirmado === true ? selectedGuest.acompanhantes : 0} acompanhantes
                          </p>
                        </div>
                      </div>

                      {/* Display companion list */}
                      {selectedGuest.confirmado === true && selectedGuest.acompanhantes_nomes.length > 0 && (
                        <div className="bg-stone-900/40 border border-stone-850 p-4 rounded-2xl">
                          <p className="text-stone-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Users size={14} className="text-gold-300" />
                            Nomes na lista:
                          </p>
                          <ul className="list-decimal list-inside text-xs text-stone-300 space-y-1 font-serif">
                            <li>{selectedGuest.nome} (Titular)</li>
                            {selectedGuest.acompanhantes_nomes.map((name, idx) => (
                              <li key={idx}>{name}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Dietary restrictions banner */}
                      {selectedGuest.restricao_alimentar && (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs p-3.5 rounded-xl">
                          ⚠️ <strong className="text-amber-300 font-bold">Alerta de Restrição Alimentar:</strong> {selectedGuest.restricao_alimentar}
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="mt-12 pt-6 border-t border-stone-800/60 space-y-4">
                    
                    {/* Success/Error States */}
                    <AnimatePresence>
                      {checkInSuccess && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-green-500/10 border border-green-500/20 text-green-200 text-xs p-4 rounded-2xl text-center flex flex-col items-center gap-1"
                        >
                          <ShieldCheck size={24} className="text-green-400 animate-bounce mb-1" />
                          <p className="font-serif font-bold text-sm">Check-in Realizado com Sucesso!</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            Check-in realizado às {formatCheckInTime(selectedGuest.check_in_at)}
                          </p>
                        </motion.div>
                      )}

                      {checkInError && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-4 rounded-2xl text-center flex flex-col items-center gap-1"
                        >
                          <AlertTriangle size={24} className="text-red-400 animate-pulse mb-1" />
                          <p className="font-serif font-bold text-sm">⚠️ Atenção</p>
                          <p className="text-[11px] font-medium text-stone-300 leading-relaxed mt-1">
                            {checkInError}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Main Entry Button */}
                    {!selectedGuest.check_in ? (
                      <motion.button
                        onClick={() => handlePerformCheckIn(selectedGuest.id)}
                        disabled={checkingIn}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full py-4 rounded-2xl font-serif text-sm font-semibold uppercase tracking-wider cursor-pointer shadow-lg transition-all flex items-center justify-center gap-2 ${
                          selectedGuest.confirmado === false
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-stone-950 shadow-green-500/10'
                        }`}
                      >
                        {checkingIn ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                            <span>Processando entrada...</span>
                          </div>
                        ) : selectedGuest.confirmado === false ? (
                          <span>⚠️ Liberar entrada mesmo Recusado</span>
                        ) : (
                          <>
                            <ShieldCheck size={16} />
                            <span>Confirmar Entrada</span>
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <div className="bg-stone-900 border border-stone-850 py-3.5 px-6 rounded-2xl text-center text-stone-400 text-xs flex justify-between items-center flex-wrap gap-2">
                        <span>Check-in realizado às:</span>
                        <span className="font-mono text-gold-300 font-bold text-sm">
                          {formatCheckInTime(selectedGuest.check_in_at)}
                        </span>
                      </div>
                    )}

                  </div>

                </motion.div>
              ) : (
                <div className="bg-stone-950/20 border border-stone-850 border-dashed rounded-3xl p-12 text-center h-full flex flex-col justify-center items-center py-24 text-stone-500">
                  <Users size={48} className="text-stone-700 mb-4" />
                  <h4 className="font-serif text-lg text-stone-300">Nenhum Convidado Selecionado</h4>
                  <p className="text-xs max-w-sm mx-auto mt-1 leading-relaxed">
                    Pesquise o nome do convidado na lista à esquerda ou simule a leitura do QR Code do convite para carregar os dados de check-in e mesa.
                  </p>
                </div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </div>
    </div>
  );
}
