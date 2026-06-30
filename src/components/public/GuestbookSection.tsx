"use client";

import React, { useEffect, useState } from "react";
import { Heart, X, MessageSquare, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface GuestMessage {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

export default function GuestbookSection() {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Estados do formulário
  const [name, setName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/messages");
      const json = await res.json();
      if (res.ok) {
        setMessages(json.messages || []);
      }
    } catch (err) {
      console.error("Erro ao carregar recados:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Por favor, informe seu nome.");
      return;
    }
    if (!messageText.trim()) {
      toast.error("Por favor, escreva uma mensagem de carinho.");
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
        toast.success("Recado registrado com sucesso! Obrigado pelo carinho.");
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

  return (
    <section id="recados" className="py-16 bg-white w-full border-t border-gold-gradient">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        
        {/* Mural de Recados dos Convidados */}
        <div className="flex flex-col items-center justify-center gap-2 mb-3 text-[#f6b26b]">
          <MessageSquare className="h-5 w-5 fill-[#f6b26b]/10" />
          <span className="text-xs font-bold uppercase tracking-wider">Mural de Recados</span>
        </div>

        <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 tracking-tight font-serif mb-3">
          Deixe seu Recadinho
        </h3>
        
        <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed max-w-xl mx-auto mb-8">
          Escreva uma mensagem especial de carinho e bençãos para o bebê e para a nossa família!
        </p>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-[#f6b26b] hover:bg-[#e09d56] text-white font-extrabold px-8 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 mb-12 text-sm flex items-center justify-center gap-2 mx-auto"
        >
          <Sparkles className="h-4 w-4" />
          Escrever Recado
        </button>

        {/* Grid de Recados */}
        {loading ? (
          <div className="py-12 text-center text-gray-400 font-bold">
            Carregando mensagens de carinho...
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-slate-50/50 rounded-3xl p-10 border border-slate-100 text-center max-w-md mx-auto">
            <p className="text-sm text-gray-400 font-bold">
              Nenhum recado deixado ainda. Seja o primeiro a escrever!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className="bg-[#faf6f0]/40 rounded-3xl p-6 border border-baby-beige/70 shadow-sm flex flex-col justify-between hover:shadow-md transition-all hover:scale-[1.01]"
              >
                <p className="text-sm md:text-base text-gray-700 italic mb-5 whitespace-pre-wrap leading-relaxed">
                  "{msg.message}"
                </p>
                <div className="flex items-center justify-between border-t border-baby-beige/50 pt-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {new Date(msg.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </span>
                  <span className="text-xs font-extrabold text-[#f6b26b] flex items-center gap-1.5 font-serif text-[13px]">
                    <Heart className="h-3.5 w-3.5 fill-[#f6b26b]" />
                    {msg.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal de Escrever Recado */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          />

          {/* Card Modal */}
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full relative z-10 shadow-2xl border border-baby-beige animate-scale-up">
            
            {/* Botão Fechar */}
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Cabeçalho */}
            <div className="mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6b26b]/10 text-[#f6b26b] mb-4">
                <Sparkles className="h-5 w-5 fill-[#f6b26b]/10" />
              </div>
              <h4 className="text-xl font-extrabold text-gray-800 tracking-tight">
                Deixar Recadinho Especial
              </h4>
              <p className="text-sm text-gray-500 font-medium mt-1.5">
                Escreva uma linda mensagem para o bebê e para os papais.
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Seu Nome / Apelido *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Titia Ana, Primo Leo, etc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-baby-beige-dark rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#f6b26b] focus:ring-4 focus:ring-[#f6b26b]/10 transition-all font-semibold"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Sua Mensagem *
                  </label>
                  <span className="text-[10px] font-bold text-gray-400">
                    {messageText.length}/500
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  placeholder="Escreva aqui sua mensagem de carinho..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full bg-slate-50 border border-baby-beige-dark rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#f6b26b] focus:ring-4 focus:ring-[#f6b26b]/10 transition-all font-semibold resize-none leading-relaxed"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider text-gray-500 hover:bg-gray-150 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-[#f6b26b] hover:bg-[#e09d56] text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting ? (
                    "Enviando..."
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Enviar Recado
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </section>
  );
}
