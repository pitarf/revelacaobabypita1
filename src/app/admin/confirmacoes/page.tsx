"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Search, Download, HelpCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Rsvp {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  adultsCount: number;
  childrenCount: number;
  totalGuests: number;
  companionsNames: string | null;
  foodRestriction: string | null;
  notes: string | null;
  accessCode: string;
  status: string;
  createdAt: string;
}

export default function AdminConfirmationsPage() {
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modal / Formulário
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [companionsNames, setCompanionsNames] = useState("");
  const [foodRestriction, setFoodRestriction] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRsvps();
  }, []);

  const fetchRsvps = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/rsvp");
      const json = await res.json();
      if (res.ok) {
        setRsvps(json.data || []);
      } else {
        toast.error(json.error || "Erro ao obter confirmações.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao conectar.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setAdultsCount(1);
    setChildrenCount(0);
    setCompanionsNames("");
    setFoodRestriction("");
    setNotes("");
    setStatus("confirmed");
    setFormOpen(true);
  };

  const handleOpenEdit = (rsvp: Rsvp) => {
    setEditingId(rsvp.id);
    setFullName(rsvp.fullName);
    setEmail(rsvp.email);
    setPhone(rsvp.phone);
    setAdultsCount(rsvp.adultsCount);
    setChildrenCount(rsvp.childrenCount);
    setCompanionsNames(rsvp.companionsNames || "");
    setFoodRestriction(rsvp.foodRestriction || "");
    setNotes(rsvp.notes || "");
    setStatus(rsvp.status);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error("Nome, E-mail e Celular são obrigatórios.");
      return;
    }

    try {
      setSubmitting(true);
      const method = editingId ? "PUT" : "POST";
      const payload = {
        id: editingId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, ""),
        adultsCount,
        childrenCount,
        companionsNames: companionsNames.trim() || null,
        foodRestriction: foodRestriction.trim() || null,
        notes: notes.trim() || null,
        status,
      };

      const res = await fetch("/api/admin/rsvp", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao salvar RSVP.");
        return;
      }

      toast.success(editingId ? "RSVP atualizado!" : "RSVP registrado!");
      setFormOpen(false);
      fetchRsvps();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar dados.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`Deseja realmente remover o RSVP de "${name}"?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/rsvp?id=${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao excluir RSVP.");
        return;
      }

      toast.success("RSVP removido com sucesso!");
      fetchRsvps();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir.");
    }
  };

  // Exportação CSV Pura otimizada para Excel Brasileiro
  const handleExportCSV = () => {
    if (rsvps.length === 0) {
      toast.error("Nenhum dado para exportar.");
      return;
    }

    const headers = [
      "Código",
      "Nome",
      "E-mail",
      "WhatsApp",
      "Adultos",
      "Crianças",
      "Total",
      "Acompanhantes",
      "Restrições",
      "Observações",
      "Status",
      "Data de Envio",
    ];

    const rows = filteredRsvps.map((rsvp) => [
      rsvp.accessCode,
      rsvp.fullName,
      rsvp.email,
      rsvp.phone,
      rsvp.adultsCount,
      rsvp.childrenCount,
      rsvp.totalGuests,
      rsvp.companionsNames || "",
      rsvp.foodRestriction || "",
      rsvp.notes || "",
      rsvp.status === "confirmed" ? "Confirmado" : "Cancelado",
      new Date(rsvp.createdAt).toLocaleDateString("pt-BR"),
    ]);

    // Adiciona o byte order mark (BOM) UTF-8 no início do arquivo para o Excel ler acentos
    let csvContent = "\uFEFF";
    csvContent += headers.join(";") + "\r\n";

    rows.forEach((row) => {
      const formattedRow = row.map((val) => {
        // Escapa aspas e quebras de linha
        const clean = String(val).replace(/"/g, '""').replace(/\r?\n|\r/g, " ");
        return `"${clean}"`;
      });
      csvContent += formattedRow.join(";") + "\r\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rsvps_cha_revelacao_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Arquivo CSV exportado com sucesso!");
  };

  // Filtra RSVPs na busca em tempo real
  const filteredRsvps = rsvps.filter((rsvp) => {
    const matchesSearch = 
      rsvp.fullName.toLowerCase().includes(search.toLowerCase()) || 
      rsvp.email.toLowerCase().includes(search.toLowerCase()) ||
      rsvp.accessCode.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === "all" || rsvp.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Cálculos de Totais Consolidados (Apenas Confirmados)
  const confirmedOnly = rsvps.filter(r => r.status === "confirmed");
  const totGuests = confirmedOnly.reduce((acc, curr) => acc + curr.totalGuests, 0);
  const totAdults = confirmedOnly.reduce((acc, curr) => acc + curr.adultsCount, 0);
  const totChildren = confirmedOnly.reduce((acc, curr) => acc + curr.childrenCount, 0);

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 md:pl-72 md:pr-8 md:py-8 space-y-6 overflow-x-hidden">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 font-sans">Lista de Confirmados (RSVP)</h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">Acompanhe as confirmações de presença e acompanhantes</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-white text-slate-700 border border-slate-200 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition-all hover:bg-slate-50 active:scale-95"
            >
              <Download className="h-4 w-4 text-slate-500" />
              Exportar CSV
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Adicionar Convidado
            </button>
          </div>
        </div>

        {/* Painel de Totais Consolidados (Confirmados) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Geral</p>
            <p className="text-xl font-black text-slate-700 mt-0.5">{totGuests} pessoa(s)</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Adultos</p>
            <p className="text-xl font-black text-slate-700 mt-0.5">{totAdults} adulto(s)</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Crianças</p>
            <p className="text-xl font-black text-slate-700 mt-0.5">{totChildren} criança(s)</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Formulários</p>
            <p className="text-xl font-black text-slate-700 mt-0.5">{confirmedOnly.length} envio(s)</p>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Buscar por nome, email ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-11 text-xs focus:outline-none focus:border-slate-400 font-semibold shadow-sm transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>

          <div className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm w-full sm:w-auto justify-between">
            <span className="text-slate-400">Filtrar:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border-0 font-bold text-slate-700 focus:outline-none cursor-pointer py-1 ml-1"
            >
              <option value="all">Todas as Respostas</option>
              <option value="confirmed">Apenas Confirmados</option>
              <option value="cancelled">Apenas Cancelados</option>
            </select>
          </div>
        </div>

        {/* Tabela RSVP */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin inline-block h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full mb-2"></div>
              <p className="text-xs text-gray-400 font-bold">Carregando confirmações...</p>
            </div>
          ) : filteredRsvps.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase text-[10px]">
              Nenhum convidado localizado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-150">
                  <tr>
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4">Convidado</th>
                    <th className="px-6 py-4">WhatsApp</th>
                    <th className="px-6 py-4">Adultos</th>
                    <th className="px-6 py-4">Crianças</th>
                    <th className="px-6 py-4">Restrições</th>
                    <th className="px-6 py-4">Mensagem</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRsvps.map((rsvp) => (
                    <tr key={rsvp.id} className="hover:bg-slate-50/50">
                      {/* Código */}
                      <td className="px-6 py-4 font-mono font-black text-slate-800 text-[11px]">{rsvp.accessCode}</td>
                      
                      {/* Convidado */}
                      <td className="px-6 py-4">
                        <div className="text-slate-700 font-extrabold">{rsvp.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{rsvp.email}</div>
                      </td>

                      {/* Celular */}
                      <td className="px-6 py-4 font-mono">{rsvp.phone}</td>

                      {/* Qtds */}
                      <td className="px-6 py-4 text-slate-800 font-black">{rsvp.adultsCount}</td>
                      <td className="px-6 py-4 text-slate-800 font-black">{rsvp.childrenCount}</td>

                      {/* Restrição */}
                      <td className="px-6 py-4 truncate max-w-[150px]" title={rsvp.foodRestriction || ""}>
                        {rsvp.foodRestriction || "-"}
                      </td>

                      {/* Obs */}
                      <td className="px-6 py-4 text-center">
                        {rsvp.notes ? (
                          <button 
                            onClick={() => alert(`Mensagem de ${rsvp.fullName}:\n"${rsvp.notes}"`)}
                            className="text-slate-400 hover:text-sky-500 transition-colors p-1"
                            title={rsvp.notes}
                          >
                            <MessageSquare className="h-4.5 w-4.5" />
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          rsvp.status === "confirmed" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {rsvp.status === "confirmed" ? "Confirmado" : "Cancelado"}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(rsvp)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(rsvp.id, rsvp.fullName)}
                          className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 transition-colors border border-rose-100"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de Formulário (Criar / Editar) */}
        {formOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative my-8 max-h-[90vh] overflow-y-auto no-scrollbar">
              
              <h3 className="text-lg font-black text-slate-800 font-sans mb-2">
                {editingId ? "Editar Convidado" : "Adicionar Convidado Manual"}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mb-6">Preencha as configurações cadastrais de RSVP do convidado.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Nome Completo *</label>
                    <input
                      type="text"
                      placeholder="Nome completo do convidado"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-slate-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">E-mail *</label>
                    <input
                      type="email"
                      placeholder="joao@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-slate-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">WhatsApp / Celular *</label>
                    <input
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono font-bold focus:outline-none focus:border-slate-400 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Adultos</label>
                    <input
                      type="number"
                      value={adultsCount}
                      onChange={(e) => setAdultsCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 text-xs font-bold text-center"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Crianças</label>
                    <input
                      type="number"
                      value={childrenCount}
                      onChange={(e) => setChildrenCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 text-xs font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 text-xs font-bold text-center cursor-pointer"
                    >
                      <option value="confirmed">Confirmado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </div>

                {adultsCount + childrenCount > 1 && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Nome dos Acompanhantes</label>
                    <textarea
                      placeholder="Ex: Maria da Silva (esposa), Pedro da Silva (filho)"
                      value={companionsNames}
                      onChange={(e) => setCompanionsNames(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-slate-400 transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Restrições Alimentares</label>
                  <input
                    type="text"
                    placeholder="Ex: Vegetariano, alérgico a glúten"
                    value={foodRestriction}
                    onChange={(e) => setFoodRestriction(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-slate-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Anotações / Recado</label>
                  <textarea
                    placeholder="Alguma anotação interna..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-slate-400 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-250 text-slate-500 font-bold py-3.5 rounded-full text-xs transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-slate-900 hover:bg-black text-white font-extrabold py-3.5 rounded-full text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    {submitting ? (
                      <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <span>Salvar Confirmação</span>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
