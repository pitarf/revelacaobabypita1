"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import ImageCropper from "@/components/admin/ImageCropper";
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Star, Image as ImageIcon, ExternalLink, UploadCloud } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface Gift {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  value: number;
  maxQuantity: number;
  chosenQuantity: number;
  remainingQuantity: number;
  externalLink: string | null;
  isFeatured: boolean;
  status: string;
  categoryId: string;
  category: Category;
}

export default function AdminGiftsPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Formulário / Modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estados de Filtro e Ordenação
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("todos");
  const [sortBy, setSortBy] = useState("relevant");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [value, setValue] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("1");
  const [externalLink, setExternalLink] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState("available");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);

  // Seleção em massa
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const filteredGifts = gifts.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "todos" || g.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === "price-desc") return b.value - a.value;
    if (sortBy === "price-asc") return a.value - b.value;
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    return (a.isFeatured === b.isFeatured ? 0 : a.isFeatured ? -1 : 1);
  });

  const toggleAll = () => {
    if (selectedIds.size === filteredGifts.length && filteredGifts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredGifts.map(g => g.id)));
    }
  };

  const handleMassAction = async (action: 'active' | 'inactive' | 'delete') => {
    if (selectedIds.size === 0) return;
    const confirmMessage = action === 'delete' 
      ? `Deseja excluir ${selectedIds.size} presentes permanentemente?` 
      : `Deseja ${action === 'active' ? 'ativar' : 'inativar'} ${selectedIds.size} presentes?`;
      
    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      const res = await fetch("/api/admin/gifts/mass", {
        method: action === 'delete' ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), action }),
      });

      if (!res.ok) {
        toast.error("Erro na ação em massa.");
      } else {
        toast.success(`Ação concluída para ${selectedIds.size} presentes!`);
        setSelectedIds(new Set());
        fetchGifts();
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGifts();
    fetchCategories();
  }, []);

  const fetchGifts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/gifts");
      const json = await res.json();
      if (res.ok) {
        setGifts(json.data || []);
      } else {
        toast.error(json.error || "Erro ao carregar presentes.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (res.ok) {
        setCategories(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setImageUrl("");
    setValue("");
    setMaxQuantity("1");
    setExternalLink("");
    setIsFeatured(false);
    setStatus("available");
    setCategoryId(categories[0]?.id || "");
    setFormOpen(true);
  };

  const handleOpenEdit = (gift: Gift) => {
    setEditingId(gift.id);
    setName(gift.name);
    setDescription(gift.description || "");
    setImageUrl(gift.imageUrl || "");
    setValue(String(gift.value));
    setMaxQuantity(String(gift.maxQuantity));
    setExternalLink(gift.externalLink || "");
    setIsFeatured(gift.isFeatured);
    setStatus(gift.status === "inactive" ? "inactive" : "available");
    setCategoryId(gift.categoryId);
    setFormOpen(true);
  };

  const handleCropComplete = async (base64Webp: string) => {
    try {
      setCropperOpen(false);
      toast.info("Enviando e otimizando imagem...");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Webp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setImageUrl(json.url);
      toast.success("Imagem enviada com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao fazer upload da imagem.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !value || !categoryId) {
      toast.error("Nome, Valor e Categoria são obrigatórios.");
      return;
    }

    try {
      setSubmitting(true);
      const method = editingId ? "PUT" : "POST";
      const payload = {
        id: editingId,
        name: name.trim(),
        description: description.trim() || null,
        imageUrl: imageUrl.trim() || null,
        value: parseFloat(value),
        maxQuantity: parseInt(maxQuantity) || 1,
        externalLink: externalLink.trim() || null,
        isFeatured,
        status,
        categoryId,
      };

      const res = await fetch("/api/admin/gifts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao salvar presente.");
        return;
      }

      toast.success(editingId ? "Presente atualizado!" : "Presente cadastrado!");
      setFormOpen(false);
      fetchGifts();
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão ao enviar.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, giftName: string) => {
    const confirmDelete = window.confirm(`Deseja realmente excluir permanentemente o presente "${giftName}"?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/gifts?id=${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao excluir presente.");
        return;
      }

      toast.success("Presente excluído com sucesso!");
      fetchGifts();
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão ao excluir.");
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 md:pl-72 md:pr-8 md:py-8 space-y-6 overflow-x-hidden">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 font-sans">Catálogo de Presentes</h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">Gerencie os presentes, valores e links externos</p>
          </div>
          
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Novo Presente
          </button>
        </div>

        {/* Barra de Ações em Massa */}
        {selectedIds.size > 0 && (
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between animate-fade-in">
            <span className="text-xs font-bold text-slate-600 px-2">{selectedIds.size} presentes selecionados</span>
            <div className="flex gap-2">
              <button onClick={() => handleMassAction('active')} className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100">Ativar</button>
              <button onClick={() => handleMassAction('inactive')} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200">Ocultar</button>
              <button onClick={() => handleMassAction('delete')} className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100">Excluir</button>
            </div>
          </div>
        )}

        {/* Filtros e Busca */}
        <div className="flex flex-col md:flex-row gap-4 mb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold focus:outline-none focus:border-slate-400"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold focus:outline-none focus:border-slate-400 cursor-pointer"
          >
            <option value="todos">Todas as Categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold focus:outline-none focus:border-slate-400 cursor-pointer"
          >
            <option value="relevant">Relevância / Destaques</option>
            <option value="price-desc">Maior Preço</option>
            <option value="price-asc">Menor Preço</option>
            <option value="name-asc">Ordem Alfabética (A-Z)</option>
            <option value="name-desc">Ordem Alfabética (Z-A)</option>
          </select>
        </div>

        {/* Tabela de Presentes */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin inline-block h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full mb-2"></div>
              <p className="text-xs text-gray-400 font-bold">Carregando presentes...</p>
            </div>
          ) : filteredGifts.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase text-[10px]">
              Nenhum presente localizado com os filtros atuais.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-500">
                <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-150">
                  <tr>
                    <th className="px-4 py-4 w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.size === filteredGifts.length && filteredGifts.length > 0}
                        onChange={toggleAll}
                        className="accent-slate-900 cursor-pointer w-3.5 h-3.5"
                      />
                    </th>
                    <th className="px-4 py-4">Foto</th>
                    <th className="px-4 py-4">Nome</th>
                    <th className="px-4 py-4">Categoria</th>
                    <th className="px-4 py-4">Valor</th>
                    <th className="px-4 py-4">Quantidade</th>
                    <th className="px-4 py-4">Selo</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGifts.map((gift) => (
                    <tr key={gift.id} className={`hover:bg-slate-50/50 ${selectedIds.has(gift.id) ? "bg-slate-50/80" : ""}`}>
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(gift.id)}
                          onChange={() => toggleSelection(gift.id)}
                          className="accent-slate-900 cursor-pointer w-3.5 h-3.5"
                        />
                      </td>
                      {/* Mini Foto */}
                      <td className="px-4 py-3">
                        <div className="h-10 w-10 rounded-lg border bg-slate-50 overflow-hidden flex items-center justify-center text-slate-300">
                          {gift.imageUrl ? (
                            <img src={gift.imageUrl} alt={gift.name} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5" />
                          )}
                        </div>
                      </td>

                      {/* Nome */}
                      <td className="px-4 py-3">
                        <div className="text-slate-700 font-extrabold line-clamp-1" title={gift.name}>{gift.name}</div>
                        {gift.externalLink && (
                          <a 
                            href={gift.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-[10px] text-sky-500 font-bold mt-0.5 hover:underline"
                          >
                            <span>Link externo</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="px-4 py-3 text-slate-500">{gift.category.name}</td>

                      {/* Valor */}
                      <td className="px-4 py-3 text-slate-800 font-black">
                        {gift.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>

                      {/* Quantidade */}
                      <td className="px-4 py-3">
                        <span className="text-slate-800 font-black">{gift.chosenQuantity}</span>
                        <span className="text-slate-400 font-medium"> / {gift.maxQuantity} escolhidos</span>
                      </td>

                      {/* Selo Destaque */}
                      <td className="px-4 py-3">
                        {gift.isFeatured && (
                          <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[9px] font-bold">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            Destaque
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          gift.status !== "inactive"
                            ? gift.status === "out_of_stock"
                              ? "bg-rose-50 text-rose-700 border border-rose-250"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-250" 
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}>
                          {gift.status === "inactive" ? "Inativo" : gift.status === "out_of_stock" ? "Esgotado" : "Ativo"}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(gift)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(gift.id, gift.name)}
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

        {/* Modal Formulário (Criar / Editar) */}
        {formOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative my-8 max-h-[90vh] overflow-y-auto no-scrollbar">
              
              <h3 className="text-lg font-black text-slate-800 font-sans mb-2">
                {editingId ? "Editar Presente" : "Novo Presente"}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mb-6">Preencha as configurações e estoque do presente do catálogo.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Nome do Presente *</label>
                    <input
                      type="text"
                      placeholder="Ex: Banheira Infantil Ergonômica"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-slate-400 transition-all"
                    />
                  </div>

                  {/* Categoria */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Categoria *</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-slate-400 cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Valor */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Valor (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="99.90"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-slate-400 transition-all"
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Descrição Curta</label>
                  <textarea
                    placeholder="Ex: Banheira portátil, macia e com suporte antiderrapante."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-slate-400 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Foto URL e Upload */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Imagem (Otimizada WebP)</label>
                    <div className="flex items-center gap-2">
                      {imageUrl ? (
                        <div className="h-10 w-10 rounded-lg border border-slate-200 overflow-hidden flex-none">
                          <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center flex-none">
                          <ImageIcon className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                      
                      <div className="flex-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCropperOpen(true)}
                          className="flex items-center justify-center gap-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-100 px-3 py-2 rounded-xl text-xs font-bold transition-all w-full"
                        >
                          <UploadCloud className="h-4 w-4" />
                          Enviar Foto (1:1)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Link Externo */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Link Externo de Compra</label>
                    <input
                      type="text"
                      placeholder="https://amazon.com.br/..."
                      value={externalLink}
                      onChange={(e) => setExternalLink(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-slate-400 transition-all"
                    />
                  </div>

                  {/* Estoque Máximo */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Quantidade Máxima (Estoque)</label>
                    <input
                      type="number"
                      placeholder="1"
                      value={maxQuantity}
                      onChange={(e) => setMaxQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-slate-400 text-center transition-all"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Status do Presente</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-slate-400 cursor-pointer text-center"
                    >
                      <option value="available">Ativo (Exibido na vitrine)</option>
                      <option value="inactive">Inativo (Ocultado)</option>
                    </select>
                  </div>
                </div>

                {/* Checkbox Destaque */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="accent-slate-900 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="featured" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                    Marcar como Presente Recomendado ⭐ (Selo Destaque)
                  </label>
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
                      <span>Salvar Presente</span>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}
        
        {cropperOpen && (
          <ImageCropper 
            onCropComplete={handleCropComplete} 
            onCancel={() => setCropperOpen(false)} 
            aspect={1}
          />
        )}

      </main>
    </div>
  );
}
