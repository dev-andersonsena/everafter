import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Mic, MicOff, Volume2, VolumeX, Send, X, Sparkles, Loader2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Guest } from '../types';

interface Message {
  role: 'user' | 'model';
  content: string;
  action?: string;
}

interface VoiceChatbotProps {
  visible: boolean;
}

export default function VoiceChatbot({ visible }: VoiceChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Olá! Sou o Assessor Virtual da Alana e do Henderson. Vamos confirmar sua presença, lhe ajudo aqui no preenchimento! (Você pode falar comigo clicando no microfone!)',
      action: 'welcome_rsvp'
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  // RSVP Wizard State
  const [rsvpStep, setRsvpStep] = useState<
    | null
    | 'ASK_NAME'
    | 'SELECT_GUEST'
    | 'CONFIRM_ATTENDANCE'
    | 'ASK_PHONE'
    | 'ASK_EMAIL'
    | 'ASK_MESSAGE'
    | 'FINISHED'
  >(null);

  const [rsvpData, setRsvpData] = useState<{
    guestId?: string;
    nome: string;
    email: string;
    telefone: string;
    confirmado: boolean | null;
    mensagem: string;
  }>({
    nome: '',
    email: '',
    telefone: '',
    confirmado: null,
    mensagem: '',
  });

  const [matchedGuests, setMatchedGuests] = useState<Guest[]>([]);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [recognition, setRecognition] = useState<any>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [voicePitch, setVoicePitch] = useState<number>(() => {
    const saved = localStorage.getItem('wedding_voice_pitch');
    return saved ? parseFloat(saved) : 0.85; // Deeper, announcer-like pitch by default
  });
  const [voiceRate, setVoiceRate] = useState<number>(() => {
    const saved = localStorage.getItem('wedding_voice_rate');
    return saved ? parseFloat(saved) : 0.90; // Slower, clear broadcaster tempo
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load voices and listen to voiceschanged event
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Filter for Portuguese voices (Brazilian preferred, then European)
      const ptVoices = allVoices.filter(v => 
        v.lang.toLowerCase().startsWith('pt-br') || 
        v.lang.toLowerCase().startsWith('pt')
      );
      
      // Sort voices so that premium, male/broadcaster voices and Google/Apple/Microsoft voices are at the top
      ptVoices.sort((a, b) => {
        const aLower = a.name.toLowerCase();
        const bLower = b.name.toLowerCase();
        
        // Prioritize male names for the radio broadcaster feel requested by the user
        const maleKeywords = ['daniel', 'felipe', 'filipe', 'antonio', 'francisco', 'male', 'homem'];
        const aIsMale = maleKeywords.some(kw => aLower.includes(kw));
        const bIsMale = maleKeywords.some(kw => bLower.includes(kw));
        
        if (aIsMale && !bIsMale) return -1;
        if (!aIsMale && bIsMale) return 1;

        const aGoogle = aLower.includes('google') || aLower.includes('natural');
        const bGoogle = bLower.includes('google') || bLower.includes('natural');
        if (aGoogle && !bGoogle) return -1;
        if (!aGoogle && bGoogle) return 1;
        
        return 0;
      });

      setVoices(ptVoices);

      if (ptVoices.length > 0) {
        const savedVoiceName = localStorage.getItem('preferred_wedding_voice');
        const voiceExists = ptVoices.some(v => v.name === savedVoiceName);
        if (savedVoiceName && voiceExists) {
          setSelectedVoiceName(savedVoiceName);
        } else {
          // Find a male voice automatically if possible, otherwise use Google or default
          const maleKeywords = ['daniel', 'felipe', 'filipe', 'antonio', 'francisco', 'male', 'homem'];
          const maleVoice = ptVoices.find(v => maleKeywords.some(kw => v.name.toLowerCase().includes(kw)));
          const googleVoice = ptVoices.find(v => v.name.toLowerCase().includes('google') && v.lang.toLowerCase().startsWith('pt-br'));
          const ptBrVoice = ptVoices.find(v => v.lang.toLowerCase().startsWith('pt-br'));
          const finalDefault = maleVoice || googleVoice || ptBrVoice || ptVoices[0];
          setSelectedVoiceName(finalDefault.name);
        }
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'pt-BR';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
        // Cancel any current speaking when user starts talking
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
      };

      setRecognition(rec);
    }
  }, []);

  // Speak text using SpeechSynthesis
  const speakText = (text: string) => {
    if (!window.speechSynthesis || !isVoiceEnabled) return;

    // Cancel any previous speaking
    window.speechSynthesis.cancel();

    // Clean text from markdown/special characters for better speech
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .replace(/_/g, '')
      .replace(/https?:\/\/\S+/g, 'link de mapa')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch; // Deeper, announcer-like pitch by default or adjusted by slider

    // Find the chosen voice from the system
    if (selectedVoiceName) {
      const chosenVoice = voices.find(v => v.name === selectedVoiceName);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }
    } else {
      const ptVoice = voices.find(v => v.lang === 'pt-BR' || v.lang.startsWith('pt'));
      if (ptVoice) {
        utterance.voice = ptVoice;
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Toggle listening
  const toggleListening = () => {
    if (!recognition) {
      alert('Seu navegador não oferece suporte para reconhecimento de voz. Tente usar o Google Chrome ou Safari!');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  // Send message to backend
  const startRsvpWizard = () => {
    setRsvpStep('ASK_NAME');
    setRsvpData({
      nome: '',
      email: '',
      telefone: '',
      confirmado: null,
      mensagem: '',
    });
    setMatchedGuests([]);
    setIsLoading(false);
    
    const introMsg = 'Excelente! Vamos fazer a sua confirmação de presença passo a passo de forma simples. Para começarmos, qual é o seu nome completo?';
    setMessages(prev => [...prev, { role: 'model', content: introMsg }]);
    speakText(introMsg);
  };

  const handleSelectGuest = (g: Guest) => {
    setRsvpData(prev => ({ 
      ...prev, 
      guestId: g.id, 
      nome: g.nome,
      telefone: g.telefone || prev.telefone
    }));
    setRsvpStep('CONFIRM_ATTENDANCE');
    
    const reply = `Excelente! Confirmado que você é "${g.nome}". Você confirma que comparecerá ao casamento de Alana e Henderson?`;
    setMessages(prev => [...prev, { role: 'user', content: `Sou o(a) ${g.nome}` }, { role: 'model', content: reply }]);
    speakText(reply);
  };

  const handleNewGuestRegister = () => {
    setRsvpStep('CONFIRM_ATTENDANCE');
    const reply = `Sem problemas! Vamos criar um novo registro para você. Você confirma que comparecerá ao casamento de Alana e Henderson?`;
    setMessages(prev => [...prev, { role: 'user', content: 'Nenhum destes (Sou um novo convidado)' }, { role: 'model', content: reply }]);
    speakText(reply);
  };

  const handleRsvpStep = async (messageText: string) => {
    setIsLoading(true);
    
    // Slight artificial delay for natural feel
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      if (rsvpStep === 'ASK_NAME') {
        const nameInput = messageText.trim();
        setRsvpData(prev => ({ ...prev, nome: nameInput }));
        
        // Fetch pre-registered guests
        const res = await fetch('/api/guests');
        let matches: Guest[] = [];
        if (res.ok) {
          const allGuests: Guest[] = await res.json();
          const query = nameInput.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          matches = allGuests.filter(g => {
            const normalizedGuestName = g.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return normalizedGuestName.includes(query) || query.includes(normalizedGuestName);
          });
        }
        
        if (matches.length === 1) {
          const matchedGuest = matches[0];
          setRsvpData(prev => ({ 
            ...prev, 
            guestId: matchedGuest.id, 
            nome: matchedGuest.nome,
            telefone: matchedGuest.telefone || prev.telefone
          }));
          setRsvpStep('CONFIRM_ATTENDANCE');
          
          const reply = `Encontrei seu convite em nome de "${matchedGuest.nome}"! Você confirma que comparecerá ao casamento de Alana e Henderson?`;
          setMessages(prev => [...prev, { role: 'model', content: reply }]);
          speakText(reply);
        } else if (matches.length > 1) {
          setMatchedGuests(matches);
          setRsvpStep('SELECT_GUEST');
          
          const reply = `Encontrei mais de um convite com um nome semelhante. Por favor, escolha qual é você nas opções abaixo:`;
          setMessages(prev => [...prev, { role: 'model', content: reply, action: 'select_guest' }]);
          speakText(reply);
        } else {
          setRsvpStep('CONFIRM_ATTENDANCE');
          const reply = `Não encontrei seu nome pré-cadastrado na lista, mas não se preocupe! Vou realizar o seu cadastro agora mesmo. Você confirma que comparecerá ao casamento de Alana e Henderson?`;
          setMessages(prev => [...prev, { role: 'model', content: reply }]);
          speakText(reply);
        }
      }
      
      else if (rsvpStep === 'CONFIRM_ATTENDANCE') {
        const lower = messageText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const isAttending = lower.includes('sim') || lower.includes('vou') || lower.includes('confirmar') || lower.includes('comparecer') || lower.includes('com certeza');
        
        setRsvpData(prev => ({ ...prev, confirmado: isAttending }));
        
        if (isAttending) {
          setRsvpStep('ASK_PHONE');
          const reply = `Maravilha! Saber que você vai nos enche de alegria. Para podermos enviar lembretes importantes do evento, qual o seu número de telefone com DDD?`;
          setMessages(prev => [...prev, { role: 'model', content: reply }]);
          speakText(reply);
        } else {
          setRsvpStep('ASK_MESSAGE');
          const reply = `Poxa, que pena que você não poderá comparecer! Sentiremos sua falta nesse dia tão especial. Gostaria de deixar uma mensagem curta de carinho para Alana e Henderson? (Se não quiser, basta responder "Não").`;
          setMessages(prev => [...prev, { role: 'model', content: reply }]);
          speakText(reply);
        }
      }
      
      else if (rsvpStep === 'ASK_PHONE') {
        const phoneInput = messageText.trim();
        setRsvpData(prev => ({ ...prev, telefone: phoneInput }));
        
        setRsvpStep('ASK_EMAIL');
        const reply = `Anotado! Agora, qual o seu e-mail para que possamos lhe enviar a confirmação oficial e atualizações importantes?`;
        setMessages(prev => [...prev, { role: 'model', content: reply }]);
        speakText(reply);
      }
      
      else if (rsvpStep === 'ASK_EMAIL') {
        const emailInput = messageText.trim();
        setRsvpData(prev => ({ ...prev, email: emailInput }));
        
        setRsvpStep('ASK_MESSAGE');
        const reply = `Tudo certo! Para finalizarmos, gostaria de deixar uma mensagem curta de carinho para o casal? (Se não quiser, basta responder "Não").`;
        setMessages(prev => [...prev, { role: 'model', content: reply, action: 'ask_msg_note' }]);
        speakText(reply);
      }
      
      else if (rsvpStep === 'ASK_MESSAGE') {
        const messageInput = messageText.trim();
        const finalMessage = (messageInput.toLowerCase() === 'não' || messageInput.toLowerCase() === 'nao' || messageInput.toLowerCase() === 'não obrigado' || messageInput.toLowerCase() === 'não, obrigado') ? '' : messageInput;
        
        const finalRsvpData = {
          ...rsvpData,
          mensagem: finalMessage
        };
        
        setRsvpData(finalRsvpData);
        setRsvpStep('FINISHED');
        
        let apiSuccess = false;
        try {
          if (finalRsvpData.guestId) {
            const res = await fetch(`/api/guests/${finalRsvpData.guestId}/rsvp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                confirmado: finalRsvpData.confirmado,
                mensagem: finalRsvpData.mensagem,
                telefone: finalRsvpData.telefone,
                email: finalRsvpData.email
              })
            });
            apiSuccess = res.ok;
          } else {
            const res = await fetch('/api/guests/public-rsvp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                nome: finalRsvpData.nome,
                email: finalRsvpData.email || 'assessor.virtual@casamento.com',
                telefone: finalRsvpData.telefone,
                mensagem: finalRsvpData.mensagem
              })
            });
            apiSuccess = res.ok;
          }
        } catch (e) {
          console.error("Error saving RSVP via chatbot:", e);
        }
        
        const reply = `Sua presença foi confirmada com sucesso! Gostaria que eu criasse um lembrete no dia da cerimônia para você?`;
        setMessages(prev => [...prev, { role: 'model', content: reply, action: 'ask_calendar_reminder' }]);
        speakText(reply);
      }
      
      else if (rsvpStep === 'FINISHED') {
        const lower = messageText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const wantsReminder = lower.includes('sim') || lower.includes('quero') || lower.includes('confirmar') || lower.includes('adicionar') || lower.includes('salvar') || lower.includes('lembrete');
        
        if (wantsReminder) {
          const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Casamento+de+Alana+%26+Henderson&dates=20260907T180000Z/20260908T010000Z&details=Casamento+de+Alana+Leticia+%26+Henderson+Venicius.+Confirmado+com+sucesso+pelo+assessor+virtual!&location=Prime+Eventos,+R.+Deocl%C3%A9cio+Brito,+3399+-+Planalto`;
          window.open(googleCalendarUrl, '_blank');
          
          const text = "Lembrete aberto! Você será direcionado para salvar o compromisso no seu calendário Google. Estaremos esperando você com muito carinho!";
          setMessages(prev => [...prev, { role: 'model', content: text }]);
          speakText(text);
        } else {
          const text = "Sem problemas! Estaremos esperando por você no dia 7 de Setembro às 15:00 no Prime Eventos.\n\nVou lhe fornecer a localização no mapa, caso no dia voce tiver duvidas, basta abrir o site que temos a localização ou se preferir so me pedir que lhe envio imediatamente!";
          setMessages(prev => [...prev, { role: 'model', content: text, action: 'open_map_cerimonia' }]);
          speakText(text);
        }
        setRsvpStep(null);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', content: 'Tive uma pequena falha de conexão no preenchimento. Vamos tentar o passo anterior?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;

    if (!textToSend) {
      setInput('');
    }

    const newUserMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    // Cancel any ongoing speaking
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    // Intercept if RSVP Wizard is active
    if (rsvpStep !== null) {
      await handleRsvpStep(messageText);
      return;
    }

    // Intercept if they say they want to confirm RSVP in general chat
    const lowerText = messageText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (lowerText.includes("confirmar") || lowerText.includes("presenca") || lowerText.includes("presença") || lowerText.includes("rsvp")) {
      startRsvpWizard();
      return;
    }

    try {
      // Keep only last 8 messages for context safety
      const historyContext = messages.slice(-8);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: historyContext,
        }),
      });

      if (!res.ok) throw new Error('Erro na requisição do chat');
      const data = await res.json();

      const botMessage: Message = { 
        role: 'model', 
        content: data.text,
        action: data.action
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Auto open maps if they explicitly ask to open/show/navigate
      const lowerInput = messageText.toLowerCase();
      const wishesToOpen = lowerInput.includes("abrir") || lowerInput.includes("abre") || lowerInput.includes("ir para") || lowerInput.includes("navegar") || lowerInput.includes("como chegar") || lowerInput.includes("maps") || lowerInput.includes("direção") || lowerInput.includes("direcao") || lowerInput.includes("link");
      
      if (wishesToOpen) {
        if (data.action === 'open_map_cerimonia') {
          window.open('https://www.google.com/maps/search/?api=1&query=Prime+Eventos+R.+Deocl%C3%A9cio+Brito,+3399+-+Planalto', '_blank');
        } else if (data.action === 'open_map_celebracao') {
          window.open('https://www.google.com/maps/search/?api=1&query=Prime+Eventos+R.+Deocl%C3%A9cio+Brito,+3399+-+Planalto', '_blank');
        }
      }

      // Voice feedback
      if (isVoiceEnabled) {
        speakText(data.text);
      }
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        role: 'model',
        content: 'Desculpe, tive um probleminha para me conectar. Você pode me perguntar novamente?',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Toggle voice settings
  const toggleVoice = () => {
    const nextState = !isVoiceEnabled;
    setIsVoiceEnabled(nextState);
    if (!nextState && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Close and stop speaking
  const handleClose = () => {
    setIsOpen(false);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    if (recognition && isListening) {
      recognition.stop();
    }
  };

  return (
    <motion.div
      id="voice-chatbot-container"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: visible ? 1 : 0, 
        scale: visible ? 1 : 0.8,
        pointerEvents: visible ? 'auto' : 'none'
      }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-[360px] sm:w-[380px] h-[500px] bg-white/95 backdrop-blur-md rounded-3xl border border-gold-200 shadow-2xl overflow-hidden flex flex-col mb-4 relative"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-gold-600 via-gold-700 to-gold-800 p-4 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/15 rounded-xl relative">
                  <Sparkles size={16} className="text-gold-100 animate-pulse" />
                  {isSpeaking && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm tracking-wide">Assessor de Casamento</h3>
                  <p className="text-[10px] font-sans text-gold-100/90 tracking-wider">IA</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer ${showSettings ? 'bg-white/15 text-white' : 'text-gold-100'}`}
                  title="Configurar Voz"
                >
                  <Settings size={16} />
                </button>
                <button
                  onClick={toggleVoice}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-gold-100"
                  title={isVoiceEnabled ? 'Desativar voz' : 'Ativar voz'}
                >
                  {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-gold-100"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Voice Settings Panel */}
            {showSettings && (
              <div className="bg-stone-50 p-3.5 border-b border-gold-200/50 shadow-inner flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-sans font-extrabold text-stone-500 uppercase tracking-widest">
                    🎙️ Configuração da Voz (Modo Locutor)
                  </span>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="text-[10px] text-stone-400 hover:text-stone-600 font-bold uppercase cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
                
                {/* Voice Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-semibold text-stone-500 uppercase tracking-wider block">
                    Selecione a Voz:
                  </label>
                  {voices.length > 0 ? (
                    <select
                      value={selectedVoiceName}
                      onChange={(e) => {
                        const newVoiceName = e.target.value;
                        setSelectedVoiceName(newVoiceName);
                        localStorage.setItem('preferred_wedding_voice', newVoiceName);
                        
                        // Speak test sample
                        setTimeout(() => {
                          const chosenVoice = voices.find(v => v.name === newVoiceName);
                          if (chosenVoice && window.speechSynthesis) {
                            window.speechSynthesis.cancel();
                            const testUtterance = new SpeechSynthesisUtterance("Voz selecionada.");
                            testUtterance.voice = chosenVoice;
                            testUtterance.pitch = voicePitch;
                            testUtterance.rate = voiceRate;
                            testUtterance.lang = 'pt-BR';
                            window.speechSynthesis.speak(testUtterance);
                          }
                        }, 100);
                      }}
                      className="w-full bg-white text-xs border border-stone-200 rounded-xl px-2.5 py-2 text-stone-700 focus:outline-none focus:ring-1 focus:ring-gold-500 font-sans cursor-pointer shadow-xs"
                    >
                      {voices.map((v) => {
                        const nameLower = v.name.toLowerCase();
                        const isGoogle = nameLower.includes('google') || nameLower.includes('natural');
                        const isApple = nameLower.includes('luciana') || nameLower.includes('felipe') || nameLower.includes('samantha') || nameLower.includes('daniel') || nameLower.includes('premium');
                        const tag = isGoogle ? '⭐ Voz Natural' : (isApple ? '📱 Apple Premium' : '🗣️ Padrão');
                        return (
                          <option key={v.name} value={v.name}>
                            {v.name.replace("Google", "").replace("Microsoft", "").replace("Desktop", "").trim()} ({tag})
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="text-[10px] text-stone-500 font-sans">
                      Carregando vozes nativas do seu navegador...
                    </div>
                  )}
                </div>

                {/* Pitch (Tom da Voz) Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-sans font-semibold text-stone-500 uppercase tracking-wider">
                    <span>Tom da Voz: {voicePitch < 1.0 ? 'Mais Grave 🎙️' : 'Mais Agudo 🗣️'}</span>
                    <span className="text-stone-400 font-mono">({voicePitch.toFixed(2)})</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={voicePitch}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setVoicePitch(value);
                      localStorage.setItem('wedding_voice_pitch', value.toString());
                    }}
                    className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-gold-600 focus:outline-none"
                  />
                  <div className="flex justify-between text-[8px] text-stone-400 font-sans px-0.5">
                    <span>Grave (Locutor de Rádio)</span>
                    <span>Padrão</span>
                    <span>Agudo</span>
                  </div>
                </div>

                {/* Rate (Velocidade da Voz) Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-sans font-semibold text-stone-500 uppercase tracking-wider">
                    <span>Velocidade de Fala:</span>
                    <span className="text-stone-400 font-mono">({voiceRate.toFixed(2)}x)</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.4"
                    step="0.05"
                    value={voiceRate}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setVoiceRate(value);
                      localStorage.setItem('wedding_voice_rate', value.toString());
                    }}
                    className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-gold-600 focus:outline-none"
                  />
                  <div className="flex justify-between text-[8px] text-stone-400 font-sans px-0.5">
                    <span>Lenta (Solene)</span>
                    <span>Normal</span>
                    <span>Rápida</span>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-stone-200/60 flex items-center justify-between">
                  <button
                    onClick={() => {
                      // Apply standard broadcaster settings (Deper and slightly slower)
                      setVoicePitch(0.80);
                      setVoiceRate(0.88);
                      localStorage.setItem('wedding_voice_pitch', '0.80');
                      localStorage.setItem('wedding_voice_rate', '0.88');
                      
                      setTimeout(() => {
                        if (window.speechSynthesis) {
                          window.speechSynthesis.cancel();
                          const testUtterance = new SpeechSynthesisUtterance("Modo Locutor de Rádio ativado!");
                          const chosenVoice = voices.find(v => v.name === selectedVoiceName) || voices[0];
                          if (chosenVoice) testUtterance.voice = chosenVoice;
                          testUtterance.pitch = 0.80;
                          testUtterance.rate = 0.88;
                          testUtterance.lang = 'pt-BR';
                          window.speechSynthesis.speak(testUtterance);
                        }
                      }, 100);
                    }}
                    className="px-2 py-1 bg-gold-50 hover:bg-gold-100 border border-gold-200 rounded-lg text-[9px] font-sans font-bold text-gold-800 transition-colors cursor-pointer"
                  >
                    ⚡ Ativar Modo Locutor 📻
                  </button>
                  <p className="text-[8px] text-stone-400 leading-none text-right font-sans">
                    Vozes excelentes no Chrome e Safari.
                  </p>
                </div>
              </div>
            )}

            {/* Speaking/Audio status wave */}
            {(isSpeaking || isListening) && (
              <div className="bg-gold-50/80 px-4 py-2 border-b border-gold-100 flex items-center justify-between text-xs font-sans text-gold-800">
                <div className="flex items-center gap-2">
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-gold-600 animate-[bounce_0.8s_infinite_100ms] rounded-full h-2"></span>
                    <span className="w-0.5 bg-gold-600 animate-[bounce_0.8s_infinite_300ms] rounded-full h-3"></span>
                    <span className="w-0.5 bg-gold-600 animate-[bounce_0.8s_infinite_200ms] rounded-full h-1.5"></span>
                    <span className="w-0.5 bg-gold-600 animate-[bounce_0.8s_infinite_400ms] rounded-full h-2.5"></span>
                  </div>
                  <span>{isListening ? 'Ouvindo você...' : 'Falando com você...'}</span>
                </div>
                {isSpeaking && (
                  <button
                    onClick={() => {
                      if (window.speechSynthesis) window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    }}
                    className="text-[10px] uppercase font-bold text-amber-700 hover:text-amber-900 cursor-pointer"
                  >
                    Parar Áudio
                  </button>
                )}
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-stone-50/50">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gold-600 text-white font-sans rounded-tr-none shadow-sm'
                        : 'bg-white text-stone-800 border border-stone-200/60 font-sans rounded-tl-none shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    
                    {msg.role === 'model' && (msg.action || (rsvpStep && index === messages.length - 1)) && (
                      <div className="mt-3 pt-2.5 border-t border-stone-100/70 flex flex-col gap-2">
                        {msg.action === 'welcome_rsvp' && (
                          <div className="flex flex-col gap-2">
                            <p className="text-[10px] text-stone-500 font-sans font-medium mb-1">Como você prefere prosseguir?</p>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                onClick={() => startRsvpWizard()}
                                className="px-3 py-2 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-700 hover:to-gold-800 text-white font-sans font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                              >
                                ✍️ Sim, Vamos Confirmar!
                              </button>
                              <button
                                onClick={() => {
                                  const text = "Tudo bem! Pode digitar ou falar sua dúvida sobre o casamento que vou te responder.";
                                  setMessages(prev => [...prev, { role: 'model', content: text }]);
                                  speakText(text);
                                }}
                                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-sans font-semibold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1 border border-stone-200"
                              >
                                💬 Tirar Dúvidas com IA.
                              </button>
                            </div>
                          </div>
                        )}

                        {msg.action === 'select_guest' && (
                          <div className="flex flex-col gap-1.5">
                            <p className="text-[10px] text-stone-500 font-sans font-medium mb-1">Escolha o seu nome da lista:</p>
                            {matchedGuests.map((g, idx) => (
                              <button
                                key={g.id || idx}
                                onClick={() => handleSelectGuest(g)}
                                className="w-full text-left px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-stone-800 font-sans font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between"
                              >
                                <span>👤 {g.nome}</span>
                                <span className="text-[10px] text-amber-700 uppercase font-bold">Selecionar ➔</span>
                              </button>
                            ))}
                            <button
                              onClick={() => handleNewGuestRegister()}
                              className="w-full text-left px-3 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 font-sans font-medium rounded-xl text-xs transition-all cursor-pointer"
                            >
                              ❌ Nenhum destes (Sou um novo convidado)
                            </button>
                          </div>
                        )}

                        {rsvpStep === 'CONFIRM_ATTENDANCE' && index === messages.length - 1 && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSendMessage('Sim, vou comparecer')}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                              ⛪ Sim, vou comparecer!
                            </button>
                            <button
                              onClick={() => handleSendMessage('Não poderei ir')}
                              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-sans font-bold rounded-xl text-xs transition-all cursor-pointer"
                            >
                              ❌ Não poderei ir
                            </button>
                          </div>
                        )}



                        {msg.action === 'ask_msg_note' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSendMessage('Não, obrigado')}
                              className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-sans font-semibold rounded-lg text-xs transition-all cursor-pointer"
                            >
                              Não, obrigado
                            </button>
                          </div>
                        )}

                        {msg.action === 'ask_calendar_reminder' && (
                          <div className="flex flex-col gap-2">
                            <p className="text-[10px] text-stone-500 font-sans font-medium mb-1">Toque para adicionar ao seu celular:</p>
                            <div className="flex flex-col gap-1.5">
                              <button
                                onClick={() => {
                                  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Casamento+de+Alana+%26+Henderson&dates=20260907T180000Z/20260908T010000Z&details=Casamento+de+Alana+Leticia+%26+Henderson+Venicius.+Confirmado+com+sucesso+pelo+assessor+virtual!&location=Prime+Eventos,+R.+Deocl%C3%A9cio+Brito,+3399+-+Planalto`;
                                  window.open(googleCalendarUrl, '_blank');
                                  
                                  const text = "Lembrete aberto! Você será direcionado para salvar o compromisso no seu calendário Google. Estaremos esperando você com muito carinho!";
                                  setMessages(prev => [...prev, { role: 'model', content: text }]);
                                  speakText(text);
                                  setRsvpStep(null);
                                }}
                                className="w-full text-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                📅 Sim, salvar no Google Agenda ↗
                              </button>
                              <button
                                onClick={() => {
                                  const text = "Sem problemas! Estaremos esperando por você no dia 7 de Setembro às 15:00 no Prime Eventos.\n\nVou lhe fornecer a localização no mapa, caso no dia voce tiver duvidas, basta abrir o site que temos a localização ou se preferir so me pedir que lhe envio imediatamente!";
                                  setMessages(prev => [...prev, { role: 'model', content: text, action: 'open_map_cerimonia' }]);
                                  speakText(text);
                                  setRsvpStep(null);
                                }}
                                className="w-full text-center px-4 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-500 font-sans font-medium rounded-xl text-[11px] transition-all cursor-pointer"
                              >
                                Não precisa, obrigado
                              </button>
                            </div>
                          </div>
                        )}

                        {msg.action === 'ask_location_type' && (
                          <>
                            <p className="text-[10px] text-stone-500 font-sans font-medium mb-1">Selecione uma opção para ver detalhes e mapa:</p>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                onClick={() => handleSendMessage('Quero a localização da Cerimônia')}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-[10px] font-sans font-semibold text-amber-800 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                ⛪ Cerimônia (Prime Eventos)
                              </button>
                              <button
                                onClick={() => handleSendMessage('Quero a localização da Celebração')}
                                className="px-2.5 py-1.5 bg-gold-50 hover:bg-gold-100 border border-gold-200 rounded-lg text-[10px] font-sans font-semibold text-gold-800 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                🎉 Celebração (Festa)
                              </button>
                            </div>
                          </>
                        )}
                        {msg.action === 'open_map_cerimonia' && (
                          <button
                            onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=Prime+Eventos+R.+Deocl%C3%A9cio+Brito,+3399+-+Planalto', '_blank')}
                            className="w-full justify-center px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[10px] font-sans font-bold text-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            🗺️ Abrir no Google Maps (Cerimônia) ↗
                          </button>
                        )}
                        {msg.action === 'open_map_celebracao' && (
                          <button
                            onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=Prime+Eventos+R.+Deocl%C3%A9cio+Brito,+3399+-+Planalto', '_blank')}
                            className="w-full justify-center px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[10px] font-sans font-bold text-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            🗺️ Abrir no Google Maps (Celebração) ↗
                          </button>
                        )}
                        {msg.action === 'show_both_maps' && (
                          <div className="flex flex-col gap-1.5">
                            <button
                              onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=Prime+Eventos+R.+Deocl%C3%A9cio+Brito,+3399+-+Planalto', '_blank')}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[10px] font-sans font-bold text-emerald-800 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              ⛪ Mapa da Cerimônia ↗
                            </button>
                            <button
                              onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=Prime+Eventos+R.+Deocl%C3%A9cio+Brito,+3399+-+Planalto', '_blank')}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[10px] font-sans font-bold text-emerald-800 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              🎉 Mapa da Celebração ↗
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {msg.role === 'model' && isVoiceEnabled && index === messages.length - 1 && !isSpeaking && (
                      <button
                        onClick={() => speakText(msg.content)}
                        className="mt-1.5 text-[9px] text-gold-600 font-extrabold hover:text-gold-800 cursor-pointer uppercase tracking-wider flex items-center gap-1"
                      >
                        🔊 Ouvir Novamente
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-stone-500 rounded-2xl rounded-tl-none p-3.5 text-xs border border-stone-100 flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin text-gold-600" />
                    <span>Pensando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-gold-100 bg-white flex items-center gap-2">
              {recognition ? (
                <button
                  onClick={toggleListening}
                  className={`p-2.5 rounded-full transition-all cursor-pointer flex-shrink-0 relative ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gold-50 hover:bg-gold-100 text-gold-700'
                  }`}
                  title={isListening ? 'Parar microfone' : 'Falar por voz'}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              ) : null}

              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Pergunte-me algo..."
                className="flex-grow bg-stone-50 hover:bg-stone-100/70 focus:bg-white text-xs border border-stone-200 rounded-2xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-gold-500 text-stone-800 transition-colors"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-gold-600 hover:bg-gold-700 disabled:bg-stone-100 text-white disabled:text-stone-300 rounded-full transition-all cursor-pointer flex-shrink-0 shadow-sm"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating launcher Button */}
      <motion.button
        id="chatbot-launcher-button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-700 hover:to-gold-800 text-white shadow-lg shadow-gold-900/20 flex items-center justify-center cursor-pointer border border-gold-400/40 relative group"
      >
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
        <MessageCircle size={22} className="group-hover:rotate-6 transition-transform duration-300" />
      </motion.button>
    </motion.div>
  );
}
