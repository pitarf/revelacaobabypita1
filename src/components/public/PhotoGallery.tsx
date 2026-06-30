"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X, Camera } from "lucide-react";
import { toast } from "sonner";

interface Photo {
  id: string;
  imageUrl: string;
  caption?: string;
  isFeatured?: boolean;
}

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [zoomImage, setZoomImage] = useState<Photo | null>(null);
  
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  const [autoplayActive, setAutoplayActive] = useState(true);

  // Carrega as fotos da API
  useEffect(() => {
    async function loadPhotos() {
      try {
        const res = await fetch("/api/gallery");
        const data = await res.json();
        if (res.ok) {
          setPhotos(data.data || []);
        }
      } catch (err) {
        console.error("Erro ao carregar galeria:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPhotos();
  }, []);

  // Lógica de Autoplay do Slider
  useEffect(() => {
    if (photos.length === 0 || !autoplayActive) return;

    autoplayRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
    }, 4500); // Avança a cada 4.5 segundos

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [photos, autoplayActive]);

  const nextSlide = () => {
    if (photos.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
  };

  const prevSlide = () => {
    if (photos.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
  };

  // Detecção de Gestos de Toque (Swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    
    // Swipe para a esquerda (próxima foto)
    if (distance > 60) {
      nextSlide();
    }
    // Swipe para a direita (foto anterior)
    if (distance < -60) {
      prevSlide();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (loading) {
    return (
      <section className="py-16 w-full text-center">
        <div className="animate-spin inline-block h-8 w-8 border-4 border-baby-gold border-t-transparent rounded-full"></div>
        <p className="text-sm text-gray-400 mt-2 font-bold">Carregando galeria de fotos...</p>
      </section>
    );
  }

  if (photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <section id="fotos" className="py-16 bg-white w-full">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-center gap-2 mb-3 text-baby-pink">
          <Camera className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Registros</span>
        </div>
        
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-tight font-serif mb-8">
          Galeria de Fotos
        </h2>

        {/* Carrossel Wrapper com Setas nas Laterais Externas */}
        <div className="relative max-w-[550px] mx-auto flex items-center justify-center px-12 md:px-14 select-none">
          
          {/* Seta Esquerda - Externa, limpa e fina */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 hover:scale-110 active:scale-95 transition-all p-1"
            title="Foto anterior"
          >
            <ChevronLeft className="h-12 w-12 md:h-14 md:w-14 stroke-[1.2]" />
          </button>

          {/* Card do Carrossel */}
          <div 
            className="relative glass-card rounded-3xl p-3 md:p-4 w-full shadow-md border border-white group overflow-hidden"
            onMouseEnter={() => setAutoplayActive(false)}
            onMouseLeave={() => setAutoplayActive(true)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Slides e Transição Suave - Proporção Real Aumentada para 420x560px */}
            <div 
              className="relative overflow-hidden w-[420px] max-w-full aspect-[3/4] mx-auto rounded-2xl bg-baby-beige-dark/20"
              style={{ aspectRatio: "3/4" }}
            >
              {/* Imagem com key única para forçar a animação fade-in na mudança de slide */}
              <img
                key={currentIndex}
                src={currentPhoto.imageUrl}
                alt="Foto do Chá Revelação"
                className="w-full h-full object-cover select-none animate-fade-in"
              />

              {/* Ícone de zoom rápido */}
              <button
                onClick={() => setZoomImage(currentPhoto)}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 hover:scale-105 transition-all shadow-md z-10"
                title="Ampliar foto"
              >
                <Maximize2 className="h-4 w-4" />
              </button>

              {/* Indicadores de Posição Numerados e Circulares (Sobre a Imagem) */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-2 z-20">
                {photos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-7 w-7 md:h-8 md:w-8 rounded-full font-bold text-xs flex items-center justify-center transition-all duration-300 shadow-md ${
                      idx === currentIndex
                        ? "bg-slate-800/90 text-white scale-110 border border-white/20"
                        : "bg-white/40 text-slate-800 hover:bg-white/60"
                    }`}
                    title={`Ver foto ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Seta Direita - Externa, limpa e fina */}
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 hover:scale-110 active:scale-95 transition-all p-1"
            title="Próxima foto"
          >
            <ChevronRight className="h-12 w-12 md:h-14 md:w-14 stroke-[1.2]" />
          </button>
        </div>

      </div>

      {/* Modal de Zoom em Tela Cheia */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col justify-center items-center p-4 animate-fade-in">
          
          {/* Botão Fechar no Topo */}
          <button
            onClick={() => setZoomImage(null)}
            className="absolute top-6 right-6 bg-white/10 text-white p-3 rounded-full hover:bg-white/20 transition-all hover:scale-105 active:scale-95 shadow-md"
            title="Fechar"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Imagem Ampliada */}
          <div className="relative max-w-full max-h-[80vh] aspect-[3/4] sm:aspect-auto">
            <img
              src={zoomImage.imageUrl}
              alt="Imagem ampliada"
              className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl border border-white/10"
            />
          </div>

        </div>
      )}
    </section>
  );
}
