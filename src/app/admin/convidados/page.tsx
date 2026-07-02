"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Plus, Edit2, Trash2, Search, Users, Link as LinkIcon, Unlink } from "lucide-react";
import { toast } from "sonner";

interface Rsvp {
  id: string;
  fullName: string;
  adultsCount: number;
  childrenCount: number;
  totalGuests: number;
  status: string;
}

interface Guest {
  id: string;
  name: string;
  group: string | null;
  rsvpId: string | null;
  rsvp: Rsvp | null;
}

export default function GuestListPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // all, associated, pending

  // Modal de Edição/Criação
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [rsvpId, setRsvpId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [guestsRes, rsvpsRes] = await Promise.all([
        fetch("/api/admin/guests"),
        fetch("/api/admin/rsvp")
      ]);

      if (guestsRes.ok) {
        setGuests(await guestsRes.json());
      }
      
      if (rsvpsRes.ok) {
        const rsvpData = await rsvpsRes.json();
        setRsvps(rsvpData.data || []);
      }
    } catch (err) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const groups = Array.from(new Set(guests.map(g => g.group).filter(Boolean)));

  const filteredGuests = guests.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = filterGroup === "all" || g.group === filterGroup;
    let matchesStatus = true;
    
    if (filterStatus === "associated") matchesStatus = !!g.rsvpId;
    if (filterStatus === "pending") matchesStatus = !g.rsvpId;

    return matchesSearch && matchesGroup && matchesStatus;
  });

  const handleOpenForm = (guest?: Guest) => {
    if (guest) {
      setEditingId(guest.id);
      setName(guest.name);
      setGroup(guest.group || "");
      setRsvpId(guest.rsvpId || "");
    } else {
      setEditingId(null);
      setName("");
      setGroup("");
      setRsvpId("");
    }
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return toast.error("Preencha o nome do convidado.");

    setSubmitting(true);
    try {
      const payload = {
        name,
        group: group || null,
        rsvpId: rsvpId || null
      };

      const url = editingId ? `/api/admin/guests/${editingId}` : "/api/admin/guests";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingId ? "Convidado atualizado!" : "Convidado criado!");
        setFormOpen(false);
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Erro ao salvar.");
      }
    } catch (err) {
      toast.error("Erro ao comunicar com o servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este convidado da lista mestra?")) return;
    
    try {
      const res = await fetch(`/api/admin/guests/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Convidado removido!");
        fetchData();
      } else {
        toast.error("Erro ao remover.");
      }
    } catch (err) {
      toast.error("Erro ao comunicar com o servidor.");
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800">Lista de Convidados</h1>
              <p className="text-slate-500">Controle a sua lista mestra e associe às confirmações de presença.</p>
            </div>
            <button
              onClick={() => handleOpenForm()}
              className="flex items-center gap-2 bg-[#5c5bd5] hover:bg-[#4a49ac] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm"
            >
              <Plus size={20} />
              Novo Convidado
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5c5bd5]/50"
              />
            </div>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5c5bd5]/50"
            >
              <option value="all">Todos os Grupos</option>
              {groups.map((g: any) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5c5bd5]/50"
            >
              <option value="all">Todos os Status</option>
              <option value="associated">✅ Associados (Confirmados)</option>
              <option value="pending">⏳ Pendentes (Sem RSVP)</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-400">Carregando lista mestra...</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Convidado</th>
                    <th className="px-6 py-4 font-semibold">Grupo</th>
                    <th className="px-6 py-4 font-semibold">Associação RSVP</th>
                    <th className="px-6 py-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGuests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-slate-400">
                        Nenhum convidado encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredGuests.map((guest) => (
                      <tr key={guest.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{guest.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                            {guest.group || "Sem Grupo"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {guest.rsvp ? (
                            <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                              <LinkIcon size={14} />
                              Confirmado por: {guest.rsvp.fullName}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-100 px-3 py-1.5 rounded-lg w-fit">
                              <Unlink size={14} />
                              Aguardando Associação
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenForm(guest)}
                              className="p-2 text-slate-400 hover:text-[#5c5bd5] hover:bg-[#5c5bd5]/10 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(guest.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? "Editar Convidado" : "Novo Convidado"}
              </h2>
              <button
                onClick={() => setFormOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Convidado</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c5bd5]/50"
                  placeholder="Ex: Tio João"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Grupo (Opcional)</label>
                <input
                  type="text"
                  value={group}
                  onChange={e => setGroup(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c5bd5]/50"
                  placeholder="Ex: Família Rafael"
                  list="group-options"
                />
                <datalist id="group-options">
                  {groups.map((g: any) => <option key={g} value={g} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Associação de RSVP (Presença)</label>
                <select
                  value={rsvpId}
                  onChange={e => setRsvpId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c5bd5]/50"
                >
                  <option value="">-- Não associado / Aguardando --</option>
                  {rsvps.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.fullName} (Confirma {r.totalGuests} pessoa{r.totalGuests > 1 ? 's' : ''}) {r.status !== 'confirmed' ? '- ' + r.status : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Selecione quem confirmou a presença para essa pessoa.
                </p>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-5 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#5c5bd5] hover:bg-[#4a49ac] text-white px-6 py-2 rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  {submitting ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
