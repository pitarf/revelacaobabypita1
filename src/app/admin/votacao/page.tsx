"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Heart, Search, Trash2, ShieldAlert, Star } from "lucide-react";
import { toast } from "sonner";

interface Vote {
  id: string;
  babyName: string;
  voterEmail: string | null;
  voterPhone: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AdminVotingPage() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBaby, setFilterBaby] = useState("all");

  useEffect(() => {
    fetchVotes();
  }, []);

  const fetchVotes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/vote");
      const json = await res.json();
      if (res.ok) {
        setVotes(json.data || []);
      } else {
        toast.error(json.error || "Erro ao obter palpites.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVote = async (id: string, contact: string) => {
    const confirmDelete = window.confirm(`Deseja realmente remover permanentemente o voto de ${contact}? Isto alterará o placar em tempo real.`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/vote?id=${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao excluir voto.");
        return;
      }

      toast.success("Voto removido com sucesso!");
      fetchVotes();
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão ao excluir.");
    }
  };

  // Filtra palpites
  const filteredVotes = votes.filter((vote) => {
    const contactStr = `${vote.voterEmail || ""} ${vote.voterPhone || ""} ${vote.ipAddress || ""}`.toLowerCase();
    const matchesSearch = contactStr.includes(search.toLowerCase());
    const matchesBaby = filterBaby === "all" || vote.babyName === filterBaby;

    return matchesSearch && matchesBaby;
  });

  // Cálculos do Placar
  const totalVotes = votes.length;
  const votesOption1 = votes.filter(v => v.babyName === "Miguel").length;
  const votesOption2 = votes.filter(v => v.babyName === "Rafaella").length;
  const pctOption1 = totalVotes > 0 ? Math.round((votesOption1 / totalVotes) * 100) : 50;
  const pctOption2 = totalVotes > 0 ? Math.round((votesOption2 / totalVotes) * 100) : 50;

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 md:pl-72 md:pr-8 md:py-8 space-y-6 overflow-x-hidden">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 font-sans">Votação & Palpites</h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">Monitore os palpites dos convidados e audite fraudes</p>
          </div>
        </div>

        {/* Placar Estatístico Grandes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-none">
              <span className="text-2xl">♂️</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Votos em Miguel</p>
              <p className="text-2xl font-black text-slate-700 mt-0.5">{votesOption1} ({pctOption1}%)</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center flex-none">
              <span className="text-2xl">♀️</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Votos em Rafaella</p>
              <p className="text-2xl font-black text-slate-700 mt-0.5">{votesOption2} ({pctOption2}%)</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-none">
              <Heart className="h-6 w-6 fill-amber-50" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total de Palpites</p>
              <p className="text-2xl font-black text-slate-700 mt-0.5">{totalVotes}</p>
            </div>
          </div>
        </div>

        {/* Gráfico de Barra Proporcional */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm max-w-2xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Proporção Visual do Placar</h3>
          <div className="relative h-5 w-full rounded-full bg-slate-100 overflow-hidden flex border border-slate-200">
            <div className="h-full bg-baby-blue transition-all duration-1000" style={{ width: `${pctOption1}%` }} />
            <div className="h-full bg-baby-pink transition-all duration-1000" style={{ width: `${pctOption2}%` }} />
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Buscar por e-mail, celular ou IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-11 text-xs focus:outline-none focus:border-slate-400 font-semibold shadow-sm transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>

          <div className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm w-full sm:w-auto justify-between">
            <span className="text-slate-400">Palpite:</span>
            <select
              value={filterBaby}
              onChange={(e) => setFilterBaby(e.target.value)}
              className="bg-transparent border-0 font-bold text-slate-700 focus:outline-none cursor-pointer py-1 ml-1"
            >
              <option value="all">Todos os Votos</option>
              <option value="Miguel">Apenas Miguel ♂️</option>
              <option value="Rafaella">Apenas Rafaella ♀️</option>
            </select>
          </div>
        </div>

        {/* Tabela de Votos */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin inline-block h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full mb-2"></div>
              <p className="text-xs text-gray-400 font-bold">Carregando palpites...</p>
            </div>
          ) : filteredVotes.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase text-[10px]">
              Nenhum palpite registrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-150">
                  <tr>
                    <th className="px-6 py-4">Bebê Opcional</th>
                    <th className="px-6 py-4">Contato do Convidado</th>
                    <th className="px-6 py-4">Endereço IP</th>
                    <th className="px-6 py-4">Data do Voto</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVotes.map((vote) => {
                    const identifier = vote.voterEmail || vote.voterPhone || "Hash Anônimo";

                    return (
                      <tr key={vote.id} className="hover:bg-slate-50/50">
                        {/* Bebê */}
                        <td className="px-6 py-4.5">
                          <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[9px] font-bold ${
                            vote.babyName === "Miguel" 
                              ? "bg-sky-50 text-sky-700 border border-sky-200" 
                              : "bg-pink-50 text-pink-700 border border-pink-200"
                          }`}>
                            {vote.babyName === "Miguel" ? "Miguel ♂️" : "Rafaella ♀️"}
                          </span>
                        </td>
                        
                        {/* Contato */}
                        <td className="px-6 py-4.5 text-slate-700 font-extrabold">
                          {identifier}
                        </td>

                        {/* IP */}
                        <td className="px-6 py-4.5 font-mono text-[11px] text-slate-400">{vote.ipAddress || "-"}</td>

                        {/* Data */}
                        <td className="px-6 py-4.5 text-slate-500">
                          {new Date(vote.createdAt).toLocaleDateString("pt-BR")} às {new Date(vote.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </td>

                        {/* Ações */}
                        <td className="px-6 py-4.5 text-right flex justify-end gap-2">
                          <button
                            onClick={() => handleDeleteVote(vote.id, identifier)}
                            className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 transition-colors border border-rose-100"
                            title="Remover voto falso/spam"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
