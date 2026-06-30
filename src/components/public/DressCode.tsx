"use client";

import React from "react";
import { Sparkles, Shirt } from "lucide-react";

export default function DressCode() {
  return (
    <section id="traje" className="py-16 w-full border-t border-gold-gradient bg-white/10">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        
        {/* Cabeçalho da Seção */}
        <div className="flex items-center justify-center gap-2 mb-3 text-baby-gold">
          <Shirt className="h-5 w-5 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">Sugestão de Traje</span>
        </div>
        
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal text-slate-800 tracking-tight font-serif mb-4">
          Nossa Paleta de Cores
        </h2>
        
        <p className="text-sm md:text-base text-gray-500 font-medium max-w-xl mx-auto mb-10">
          Para que nosso momento seja ainda mais lindo e as fotos fiquem harmônicas, convidamos todos a vestirem roupas na paleta de cores da decoração do evento!
        </p>

        {/* Paleta Visual */}
        <div className="glass-card rounded-3xl p-8 max-w-2xl mx-auto border border-white shadow-sm flex flex-col md:flex-row items-center justify-around gap-8">
          
          {/* Categoria Branco */}
          <div className="flex flex-col items-center text-center space-y-3 flex-1">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-gray-200 to-gray-100 opacity-75 blur-sm transition duration-200" />
              <div className="relative w-24 h-24 rounded-full border-2 border-gray-200 bg-white shadow-inner" />
            </div>
            <p className="text-sm font-bold text-gray-700">Branco Clássico</p>
            <p className="text-xs text-gray-400 max-w-[180px]">
              Tons brancos, off-white ou creme para trazer luz e leveza às fotos.
            </p>
          </div>

          {/* Divisor Visual */}
          <div className="hidden md:flex text-2xl font-light text-gray-300 select-none">+</div>

          {/* Categoria Laranja Suave / Pêssego */}
          <div className="flex flex-col items-center text-center space-y-3 flex-1">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#f6b26b] to-[#f8c48c] opacity-75 blur-sm transition duration-200" />
              <div className="relative w-24 h-24 rounded-full bg-[#f6b26b] shadow-md" />
            </div>
            <p className="text-sm font-bold text-gray-700">Pêssego / Apricot</p>
            <p className="text-xs text-gray-400 max-w-[180px]">
              Tons quentes de laranja suave, salmão, coral claro e pêssego.
            </p>
          </div>

        </div>

        {/* Dicas de Estilo */}
        <div className="mt-8 max-w-xl mx-auto bg-white/50 backdrop-blur-sm rounded-2xl p-5 border border-white/60 shadow-sm text-left">
          <div className="flex gap-2 items-center text-baby-gold mb-2">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-bold uppercase tracking-wider">Dicas de Combinação</p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Sinta-se à vontade para combinar as duas cores ou usar peças únicas. Pode ser uma camisa branca com calça pêssego, vestidos nos tons, macacões ou pequenos detalhes acessórios. O importante é celebrar conosco com muito conforto!
          </p>
        </div>

      </div>
    </section>
  );
}
