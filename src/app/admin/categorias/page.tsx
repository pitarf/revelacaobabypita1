"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Plus, Edit2, Trash2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados do Modal / Formulário
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [order, setOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      if (res.ok) {
        setCategories(json.data || []);
      } else {
        toast.error(json.error || "Erro ao carregar categorias.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Helper para gerar o slug automaticamente a partir do nome
  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingId) {
      const generated = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .replace(/[^a-z0-9\s-]/g, "") // remove caracteres especiais
        .trim()
        .replace(/\s+/g, "-"); // troca espaços por hífen
      setSlug(generated);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setOrder("0");
    setIsActive(true);
    setFormOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setOrder(String(cat.order));
    setIsActive(cat.isActive);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error("Nome e slug são obrigatórios.");
      return;
    }

    try {
      setSubmitting(true);
      const method = editingId ? "PUT" : "POST";
      const payload = {
        id: editingId,
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        order: parseInt(order) || 0,
        isActive,
      };

      const res = await fetch("/api/admin/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao salvar categoria.");
        return;
      }

      toast.success(editingId ? "Categoria atualizada!" : "Categoria criada!");
      setFormOpen(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar dados.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    const confirmDelete = window.confirm(`Deseja realmente excluir permanentemente a categoria "${catName}"?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao excluir categoria.");
        return;
      }

      toast.success("Categoria excluída com sucesso!");
      fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão ao excluir.");
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 md:pl-72 md:pr-8 md:py-8 space-y-6 overflow-x-hidden">
        
        {/* Cabeçalho da página */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 font-sans">Categorias de Presentes</h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">Crie e edite as partições da vitrine</p>
          </div>
          
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Nova Categoria
          </button>
        </div>

        {/* Tabela de Categorias */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin inline-block h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full mb-2"></div>
              <p className="text-xs text-gray-400 font-bold">Carregando categorias...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase text-[10px]">
              Nenhuma categoria cadastrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-500">
                <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-150">
                  <tr>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Slug / Link</th>
                    <th className="px-6 py-4">Ordem de exibição</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4.5 text-slate-700 font-extrabold">{cat.name}</td>
                      <td className="px-6 py-4.5 font-mono text-[11px] text-slate-400">/{cat.slug}</td>
                      <td className="px-6 py-4.5 text-slate-600 font-bold">{cat.order}º</td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          cat.isActive 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}>
                          {cat.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Ativa
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              Inativa
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
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
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative">
              
              <h3 className="text-lg font-black text-slate-800 font-sans mb-2">
                {editingId ? "Editar Categoria" : "Nova Categoria"}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mb-6">Preencha as configurações de organização da categoria.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Nome da Categoria</label>
                  <input
                    type="text"
                    placeholder="Ex: Roupas e Acessórios"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-slate-400 font-bold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">URL Slug (Auto-gerado)</label>
                  <input
                    type="text"
                    placeholder="ex-roupas-e-acessorios"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono font-bold focus:outline-none focus:border-slate-400 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Ordem de Exibição</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={order}
                      onChange={(e) => setOrder(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-slate-400 text-center transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Status Ativo</label>
                    <select
                      value={String(isActive)}
                      onChange={(e) => setIsActive(e.target.value === "true")}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-slate-400 cursor-pointer text-center"
                    >
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </select>
                  </div>
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
                      <span>Salvar Categoria</span>
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
