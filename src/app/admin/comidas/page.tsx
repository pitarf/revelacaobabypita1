"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Plus, Edit2, Trash2, Search, Utensils, CheckCircle2, Circle, Clock, DollarSign, Calendar, Truck } from "lucide-react";
import { toast } from "sonner";

interface MarketItem {
  id: string;
  name: string;
  quantity: string;
  price: string;
  isPurchased: boolean;
}

interface FoodItem {
  id: string;
  name: string;
  quantity: string;
  isPurchased: boolean;
  amountSpent: number | null;
  isReady: boolean;
  supplier: string | null;
  deliveryDate: string | null;
  isMarketList: boolean;
  marketItems: MarketItem[] | null;
}

export default function FoodListPage() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMarket, setFilterMarket] = useState(false);
  
  // Modal form states
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isPurchased, setIsPurchased] = useState(false);
  const [amountSpent, setAmountSpent] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [isMarketList, setIsMarketList] = useState(false);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/food");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        toast.error("Erro ao carregar lista de comidas e bebidas.");
      }
    } catch (err) {
      toast.error("Erro de conexão ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenForm = (item?: FoodItem) => {
    if (item) {
      setEditingId(item.id);
      setName(item.name);
      setQuantity(item.quantity);
      setIsPurchased(item.isPurchased);
      setAmountSpent(item.amountSpent ? item.amountSpent.toString() : "");
      setIsReady(item.isReady);
      setSupplier(item.supplier || "");
      setDeliveryDate(item.deliveryDate ? new Date(item.deliveryDate).toISOString().slice(0, 16) : "");
      setIsMarketList(item.isMarketList);
      setMarketItems(item.marketItems || []);
    } else {
      setEditingId(null);
      setName("");
      setQuantity("");
      setIsPurchased(false);
      setAmountSpent("");
      setIsReady(false);
      setSupplier("");
      setDeliveryDate("");
      setIsMarketList(false);
      setMarketItems([]);
    }
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name,
      quantity,
      isPurchased,
      amountSpent: amountSpent ? parseFloat(amountSpent) : null,
      isReady,
      supplier,
      deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
      isMarketList,
      marketItems: isMarketList ? marketItems : null,
    };

    try {
      const url = editingId ? `/api/admin/food/${editingId}` : "/api/admin/food";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingId ? "Item atualizado!" : "Item adicionado!");
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
    if (!confirm("Tem certeza que deseja excluir este item?")) return;
    
    try {
      const res = await fetch(`/api/admin/food/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Item removido!");
        fetchData();
      } else {
        toast.error("Erro ao remover.");
      }
    } catch (err) {
      toast.error("Erro ao comunicar com o servidor.");
    }
  };

  const toggleStatus = async (item: FoodItem, field: 'isPurchased' | 'isReady') => {
    // Optimistic update
    const previousItems = [...items];
    const newStatus = !item[field];
    setItems(items.map(i => i.id === item.id ? { ...i, [field]: newStatus } : i));
    
    try {
      const payload = { ...item, [field]: newStatus };
      // Limpar campos de data pra evitar erro de tipo se vierem nulos
      if (payload.deliveryDate) payload.deliveryDate = new Date(payload.deliveryDate).toISOString();
      
      const res = await fetch(`/api/admin/food/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setItems(previousItems);
        toast.error("Erro ao atualizar status.");
      }
    } catch (err) {
      setItems(previousItems);
      toast.error("Erro de conexão ao servidor.");
    }
  };

  const toggleSubItemStatus = async (item: FoodItem, subItemId: string) => {
    if (!item.marketItems) return;
    
    const previousItems = [...items];
    const newMarketItems = item.marketItems.map(mi => mi.id === subItemId ? { ...mi, isPurchased: !mi.isPurchased } : mi);
    
    // Auto-calculate the total amountSpent from purchased sub-items
    const newAmountSpent = newMarketItems
      .filter(mi => mi.isPurchased && mi.price && !isNaN(parseFloat(mi.price)))
      .reduce((acc, curr) => acc + parseFloat(curr.price), 0);

    const newItem = { 
      ...item, 
      marketItems: newMarketItems, 
      amountSpent: newAmountSpent > 0 ? newAmountSpent : null 
    };

    setItems(items.map(i => i.id === item.id ? newItem : i));

    try {
      const payload = { ...newItem };
      if (payload.deliveryDate) payload.deliveryDate = new Date(payload.deliveryDate).toISOString();
      
      const res = await fetch(`/api/admin/food/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setItems(previousItems);
        toast.error("Erro ao atualizar sub-item.");
      }
    } catch (err) {
      setItems(previousItems);
      toast.error("Erro de conexão ao servidor.");
    }
  };

  const filteredItems = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
      (item.supplier && item.supplier.toLowerCase().includes(search.toLowerCase()));
    
    if (filterMarket && item.isPurchased) return false;
    
    return matchSearch;
  });

  const totalSpent = items.reduce((acc, curr) => acc + (curr.amountSpent ? Number(curr.amountSpent) : 0), 0);

  return (
    <div className="flex flex-col md:flex-row bg-slate-50 min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6 md:pl-72 md:pr-8 md:py-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
                <Utensils className="text-[#5c5bd5]" /> Comidas & Bebidas
              </h1>
              <p className="text-slate-500">Controle o que já foi comprado, gastos e status de preparo.</p>
            </div>
            <button
              onClick={() => handleOpenForm()}
              className="flex items-center gap-2 bg-[#5c5bd5] hover:bg-[#4a49ac] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm"
            >
              <Plus size={20} />
              Novo Item
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row w-full gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou fornecedor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5c5bd5]/50"
                />
              </div>
              <label className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors shrink-0">
                <input 
                  type="checkbox" 
                  checked={filterMarket} 
                  onChange={e => setFilterMarket(e.target.checked)} 
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span className="text-sm font-bold text-amber-800">Lista de Mercado (Faltantes)</span>
              </label>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold border border-emerald-200 shrink-0 w-full md:w-auto justify-center">
              <DollarSign size={18} />
              Total Gasto: R$ {totalSpent.toFixed(2).replace('.', ',')}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-400">Carregando lista...</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              
              {/* === VISÃO DESKTOP (Tabela) === */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Item & Qtd</th>
                      <th className="px-6 py-4 font-semibold">Gasto</th>
                      <th className="px-6 py-4 font-semibold">Comprado / Pronto?</th>
                      <th className="px-6 py-4 font-semibold">Fornecedor & Entrega</th>
                      <th className="px-6 py-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-400">
                          Nenhum item adicionado ainda.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 text-base">{item.name}</div>
                            <div className="text-sm text-slate-500">{item.quantity}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-700">
                              {item.amountSpent ? `R$ ${Number(item.amountSpent).toFixed(2).replace('.', ',')}` : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 space-y-2">
                            {item.isMarketList ? (
                              <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                {item.marketItems?.map(mi => (
                                  <button 
                                    key={mi.id} 
                                    onClick={() => toggleSubItemStatus(item, mi.id)} 
                                    className={`flex items-center gap-2 text-xs font-semibold px-2 py-1.5 rounded-md w-full transition-colors ${mi.isPurchased ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'}`}
                                  >
                                    {mi.isPurchased ? <CheckCircle2 size={14} className="shrink-0 text-emerald-500" /> : <Circle size={14} className="shrink-0 text-slate-400" />}
                                    <span className="truncate flex-1 text-left">{mi.name} ({mi.quantity})</span>
                                  </button>
                                ))}
                                {(!item.marketItems || item.marketItems.length === 0) && <span className="text-xs text-slate-400 italic">Sem itens</span>}
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 text-sm">
                                  {item.isPurchased ? (
                                    <button onClick={() => toggleStatus(item, 'isPurchased')} className="flex items-center gap-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md font-semibold transition-colors"><CheckCircle2 size={14}/> Comprado</button>
                                  ) : (
                                    <button onClick={() => toggleStatus(item, 'isPurchased')} className="flex items-center gap-1 text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md font-semibold transition-colors"><Circle size={14}/> A comprar</button>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  {item.isReady ? (
                                    <button onClick={() => toggleStatus(item, 'isReady')} className="flex items-center gap-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md font-semibold transition-colors"><CheckCircle2 size={14}/> Tá pronto</button>
                                  ) : (
                                    <button onClick={() => toggleStatus(item, 'isReady')} className="flex items-center gap-1 text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md font-semibold transition-colors"><Clock size={14}/> Pendente</button>
                                  )}
                                </div>
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-700 font-semibold flex items-center gap-1.5 mb-1">
                              <Truck size={14} className="text-slate-400"/> {item.supplier || "Sem fornecedor"}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5">
                              <Calendar size={14} className="text-slate-400"/> 
                              {item.deliveryDate ? new Date(item.deliveryDate).toLocaleString('pt-BR') : "Data não definida"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleOpenForm(item)}
                                className="p-2 text-slate-400 hover:text-[#5c5bd5] hover:bg-[#5c5bd5]/10 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* === VISÃO MOBILE (Cards) === */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    Nenhum item adicionado ainda.
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <div key={item.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-slate-800 text-lg">{item.name}</div>
                          <div className="text-sm text-slate-500 mt-0.5">{item.quantity}</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenForm(item)}
                            className="p-2 text-slate-400 hover:text-[#5c5bd5] bg-slate-50 hover:bg-[#5c5bd5]/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      {item.isMarketList ? (
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Itens da Lista</h4>
                          {item.marketItems?.map(mi => (
                            <button 
                              key={mi.id} 
                              onClick={() => toggleSubItemStatus(item, mi.id)} 
                              className={`flex items-center gap-3 text-xs font-semibold px-3 py-2.5 rounded-lg w-full transition-colors ${mi.isPurchased ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'}`}
                            >
                              {mi.isPurchased ? <CheckCircle2 size={16} className="shrink-0 text-emerald-500" /> : <Circle size={16} className="shrink-0 text-slate-400" />}
                              <span className="truncate flex-1 text-left text-[13px]">{mi.name} <span className="opacity-70 font-normal">({mi.quantity})</span></span>
                            </button>
                          ))}
                          {(!item.marketItems || item.marketItems.length === 0) && <span className="text-sm text-slate-400 italic">Lista vazia</span>}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                          {item.isPurchased ? (
                            <button onClick={() => toggleStatus(item, 'isPurchased')} className="flex items-center gap-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-2 rounded-lg text-xs font-bold justify-center transition-colors w-full"><CheckCircle2 size={14}/> Comprado</button>
                          ) : (
                            <button onClick={() => toggleStatus(item, 'isPurchased')} className="flex items-center gap-1 text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-2 rounded-lg text-xs font-bold justify-center transition-colors w-full"><Circle size={14}/> A comprar</button>
                          )}
                          {item.isReady ? (
                            <button onClick={() => toggleStatus(item, 'isReady')} className="flex items-center gap-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-2 rounded-lg text-xs font-bold justify-center transition-colors w-full"><CheckCircle2 size={14}/> Tá pronto</button>
                          ) : (
                            <button onClick={() => toggleStatus(item, 'isReady')} className="flex items-center gap-1 text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-2 rounded-lg text-xs font-bold justify-center transition-colors w-full"><Clock size={14}/> Pendente</button>
                          )}
                        </div>
                      )}

                      <div className="bg-slate-50 p-3 rounded-lg space-y-1 mt-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Gasto:</span>
                          <span className="font-bold text-slate-700">
                            {item.amountSpent ? `R$ ${Number(item.amountSpent).toFixed(2).replace('.', ',')}` : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Fornecedor:</span>
                          <span className="font-medium text-slate-700 truncate max-w-[150px]">{item.supplier || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Entrega:</span>
                          <span className="font-medium text-slate-700">
                            {item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString('pt-BR') : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Modal de Formulário */}
      {formOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">
                {editingId ? "Editar Item" : "Novo Item"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Item <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Salgadinhos sortidos, Bolo, Cerveja"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c5bd5]/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Quantidade <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="Ex: 500 un, 20 litros, 3 caixas"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c5bd5]/50"
                  required
                />
              </div>
              
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={isMarketList}
                    onChange={e => setIsMarketList(e.target.checked)}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="font-bold text-amber-800 text-sm">É uma Lista de Mercado (com sub-itens)</span>
                </label>
              </div>

              {!isMarketList ? (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Valor Gasto (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountSpent}
                    onChange={e => setAmountSpent(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c5bd5]/50"
                  />
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800">Itens da Lista de Mercado</h3>
                  
                  {marketItems.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Nenhum item adicionado. Clique no botão abaixo para adicionar.</p>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {marketItems.map((mi, idx) => (
                        <div key={mi.id} className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-white p-2 border border-slate-200 rounded-lg">
                          <input 
                            type="text" 
                            placeholder="Item (ex: Água)" 
                            value={mi.name}
                            onChange={(e) => {
                              const newArr = [...marketItems];
                              newArr[idx].name = e.target.value;
                              setMarketItems(newArr);
                            }}
                            className="flex-1 min-w-[120px] px-2 py-1 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none"
                            required
                          />
                          <input 
                            type="text" 
                            placeholder="Qtd (ex: 2L)" 
                            value={mi.quantity}
                            onChange={(e) => {
                              const newArr = [...marketItems];
                              newArr[idx].quantity = e.target.value;
                              setMarketItems(newArr);
                            }}
                            className="w-[80px] px-2 py-1 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none"
                            required
                          />
                          <input 
                            type="number" 
                            step="0.01"
                            placeholder="R$" 
                            value={mi.price}
                            onChange={(e) => {
                              const newArr = [...marketItems];
                              newArr[idx].price = e.target.value;
                              setMarketItems(newArr);
                            }}
                            className="w-[80px] px-2 py-1 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              setMarketItems(marketItems.filter((_, i) => i !== idx));
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => {
                      setMarketItems([...marketItems, { id: Math.random().toString(36).substring(7), name: '', quantity: '', price: '', isPurchased: false }]);
                    }}
                    className="flex items-center gap-1 text-sm font-bold text-[#5c5bd5] hover:text-[#4a49ac] hover:bg-[#5c5bd5]/10 px-3 py-1.5 rounded-lg transition-colors w-fit"
                  >
                    <Plus size={16}/>
                    Adicionar Sub-item
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={isPurchased}
                    onChange={e => setIsPurchased(e.target.checked)}
                    className="w-5 h-5 text-[#5c5bd5] rounded focus:ring-[#5c5bd5]"
                  />
                  <span className="font-semibold text-slate-700 text-sm">Já foi comprado?</span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={isReady}
                    onChange={e => setIsReady(e.target.checked)}
                    className="w-5 h-5 text-[#5c5bd5] rounded focus:ring-[#5c5bd5]"
                  />
                  <span className="font-semibold text-slate-700 text-sm">Já tá feito / pronto?</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Informações de Entrega</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Fornecedor</label>
                    <input
                      type="text"
                      value={supplier}
                      onChange={e => setSupplier(e.target.value)}
                      placeholder="Ex: Padaria, Salgados da Maria..."
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c5bd5]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Data/Hora da Entrega</label>
                    <input
                      type="datetime-local"
                      value={deliveryDate}
                      onChange={e => setDeliveryDate(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c5bd5]/50 text-slate-700"
                    />
                  </div>
                </div>
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
                  className="px-5 py-2 bg-[#5c5bd5] hover:bg-[#4a49ac] text-white rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Salvando..." : "Salvar Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
