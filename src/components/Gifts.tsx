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
    <section id="presentes" className="py-20 sm:py-28 bg-white px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Heading */}
        <div className="text-center mb-16">
          <div className="inline-flex p-3 bg-gold-100 rounded-2xl text-gold-600 mb-4 shadow-sm">
            <Gift size={24} />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-stone-900 tracking-tight">Lista de Presentes</h2>
          <div className="w-16 h-[1.5px] bg-gold-300 mx-auto mt-4" />
          <p className="text-stone-600 font-sans text-sm sm:text-base max-w-xl mx-auto mt-4 leading-relaxed">
            Optamos por uma <span className="text-gold-600 font-medium">Lista Virtual</span>, onde as cotas e presentes selecionados são convertidos diretamente em saldo para montarmos nossa nova casa e realizarmos nossa lua de mel!
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
                  ? 'bg-stone-900 text-gold-100 shadow-md font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
                className="group bg-gold-50/50 border border-stone-100 hover:border-gold-200/50 rounded-3xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Card Image */}
                  <div className="relative h-48 sm:h-56 rounded-2xl overflow-hidden mb-4 bg-stone-100">
                    <img 
                      src={gift.image} 
                      alt={gift.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Badge */}
                    {gift.isSuggested && (
                      <span className="absolute top-3 left-3 bg-stone-900/85 backdrop-blur-md text-gold-200 text-[10px] font-sans font-medium uppercase tracking-widest px-2.5 py-1 rounded-full border border-gold-300/20">
                        Sugerido
                      </span>
                    )}

                    <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-stone-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                      {gift.category}
                    </span>
                  </div>

                  {/* Card Info */}
                  <div className="px-1 mb-6">
                    <h3 className="font-serif text-lg sm:text-xl text-stone-900 font-medium mb-1 group-hover:text-gold-700 transition-colors">
                      {gift.name}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed font-sans mb-3 h-8">
                      {gift.description}
                    </p>
                    <p className="font-serif text-gold-600 font-bold text-lg">
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
                  className="w-full py-3 px-4 rounded-xl border border-gold-300/30 bg-white hover:bg-gold-500 hover:text-stone-950 text-gold-600 font-sans text-xs font-semibold uppercase tracking-widest cursor-pointer transition-colors duration-300 text-center"
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
                className="absolute inset-0 bg-stone-950/70 backdrop-blur-md"
              />

              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden z-10 border border-stone-100 max-h-[90vh] flex flex-col"
              >
                {/* Header Close Button */}
                <button
                  onClick={() => setActiveGift(null)}
                  className="absolute top-4 right-4 z-20 p-2 rounded-full bg-stone-100/80 hover:bg-stone-200 text-stone-600 cursor-pointer transition-colors"
                  aria-label="Fechar"
                >
                  <X size={16} />
                </button>

                {/* Content */}
                <div className="overflow-y-auto p-6 sm:p-8">
                  
                  {/* Gift Info Preview */}
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center pb-6 border-b border-stone-100 mb-6">
                    <img
                      src={activeGift.image}
                      alt={activeGift.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-stone-100 shrink-0"
                    />
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-gold-500 font-sans font-semibold">
                        {activeGift.category}
                      </span>
                      <h4 className="font-serif text-xl sm:text-2xl text-stone-900 font-medium">
                        {activeGift.name}
                      </h4>
                      <p className="font-serif text-lg text-gold-600 font-bold mt-1">
                        {formatPrice(activeGift.price)}
                      </p>
                    </div>
                  </div>

                  {/* Virtual Cash List Notice */}
                  <div className="bg-gold-50/70 border border-gold-200/40 p-4 rounded-2xl text-stone-700 text-xs sm:text-sm font-sans mb-6 space-y-2">
                    <p className="font-semibold flex items-center gap-1.5 text-gold-800">
                      <Info size={16} className="text-gold-600" />
                      Como funciona o presente?
                    </p>
                    <p className="leading-relaxed text-stone-600 text-xs">
                      O presente escolhido é virtual! Ao efetuar o Pix, a quantia equivalente é depositada na conta dos noivos. Nós usaremos esse saldo para adquirir o item ou realizar a experiência durante nossa lua de mel!
                    </p>
                  </div>

                  {/* Pix Details Block */}
                  <div className="border border-stone-100 bg-stone-50 rounded-2xl p-5 mb-6 space-y-4 font-sans">
                    
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 uppercase tracking-wider font-semibold">
                      <ShieldCheck size={16} className="text-green-500" />
                      Dados do Pix dos Noivos
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-xs sm:text-sm text-stone-700">
                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase tracking-widest">Titular</span>
                        <span className="font-medium text-stone-900">{weddingDetails.pixName}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-stone-400 block text-[10px] uppercase tracking-widest">Banco</span>
                          <span className="font-medium text-stone-900">{weddingDetails.pixBank}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px] uppercase tracking-widest">Chave Pix</span>
                          <span className="font-medium text-stone-900 select-all truncate">{weddingDetails.pixKey}</span>
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
                          : 'bg-stone-900 hover:bg-stone-800 text-gold-100 border-stone-800 shadow-md'
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
                      )}
                    </motion.button>
                  </div>

                  {/* Confirmation / WhatsApp instructions */}
                  <div className="space-y-4">
                    <p className="text-xs text-stone-500 font-sans text-center">
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
