import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Heart, Link2, Copy, Check, QrCode, Trash2,
  Search, Eye, ShieldCheck, MapPin, Smartphone, Chrome, Calendar, Clock, ArrowLeft, RefreshCw, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { Guest, AccessLog, CompanionLink } from '../types';

interface AdminDashboardProps {
  onClose: () => void;
  onLogout: () => void;
}

export default function AdminDashboard({ onClose, onLogout }: AdminDashboardProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'convidados' | 'acompanhantes' | 'analytics' | 'logs'>('convidados');

  // New Guest Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [acompanhantesLimite, setAcompanhantesLimite] = useState(0);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const [companionLinks, setCompanionLinks] = useState<CompanionLink[]>([]);
  const [companionLimit, setCompanionLimit] = useState(1);
  const [generatedCompanionLink, setGeneratedCompanionLink] = useState('');
  const [companionError, setCompanionError] = useState('');
  const [creatingCompanionLink, setCreatingCompanionLink] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'confirmados' | 'recusados' | 'pendentes'>('todos');

  // QR Code Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrGuest, setQrGuest] = useState<Guest | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Table assignment state
  const [editingMesaGuestId, setEditingMesaGuestId] = useState<string | null>(null);
  const [mesaValue, setMesaValue] = useState('');

  const fetchAdminData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const [guestsRes, logsRes, companionLinksRes] = await Promise.all([
        fetch('/api/guests'),
        fetch('/api/access-logs'),
        fetch('/api/companion-links'),
      ]);
      if (guestsRes.ok && logsRes.ok && companionLinksRes.ok) {
        const guestsData = await guestsRes.json();
        const logsData = await logsRes.json();
        setGuests(guestsData);
        setAccessLogs(logsData);
        setCompanionLinks(await companionLinksRes.json());
      }
    } catch (err) {
      console.error("Erro ao buscar dados do painel:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const getCompanionLinkUrl = (hash: string) =>
    window.location.origin + '/acompanhantes/' + hash;

  const handleCreateCompanionLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setCompanionError('');
    setCreatingCompanionLink(true);
    try {
      const response = await fetch('/api/companion-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acompanhantes_limite: companionLimit }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'N\u00e3o foi poss\u00edvel gerar o link.');

      const url = getCompanionLinkUrl(data.hash);
      setGeneratedCompanionLink(url);
      setCompanionLinks(current => [data, ...current]);
    } catch (requestError) {
      setCompanionError(requestError instanceof Error ? requestError.message : 'N\u00e3o foi poss\u00edvel gerar o link.');
    } finally {
      setCreatingCompanionLink(false);
    }
  };

  const copyCompanionLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);

    if (!nome.trim()) {
      setFormError('Por favor, informe o nome do convidado.');
      return;
    }

    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          telefone: telefone.trim(),
          acompanhantes_limite: acompanhantesLimite
        })
      });

      if (res.ok) {
        setNome('');
        setEmail('');
        setTelefone('');
        setAcompanhantesLimite(0);
        setFormSuccess(true);
        setTimeout(() => setFormSuccess(false), 3000);
        fetchAdminData(true);
      } else {
        const errData = await res.json();
        setFormError(errData.error || 'Erro ao cadastrar convidado.');
      }
    } catch (err) {
      setFormError('Falha de rede ao conectar com o servidor.');
    }
  };

  const handleDeleteGuest = async (id: string, name: string) => {
    if (confirm(`Remover "${name}" da interface? O registro será preservado no banco de dados.`)) {
      try {
        const res = await fetch(`/api/guests/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          fetchAdminData(true);
        } else {
          const data = await res.json();
          alert(data.error || 'Você não tem permissão para remover este cadastro.');
        }
      } catch (err) {
        console.error("Erro ao deletar convidado:", err);
      }
    }
  };

  const handleSaveMesa = async (id: string) => {
    try {
      const res = await fetch(`/api/guests/${id}/mesa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesa: mesaValue.trim() })
      });
      if (res.ok) {
        setEditingMesaGuestId(null);
        setMesaValue('');
        fetchAdminData(true);
      }
    } catch (err) {
      console.error("Erro ao atualizar mesa:", err);
    }
  };

  const getInviteLink = (guestId: string) => {
    const origin = window.location.origin;
    return `${origin}?i=${guestId}`;
  };

  const handleCopyLink = (guestId: string) => {
    const link = getInviteLink(guestId);
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleViewQr = (guest: Guest) => {
    const link = getInviteLink(guest.id);
    QRCode.toDataURL(link, { width: 300, margin: 2 }, (err, url) => {
      if (err) {
        console.error(err);
        return;
      }
      setQrGuest(guest);
      setQrCodeDataUrl(url);
      setShowQrModal(true);
    });
  };

  // Calculations for analytics
  const totalGuests = guests.length;
  const confirmedAttending = guests.filter(g => g.confirmado === true);
  const declinedCount = guests.filter(g => g.confirmado === false);
  const pendingCount = guests.filter(g => g.confirmado === null);

  const totalCompanionsConfirmed = confirmedAttending.reduce((acc, curr) => acc + curr.acompanhantes, 0);
  const totalConfirmedPeople = confirmedAttending.length + totalCompanionsConfirmed;

  // Filtered guests list
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (guest.email && guest.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (guest.telefone && guest.telefone.includes(searchQuery));

    if (statusFilter === 'todos') return matchesSearch;
    if (statusFilter === 'confirmados') return matchesSearch && guest.confirmado === true;
    if (statusFilter === 'recusados') return matchesSearch && guest.confirmado === false;
    if (statusFilter === 'pendentes') return matchesSearch && guest.confirmado === null;
    return matchesSearch;
  });

  // Calculate unique logs count per guest
  const getGuestAccessStats = (guestId: string) => {
    const logs = accessLogs.filter(l => l.guest_id === guestId);
    return {
      count: logs.length,
      lastAccess: logs.length > 0 ? logs[0].data : null
    };
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-gold-300 font-semibold tracking-widest uppercase mb-1">
              <ShieldCheck size={14} />
              Painel de Controle dos Noivos
            </div>
            <h1 className="font-serif text-3xl text-stone-100">Convites & RSVP Real-time</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAdminData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Atualizar
            </button>
            <button
              onClick={() => {
                onLogout();
              }}
              className="px-4 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-700 text-white flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-md border border-red-500/20"
            >
              Sair (Logout)
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

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-stone-900/45 border border-stone-800 rounded-2xl p-4">
            <p className="text-stone-500 text-[10px] uppercase tracking-wider font-semibold">Total de Convites</p>
            <p className="text-2xl font-serif text-stone-100 mt-1">{totalGuests}</p>
            <p className="text-[10px] text-stone-400 mt-1">Lançados no banco</p>
          </div>

          <div className="bg-stone-900/45 border border-stone-800 rounded-2xl p-4">
            <p className="text-stone-500 text-[10px] uppercase tracking-wider font-semibold">Total de Confirmados</p>
            <p className="text-2xl font-serif text-green-400 mt-1">{confirmedAttending.length}</p>
            <p className="text-[10px] text-stone-400 mt-1">Convidados confirmados</p>
          </div>

          <div className="bg-stone-900/45 border border-stone-800 rounded-2xl p-4">
            <p className="text-stone-500 text-[10px] uppercase tracking-wider font-semibold">Não Comparecerão</p>
            <p className="text-2xl font-serif text-red-400 mt-1">{declinedCount.length}</p>
            <p className="text-[10px] text-stone-400 mt-1">Respostas negativas</p>
          </div>

          <div className="bg-stone-900/45 border border-stone-800 rounded-2xl p-4">
            <p className="text-stone-500 text-[10px] uppercase tracking-wider font-semibold">Aguardando Resposta</p>
            <p className="text-2xl font-serif text-gold-300 mt-1">{pendingCount.length}</p>
            <p className="text-[10px] text-stone-400 mt-1">Taxa pendente: {totalGuests ? Math.round((pendingCount.length / totalGuests) * 100) : 0}%</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-stone-850 mb-8">
          <button
            onClick={() => setActiveTab('convidados')}
            className={`px-5 py-3 text-xs uppercase tracking-wider font-semibold cursor-pointer border-b-2 transition-all ${
              activeTab === 'convidados'
                ? 'border-gold-400 text-gold-300'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={14} />
              Convidados ({guests.length})
            </div>
          </button>

          <button
            onClick={() => setActiveTab('acompanhantes')}
            className={'px-5 py-3 text-xs uppercase tracking-wider font-semibold cursor-pointer border-b-2 transition-all ' + (
              activeTab === 'acompanhantes'
                ? 'border-gold-400 text-gold-300'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            )}
          >
            <div className="flex items-center gap-2">
              <UserPlus size={14} />
              Acompanhantes ({companionLinks.length})
            </div>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-3 text-xs uppercase tracking-wider font-semibold cursor-pointer border-b-2 transition-all ${
              activeTab === 'analytics'
                ? 'border-gold-400 text-gold-300'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers size={14} />
              Analytics & Insights
            </div>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-5 py-3 text-xs uppercase tracking-wider font-semibold cursor-pointer border-b-2 transition-all ${
              activeTab === 'logs'
                ? 'border-gold-400 text-gold-300'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock size={14} />
              Acessos de QR Code ({accessLogs.length})
            </div>
          </button>
        </div>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">

          {activeTab === 'acompanhantes' && (
            <motion.div
              key="acompanhantes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-8 lg:grid-cols-3"
            >
              <section className="h-fit rounded-3xl border border-stone-800 bg-stone-900/30 p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-gold-400/10 p-2 text-gold-300">
                    <Link2 size={18} />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg text-stone-100">Link com acompanhantes</h2>
                    <p className="text-[10px] uppercase tracking-wider text-stone-500">Acesso exclusivo</p>
                  </div>
                </div>

                <form onSubmit={handleCreateCompanionLink} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                      Adicionar acompanhante
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={companionLimit}
                      onChange={(event) => setCompanionLimit(Math.min(20, Math.max(1, Number(event.target.value) || 1)))}
                      className="w-full rounded-xl border border-stone-800 bg-stone-950 px-3.5 py-3 text-sm text-stone-200 focus:border-gold-300 focus:outline-none"
                    />
                    <p className="mt-2 text-[10px] leading-relaxed text-stone-500">
                      Defina quantos acompanhantes a pessoa poder&#225; incluir ao abrir o link.
                    </p>
                  </div>

                  {companionError && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200">
                      {companionError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={creatingCompanionLink}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-950 transition-colors hover:bg-gold-300 disabled:opacity-60"
                  >
                    <Link2 size={14} />
                    {creatingCompanionLink ? 'Gerando...' : 'Gerar link'}
                  </button>
                </form>

                {generatedCompanionLink && (
                  <div className="mt-5 rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-green-300">Link gerado</p>
                    <p className="break-all text-xs text-stone-300">{generatedCompanionLink}</p>
                    <button
                      type="button"
                      onClick={() => copyCompanionLink(generatedCompanionLink)}
                      className="mt-3 flex items-center gap-2 rounded-lg bg-stone-950 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gold-300"
                    >
                      {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                      {copiedLink ? 'Copiado' : 'Copiar link'}
                    </button>
                  </div>
                )}
              </section>

              <section className="space-y-3 lg:col-span-2">
                <div className="mb-4">
                  <h2 className="font-serif text-xl text-stone-100">Links gerados</h2>
                  <p className="mt-1 text-xs text-stone-500">Cada link pode ser utilizado uma &#250;nica vez.</p>
                </div>

                {companionLinks.length === 0 ? (
                  <div className="rounded-3xl border border-stone-800 bg-stone-900/20 py-16 text-center">
                    <Link2 size={30} className="mx-auto mb-3 text-stone-700" />
                    <p className="text-sm text-stone-400">Nenhum link com acompanhantes foi gerado.</p>
                  </div>
                ) : companionLinks.map(link => {
                  const url = getCompanionLinkUrl(link.hash);
                  return (
                    <div key={link.hash} className="rounded-2xl border border-stone-800 bg-stone-900/30 p-5">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-serif text-base text-stone-200">
                              At&#233; {link.acompanhantes_limite} {link.acompanhantes_limite === 1 ? 'acompanhante' : 'acompanhantes'}
                            </span>
                            <span className={link.used_at
                              ? 'rounded-full bg-green-500/10 px-2 py-1 text-[9px] font-bold uppercase text-green-300'
                              : 'rounded-full bg-gold-400/10 px-2 py-1 text-[9px] font-bold uppercase text-gold-300'}
                            >
                              {link.used_at ? 'Utilizado' : 'Dispon\u00edvel'}
                            </span>
                          </div>
                          {link.guest_nome && (
                            <p className="mt-1 text-xs text-stone-400">Cadastro: {link.guest_nome}</p>
                          )}
                          <p className="mt-2 break-all font-mono text-[10px] text-stone-600">{url}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyCompanionLink(url)}
                            className="flex items-center justify-center gap-2 rounded-xl border border-stone-700 bg-stone-950 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-300 hover:text-gold-300"
                          >
                            <Copy size={13} />
                            Copiar
                          </button>
                          {link.guest_id && link.guest_nome && link.can_soft_delete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteGuest(link.guest_id!, link.guest_nome!)}
                              className="rounded-xl border border-stone-700 bg-stone-950 p-2.5 text-stone-500 hover:border-red-500/30 hover:text-red-400"
                              title="Remover cadastro da interface (soft delete)"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>
            </motion.div>
          )}

          {/* TAB 1: GUEST REGISTRATION & DIRECTORY */}
          {activeTab === 'convidados' && (
            <motion.div
              key="convidados"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid lg:grid-cols-3 gap-8"
            >
              {/* Add Guest Form (1/3 width) */}
              <div className="bg-stone-900/30 border border-stone-800 rounded-3xl p-6 h-fit">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-gold-400/10 text-gold-300 rounded-xl">
                    <UserPlus size={18} />
                  </div>
                  <h2 className="font-serif text-lg text-stone-100">Cadastrar Convidado</h2>
                </div>

                <form onSubmit={handleAddGuest} className="space-y-4">
                  {formError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-3 rounded-xl">
                      {formError}
                    </div>
                  )}

                  {formSuccess && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-200 text-xs p-3 rounded-xl flex items-center gap-1.5">
                      <ShieldCheck size={14} />
                      Convidado cadastrado com sucesso!
                    </div>
                  )}

                  <div>
                    <label className="block text-stone-400 text-[10px] uppercase tracking-wider mb-1.5 font-semibold">
                      Nome do Convidado *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Henrique"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2.5 px-3.5 text-stone-200 text-sm focus:outline-none focus:border-gold-300"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 text-[10px] uppercase tracking-wider mb-1.5 font-semibold">
                      E-mail (Opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="Ex: carlos@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2.5 px-3.5 text-stone-200 text-sm focus:outline-none focus:border-gold-300"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 text-[10px] uppercase tracking-wider mb-1.5 font-semibold">
                      Telefone (Opcional)
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex: (11) 98765-4321"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2.5 px-3.5 text-stone-200 text-sm focus:outline-none focus:border-gold-300"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 mt-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-gold-300/40 hover:text-gold-300 text-stone-200 text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors"
                  >
                    Salvar
                  </button>
                </form>
              </div>

              {/* Guest Directory (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">

                {/* Search & Filter tools */}
                <div className="flex flex-col sm:flex-row gap-3 bg-stone-900/10 border border-stone-850 p-4 rounded-2xl">

                  {/* Search box */}
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, e-mail ou telefone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-stone-300 focus:outline-none focus:border-gold-300/60"
                    />
                  </div>

                  {/* Filter buttons */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {(['todos', 'confirmados', 'recusados', 'pendentes'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setStatusFilter(filter)}
                        className={`px-3.5 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider cursor-pointer transition-all shrink-0 ${
                          statusFilter === filter
                            ? 'bg-stone-800 text-gold-300 border border-gold-300/20'
                            : 'bg-stone-900/30 border border-stone-850 text-stone-500 hover:text-stone-300'
                        }`}
                      >
                        {filter === 'todos' && 'Todos'}
                        {filter === 'confirmados' && '✅ Confirmados'}
                        {filter === 'recusados' && '❌ Não vão'}
                        {filter === 'pendentes' && '⏳ Pendentes'}
                      </button>
                    ))}
                  </div>

                </div>

                {/* Directory List */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-stone-500 text-xs">Buscando convidados do banco PostgreSQL...</p>
                  </div>
                ) : filteredGuests.length === 0 ? (
                  <div className="bg-stone-900/10 border border-stone-850 rounded-3xl py-20 text-center px-4">
                    <Users size={32} className="text-stone-700 mx-auto mb-3" />
                    <p className="text-stone-400 font-serif text-base">Nenhum convidado encontrado</p>
                    <p className="text-stone-600 text-xs mt-1">Tente ajustar seus filtros ou cadastre um novo convidado.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredGuests.map((guest) => {
                      const accessStats = getGuestAccessStats(guest.id);
                      return (
                        <div
                          key={guest.id}
                          className="bg-stone-900/25 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-stone-700 transition-all"
                        >
                          {/* Left: Guest Details */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-serif text-base text-stone-200 font-semibold">{guest.nome}</span>
                              <span className="bg-stone-800 border border-stone-700/60 text-gold-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider" title="Código de busca do convite">
                                Código: {guest.id.startsWith("guest_") ? guest.id.substring(6).toUpperCase() : guest.id.toUpperCase()}
                              </span>

                              {/* Confirmed Badge */}
                              {guest.confirmado === true && (
                                <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Confirmado
                                </span>
                              )}
                              {guest.confirmado === false && (
                                <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Recusado
                                </span>
                              )}
                              {guest.confirmado === null && (
                                <span className="bg-gold-500/10 border border-gold-300/20 text-gold-300 text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Pendente
                                </span>
                              )}

                              {/* Check-in Badge */}
                              {guest.check_in && (
                                <span className="bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                  <ShieldCheck size={10} />
                                  Check-in Realizado
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-stone-400">
                              {guest.telefone && <span>📞 {guest.telefone}</span>}
                              {guest.email && <span className="text-stone-500">✉️ {guest.email}</span>}
                            </div>

                            {guest.acompanhantes > 0 && (
                              <div className="mt-2 rounded-xl border border-gold-400/15 bg-gold-400/5 p-3">
                                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gold-300">
                                  <Users size={12} />
                                  Acompanhantes ({guest.acompanhantes})
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {guest.acompanhantes_nomes.map((companionName, index) => (
                                    <span
                                      key={index}
                                      className="rounded-full border border-stone-700 bg-stone-900 px-2.5 py-1 text-[10px] text-stone-300"
                                    >
                                      {companionName}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Show message if exists */}
                            {guest.confirmado === true && guest.mensagem && (
                              <div className="mt-1 pt-1 border-t border-stone-800/40 text-[11px] space-y-0.5">
                                <p className="text-stone-500 italic">"{guest.mensagem}"</p>
                              </div>
                            )}

                            {/* Analytics context for this guest */}
                            <div className="flex gap-4 pt-1.5 text-[10px] text-stone-500 font-mono">
                              <span>Acessou QR: <strong className="text-stone-300">{accessStats.count}x</strong></span>
                              {accessStats.lastAccess && (
                                <span>Último: <strong className="text-stone-300">{new Date(accessStats.lastAccess).toLocaleDateString('pt-BR')}</strong></span>
                              )}
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            {/* Table Assignment Box */}
                            <div className="flex items-center gap-1 border border-stone-800 bg-stone-950/40 py-1 px-2 rounded-xl">
                              <MapPin size={11} className="text-gold-400 shrink-0" />
                              {editingMesaGuestId === guest.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    placeholder="Mesa 12"
                                    value={mesaValue}
                                    onChange={(e) => setMesaValue(e.target.value)}
                                    className="bg-stone-900 border border-stone-800 text-[11px] py-0.5 px-1.5 w-16 text-white rounded focus:outline-none focus:border-gold-300"
                                  />
                                  <button
                                    onClick={() => handleSaveMesa(guest.id)}
                                    className="bg-green-500 text-stone-950 p-1 rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    OK
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingMesaGuestId(guest.id);
                                    setMesaValue(guest.mesa || '');
                                  }}
                                  className="text-[11px] text-stone-300 hover:text-white cursor-pointer select-none font-medium"
                                >
                                  {guest.mesa ? guest.mesa : 'S/ Mesa'}
                                </button>
                              )}
                            </div>

                            {/* Copy URL */}
                            <button
                              onClick={() => handleCopyLink(guest.id)}
                              className="p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-400 hover:text-white hover:border-stone-700 cursor-pointer"
                              title="Copiar Link Seguro do Convite"
                            >
                              <Link2 size={13} />
                            </button>

                            {/* View QR Code */}
                            <button
                              onClick={() => handleViewQr(guest)}
                              className="p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-gold-300 hover:text-gold-200 hover:border-gold-400/20 cursor-pointer"
                              title="Gerar QR Code de Acesso"
                            >
                              <QrCode size={13} />
                            </button>

                            {guest.can_soft_delete && (
                              <button
                                onClick={() => handleDeleteGuest(guest.id, guest.nome)}
                                className="p-2.5 bg-stone-950 border border-stone-800 hover:border-red-500/20 text-stone-500 hover:text-red-400 rounded-xl cursor-pointer"
                                title="Remover da interface (soft delete)"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {/* TAB 2: ANALYTICS & INSIGHTS */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid md:grid-cols-3 gap-6">

                {/* RSVP Attendance Chart summary */}
                <div className="bg-stone-900/30 border border-stone-800 rounded-3xl p-6">
                  <h3 className="font-serif text-lg text-stone-100 mb-4 flex items-center gap-2">
                    <Heart size={16} className="text-gold-400 fill-current" />
                    Engajamento de Resposta
                  </h3>

                  <div className="space-y-4 font-sans text-sm mt-6">
                    <div className="flex justify-between items-center text-stone-400">
                      <span>Sim, comparecerão</span>
                      <span className="font-semibold text-green-400">{confirmedAttending.length} convites ({totalGuests ? Math.round((confirmedAttending.length / totalGuests) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-green-400 h-full rounded-full"
                        style={{ width: `${totalGuests ? (confirmedAttending.length / totalGuests) * 100 : 0}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-stone-400 pt-2">
                      <span>Não comparecerão</span>
                      <span className="font-semibold text-red-400">{declinedCount.length} convites ({totalGuests ? Math.round((declinedCount.length / totalGuests) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-red-400 h-full rounded-full"
                        style={{ width: `${totalGuests ? (declinedCount.length / totalGuests) * 100 : 0}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-stone-400 pt-2">
                      <span>Ainda não responderam (Pendentes)</span>
                      <span className="font-semibold text-gold-300">{pendingCount.length} convites ({totalGuests ? Math.round((pendingCount.length / totalGuests) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gold-400 h-full rounded-full"
                        style={{ width: `${totalGuests ? (pendingCount.length / totalGuests) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Device breakdown & insights */}
                <div className="bg-stone-900/30 border border-stone-800 rounded-3xl p-6">
                  <h3 className="font-serif text-lg text-stone-100 mb-4 flex items-center gap-2">
                    <Smartphone size={16} className="text-gold-400" />
                    Perfil dos Convidados (Dispositivos)
                  </h3>

                  <div className="space-y-4 font-sans text-sm mt-6">
                    {(() => {
                      const loggedAccesses = accessLogs.length;
                      const mobileLogs = accessLogs.filter(l => l.celular === 'Sim').length;
                      const desktopLogs = loggedAccesses - mobileLogs;
                      const mobilePercent = loggedAccesses ? Math.round((mobileLogs / loggedAccesses) * 100) : 0;

                      return (
                        <>
                          <div className="flex justify-between items-center text-stone-400">
                            <span>Visualizações via Celular</span>
                            <span className="font-semibold text-stone-200">{mobileLogs} acessos ({mobilePercent}%)</span>
                          </div>
                          <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gold-400 h-full rounded-full"
                              style={{ width: `${mobilePercent}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-stone-400 pt-2">
                            <span>Visualizações via Computador</span>
                            <span className="font-semibold text-stone-200">{desktopLogs} acessos ({100 - mobilePercent}%)</span>
                          </div>
                          <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-stone-700 h-full rounded-full"
                              style={{ width: `${100 - mobilePercent}%` }}
                            />
                          </div>

                          <div className="bg-stone-950/50 p-3 rounded-xl border border-stone-850 mt-4 text-[11px] text-stone-400 leading-relaxed italic">
                            * Dica: Como {mobilePercent}% dos acessos são por dispositivos móveis, priorizamos layout ultra-fluido e de rápido carregamento no celular.
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Engagement / Access Frequency */}
                <div className="bg-stone-900/30 border border-stone-800 rounded-3xl p-6">
                  <h3 className="font-serif text-lg text-stone-100 mb-4 flex items-center gap-2">
                    <Chrome size={16} className="text-gold-400" />
                    Cidades & Geografia
                  </h3>

                  <div className="space-y-3 font-sans text-xs mt-4 overflow-y-auto max-h-48 pr-1">
                    {(() => {
                      const citiesCount: Record<string, number> = {};
                      accessLogs.forEach(log => {
                        citiesCount[log.cidade] = (citiesCount[log.cidade] || 0) + 1;
                      });

                      const sortedCities = Object.entries(citiesCount).sort((a, b) => b[1] - a[1]);

                      if (sortedCities.length === 0) {
                        return <p className="text-stone-500 italic py-8 text-center">Nenhum dado geográfico de acesso registrado.</p>;
                      }

                      return sortedCities.map(([city, count]) => {
                        const percent = Math.round((count / accessLogs.length) * 100);
                        return (
                          <div key={city} className="space-y-1">
                            <div className="flex justify-between text-stone-300">
                              <span>📍 {city}</span>
                              <span className="font-mono text-gold-300">{count}x ({percent}%)</span>
                            </div>
                            <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-gold-400 h-full rounded-full" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

              </div>

              {/* Attendance dietary restrictions dashboard */}
              <div className="bg-stone-900/30 border border-stone-800 rounded-3xl p-6">
                <h3 className="font-serif text-lg text-stone-100 mb-4 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-gold-400" />
                  Avisos de Alergias & Restrições Alimentares
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  {guests.filter(g => g.confirmado && g.restricao_alimentar).length === 0 ? (
                    <p className="text-stone-500 text-xs italic py-4 col-span-2 text-center">Nenhum convidado confirmado registrou alergia ou restrição alimentar até o momento.</p>
                  ) : (
                    guests
                      .filter(g => g.confirmado && g.restricao_alimentar)
                      .map(guest => (
                        <div key={guest.id} className="bg-stone-950/60 border border-stone-850 p-3.5 rounded-xl flex justify-between items-start gap-4">
                          <div>
                            <p className="font-serif text-sm text-stone-200 font-semibold">{guest.nome}</p>
                            <p className="text-xs text-stone-400 mt-0.5">📞 {guest.telefone || 'S/ Tel'}</p>
                          </div>
                          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs px-3 py-1.5 rounded-xl font-medium font-serif shrink-0">
                            ⚠️ {guest.restricao_alimentar}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 3: REAL-TIME ACCESS LOGS */}
          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-stone-900/15 border border-stone-800 rounded-3xl overflow-hidden shadow-xl"
            >
              {accessLogs.length === 0 ? (
                <div className="py-24 text-center">
                  <Clock size={40} className="text-stone-700 mx-auto mb-4" />
                  <p className="font-serif text-lg text-stone-300">Sem acessos registrados</p>
                  <p className="text-stone-500 text-xs mt-1">Os acessos serão listados aqui em tempo real assim que os convidados escanearem os QR Codes.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm font-sans text-stone-300">
                    <thead>
                      <tr className="bg-stone-900/60 text-stone-400 uppercase tracking-widest text-[9px] border-b border-stone-800">
                        <th className="py-4 px-6 font-semibold">Convidado</th>
                        <th className="py-4 px-6 font-semibold">Data / Hora</th>
                        <th className="py-4 px-6 font-semibold">Dispositivo</th>
                        <th className="py-4 px-6 font-semibold">Navegador</th>
                        <th className="py-4 px-6 font-semibold" title="Localização aproximada obtida pelo endereço IP">
                          📍 Cidade aproximada
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850 bg-stone-950/20">
                      {accessLogs.map((log) => {
                        const matchingGuest = guests.find(g => g.id === log.guest_id);
                        return (
                          <tr key={log.id} className="hover:bg-stone-900/20 transition-colors">
                            <td className="py-4 px-6">
                              <span className="font-serif text-stone-200 font-semibold text-sm">
                                {matchingGuest ? matchingGuest.nome : 'Excluído ou Desconhecido'}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-mono text-xs text-stone-400">
                              {new Date(log.data).toLocaleString('pt-BR')}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                log.celular === 'Sim'
                                  ? 'bg-gold-400/10 text-gold-300'
                                  : 'bg-stone-800 text-stone-400'
                              }`}>
                                <Smartphone size={10} />
                                {log.celular === 'Sim' ? 'Mobile' : 'Desktop'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-stone-400 text-xs">
                              {log.navegador}
                            </td>
                            <td className="py-4 px-6 text-stone-300 font-medium">
                              📍 {log.cidade}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>

      </div>

      {/* QR Code Viewer Modal */}
      <AnimatePresence>
        {showQrModal && qrGuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQrModal(false)}
              className="absolute inset-0 bg-stone-950/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 sm:p-8 text-center z-10 border border-stone-100 shadow-2xl relative"
            >
              <h3 className="font-serif text-stone-900 text-xl font-bold mb-1">QR Code de {qrGuest.nome}</h3>
              <p className="text-stone-500 text-xs font-sans mb-6">Escaneie para acessar o convite personalizado e fazer RSVP ou Check-in!</p>

              {/* QR Code Render Area */}
              <div className="bg-stone-50 border border-stone-100 p-4 rounded-2xl inline-block shadow-inner mb-6">
                <img
                  src={qrCodeDataUrl}
                  alt="Convite QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              {/* Short secure notice */}
              <div className="bg-gold-50 border border-gold-200/50 p-3.5 rounded-xl text-stone-700 text-xs leading-relaxed font-sans mb-6 text-left">
                🔒 <strong className="text-gold-900">Segurança Total:</strong> Este QR Code aponta para o link único do convidado. Ele impede que pessoas não convidadas acessem os dados ou mudem a confirmação de outros convidados.
              </div>

              {/* Action Rows */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCopyLink(qrGuest.id)}
                  className={`w-full py-3 rounded-xl flex items-center justify-center gap-1.5 font-sans font-medium text-xs uppercase tracking-wider cursor-pointer border transition-all ${
                    copiedLink
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-stone-900 hover:bg-stone-850 text-gold-100 border-stone-850 shadow-md'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check size={14} />
                      Link do Convite Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copiar Link Único
                    </>
                  )}
                </motion.button>

                <button
                  onClick={() => setShowQrModal(false)}
                  className="w-full py-2.5 text-stone-500 hover:text-stone-700 text-xs font-sans font-bold cursor-pointer"
                >
                  Fechar Janela
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
