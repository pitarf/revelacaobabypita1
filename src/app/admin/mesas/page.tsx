"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Plus, Edit2, Trash2, Search, Users, LayoutGrid, AlertCircle, CheckCircle2, X, Minus } from "lucide-react";
import { toast } from "sonner";

interface Guest {
  id: string;
  name: string;
  group: string | null;
  tableId: string | null;
  rsvpId: string | null;
  isManuallyConfirmed: boolean;
}

interface Table {
  id: string;
  name: string;
  capacity: number;
  guests: Guest[];
}

export default function MesasAdmin() {
  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tableName, setTableName] = useState("");
  
  const [guestSearch, setGuestSearch] = useState("");

  const fetchData = async () => {
    try {
      const [resTables, resGuests] = await Promise.all([
        fetch("/api/admin/tables"),
        fetch("/api/admin/guests")
      ]);
      if (resTables.ok && resGuests.ok) {
        setTables(await resTables.json());
        setGuests(await resGuests.json());
      } else {
        toast.error("Erro ao carregar os dados.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Falha na conexão.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openForm = (table?: Table) => {
    if (table) {
      setEditingId(table.id);
      setTableName(table.name);
    } else {
      setEditingId(null);
      setTableName("");
    }
    setFormOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName) return toast.error("Preencha o nome da mesa.");

    const payload = { name: tableName, capacity: editingId ? undefined : 1 }; // Default 1 mesa

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/admin/tables/${editingId}` : "/api/admin/tables";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingId ? "Mesa atualizada!" : "Mesa criada com sucesso!");
        setFormOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao salvar a mesa.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão.");
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!window.confirm("Deseja excluir esta mesa? Os convidados não serão excluídos, apenas perderão a mesa associada.")) return;
    
    try {
      const res = await fetch(`/api/admin/tables/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Mesa removida com sucesso!");
        fetchData();
      } else {
        toast.error("Erro ao remover mesa.");
      }
    } catch (err) {
      toast.error("Erro de conexão.");
    }
  };

  const assignGuestToTable = async (guestId: string, targetTableId: string | null) => {
    try {
      // Optimistic Update UI for better UX
      const currentGuest = guests.find(g => g.id === guestId);
      if (!currentGuest) return;

      const res = await fetch(`/api/admin/guests/${guestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: targetTableId })
      });
      if (res.ok) {
        toast.success("Convidado movido!");
        fetchData(); // Reload to get fresh states
      } else {
        toast.error("Erro ao mover convidado.");
      }
    } catch (err) {
      toast.error("Erro de conexão.");
    }
  };

  const updateTableCount = async (id: string, currentCount: number, change: number) => {
    const newCount = Math.max(1, currentCount + change);
    if (newCount === currentCount) return;

    try {
      setTables(tables.map(t => t.id === id ? { ...t, capacity: newCount } : t));
      
      const res = await fetch(`/api/admin/tables/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacity: newCount })
      });
      if (!res.ok) {
        toast.error("Erro ao atualizar quantidade de mesas.");
        fetchData(); 
      }
    } catch (err) {
      toast.error("Erro de conexão.");
      fetchData(); 
    }
  };

  const unassignedGuests = guests.filter(g => !g.tableId);
  const filteredUnassigned = unassignedGuests.filter(g => 
    g.name.toLowerCase().includes(guestSearch.toLowerCase()) || 
    (g.group && g.group.toLowerCase().includes(guestSearch.toLowerCase()))
  );

  const totalTables = tables.reduce((acc, t) => acc + t.capacity, 0);
  const totalAssignedGuests = guests.length - unassignedGuests.length;
  const totalChairsToRent = totalAssignedGuests;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 md:ml-64 relative">
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Organização das Mesas</h1>
            <p className="text-slate-500 text-sm mt-1">
              Gerencie os assentos dos seus convidados.
            </p>
          </div>
          <button
            onClick={() => openForm()}
            className="flex items-center gap-2 bg-[#5c5bd5] hover:bg-[#4a49ac] text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-colors w-fit"
          >
            <Plus size={20} />
            Nova Mesa
          </button>
        </header>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Mesas p/ Alugar</p>
            <p className="text-2xl font-black text-slate-800">{loading ? "-" : totalTables}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Total de Cadeiras</p>
            <p className="text-2xl font-black text-amber-600">{loading ? "-" : totalChairsToRent}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Convidados Sentados</p>
            <p className="text-2xl font-black text-green-600">{loading ? "-" : totalAssignedGuests}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Convidados sem Lugar</p>
            <p className="text-2xl font-black text-rose-600">{loading ? "-" : unassignedGuests.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Qtd de Grupos</p>
            <p className="text-2xl font-black text-blue-600">{loading ? "-" : tables.length}</p>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Left Column: Unassigned Guests */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-lg">Sem Assento</h2>
              <p className="text-xs text-slate-500 mb-3">{unassignedGuests.length} aguardando alocação</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar convidado..."
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5c5bd5]/50"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/50">
              {filteredUnassigned.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-400">Nenhum convidado encontrado.</div>
              ) : (
                filteredUnassigned.map(g => (
                  <div key={g.id} className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm group">
                    <p className="font-bold text-slate-700 text-sm line-clamp-1">{g.name}</p>
                    <p className="text-xs text-slate-500 line-clamp-1 mb-2">{g.group || "Sem Grupo"}</p>
                    <div className="relative">
                      <select 
                        className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded cursor-pointer focus:outline-none"
                        onChange={(e) => {
                          if (e.target.value) assignGuestToTable(g.id, e.target.value);
                        }}
                        value=""
                      >
                        <option value="" disabled>Colocar na mesa...</option>
                        {tables.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.guests.length} pessoas)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Tables Grid */}
          <div className="lg:col-span-3">
            {tables.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 p-10 rounded-xl text-center text-slate-500">
                <LayoutGrid className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p>Nenhuma mesa cadastrada.</p>
                <button onClick={() => openForm()} className="mt-3 text-sm font-bold text-[#5c5bd5] hover:underline">
                  Cadastrar a primeira mesa
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {tables.map(table => (
                  <div key={table.id} className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col border-slate-200 h-[350px]">
                    <div className="p-4 border-b flex justify-between items-start bg-slate-50 border-slate-100 shrink-0">
                      <div>
                        <h3 className="font-bold text-slate-800 line-clamp-1" title={table.name}>{table.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-slate-600 bg-slate-200 pl-2 pr-1 py-0.5 rounded-full flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              className="w-10 bg-white/50 text-center focus:outline-none focus:bg-white rounded border border-slate-300 py-0.5"
                              value={table.capacity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val > 0) {
                                  updateTableCount(table.id, table.capacity, val - table.capacity);
                                }
                              }}
                            />
                            mesa(s)
                            <button onClick={() => updateTableCount(table.id, table.capacity, -1)} className="hover:text-slate-900 ml-1"><Minus size={12}/></button>
                            <button onClick={() => updateTableCount(table.id, table.capacity, 1)} className="hover:text-slate-900"><Plus size={12}/></button>
                          </span>
                          <span className="text-xs text-slate-500">
                            ({table.guests.length} pessoas, {table.guests.filter(g => g.rsvpId || g.isManuallyConfirmed).length} confirmados)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openForm(table)} className="p-1.5 text-slate-400 hover:text-blue-600 bg-white rounded-md border border-slate-200 hover:border-blue-200 shadow-sm" title="Editar Nome do Grupo">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDeleteTable(table.id)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-white rounded-md border border-slate-200 hover:border-rose-200 shadow-sm" title="Excluir Grupo">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-3 bg-slate-50/30 overflow-y-auto custom-scrollbar">
                      {table.guests.length === 0 ? (
                        <div className="h-24 flex items-center justify-center text-xs text-slate-400 italic">Mesa Vazia</div>
                      ) : (
                        <div className="space-y-1.5">
                          {table.guests.map(g => (
                            <div key={g.id} className="flex justify-between items-center bg-white border border-slate-100 p-2 rounded-md shadow-sm">
                              <div className="overflow-hidden flex items-center gap-2">
                                <div title={(g.rsvpId || g.isManuallyConfirmed) ? "Confirmado" : "Pendente"}>
                                  <CheckCircle2 size={16} className={(g.rsvpId || g.isManuallyConfirmed) ? "text-green-500" : "text-slate-200"} />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-700 line-clamp-1">{g.name}</p>
                                  <p className="text-[10px] text-slate-400 line-clamp-1">{g.group || "Sem Grupo"}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => assignGuestToTable(g.id, null)}
                                className="text-xs text-rose-500 hover:bg-rose-50 px-2 py-1 rounded border border-transparent hover:border-rose-200 transition-colors ml-2 shrink-0"
                                title="Remover da mesa"
                              >
                                Retirar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Nova/Editar Mesa */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? "Editar Mesa" : "Nova Mesa"}
              </h2>
              <button 
                onClick={() => setFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm border border-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveTable} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Mesa</label>
                  <input
                    type="text"
                    required
                    value={tableName}
                    onChange={e => setTableName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c5bd5]/50"
                    placeholder="Ex: Família Silva ou Mesa 1"
                  />
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#5c5bd5] hover:bg-[#4a49ac] text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-colors"
                >
                  Salvar Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
