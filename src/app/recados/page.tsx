"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Heart, MessageSquare, Sparkles, X, Quote } from "lucide-react";

interface GuestMessage {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

export default function RecadosPage() {
  const [config, setConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setLoadingConfig(false);
      }
    }
    loadSettings();
  }, []);

  // Carrega as mensagens
  useEffect(() => {
    async function fetchMessages() {
      try {
        setLoadingMessages(true);
        const res = await fetch("/api/messages");
        const json = await res.json();
        if (res.ok) {
          setMessages(json.messages || []);
        }
      } catch (err) {
        console.error("Erro ao carregar recados:", err);
      } finally {
        setLoadingMessages(false);
      }
    }
    fetchMessages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Por favor, informe seu nome.");
      return;
    }
    if (!messageText.trim()) {
      toast.error("Por favor, escreva uma mensagem.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          message: messageText.trim(),
        }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Recado registrado com sucesso! Obrigado.");
        setMessages((prev) => [data.message, ...prev]);
        setName("");
        setMessageText("");
        setModalOpen(false);
      } else {
        toast.error(data.error || "Erro ao registrar recado.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingConfig) {
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
      {/* Barra de Navegação Simples */}
      <div className="w-full bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-baby-beige/50">
        <div className="container mx-auto px-4 max-w-5xl h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-gray-600 hover:text-[#f6b26b] font-bold text-sm transition-colors group">
            <span className="bg-gray-100 group-hover:bg-[#f6b26b]/10 p-2 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </span>
            Voltar para o Início
          </a>
          <div className="text-sm font-extrabold text-gray-400 font-serif tracking-tight">
            {event.title || "Chá Revelação"}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full bg-white pt-10 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3 text-[#f6b26b]">
              <MessageSquare className="h-5 w-5 fill-[#f6b26b]/10" />
              <span className="text-xs font-bold uppercase tracking-wider">Mural Completo</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight font-serif mb-4">
              Recados de Amor
            </h1>
            <p className="text-sm md:text-base text-gray-500 font-medium max-w-xl mx-auto mb-8">
              Leia todas as mensagens deixadas pelos nossos queridos convidados. Cada palavra é muito especial para nós!
            </p>
            
            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#f6b26b] hover:bg-[#e09d56] text-white font-extrabold px-8 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 text-sm flex items-center justify-center gap-2 mx-auto"
            >
              <Sparkles className="h-4 w-4" />
              Escrever um Novo Recado
            </button>
          </div>

          {loadingMessages ? (
            <div className="py-12 text-center text-gray-400 font-bold">
              Carregando recados...
            </div>
          ) : messages.length === 0 ? (
            <div className="bg-slate-50/50 rounded-3xl p-10 border border-slate-100 text-center max-w-md mx-auto">
              <p className="text-sm text-gray-400 font-bold">
                Nenhum recado deixado ainda. Seja o primeiro a escrever!
              </p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className="break-inside-avoid bg-[#faf6f0]/40 rounded-3xl p-6 border border-baby-beige/70 shadow-sm flex flex-col hover:shadow-md transition-shadow relative"
                >
                  <Quote className="absolute top-6 left-6 h-8 w-8 text-baby-gold/20" />
                  <p className="text-lg text-slate-700 mt-6 mb-6 whitespace-pre-wrap leading-relaxed font-serif relative z-10">
                    {msg.message}
                  </p>
                  <div className="flex items-center justify-between border-t border-baby-beige/50 pt-4 mt-auto">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {new Date(msg.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </span>
                    <span className="text-sm font-extrabold text-[#f6b26b] flex items-center gap-1.5 font-serif">
                      <Heart className="h-3.5 w-3.5 fill-[#f6b26b]" />
                      {msg.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      <footer className="bg-white border-t border-baby-beige py-8 text-center text-xs text-gray-400 font-semibold mt-auto">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} - Chá Revelação {event.babyOption1} ou {event.babyOption2}?. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Modal de Escrever Recado */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          />
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full relative z-10 shadow-2xl border border-baby-beige animate-scale-up">
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-center mb-6">
              <div className="bg-baby-pink-light/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-baby-pink">
                <Heart className="h-6 w-6 fill-current" />
              </div>
              <h3 className="text-2xl font-black text-gray-800 font-serif">Deixe seu Carinho</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">Preencha com amor para a família ler depois!</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                  Seu Nome
                </label>
                <input
                  type="text"
                  required
                  placeholder="Como você quer ser lembrado?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-baby-gold/30 focus:border-baby-gold/50 transition-all placeholder:text-gray-300"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                  Sua Mensagem
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Escreva algo especial..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-baby-gold/30 focus:border-baby-gold/50 transition-all resize-none placeholder:text-gray-300"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-baby-gold hover:bg-baby-gold-hover text-white font-extrabold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center disabled:opacity-70 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  "Enviar Mensagem"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
