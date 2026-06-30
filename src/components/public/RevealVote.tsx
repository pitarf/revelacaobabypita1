"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Heart, CheckCircle2, Lock, EyeOff } from "lucide-react";

interface VoteStats {
  option1: { name: string; count: number; percentage: number };
  option2: { name: string; count: number; percentage: number };
  total: number;
  hideResults: boolean;
}

interface RevealVoteProps {
  babyOption1: string;
  babyOption2: string;
}

export default function RevealVote({ babyOption1, babyOption2 }: RevealVoteProps) {
  const [stats, setStats] = useState<VoteStats | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedBaby, setSelectedBaby] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [voterName, setVoterName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResultsWithoutVoting, setShowResultsWithoutVoting] = useState(false);

  // Verifica se o usuário já votou pela sessão/cookie local na montagem do componente
  useEffect(() => {
    const localVoted = localStorage.getItem("has_voted_reveal");
    if (localVoted === "1") {
      setHasVoted(true);
    }
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await fetch("/api/vote");
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error("Erro ao carregar dados de votação:", err);
    }
  };

  const handleOpenVoteModal = (babyName: string) => {
    setSelectedBaby(babyName);
    setShowModal(true);
  };

  // Envia o voto para a API
  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBaby) return;

    try {
      setLoading(true);
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          babyName: selectedBaby,
          voterName,
          voterEmail: null,
          voterPhone: null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Ocorreu um erro ao votar. Tente novamente.");
        return;
      }

      // Sucesso!
      toast.success(data.message || "Palpite registrado!");
      
      // Dispara Confetes
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: selectedBaby === babyOption1 ? ["#57a3e2", "#bae6fd"] : ["#e0589a", "#fbcfe8"],
      });

      setHasVoted(true);
      localStorage.setItem("has_voted_reveal", "1");
      setStats({
        option1: data.option1,
        option2: data.option2,
        total: data.total,
        hideResults: data.hideResults,
      });
      setShowModal(false);
      
    } catch (err) {
      console.error("Erro ao votar:", err);
      toast.error("Erro de conexão. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  if (!stats) return null;

  const shouldShowResults = hasVoted || showResultsWithoutVoting;

  return (
    <div className="w-full max-w-xl mx-auto my-8 px-4 text-center">
      <h3 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-800 mb-8">
        Qual seu palpite?
      </h3>

      {!shouldShowResults ? (
        <div className="flex flex-col space-y-6">
          <div className="flex gap-4 justify-center items-center">
            {/* Botão Miguel (Azul) */}
            <button
              onClick={() => handleOpenVoteModal(babyOption1)}
              className="flex-1 bg-baby-blue hover:bg-baby-blue-hover text-white text-3xl md:text-4xl lg:text-5xl font-serif font-normal py-5 px-8 rounded-3xl shadow-md hover:shadow-lg shadow-baby-blue/20 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              {babyOption1}
            </button>

            {/* Botão Rafaella (Rosa) */}
            <button
              onClick={() => handleOpenVoteModal(babyOption2)}
              className="flex-1 bg-baby-pink hover:bg-baby-pink-hover text-white text-3xl md:text-4xl lg:text-5xl font-serif font-normal py-5 px-8 rounded-3xl shadow-md hover:shadow-lg shadow-baby-pink/20 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              {babyOption2}
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowResultsWithoutVoting(true)}
              className="bg-[#f6b26b] hover:bg-[#e09d56] text-white text-sm font-bold py-3 px-8 rounded-full shadow-md hover:scale-105 active:scale-95 transition-all duration-200 mt-2"
            >
              Ver Resultado
            </button>
          </div>
        </div>
      ) : (
        /* Resultados da Votação - Design Premium */
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/60 shadow-xl max-w-md mx-auto space-y-6">
          {hasVoted && (
            <div className="flex justify-center items-center gap-1.5 text-emerald-500 font-bold text-xs bg-emerald-50 py-2 px-4 rounded-full">
              <CheckCircle2 className="h-4 w-4" />
              <span>Palpite registrado com sucesso!</span>
            </div>
          )}

          {stats.hideResults ? (
            <div className="text-center py-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-baby-gold-light text-baby-gold mb-3">
                <EyeOff className="h-6 w-6" />
              </div>
              <p className="text-gray-700 font-bold">Placar Ocultado pelos Pais</p>
              <p className="text-xs text-gray-400 mt-1">O resultado será revelado somente durante a festa!</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Palpite Miguel */}
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-end">
                  <span className="text-baby-blue font-serif text-2xl font-normal">{stats.option1.name}</span>
                  <span className="text-baby-blue font-bold text-lg">
                    {stats.option1.percentage}% <span className="text-xs text-gray-400 font-semibold">({stats.option1.count} votos)</span>
                  </span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/40">
                  <div 
                    className="h-full bg-baby-blue rounded-full shadow-[0_0_12px_rgba(87,163,226,0.4)] transition-all duration-1000 ease-out" 
                    style={{ width: `${stats.option1.percentage}%` }}
                  />
                </div>
              </div>

              {/* Palpite Rafaella */}
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-end">
                  <span className="text-baby-pink font-serif text-2xl font-normal">{stats.option2.name}</span>
                  <span className="text-baby-pink font-bold text-lg">
                    {stats.option2.percentage}% <span className="text-xs text-gray-400 font-semibold">({stats.option2.count} votos)</span>
                  </span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/40">
                  <div 
                    className="h-full bg-baby-pink rounded-full shadow-[0_0_12px_rgba(224,88,154,0.4)] transition-all duration-1000 ease-out" 
                    style={{ width: `${stats.option2.percentage}%` }}
                  />
                </div>
              </div>
              
              <div className="text-center pt-3 border-t border-slate-100">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  Total de votos: <span className="text-slate-700">{stats.total}</span>
                </p>
              </div>
            </div>
          )}

          {/* Botão para Voltar a ver a votação (caso não tenha votado) */}
          {!hasVoted && (
            <button
              onClick={() => setShowResultsWithoutVoting(false)}
              className="text-xs font-bold text-[#f6b26b] hover:text-[#e09d56] transition-colors uppercase tracking-wider mt-4 w-full block text-center pt-2"
            >
              ← Voltar para Votação
            </button>
          )}
        </div>
      )}

      {/* Modal para Informar Dados (Anti-Spam) - Idêntico ao print */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-baby-beige text-center">
            
            <h3 className="text-2xl font-extrabold text-gray-800 mb-2 leading-tight">
              Confirme seu Palpite em <span className={selectedBaby === babyOption1 ? "text-baby-blue" : "text-baby-pink"}>{selectedBaby}</span>!
            </h3>
            <p className="text-sm text-gray-400 font-semibold mb-8 max-w-sm mx-auto leading-relaxed">
              Obrigado por participar! Clique abaixo para registrar seu voto.
            </p>

            <form onSubmit={handleVoteSubmit} className="space-y-6">
              
              {/* Nome */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase text-gray-400 tracking-wider">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ana Maria"
                  value={voterName}
                  onChange={(e) => setVoterName(e.target.value)}
                  className="w-full bg-gray-50/50 border border-[#f6b26b]/30 rounded-2xl px-4 py-3.5 text-sm text-center focus:outline-none focus:border-[#f6b26b] font-bold text-gray-700 transition-all placeholder:text-gray-350"
                />
              </div>

              {/* Botões do Rodapé */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold py-3.5 rounded-full text-sm transition-all"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 text-white font-bold py-3.5 rounded-full text-sm shadow-md transition-all flex items-center justify-center gap-1 active:scale-95 ${
                    selectedBaby === babyOption1 
                      ? "bg-baby-blue hover:bg-baby-blue-hover" 
                      : "bg-baby-pink hover:bg-baby-pink-hover"
                  }`}
                >
                  {loading ? (
                    <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  ) : (
                    <span>Registrar Palpite</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
}
