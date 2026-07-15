import React, { useState } from 'react';
import { User, Lock, ArrowLeft, Eye, EyeOff, ShieldAlert, Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onClose: () => void;
  isRecepcao?: boolean;
}

export default function AdminLogin({ onLoginSuccess, onClose, isRecepcao = false }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsShaking(false);

    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      setIsShaking(true);
      return;
    }

    setLoading(true);

    // Simulate small aesthetic loading transition
    setTimeout(() => {
      if (username.trim() === 'admin' && password === 'guim123') {
        if (isRecepcao) {
          localStorage.setItem('recepcao_authenticated', 'true');
        } else {
          localStorage.setItem('admin_authenticated', 'true');
        }
        onLoginSuccess();
      } else {
        setError('Usuário ou senha incorretos.');
        setIsShaking(true);
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-watercolor px-4 py-12">
      {/* Dynamic ambient blur circles in background - CodePen high fidelity style */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gold-200/40 rounded-full filter blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold-300/30 rounded-full filter blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Floating peachy petal particles for extra wedding atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
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
              opacity: [0, 0.6, 0.6, 0],
              y: '105vh',
              x: `calc(100% + ${Math.random() * 100 - 50}px)`,
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

      {/* Back button to return to home screen */}
      <button
        onClick={onClose}
        className="absolute top-6 left-6 flex items-center gap-2 text-gold-800 hover:text-gold-950 text-xs uppercase tracking-widest font-bold cursor-pointer transition-all z-30 bg-white/50 hover:bg-white/80 py-2 px-4 rounded-full border border-gold-200/50 backdrop-blur-sm"
      >
        <ArrowLeft size={14} />
        Voltar para o Convite
      </button>

      {/* Main glassmorphic login card wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isShaking ? { x: [-10, 10, -10, 10, -5, 5, 0], opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-20 w-full max-w-[420px] bg-white/70 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-white/50 shadow-2xl flex flex-col items-center"
      >
        {/* Monogram Section (The requested logo background) */}
        <div className="w-full text-center mb-6">
          <svg viewBox="0 0 200 200" className="w-32 h-32 text-gold-500 fill-none stroke-current mx-auto -mt-4">
            {/* Elegant oval border */}
            <ellipse cx="100" cy="95" rx="58" ry="68" strokeWidth="1" strokeDasharray="3 2" className="text-gold-400/40" />
            <ellipse cx="100" cy="95" rx="55" ry="65" strokeWidth="1" className="text-gold-500/70" />
            
            {/* Initials */}
            <text x="68" y="105" fontFamily="var(--font-serif)" fontSize="42" fill="currentColor" stroke="none" fontWeight="300" className="text-gold-700">A</text>
            <text x="96" y="112" fontFamily="var(--font-serif)" fontSize="28" fill="currentColor" stroke="none" fontWeight="300" fontStyle="italic" className="text-gold-500">&amp;</text>
            <text x="112" y="122" fontFamily="var(--font-serif)" fontSize="42" fill="currentColor" stroke="none" fontWeight="300" className="text-gold-700">H</text>
            
            {/* Fine branches decoration */}
            <path d="M 52,110 Q 40,100 38,85" strokeWidth="0.8" className="text-gold-400/60" />
            <path d="M 38,85 Q 42,65 52,55" strokeWidth="0.6" className="text-gold-400/60" />
            <circle cx="38" cy="85" r="1.5" fill="currentColor" stroke="none" className="text-gold-500" />
            
            <path d="M 148,110 Q 160,100 162,85" strokeWidth="0.8" className="text-gold-400/60" />
            <path d="M 162,85 Q 158,65 148,55" strokeWidth="0.6" className="text-gold-400/60" />
            <circle cx="162" cy="85" r="1.5" fill="currentColor" stroke="none" className="text-gold-500" />
            
            {/* Small floral emblem at bottom */}
            <circle cx="100" cy="160" r="2" fill="currentColor" stroke="none" className="text-gold-600" />
            <path d="M 100,160 Q 94,155 96,151 Q 100,154 100,160" fill="currentColor" stroke="none" className="text-gold-500/70" />
            <path d="M 100,160 Q 106,155 104,151 Q 100,154 100,160" fill="currentColor" stroke="none" className="text-gold-500/70" />
          </svg>
          
          <h2 className="font-serif text-2xl text-gold-900 mt-2 tracking-wide font-semibold">
            {isRecepcao ? 'Controle de Portaria' : 'Painel dos Noivos'}
          </h2>
          <p className="text-gold-600/80 text-xs mt-1 uppercase tracking-widest font-semibold font-sans">
            {isRecepcao ? 'Acesso Restrito - Recepção' : 'Acesso Restrito'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl font-medium"
          >
            <ShieldAlert size={15} className="shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-5 font-sans">
          {/* Username Input */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500/70">
              <User size={16} />
            </span>
            <input
              type="text"
              placeholder="Usuário"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError('');
              }}
              disabled={loading}
              className="w-full bg-white/80 border border-gold-200/80 rounded-2xl py-3.5 pl-12 pr-4 text-gold-900 text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-400/20 transition-all placeholder:text-gold-400/70 font-medium"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500/70">
              <Lock size={16} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              disabled={loading}
              className="w-full bg-white/80 border border-gold-200/80 rounded-2xl py-3.5 pl-12 pr-12 text-gold-900 text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-400/20 transition-all placeholder:text-gold-400/70 font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500/70 hover:text-gold-800 p-1 cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3.5 bg-gold-600 hover:bg-gold-700 text-white font-serif font-bold text-sm tracking-widest uppercase rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Entrando...</span>
              </div>
            ) : (
              <>
                <span>{isRecepcao ? 'Acessar Portaria' : 'Acessar Painel'}</span>
              </>
            )}
          </motion.button>
        </form>

        {/* Delicate decorative line at bottom */}
        <div className="flex items-center gap-2 mt-8 w-full">
          <div className="h-[1px] bg-gold-200/50 flex-1" />
          <Heart size={10} className="text-gold-400 fill-current" />
          <div className="h-[1px] bg-gold-200/50 flex-1" />
        </div>
      </motion.div>
    </div>
  );
}
