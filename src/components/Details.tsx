import { MapPin, Clock, Shirt, Info, Car, CalendarHeart } from 'lucide-react';
import { motion } from 'motion/react';
import { weddingDetails } from '../data';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';

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

        {/* Add to Calendar Shortcut Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-md mx-auto mb-14 bg-white rounded-3xl p-6 border border-gold-200/50 shadow-md flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Card subtle background */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gold-100/30 rounded-full blur-xl pointer-events-none" />
          
          <span className="text-[10px] font-sans uppercase tracking-widest text-gold-500 font-extrabold mb-2.5 flex items-center gap-1">
            🔔 Multi-Alertas Programados
          </span>
          <h4 className="font-serif text-gold-900 text-sm font-semibold mb-2">
            Adicione à sua agenda e receba alertas automáticos
          </h4>
          
          <div className="text-left w-full bg-stone-50/75 rounded-2xl p-3.5 mb-4 border border-stone-100 text-stone-700 space-y-1.5">
            <p className="text-[11px] font-sans text-stone-500 font-semibold uppercase tracking-wider text-center border-b border-stone-200/60 pb-1.5 mb-1.5">
              Alertas inclusos no arquivo (.ics):
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-sans">
              <span className="flex items-center gap-1">⏱️ 45 dias antes</span>
              <span className="flex items-center gap-1">⏱️ 30 dias antes</span>
              <span className="flex items-center gap-1">⏱️ 7 dias antes</span>
              <span className="flex items-center gap-1">⏱️ 5 dias antes</span>
              <span className="flex items-center gap-1">⏱️ 2 dias antes</span>
              <span className="flex items-center gap-1">🎉 No dia exato</span>
            </div>
            <div className="pt-2 border-t border-stone-200/60 text-[11px] text-stone-600 font-sans">
              <span className="text-amber-600 font-bold">📲 Teste para hoje:</span> Ao importar (Apple, Outlook ou Google via arquivo), um alarme teste disparará **2 minutos** após o download para testar o funcionamento no seu celular!
            </div>
          </div>

          <div className="flex gap-2.5 w-full justify-center flex-wrap sm:flex-nowrap">
            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 px-3 bg-gold-50/50 hover:bg-gold-100/70 border border-gold-200 text-gold-900 hover:text-gold-950 rounded-xl text-xs font-sans font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <CalendarHeart size={14} className="text-gold-600" />
              Google Agenda
            </a>
            <button
              onClick={downloadIcsFile}
              className="flex-1 py-2.5 px-3 bg-gold-50/50 hover:bg-gold-100/70 border border-gold-200 text-gold-900 hover:text-gold-950 rounded-xl text-xs font-sans font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <CalendarHeart size={14} className="text-gold-600" />
              Apple / Outlook
            </button>
          </div>
        </motion.div>

        {/* Ceremony and Celebration grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          
          {/* Ceremony Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
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
              Como Chegar à Capela
            </motion.a>
          </motion.div>

          {/* Reception Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-gold-100/50 flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex p-3 bg-gold-100 rounded-2xl text-gold-600 mb-6">
                <CalendarHeart size={24} />
              </div>
              <h3 className="font-serif text-2xl text-gold-800 font-bold mb-4">A Celebração</h3>
              
              <div className="space-y-4 text-gold-900/80 mb-8">
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-gold-500 mt-1 shrink-0" />
                  <div>
                    <p className="font-sans text-xs uppercase tracking-wider text-gold-400 font-bold">Horário</p>
                    <p className="font-serif text-gold-900 font-semibold">Segunda-feira (Feriado), 07 de Setembro de 2026, às {weddingDetails.receptionTime}h</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-gold-500 mt-1 shrink-0" />
                  <div>
                    <p className="font-sans text-xs uppercase tracking-wider text-gold-400 font-bold">Local</p>
                    <p className="font-serif text-gold-900 font-semibold">{weddingDetails.receptionLocation}</p>
                    <p className="font-sans text-xs text-gold-600 mt-0.5">{weddingDetails.receptionAddress}</p>
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
              className="inline-flex items-center justify-center w-full py-3.5 px-6 rounded-2xl bg-gold-600 hover:bg-gold-700 text-white font-sans text-sm font-medium tracking-wide transition-colors duration-300 shadow-md cursor-pointer text-center"
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
            className="md:col-span-2 bg-watercolor-soft text-gold-950 rounded-3xl p-8 shadow-sm border border-gold-200/40 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gold-500/10 rounded-xl text-gold-600">
                  <Shirt size={20} />
                </div>
                <h4 className="font-serif text-xl text-gold-800 font-bold">Traje: {weddingDetails.dressCode}</h4>
              </div>
              <p className="text-sm leading-relaxed text-gold-900/90 font-sans font-medium">
                {weddingDetails.dressCodeDescription}
              </p>
            </div>
            
            <div className="w-full h-[1px] bg-gold-200/30 my-6" />
            
            <p className="text-xs text-gold-600 italic font-serif font-semibold">
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
