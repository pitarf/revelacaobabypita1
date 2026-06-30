"use client";

import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Menu, X, Gift, CheckCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import RevealVote from "./RevealVote";

interface HeaderProps {
  title: string;
  babyOption1: string;
  babyOption2: string;
  eventDate: string;
  eventTime: string;
  locationName: string;
  address: string;
  googleMapsUrl?: string;
  showCountdown?: boolean;
}

export default function Header({
  title,
  babyOption1,
  babyOption2,
  eventDate,
  eventTime,
  locationName,
  address,
  googleMapsUrl = "",
  showCountdown = true,
}: HeaderProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    finished: false,
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Calcula o tempo restante da contagem regressiva
  useEffect(() => {
    if (!eventDate) return;

    const calculateTime = () => {
      const difference = +new Date(eventDate) - +new Date();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, finished: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        finished: false,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [eventDate]);

  // Função para fazer scroll suave até as seções
  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    
    if (pathname !== "/") {
      router.push(`/#${id}`);
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="relative w-full bg-baby-gradient pb-16 pt-6 overflow-hidden">
      {/* Elementos Decorativos de Balões/Nuvens flutuantes */}
      <div className="absolute top-20 left-10 w-24 h-24 text-baby-blue opacity-20 animate-float-balloon-blue pointer-events-none hidden md:block">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M50,10 C65,10 75,22 75,37 C75,52 62,65 50,75 C38,65 25,52 25,37 C25,22 35,10 50,10 M50,75 L50,90 C50,92 48,94 46,94 L46,96 L54,96 L54,94 C52,94 50,92 50,90" />
        </svg>
      </div>
      <div className="absolute top-32 right-12 w-28 h-28 text-baby-pink opacity-20 animate-float-balloon-pink pointer-events-none hidden md:block">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M50,10 C65,10 75,22 75,37 C75,52 62,65 50,75 C38,65 25,52 25,37 C25,22 35,10 50,10 M50,75 L50,90 C50,92 48,94 46,94 L46,96 L54,96 L54,94 C52,94 50,92 50,90" />
        </svg>
      </div>

      {/* Menu Principal de Navegação */}
      <div className="container mx-auto px-4 max-w-6xl">
        <nav className="flex items-center justify-between py-4 rounded-full bg-[#f6b26b] px-6 shadow-md border border-[#e09d56]/20">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => scrollToSection("inicio")}>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Chá Revelação
            </span>
          </div>

          {/* Links Desktop */}
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-white/95">
            <button onClick={() => scrollToSection("inicio")} className="hover:text-white hover:scale-105 transition-all">Início</button>
            <button onClick={() => scrollToSection("recados")} className="hover:text-white hover:scale-105 transition-all">Recados</button>
            <button onClick={() => scrollToSection("palpite")} className="hover:text-white hover:scale-105 transition-all">Palpite</button>
            <button onClick={() => scrollToSection("fotos")} className="hover:text-white hover:scale-105 transition-all">Fotos</button>
            <button onClick={() => scrollToSection("presentes")} className="hover:text-white hover:scale-105 transition-all">Presentes</button>
            <button 
              onClick={() => scrollToSection("confirmacao")}
              className="flex items-center gap-1.5 bg-white text-[#f6b26b] px-4.5 py-2 rounded-full hover:shadow-md hover:bg-white/95 transition-all hover:scale-105 active:scale-95"
            >
              <CheckCircle className="h-4 w-4" />
              Confirmar RSVP
            </button>
          </div>

          {/* Botão Hamburger Mobile */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-white hover:scale-105 transition-all">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>
      </div>

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#f6b26b] flex flex-col justify-center items-center gap-8 text-xl font-bold text-white animate-fade-in">
          <button onClick={() => setMobileMenuOpen(false)} className="absolute top-8 right-8 p-2">
            <X className="h-8 w-8 text-white" />
          </button>
          <button onClick={() => scrollToSection("inicio")} className="hover:text-white/80 transition-colors">Início</button>
          <button onClick={() => scrollToSection("recados")} className="hover:text-white/80 transition-colors">Recados</button>
          <button onClick={() => scrollToSection("palpite")} className="hover:text-white/80 transition-colors">Palpite</button>
          <button onClick={() => scrollToSection("fotos")} className="hover:text-white/80 transition-colors">Fotos</button>
          <button onClick={() => scrollToSection("presentes")} className="hover:text-white/80 transition-colors">Presentes</button>
          <button 
            onClick={() => scrollToSection("confirmacao")}
            className="flex items-center gap-2 bg-white text-[#f6b26b] px-6 py-3 rounded-full shadow-md hover:bg-white/95 transition-all active:scale-95"
          >
            <CheckCircle className="h-5 w-5" />
            Confirmar RSVP
          </button>
        </div>
      )}

      {/* Corpo do Cabeçalho - Apresentação principal */}
      <div id="inicio" className="container mx-auto px-4 max-w-4xl text-center mt-12 md:mt-20">
        
        {/* Nuvens fofas em ilustração sutil */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-baby-gold/20 text-xs font-bold text-baby-gold shadow-sm mb-6 animate-pulse-soft">
          <span>👶 Seja bem-vindo ao nosso evento!</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal text-slate-800 leading-none mb-4 font-serif">
          {title}
        </h1>

        {/* Pergunta "Miguel ou Rafaella" com Transição de Cores */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-16 md:mb-20 flex-wrap">
          <span className="text-baby-blue text-5xl md:text-7xl lg:text-8xl tracking-wide drop-shadow-[0_2px_3px_rgba(87,163,226,0.2)] font-serif font-normal">
            {babyOption1}
          </span>
          <span className="text-slate-800 font-sans font-normal text-lg md:text-2xl lg:text-3xl mx-1 md:mx-2 select-none self-center pt-2">
            ou
          </span>
          <span className="text-baby-pink text-5xl md:text-7xl lg:text-8xl tracking-wide drop-shadow-[0_2px_3px_rgba(224,88,154,0.2)] font-serif font-normal">
            {babyOption2}
          </span>
        </div>

        {/* Bloco de Detalhes do Evento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10 text-left font-semibold">
          
          <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md rounded-2xl p-4.5 border border-white/60 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-baby-blue-light text-baby-blue">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Data</p>
              <p className="text-sm text-gray-700">
                {eventDate 
                  ? new Date(eventDate).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC"
                    }) 
                  : "Carregando..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md rounded-2xl p-4.5 border border-white/60 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-baby-pink-light text-baby-pink">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Horário</p>
              <p className="text-sm text-gray-700">{eventTime}h</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md rounded-2xl p-4.5 border border-white/60 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-baby-gold-light text-baby-gold">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="truncate">
              <p className="text-xs text-gray-400 font-bold uppercase">Local</p>
              <p className="text-sm text-gray-700 truncate" title={`${locationName} - ${address}`}>
                {locationName}
              </p>
            </div>
          </div>

        </div>

        {/* Votação e Palpite abaixo da Data, Horário e Local */}
        <div className="mb-10">
          <RevealVote babyOption1={babyOption1} babyOption2={babyOption2} />
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
          <button
            onClick={() => scrollToSection("confirmacao")}
            className="w-full sm:w-auto bg-gradient-to-r from-baby-blue to-baby-pink text-white px-8 py-3.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            Confirmar Presença
          </button>
          
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-gray-700 border border-baby-beige-dark px-8 py-3.5 rounded-full font-bold shadow-sm hover:bg-gray-50 transition-all hover:scale-105"
            >
              <MapPin className="h-4 w-4 text-baby-gold" />
              Ver Localização
            </a>
          )}
        </div>

        {/* Contagem Regressiva */}
        {showCountdown && !timeLeft.finished && (
          <div className="max-w-2xl mx-auto rounded-3xl bg-white/60 backdrop-blur-md border border-white p-6 shadow-sm">
            <p className="text-sm font-extrabold text-baby-gold uppercase tracking-wider mb-4 flex items-center justify-center gap-1.5">
              <Clock className="h-4 w-4" /> Contagem Regressiva para o Chá
            </p>
            
            <div className="grid grid-cols-4 gap-2 text-center">
              
              <div className="bg-white/95 rounded-2xl py-3 border border-baby-beige">
                <p className="text-2xl md:text-4xl font-extrabold text-gray-800">{timeLeft.days}</p>
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Dias</p>
              </div>

              <div className="bg-white/95 rounded-2xl py-3 border border-baby-beige">
                <p className="text-2xl md:text-4xl font-extrabold text-gray-800">
                  {timeLeft.hours.toString().padStart(2, "0")}
                </p>
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Horas</p>
              </div>

              <div className="bg-white/95 rounded-2xl py-3 border border-baby-beige">
                <p className="text-2xl md:text-4xl font-extrabold text-gray-800">
                  {timeLeft.minutes.toString().padStart(2, "0")}
                </p>
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Min</p>
              </div>

              <div className="bg-white/95 rounded-2xl py-3 border border-baby-beige">
                <p className="text-2xl md:text-4xl font-extrabold text-gray-800">
                  {timeLeft.seconds.toString().padStart(2, "0")}
                </p>
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Seg</p>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Rodapé Flutuante Fixo para Dispositivos Móveis (Ergonomia) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-baby-beige px-4 py-3 flex gap-3 shadow-2xl">
        <button
          onClick={() => scrollToSection("confirmacao")}
          className="flex-1 bg-[#f6b26b] hover:bg-[#e09d56] text-white text-sm font-extrabold py-3 rounded-full text-center shadow-md active:scale-95 transition-all"
        >
          Confirmar Presença
        </button>
        <button
          onClick={() => scrollToSection("presentes")}
          className="flex-1 bg-white border border-[#f6b26b]/30 text-[#f6b26b] text-sm font-extrabold py-3 rounded-full flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <Gift className="h-4 w-4" />
          Ver Presentes
        </button>
      </div>
    </header>
  );
}
