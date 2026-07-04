import { MapPin, Clock, Shirt, Info, Car, CalendarHeart } from 'lucide-react';
import { motion } from 'motion/react';
import { weddingDetails } from '../data';

export default function Details() {
  return (
    <section id="evento" className="py-20 sm:py-28 bg-gold-50 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Section Heading */}
        <div className="text-center mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center gap-2 mb-3"
          >
            <CalendarHeart className="text-gold-500" size={24} />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-stone-900 tracking-tight"
          >
            O Grande Dia
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-16 h-[1.5px] bg-gold-300 mx-auto mt-4" 
          />
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.7 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, delay: 0.3 }}
            className="text-stone-600 font-sans text-sm sm:text-base max-w-lg mx-auto mt-4"
          >
            Tudo o que você precisa saber sobre o local, horários e recomendações para o nosso casamento.
          </motion.p>
        </div>

        {/* Ceremony and Celebration grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          
          {/* Ceremony Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-stone-100 flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex p-3 bg-gold-100/50 rounded-2xl text-gold-600 mb-6">
                <Clock size={24} />
              </div>
              <h3 className="font-serif text-2xl text-stone-900 mb-4">A Cerimônia</h3>
              
              <div className="space-y-4 text-stone-600 mb-8">
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-gold-400 mt-1 shrink-0" />
                  <div>
                    <p className="font-sans text-xs uppercase tracking-wider text-stone-400">Horário</p>
                    <p className="font-serif text-stone-800 font-medium">Sábado, 10 de Outubro de 2026, às {weddingDetails.ceremonyTime}h</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-gold-400 mt-1 shrink-0" />
                  <div>
                    <p className="font-sans text-xs uppercase tracking-wider text-stone-400">Local</p>
                    <p className="font-serif text-stone-800 font-medium">{weddingDetails.ceremonyLocation}</p>
                    <p className="font-sans text-xs text-stone-500 mt-0.5">{weddingDetails.ceremonyAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            <motion.a 
              href={weddingDetails.ceremonyMapsLink}
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center w-full py-3.5 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 text-gold-100 font-sans text-sm font-medium tracking-wide transition-colors duration-300 shadow-md cursor-pointer text-center"
            >
              <MapPin size={16} className="mr-2" />
              Como Chegar à Capela
            </motion.a>
          </motion.div>

          {/* Reception Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-stone-100 flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex p-3 bg-gold-100/50 rounded-2xl text-gold-600 mb-6">
                <CalendarHeart size={24} />
              </div>
              <h3 className="font-serif text-2xl text-stone-900 mb-4">A Celebração</h3>
              
              <div className="space-y-4 text-stone-600 mb-8">
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-gold-400 mt-1 shrink-0" />
                  <div>
                    <p className="font-sans text-xs uppercase tracking-wider text-stone-400">Horário</p>
                    <p className="font-serif text-stone-800 font-medium">Sábado, 10 de Outubro de 2026, às {weddingDetails.receptionTime}h</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-gold-400 mt-1 shrink-0" />
                  <div>
                    <p className="font-sans text-xs uppercase tracking-wider text-stone-400">Local</p>
                    <p className="font-serif text-stone-800 font-medium">{weddingDetails.receptionLocation}</p>
                    <p className="font-sans text-xs text-stone-500 mt-0.5">{weddingDetails.receptionAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            <motion.a 
              href={weddingDetails.receptionMapsLink}
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center w-full py-3.5 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 text-gold-100 font-sans text-sm font-medium tracking-wide transition-colors duration-300 shadow-md cursor-pointer text-center"
            >
              <MapPin size={16} className="mr-2" />
              Como Chegar à Festa
            </motion.a>
          </motion.div>

        </div>

        {/* Dress code and additional info rows */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Dress Code Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="md:col-span-2 bg-stone-900 text-stone-200 rounded-3xl p-8 shadow-md border border-stone-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gold-400/20 rounded-xl text-gold-300">
                  <Shirt size={20} />
                </div>
                <h4 className="font-serif text-xl text-stone-100">Traje: {weddingDetails.dressCode}</h4>
              </div>
              <p className="text-sm leading-relaxed text-stone-300 font-sans">
                {weddingDetails.dressCodeDescription}
              </p>
            </div>
            
            <div className="w-full h-[1px] bg-stone-800 my-6" />
            
            <p className="text-xs text-gold-300/80 italic font-serif">
              * Sua presença com um traje confortável e adequado ao nosso dia fará as fotos ainda mais belas!
            </p>
          </motion.div>

          {/* Tips / Recs Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-3xl p-8 border border-stone-100 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gold-100/80 rounded-xl text-gold-600">
                  <Info size={20} />
                </div>
                <h4 className="font-serif text-lg text-stone-900">Dicas da Serra</h4>
              </div>
              
              <ul className="space-y-3 text-xs text-stone-600 font-sans">
                <li className="flex gap-2">
                  <Car size={14} className="text-gold-400 shrink-0 mt-0.5" />
                  <span>Estacionamento privativo gratuito no local da recepção.</span>
                </li>
                <li className="flex gap-2">
                  <Info size={14} className="text-gold-400 shrink-0 mt-0.5" />
                  <span>Gramado costuma esfriar no final da tarde. Sugerimos trazer agasalho.</span>
                </li>
                <li className="flex gap-2">
                  <Info size={14} className="text-gold-400 shrink-0 mt-0.5" />
                  <span>Recomendamos reservar hospedagem com antecedência devido à alta temporada.</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] text-stone-400 text-center uppercase tracking-widest font-sans">
              Gramado • RS
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
