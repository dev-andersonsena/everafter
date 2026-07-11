import { useState } from 'react';
import { Gift, Copy, Check, Info, X, MessageSquare, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { giftItems, weddingDetails } from '../data';
import { GiftItem } from '../types';

export default function Gifts() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [activeGift, setActiveGift] = useState<GiftItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter categories
  const categories = ['Todos', 'Lua de Mel', 'Cozinha', 'Eletros', 'Decoração'];

  const filteredGifts = selectedCategory === 'Todos'
    ? giftItems
    : giftItems.filter(item => item.category === selectedCategory);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(weddingDetails.pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getWhatsAppLink = (giftName: string, price: number) => {
    const text = `Olá Henderson e Alana! Gostaria de presentear vocês com o item: "${giftName}" no valor de ${formatPrice(price)}. Acabei de fazer a transferência do Pix e estou enviando o comprovante!`;
    return `https://wa.me/5554999999999?text=${encodeURIComponent(text)}`; // Dummy WhatsApp number
  };

  return (
    <section id="presentes" className="py-20 sm:py-28 bg-gold-50/20 px-4 border-t border-b border-gold-200/20">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Heading */}
        <div className="text-center mb-16">
          <div className="inline-flex p-3 bg-gold-100 rounded-2xl text-gold-600 mb-4 shadow-sm">
            <Gift size={24} />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-gold-800 tracking-tight font-bold">Lista de Presentes</h2>
          <div className="w-16 h-[1.5px] bg-gold-300 mx-auto mt-4" />
          <p className="text-gold-900/80 font-sans text-sm sm:text-base max-w-xl mx-auto mt-4 leading-relaxed font-medium">
            Optamos por uma <span className="text-gold-600 font-bold">Lista Virtual</span>, onde as cotas e presentes selecionados são convertidos diretamente em saldo para montarmos nossa nova casa e realizarmos nossa lua de mel!
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2.5 rounded-full text-xs font-sans tracking-wide uppercase transition-all duration-300 cursor-pointer ${
                selectedCategory === category
                  ? 'bg-gold-600 text-white shadow-sm font-semibold'
                  : 'bg-gold-100/50 text-gold-700 hover:bg-gold-100/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gifts Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredGifts.map((gift) => (
              <motion.div
                layout
                key={gift.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="group bg-white border border-gold-100 hover:border-gold-300/60 rounded-3xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Card Image */}
                  <div className="relative h-48 sm:h-56 rounded-2xl overflow-hidden mb-4 bg-gold-50/30">
                    <img 
                      src={gift.image} 
                      alt={gift.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Badge */}
                    {gift.isSuggested && (
                      <span className="absolute top-3 left-3 bg-gold-600/90 backdrop-blur-md text-white text-[10px] font-sans font-medium uppercase tracking-widest px-2.5 py-1 rounded-full border border-gold-400/20">
                        Sugerido
                      </span>
                    )}

                    <span className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-gold-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {gift.category}
                    </span>
                  </div>

                  {/* Card Info */}
                  <div className="px-1 mb-6">
                    <h3 className="font-serif text-lg sm:text-xl text-gold-800 font-bold mb-1 group-hover:text-gold-700 transition-colors">
                      {gift.name}
                    </h3>
                    <p className="text-xs text-gold-700/80 line-clamp-2 leading-relaxed font-sans mb-3 h-8 font-medium">
                      {gift.description}
                    </p>
                    <p className="font-serif text-gold-700 font-bold text-lg">
                      {formatPrice(gift.price)}
                    </p>
                  </div>
                </div>

                {/* Gift Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveGift(gift);
                    setCopied(false);
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-gold-300/30 bg-white hover:bg-gold-600 hover:text-white text-gold-600 font-sans text-xs font-semibold uppercase tracking-widest cursor-pointer transition-colors duration-300 text-center shadow-sm"
                >
                  Presentear Noivos
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Dynamic Detail Modal / Slide-over */}
        <AnimatePresence>
          {activeGift && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              
              {/* Blur backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveGift(null)}
                className="absolute inset-0 bg-gold-950/40 backdrop-blur-md"
              />

              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden z-10 border border-gold-100 max-h-[90vh] flex flex-col"
              >
                {/* Header Close Button */}
                <button
                  onClick={() => setActiveGift(null)}
                  className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gold-50 hover:bg-gold-100 text-gold-700 cursor-pointer transition-colors"
                  aria-label="Fechar"
                >
                  <X size={16} />
                </button>

                {/* Content */}
                <div className="overflow-y-auto p-6 sm:p-8">
                  
                  {/* Gift Info Preview */}
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center pb-6 border-b border-gold-100 mb-6">
                    <img
                      src={activeGift.image}
                      alt={activeGift.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-gold-100 shrink-0"
                    />
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-gold-500 font-sans font-semibold">
                        {activeGift.category}
                      </span>
                      <h4 className="font-serif text-xl sm:text-2xl text-gold-800 font-bold">
                        {activeGift.name}
                      </h4>
                      <p className="font-serif text-lg text-gold-700 font-bold mt-1">
                        {formatPrice(activeGift.price)}
                      </p>
                    </div>
                  </div>

                  {/* Virtual Cash List Notice */}
                  <div className="bg-watercolor-soft border border-gold-200/50 p-4 rounded-2xl text-gold-950 text-xs sm:text-sm font-sans mb-6 space-y-2">
                    <p className="font-semibold flex items-center gap-1.5 text-gold-800">
                      <Info size={16} className="text-gold-600" />
                      Como funciona o presente?
                    </p>
                    <p className="leading-relaxed text-gold-900/90 font-medium text-xs">
                      O presente escolhido é virtual! Ao efetuar o Pix, a quantia equivalente é depositada na conta dos noivos. Nós usaremos esse saldo para adquirir o item ou realizar a experiência durante nossa lua de mel!
                    </p>
                  </div>

                  {/* Pix Details Block */}
                  <div className="border border-gold-100 bg-gold-50/40 rounded-2xl p-5 mb-6 space-y-4 font-sans">
                    
                    <div className="flex items-center gap-1.5 text-xs text-gold-600 uppercase tracking-wider font-bold">
                      <ShieldCheck size={16} className="text-green-600" />
                      Dados do Pix dos Noivos
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-xs sm:text-sm text-gold-900">
                      <div>
                        <span className="text-gold-500 block text-[10px] uppercase tracking-widest font-bold">Titular</span>
                        <span className="font-bold text-gold-800">{weddingDetails.pixName}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gold-500 block text-[10px] uppercase tracking-widest font-bold">Banco</span>
                          <span className="font-bold text-gold-800">{weddingDetails.pixBank}</span>
                        </div>
                        <div>
                          <span className="text-gold-500 block text-[10px] uppercase tracking-widest font-bold">Chave Pix</span>
                          <span className="font-bold text-gold-850 select-all truncate">{weddingDetails.pixKey}</span>
                        </div>
                      </div>
                    </div>

                    {/* Copy Button */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleCopyPix}
                      className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-sans font-medium text-xs sm:text-sm uppercase tracking-wider cursor-pointer border transition-all duration-300 ${
                        copied
                          ? 'bg-green-500 text-white border-green-500 shadow-md'
                          : 'bg-gold-600 hover:bg-gold-700 text-white border-gold-500 shadow-md'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check size={16} />
                          Chave Copiada!
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copiar Chave Pix
                        </>
                      )
                      }
                    </motion.button>
                  </div>

                  {/* Confirmation / WhatsApp instructions */}
                  <div className="space-y-4">
                    <p className="text-xs text-gold-600 font-sans font-semibold text-center">
                      * Após fazer a transferência do Pix, você pode clicar no botão abaixo para nos enviar o comprovante via WhatsApp e nos dar a alegria de comemorar!
                    </p>

                    <motion.a
                      href={getWhatsAppLink(activeGift.name, activeGift.price)}
                      target="_blank"
                      rel="noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-sans text-xs sm:text-sm font-semibold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-green-500/10 text-center"
                    >
                      <MessageSquare size={16} fill="currentColor" />
                      Enviar Comprovante por WhatsApp
                    </motion.a>
                  </div>

                </div>
              </motion.div>

            </div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
