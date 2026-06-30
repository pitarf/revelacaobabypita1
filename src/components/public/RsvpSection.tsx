"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, Search, Edit3, Trash2, CalendarCheck, Calendar, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import RsvpModal from "./RsvpModal";

export default function RsvpSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchCode, setSearchCode] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [activeRsvp, setActiveRsvp] = useState<any | null>(null);
  const [newRsvpSuccess, setNewRsvpSuccess] = useState<any | null>(null);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [eventDataInfo, setEventDataInfo] = useState<any>(null);

  // Carrega as informações dinâmicas do evento para sincronizar com o painel admin
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setEventDataInfo(data.event);
        }
      } catch (err) {
        console.error("Erro ao carregar configurações do evento no RSVP:", err);
      }
    };
    fetchEvent();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "18/07/2026";
    try {
      const d = new Date(dateStr);
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "18/07/2026";
    }
  };

  // Busca dados do RSVP por código para Edição/Cancelamento
  const handleSearchCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) {
      toast.error("Por favor, digite um código de acesso.");
      return;
    }

    try {
      setLoadingSearch(true);
      const res = await fetch(`/api/rsvp?code=${searchCode.toUpperCase().trim()}`);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Código inválido ou confirmação não encontrada.");
        setActiveRsvp(null);
        return;
      }

      setActiveRsvp(data.data);
      setNewRsvpSuccess(null);
      toast.success("Confirmação de presença localizada!");
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão ao buscar código.");
    } finally {
      setLoadingSearch(false);
    }
  };

  // Cancela a presença do convidado
  const handleCancelRsvp = async () => {
    if (!activeRsvp) return;

    const confirmCancel = window.confirm("Deseja realmente cancelar sua confirmação de presença no evento?");
    if (!confirmCancel) return;

    try {
      const res = await fetch(`/api/rsvp?code=${activeRsvp.accessCode}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao cancelar confirmação.");
        return;
      }

      toast.success("Sua presença foi cancelada com sucesso.");
      setActiveRsvp(null);
      setSearchCode("");
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão ao cancelar.");
    }
  };

  const handleRsvpSuccess = (data: any) => {
    if (activeRsvp) {
      setActiveRsvp(data);
    } else {
      setNewRsvpSuccess(data);
    }
  };

  return (
    <section id="confirmacao" className="py-16 bg-white w-full border-t border-gold-gradient">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal text-slate-800 tracking-tight font-serif mb-8">
          Confirmação de Presença
        </h2>

        {/* Informações do Evento - Idêntico ao print */}
        <div className="space-y-4 max-w-lg mx-auto text-left mb-8 font-semibold text-slate-700">
          
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-[#f6b26b] fill-[#f6b26b]/10 mt-0.5 shrink-0" />
            <div className="text-base leading-relaxed">
              <span className="text-[#f6b26b] font-bold mr-1.5">Data:</span>
              <span>{eventDataInfo ? formatDate(eventDataInfo.eventDate) : "18/07/2026"}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-[#f6b26b] fill-[#f6b26b]/10 mt-0.5 shrink-0" />
            <div className="text-base leading-relaxed">
              <span className="text-[#f6b26b] font-bold mr-1.5">Hora:</span>
              <span>{eventDataInfo ? `${eventDataInfo.eventTime}` : "14:00"}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-[#f6b26b] fill-[#f6b26b]/10 mt-0.5 shrink-0" />
            <div className="text-base leading-relaxed">
              <span className="text-[#f6b26b] font-bold mr-1.5">Endereço:</span>
              <span>
                {eventDataInfo 
                  ? `${eventDataInfo.locationName} - ${eventDataInfo.address}` 
                  : "Espaço Kolina - Rua Nabôr do Rêgo, 384 - Ramos"}
              </span>
            </div>
          </div>

        </div>

        {/* Bloco de Sucesso após Confirmar RSVP */}
        {newRsvpSuccess ? (
          <div className="rounded-3xl bg-emerald-50/50 border border-emerald-500/20 p-8 text-center shadow-sm max-w-md mx-auto mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 mx-auto animate-bounce">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-extrabold text-emerald-800 font-serif mb-2">Presença Confirmada!</h4>
            <p className="text-xs text-gray-500 font-semibold mb-6">
              Ficamos muito felizes em saber que você estará com a gente nesse momento tão feliz!
            </p>

            <div className="bg-white rounded-2xl p-4 border border-emerald-500/10 shadow-sm w-full max-w-xs mx-auto">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Código de Alteração</p>
              <p className="text-2xl font-black text-emerald-600 tracking-wider font-mono">{newRsvpSuccess.accessCode}</p>
            </div>
            <p className="text-[10px] text-gray-400 font-medium mt-3.5 leading-relaxed">
              Guarde este código. Caso precise alterar ou cancelar, utilize-o na consulta abaixo.
            </p>
          </div>
        ) : (
          /* Botão Principal Confirmar Presença - Pêssego */
          <div className="mb-6">
            <button
              onClick={() => {
                setActiveRsvp(null);
                setModalOpen(true);
              }}
              className="bg-[#f6b26b] hover:bg-[#e09d56] text-white font-bold px-8 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto text-base"
            >
              <CalendarCheck className="h-5 w-5" />
              <span>Confirmar Presença</span>
            </button>
          </div>
        )}

        {/* Bloco de Busca por Código de Confirmação */}
        <div className="mt-8 max-w-md mx-auto">
          {!showSearchBox && !activeRsvp ? (
            <button
              onClick={() => setShowSearchBox(true)}
              className="text-xs font-bold text-gray-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
            >
              Já confirmou presença? Consultar ou alterar dados
            </button>
          ) : (
            <div className="bg-slate-50/60 rounded-3xl p-6 border border-slate-100 shadow-inner relative text-left">
              <button 
                onClick={() => {
                  setActiveRsvp(null);
                  setSearchCode("");
                  setShowSearchBox(false);
                }} 
                className="absolute top-4 right-4 text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider"
              >
                Esconder
              </button>

              {activeRsvp ? (
                /* Exibe RSVP localizado */
                <div className="space-y-4">
                  <h4 className="text-sm font-extrabold text-gray-800">
                    Olá, {activeRsvp.fullName.split(" ")[0]}!
                  </h4>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    Sua presença está confirmada: <strong>{activeRsvp.totalGuests} pessoa(s)</strong> ({activeRsvp.adultsCount} Adulto(s) {activeRsvp.childrenCount > 0 && `e ${activeRsvp.childrenCount} Criança(s)`})
                  </p>
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setModalOpen(true)}
                      className="flex-1 bg-[#f6b26b] hover:bg-[#e09d56] text-white text-xs font-bold py-2.5 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
                    >
                      Editar Dados
                    </button>
                    <button
                      onClick={handleCancelRsvp}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all border border-red-150"
                    >
                      Cancelar Presença
                    </button>
                  </div>
                </div>
              ) : (
                /* Formulário de Busca por Código */
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Digite seu código de 6 dígitos</h4>
                  <form onSubmit={handleSearchCode} className="flex gap-2 w-full">
                    <input
                      type="text"
                      placeholder="Ex: JX7B29"
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                      maxLength={6}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-baby-gold font-bold tracking-wider text-center uppercase font-mono transition-all"
                    />
                    <button
                      type="submit"
                      disabled={loadingSearch}
                      className="bg-[#f6b26b] hover:bg-[#e09d56] text-white px-4 rounded-xl shadow-sm transition-all flex items-center justify-center hover:scale-105 active:scale-95"
                    >
                      {loadingSearch ? (
                        <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      ) : (
                        <span>Buscar</span>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Modal RSVP Compartilhado */}
      <RsvpModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={activeRsvp}
        onSuccess={handleRsvpSuccess}
      />
    </section>
  );
}
