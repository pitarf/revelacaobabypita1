"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/public/Header";
import GuestbookSection from "@/components/public/GuestbookSection";
import { toast } from "sonner";

export default function RecadosPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Carrega as configurações centralizadas da API
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (res.ok) {
          setConfig(data);
        } else {
          toast.error("Erro ao carregar configurações.");
        }
      } catch (err) {
        console.error("Falha ao inicializar configurações:", err);
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
          <p className="text-xs text-gray-400 font-medium">Carregando...</p>
        </div>
      </main>
    );
  }

  const event = config?.event || {};

  return (
    <main className="relative min-h-screen bg-baby-gradient flex flex-col">
      <Header
        title={event.title || "Chá Revelação"}
        babyOption1={event.babyOption1 || ""}
        babyOption2={event.babyOption2 || ""}
        eventDate={event.eventDate || ""}
        eventTime={event.eventTime || ""}
        locationName={event.locationName || ""}
        address={event.address || ""}
        showCountdown={false}
      />

      {/* Container flex-1 para empurrar o footer para baixo caso não tenha muitos recados */}
      <div className="flex-1 w-full bg-white">
        {/* A GuestbookSection já tem seu padding e background interno */}
        <div className="pt-8 pb-16">
          <GuestbookSection />
        </div>
      </div>

      <footer className="bg-white border-t border-baby-beige py-8 text-center text-xs text-gray-400 font-semibold mt-auto">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} - Chá Revelação {event.babyOption1} ou {event.babyOption2}?. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
