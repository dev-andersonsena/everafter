import { MapPin, Clock, Info, Car, CalendarHeart } from 'lucide-react';
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
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-gold-800 tracking-tight font-bold"
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
            className="text-gold-900/80 font-sans text-sm sm:text-base max-w-lg mx-auto mt-4 font-medium"
          >
            Tudo o que você precisa saber sobre o local, horários e recomendações para o nosso casamento.
          </motion.p>
        </div>

        {/* Ceremony container (centered, single card) */}
        <div className="max-w-xl mx-auto mb-16">
          
          {/* Ceremony Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-gold-100/50 flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex p-3 bg-gold-100 rounded-2xl text-gold-600 mb-6">
                <Clock size={24} />
              </div>
              <h3 className="font-serif text-2xl text-gold-800 font-bold mb-4">A Cerimônia</h3>
              
              <div className="space-y-4 text-gold-900/80 mb-8">
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-gold-500 mt-1 shrink-0" />
                  <div>
                    <p className="font-sans text-xs uppercase tracking-wider text-gold-400 font-bold">Horário</p>
                    <p className="font-serif text-gold-900 font-semibold">Segunda-feira (Feriado), 07 de Setembro de 2026, às {weddingDetails.ceremonyTime}h</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-gold-500 mt-1 shrink-0" />
                  <div>
                    <p className="font-sans text-xs uppercase tracking-wider text-gold-400 font-bold">Local</p>
                    <p className="font-serif text-gold-900 font-semibold">{weddingDetails.ceremonyLocation}</p>
                    <p className="font-sans text-xs text-gold-600 mt-0.5">{weddingDetails.ceremonyAddress}</p>
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
              className="inline-flex items-center justify-center w-full py-3.5 px-6 rounded-2xl bg-gold-600 hover:bg-gold-700 text-white font-sans text-sm font-medium tracking-wide transition-colors duration-300 shadow-md cursor-pointer text-center"
            >
              <MapPin size={16} className="mr-2" />
              Como Chegar ao Evento
            </motion.a>
          </motion.div>

        </div>

        {/* Additional info rows */}
        <div className="max-w-2xl mx-auto">
          
          {/* Tips / Recs Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-3xl p-8 sm:p-10 border border-gold-100/50 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gold-100 rounded-xl text-gold-600">
                  <Info size={22} />
                </div>
                <h4 className="font-serif text-2xl text-gold-800 font-bold">Dicas do Evento</h4>
              </div>
              
              <ul className="space-y-4 text-sm text-gold-900/80 font-sans font-medium">
                <li className="flex gap-3 items-start">
                  <Car size={18} className="text-gold-500 shrink-0 mt-0.5" />
                  <span>Estacionamento privativo gratuito no local do evento (Prime Eventos).</span>
                </li>
                <li className="flex gap-3 items-start">
                  <Info size={18} className="text-gold-500 shrink-0 mt-0.5" />
                  <span>Recomendamos chegar com alguns minutos de antecedência para desfrutar da cerimônia com tranquilidade.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <Info size={18} className="text-gold-500 shrink-0 mt-0.5" />
                  <span>Como o casamento é em feriado nacional, recomendamos planejar seu deslocamento com antecedência.</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gold-100 text-xs text-gold-500 text-center uppercase tracking-widest font-sans font-semibold">
              Teresina • PI
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
