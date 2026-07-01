"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Users, Heart, Gift, DollarSign, Calendar, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          toast.error("Sua sessão expirou. Faça login novamente.");
        }
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
        toast.error("Erro ao carregar dados do painel.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full mb-2"></div>
          <p className="text-xs text-gray-400 font-bold">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, recent } = data;

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col md:flex-row">
      {/* Menu Lateral */}
      <AdminSidebar />

      {/* Conteúdo Principal */}
      <main className="flex-1 p-6 md:pl-72 md:pr-8 md:py-8 space-y-6 overflow-x-hidden">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 font-sans">Resumo do Chá Revelação</h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">Métricas e Atividades Recentes</p>
          </div>
          <div className="text-xs font-bold text-slate-500 bg-white border rounded-lg px-3 py-1.5 shadow-sm">
            📅 Local: <strong>Espaço Kolina</strong>
          </div>
        </div>

        {/* Linha 1: Cards Estatísticos Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card RSVP */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-none">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Convidados Confirmados</p>
              <p className="text-2xl font-black text-slate-700 mt-0.5">{metrics.rsvp.confirmedGuests}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {metrics.rsvp.confirmedAdults} adultos, {metrics.rsvp.confirmedChildren} crianças
              </p>
            </div>
          </div>

          {/* Card Votos */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center flex-none">
              <Heart className="h-6 w-6 fill-pink-50" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Palpites Registrados</p>
              <p className="text-2xl font-black text-slate-700 mt-0.5">{metrics.votes.total}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {metrics.votes.option1.name} {metrics.votes.option1.percentage}% | {metrics.votes.option2.name} {metrics.votes.option2.percentage}%
              </p>
            </div>
          </div>

          {/* Card Financeiro Bruto */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-none">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Arrecadação Líquida</p>
              <p className="text-2xl font-black text-slate-700 mt-0.5">
                {metrics.finance.net.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <p className="text-[10px] text-emerald-500 font-bold mt-0.5">
                Bruto: {metrics.finance.gross.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
          </div>

          {/* Card Pendentes */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-none">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aguardando Pagamento</p>
              <p className="text-2xl font-black text-slate-700 mt-0.5">
                {metrics.finance.pending.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Aguardando Pix ou Cartão</p>
            </div>
          </div>

        </div>

        {/* Linha 2: Votação Gráfico Placar */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5 text-pink-500" />
              Palpites do Placar
            </h3>
            <span className="text-xs font-bold text-slate-400">{metrics.votes.total} votos no total</span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-baby-blue">{metrics.votes.option1.name}: {metrics.votes.option1.count} ({metrics.votes.option1.percentage}%)</span>
              <span className="text-baby-pink">{metrics.votes.option2.name}: {metrics.votes.option2.count} ({metrics.votes.option2.percentage}%)</span>
            </div>

            {/* Barra Proporcional */}
            <div className="relative h-5 w-full rounded-full bg-slate-100 overflow-hidden flex border border-slate-200">
              <div 
                className="h-full bg-baby-blue transition-all duration-1000 ease-out" 
                style={{ width: `${metrics.votes.option1.percentage}%` }}
              />
              <div 
                className="h-full bg-baby-pink transition-all duration-1000 ease-out" 
                style={{ width: `${metrics.votes.option2.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Linha 3: Grid de Tabelas de Histórico Recente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Confirmações de RSVP Recentes */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Users className="h-4.5 w-4.5 text-sky-500" />
              RSVPs Recentes
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-500">
                <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2.5">Convidado</th>
                    <th className="px-4 py-2.5">Total</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent.rsvps.map((rsvp: any) => (
                    <tr key={rsvp.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-700 font-extrabold">{rsvp.fullName}</td>
                      <td className="px-4 py-3">{rsvp.totalGuests} pessoa(s)</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                          rsvp.status === "confirmed" 
                            ? "bg-emerald-50 text-emerald-700" 
                            : "bg-rose-50 text-rose-700"
                        }`}>
                          {rsvp.status === "confirmed" ? "Confirmado" : "Cancelado"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recent.rsvps.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-6 text-slate-400 font-bold uppercase text-[10px]">
                        Nenhuma confirmação enviada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Presentes Mais Escolhidos */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Gift className="h-4.5 w-4.5 text-baby-gold" />
              Presentes Mais Escolhidos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-500">
                <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2.5">Presente</th>
                    <th className="px-4 py-2.5">Categoria</th>
                    <th className="px-4 py-2.5">Escolhidos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent.topGifts.map((gift: any) => (
                    <tr key={gift.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-700 font-extrabold">{gift.name}</td>
                      <td className="px-4 py-3">{gift.category.name}</td>
                      <td className="px-4 py-3 text-slate-800 font-black">{gift.chosenQuantity} / {gift.maxQuantity}</td>
                    </tr>
                  ))}
                  {recent.topGifts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-6 text-slate-400 font-bold uppercase text-[10px]">
                        Nenhum presente escolhido ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pedidos Recentes */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
              Pedidos de Presentes Recentes
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-500">
                <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2.5">Código</th>
                    <th className="px-4 py-2.5">Quem Presenteou</th>
                    <th className="px-4 py-2.5">Valor</th>
                    <th className="px-4 py-2.5">Método</th>
                    <th className="px-4 py-2.5">Pagamento</th>
                    <th className="px-4 py-2.5">Entrega</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent.orders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-800 font-black font-mono">{ord.code}</td>
                      <td className="px-4 py-3 text-slate-700 font-extrabold">
                        {ord.isAnonymous ? "🔒 Convidado Anônimo" : ord.gifterName}
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-extrabold">
                        {ord.totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="px-4 py-3 uppercase text-[10px] font-bold">{ord.paymentMethod === 'personal' ? 'PESSOALMENTE' : ord.paymentMethod}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                          ord.paymentStatus === "approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-250"
                            : "bg-amber-50 text-amber-700 border border-amber-250"
                        }`}>
                          {ord.paymentStatus === "approved" ? "Aprovado" : "Pendente"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                          ord.deliveryStatus === "delivered"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-250"
                            : ord.deliveryStatus === "cancelled"
                            ? "bg-rose-50 text-rose-700 border border-rose-250"
                            : "bg-amber-50 text-amber-700 border border-amber-250"
                        }`}>
                          {ord.deliveryStatus === "delivered" 
                            ? "Entregue" 
                            : ord.deliveryStatus === "cancelled" 
                            ? "Cancelado" 
                            : "Pendente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recent.orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400 font-bold uppercase text-[10px]">
                        Nenhum pedido de presentes registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
