"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/public/Header";
import BabyMessage from "@/components/public/BabyMessage";
import VideoSection from "@/components/public/VideoSection";
import PhotoGallery from "@/components/public/PhotoGallery";
import RsvpSection from "@/components/public/RsvpSection";
import GuestbookSection from "@/components/public/GuestbookSection";
import DressCode from "@/components/public/DressCode";
import GiftList from "@/components/public/GiftList";
import MusicPlayer from "@/components/public/MusicPlayer";
import CartDrawer from "@/components/public/CartDrawer";
import CartModal from "@/components/public/CartModal";
import FloatingCartButton from "@/components/public/FloatingCartButton";
import { toast } from "sonner";

export default function Home() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Carrega as configurações centralizadas da API ao montar a página
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (res.ok) {
          setConfig(data);
        } else {
          toast.error("Erro ao carregar dados do evento.");
        }
      } catch (err) {
        console.error("Falha ao inicializar configurações da página principal:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  if (loading) {
    return (
      <main className="bg-baby-gradient min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block h-8 w-8 border-4 border-baby-gold border-t-transparent rounded-full mb-3"></div>
          <h2 className="text-lg font-bold text-gray-700 font-serif">Preparando Chá Revelação...</h2>
          <p className="text-xs text-gray-400 font-medium">Carregando o tema e configurações...</p>
        </div>
      </main>
    );
  }

  const site = config?.site || {};
  const event = config?.event || {};
  const music = config?.music || {};

  return (
    <main className="relative min-h-screen bg-baby-gradient flex flex-col">
      {/* 1. Tocador de Música de Fundo */}
      <MusicPlayer
        audioUrl={music.audioUrl}
        isActive={music.isActive}
        initialVolume={music.initialVolume}
        autoRestart={music.autoRestart}
      />

      {/* 2. Cabeçalho Principal (Apresentação e Placar) */}
      <Header
        title={event.title}
        babyOption1={event.babyOption1}
        babyOption2={event.babyOption2}
        eventDate={event.eventDate}
        eventTime={event.eventTime}
        locationName={event.locationName}
        address={event.address}
        googleMapsUrl={event.googleMapsUrl}
        showCountdown={event.showCountdown}
      />

      {/* 3. Galeria de Fotos (Carrossel Interativo) */}
      <PhotoGallery />

      {/* 4. Seção Mensagem dos Pais */}
      <BabyMessage
        title={site.messageTitle}
        text={site.messageText}
      />

      {/* 5. Confirmação de Presença (RSVP) */}
      <RsvpSection />

      {/* Mural de Recados (Deixe seu Recadinho) */}
      <GuestbookSection />

      {/* 6. Sugestão de Traje e Paleta de Cores */}
      <DressCode />

      {/* 7. Lista de Presentes estilo Loja Virtual */}
      <GiftList 
        onOpenCart={() => setIsCartOpen(true)} 
        onDirectCheckout={() => setIsCheckoutModalOpen(true)}
      />

      {/* 8. Seção Opcional de Vídeo */}
      {config?.video?.isActive && (
        <VideoSection
          title={config.video.title}
          description={config.video.description}
          videoUrl={config.video.videoUrl}
          isUpload={config.video.isUpload}
          isActive={config.video.isActive}
        />
      )}

      {/* 9. Botão Flutuante do Carrinho de Presentes */}
      <FloatingCartButton onClick={() => setIsCartOpen(true)} />

      {/* 10. Drawer (Painel Lateral) do Carrinho */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Modal de Presente Direto (Checkout direto do Passo 1) */}
      <CartModal 
        isOpen={isCheckoutModalOpen} 
        onClose={() => setIsCheckoutModalOpen(false)} 
        initialStep={1} 
      />

      {/* Rodapé da Página Pública */}
      <footer className="bg-white border-t border-baby-beige py-8 pb-24 md:pb-8 text-center text-xs text-gray-400 font-semibold">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} - Chá Revelação {event.babyOption1} ou {event.babyOption2}?. Todos os direitos reservados.</p>
          <div className="flex justify-center gap-4 mt-3">
            <a href="/politica-privacidade" className="hover:text-baby-gold transition-colors">Política de Privacidade</a>
            <span>•</span>
            <a href="/termos-lista" className="hover:text-baby-gold transition-colors">Termos de Uso</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
