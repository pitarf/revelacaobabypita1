"use client";

import React from "react";

interface BabyMessageProps {
  title: string;
  text: string;
}

export default function BabyMessage({ title, text }: BabyMessageProps) {
  if (!text) return null;

  return (
    <section id="mensagem" className="py-12 md:py-16 bg-white w-full border-b border-baby-beige/30">
      <div className="container mx-auto px-4 max-w-5xl text-center">
        
        {/* Título da Seção (Mensagem dos Pais) */}
        <h2 
          className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-800 tracking-tight mb-10"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
          {title || "Oi, queridos amigos e familiares!"}
        </h2>

        {/* Texto da Mensagem */}
        <div className="max-w-4xl mx-auto mb-16">
          <div 
            className="text-lg md:text-xl lg:text-[22px] text-gray-700 leading-relaxed font-normal text-center space-y-6"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
            dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, "<br/>") }}
          />
        </div>

        {/* Linha Divisória de Estrelas */}
        <div className="flex justify-center items-center gap-2 text-baby-gold/30">
          <span className="h-px w-8 bg-baby-gold/20"></span>
          <span>⭐</span>
          <span>⭐</span>
          <span>⭐</span>
          <span className="h-px w-8 bg-baby-gold/20"></span>
        </div>

      </div>
    </section>
  );
}
