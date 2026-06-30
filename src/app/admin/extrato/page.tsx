"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Search, Download, HelpCircle, DollarSign, CreditCard, Clock, CheckCircle2, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  priceAtPurchase: number;
}

interface Payment {
  id: string;
  method: string;
  status: string;
  value: number;
  feeValue: number;
  netValue: number;
}

interface Order {
  id: string;
  code: string;
  gifterName: string;
  gifterEmail: string;
  gifterPhone: string;
  message: string | null;
  isAnonymous: boolean;
  paymentMethod: string;
  paymentStatus: string;
  deliveryStatus: string;
  totalValue: number;
  createdAt: string;
  orderItems: OrderItem[];
  payments: Payment[];
}

export default function AdminLedgerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterDelivery, setFilterDelivery] = useState("all");
  
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeliveryStatus, setBulkDeliveryStatus] = useState<string>("delivered");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/orders");
      const json = await res.json();
      if (res.ok) {
        setOrders(json.data || []);
      } else {
        toast.error(json.error || "Erro ao carregar extrato de pedidos.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao conectar.");
    } finally {
      setLoading(false);
    }
  };

  // Aprovação Manual de Pagamento
  const handleApprovePayment = async (orderId: string, orderCode: string) => {
    const confirmApprove = window.confirm(`Deseja aprovar manualmente o pagamento do pedido ${orderCode}?`);
    if (!confirmApprove) return;

    try {
      setSubmittingId(orderId);
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, action: "approve_payment" }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao aprovar pagamento.");
        return;
      }

      toast.success(`Pedido ${orderCode} aprovado manualmente!`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Erro na transação.");
    } finally {
      setSubmittingId(null);
    }
  };

  // Alteração de Status da Entrega Física
  const handleDeliveryChange = async (orderId: string, newStatus: string, orderCode: string) => {
    try {
      setSubmittingId(orderId);
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, deliveryStatus: newStatus }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao atualizar entrega.");
        return;
      }

      toast.success(`Entrega do pedido ${orderCode} atualizada para ${newStatus.toUpperCase()}!`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Erro na alteração de status.");
    } finally {
      setSubmittingId(null);
    }
  };

  // Excluir Pedido Permanentemente
  const handleDeleteOrder = async (orderId: string, orderCode: string) => {
    const confirmDelete = window.confirm(`ATENÇÃO: Deseja realmente excluir permanentemente o pedido ${orderCode}?\n\nSe ele estava aprovado, os presentes retornarão ao estoque.`);
    if (!confirmDelete) return;

    try {
      setSubmittingId(orderId);
      const res = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao excluir pedido.");
        return;
      }

      toast.success(`Pedido ${orderCode} excluído com sucesso!`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao conectar.");
    } finally {
      setSubmittingId(null);
    }
  };

  // Bulk Actions
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    const confirmApprove = window.confirm(`Deseja aprovar manualmente o pagamento de ${selectedIds.length} pedido(s)?`);
    if (!confirmApprove) return;

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action: "approve_payment" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(json.message || "Pagamentos aprovados!");
      setSelectedIds([]);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Erro ao aprovar pagamentos.");
    }
  };

  const handleBulkDeliveryChange = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, deliveryStatus: bulkDeliveryStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`Entrega atualizada em ${json.count} pedido(s)!`);
      setSelectedIds([]);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Erro na alteração de status.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmDelete = window.confirm(`ATENÇÃO: Deseja realmente excluir permanentemente ${selectedIds.length} pedido(s)?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(json.message || "Pedidos excluídos!");
      setSelectedIds([]);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir pedidos.");
    }
  };

  // Exportar Pedidos para Planilha CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error("Nenhum dado para exportar.");
      return;
    }

    const headers = [
      "Código",
      "Quem Presenteou",
      "E-mail",
      "Celular",
      "Anônimo?",
      "Presentes / Qtd",
      "Valor Total",
      "Método",
      "Status Pagamento",
      "Status Entrega",
      "Mensagem do Convidado",
      "Data de Criação",
    ];

    const rows = filteredOrders.map((ord) => {
      const itemsStr = ord.orderItems.map(item => `${item.name} (x${item.quantity})`).join(" | ");
      return [
        ord.code,
        ord.gifterName,
        ord.gifterEmail,
        ord.gifterPhone,
        ord.isAnonymous ? "Sim" : "Não",
        itemsStr,
        ord.totalValue.toFixed(2),
        ord.paymentMethod.toUpperCase(),
        ord.paymentStatus === "approved" ? "Aprovado" : "Pendente",
        ord.deliveryStatus === "delivered" ? "Entregue" : ord.deliveryStatus === "cancelled" ? "Cancelado" : "Pendente",
        ord.message || "",
        new Date(ord.createdAt).toLocaleDateString("pt-BR"),
      ];
    });

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += headers.join(";") + "\r\n";

    rows.forEach((row) => {
      const cleanRow = row.map((val) => `"${String(val).replace(/"/g, '""').replace(/\r?\n|\r/g, " ")}"`).join(";");
      csvContent += cleanRow + "\r\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pedidos_cha_revelacao_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Relatório de pedidos exportado!");
  };

  // Filtra lista de pedidos
  const filteredOrders = orders.filter((ord) => {
    const term = search.toLowerCase();
    const matchesSearch = 
      ord.code.toLowerCase().includes(term) ||
      ord.gifterName.toLowerCase().includes(term) ||
      ord.gifterEmail.toLowerCase().includes(term);

    const matchesMethod = filterMethod === "all" || ord.paymentMethod === filterMethod;
    const matchesPayment = filterPayment === "all" || ord.paymentStatus === filterPayment;
    const matchesDelivery = filterDelivery === "all" || ord.deliveryStatus === filterDelivery;

    return matchesSearch && matchesMethod && matchesPayment && matchesDelivery;
  });

  const allFilteredIds = filteredOrders.map(o => o.id);
  const isAllSelected = filteredOrders.length > 0 && selectedIds.length === filteredOrders.length;
  
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredIds);
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Cálculos Financeiros (Pedidos Aprovados)
  const approvedOrders = orders.filter(o => o.paymentStatus === "approved");
  const pendingOrders = orders.filter(o => o.paymentStatus === "pending");

  // Sumarização dos Valores Financeiros de Pagamentos
  let grossSum = 0;
  let feeSum = 0;
  let netSum = 0;

  approvedOrders.forEach((ord) => {
    ord.payments.forEach((pay) => {
      if (pay.status === "approved") {
        grossSum += pay.value;
        feeSum += pay.feeValue;
        netSum += pay.netValue;
      }
    });
  });

  const pendingSum = pendingOrders.reduce((acc, curr) => acc + curr.totalValue, 0);

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 md:pl-72 md:pr-8 md:py-8 space-y-6 overflow-x-hidden">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 font-sans">Relatório e Extrato Financeiro</h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">Acompanhe as transações financeiras e controle de entrega física</p>
          </div>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>

        {/* Painel Financeiro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-none">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Faturamento Bruto</p>
              <p className="text-xl font-black text-slate-700 mt-0.5">
                {grossSum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Pix + Cartão Aprovados</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-none">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Taxas do Gateway</p>
              <p className="text-xl font-black text-slate-700 mt-0.5">
                -{feeSum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Tarifas Mercado Pago</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-none">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Líquido a Receber</p>
              <p className="text-xl font-black text-slate-700 mt-0.5">
                {netSum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Disponível em conta</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-none">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aguardando Pagamento</p>
              <p className="text-xl font-black text-slate-700 mt-0.5">
                {pendingSum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Ordens pendentes</p>
            </div>
          </div>

        </div>

        {/* Barra de Filtros e Buscas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Busca por código ou gifter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Busca</label>
            <input
              type="text"
              placeholder="Código, nome, e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-slate-400 font-semibold shadow-sm"
            />
          </div>

          {/* Filtro por Método */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Método</label>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-400 cursor-pointer"
            >
              <option value="all">Todos os Métodos</option>
              <option value="pix">Pix (Online)</option>
              <option value="card">Cartão de Crédito</option>
              <option value="personal">Levar Pessoalmente</option>
              <option value="link">Comprar pelo Link</option>
            </select>
          </div>

          {/* Filtro por Pagamento */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Pagamento</label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-400 cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="approved">Apenas Aprovados</option>
              <option value="pending">Apenas Pendentes</option>
            </select>
          </div>

          {/* Filtro por Entrega */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Entrega Física</label>
            <select
              value={filterDelivery}
              onChange={(e) => setFilterDelivery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-400 cursor-pointer"
            >
              <option value="all">Todas as Entregas</option>
              <option value="pending">Pendente (Não Recebido)</option>
              <option value="delivered">Entregue (Recebido na Festa)</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

        </div>

        {/* Barra de Ações em Massa */}
        {selectedIds.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="text-indigo-900 font-bold text-sm">
              <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md mr-2">{selectedIds.length}</span>
              pedido(s) selecionado(s)
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={handleBulkApprove}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors"
              >
                Aprovar Pagamentos
              </button>
              
              <div className="flex items-center gap-2 bg-white border border-indigo-100 rounded-lg p-1 pr-2">
                <select 
                  value={bulkDeliveryStatus}
                  onChange={(e) => setBulkDeliveryStatus(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none pl-2 py-1"
                >
                  <option value="delivered">Marcar como Entregue</option>
                  <option value="pending">Marcar como Pendente</option>
                  <option value="cancelled">Marcar como Cancelado</option>
                </select>
                <button 
                  onClick={handleBulkDeliveryChange}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded shadow-sm transition-colors"
                >
                  Aplicar
                </button>
              </div>

              <button 
                onClick={handleBulkDelete}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold px-4 py-2 rounded-lg transition-colors ml-auto sm:ml-2"
              >
                Excluir
              </button>
            </div>
          </div>
        )}

        {/* Tabela de Pedidos */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin inline-block h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full mb-2"></div>
              <p className="text-xs text-gray-400 font-bold">Carregando transações...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase text-[10px]">
              Nenhum pedido localizado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-150">
                  <tr>
                    <th className="px-6 py-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4">Quem Presenteou</th>
                    <th className="px-6 py-4">Presentes</th>
                    <th className="px-6 py-4">Valor Total</th>
                    <th className="px-6 py-4">Método</th>
                    <th className="px-6 py-4">Pagamento</th>
                    <th className="px-6 py-4">Entrega Física</th>
                    <th className="px-6 py-4 text-right">Ação Pagamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((ord) => {
                    const isApproved = ord.paymentStatus === "approved";
                    const isManualApprovePossible = !isApproved && (ord.paymentMethod === "pix" || ord.paymentMethod === "card");

                    return (
                      <tr key={ord.id} className={`hover:bg-slate-50/50 ${selectedIds.includes(ord.id) ? 'bg-indigo-50/30' : ''}`}>
                        {/* Checkbox */}
                        <td className="px-6 py-4.5 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(ord.id)}
                            onChange={() => toggleSelectOrder(ord.id)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        
                        {/* Código */}
                        <td className="px-6 py-4.5 font-mono font-black text-slate-800 text-[11px]">{ord.code}</td>
                        
                        {/* Quem presenteou */}
                        <td className="px-6 py-4.5">
                          <div className="text-slate-700 font-extrabold flex items-center gap-1">
                            <span>{ord.isAnonymous ? "🔒 Anônimo" : ord.gifterName}</span>
                            {ord.isAnonymous && <span className="text-[9px] text-slate-400 font-semibold">({ord.gifterName})</span>}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400">{ord.gifterEmail}</span>
                            <a 
                              href={`https://api.whatsapp.com/send?phone=55${ord.gifterPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-500 hover:text-emerald-600 flex items-center gap-0.5 text-[9px] font-bold"
                              title="Enviar mensagem pelo WhatsApp"
                            >
                              <Phone className="h-2.5 w-2.5" />
                              <span>WhatsApp</span>
                            </a>
                            {ord.message && (
                              <button 
                                onClick={() => alert(`Mensagem do padrinho/padrinho:\n"${ord.message}"`)}
                                className="text-sky-500 hover:text-sky-600 flex items-center gap-0.5 text-[9px] font-bold"
                              >
                                <MessageSquare className="h-2.5 w-2.5" />
                                <span>Mensagem</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Presentes */}
                        <td className="px-6 py-4.5">
                          <div className="space-y-0.5 max-w-xs truncate text-[11px]">
                            {ord.orderItems.map((item, idx) => (
                              <div key={idx} className="truncate text-slate-600" title={`${item.name} (x${item.quantity})`}>
                                • {item.name} <strong className="text-slate-400">x{item.quantity}</strong>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Valor total */}
                        <td className="px-6 py-4.5 text-slate-800 font-black">
                          {ord.totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>

                        {/* Método */}
                        <td className="px-6 py-4.5 uppercase text-[10px] font-bold text-slate-500">{ord.paymentMethod}</td>

                        {/* Status Pagamento */}
                        <td className="px-6 py-4.5">
                          <span className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            isApproved 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-250" 
                              : "bg-amber-50 text-amber-700 border border-amber-250"
                          }`}>
                            {isApproved ? "Aprovado" : "Pendente"}
                          </span>
                        </td>

                        {/* Status Entrega */}
                        <td className="px-6 py-4.5">
                          <select
                            value={ord.deliveryStatus}
                            disabled={submittingId === ord.id}
                            onChange={(e) => handleDeliveryChange(ord.id, e.target.value, ord.code)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                          >
                            <option value="pending">Pendente (Não Recebido)</option>
                            <option value="delivered">Recebido na Festa</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </td>

                        {/* Ações adicionais */}
                        <td className="px-6 py-4.5 text-right flex items-center justify-end gap-2">
                          {isManualApprovePossible && (
                            <button
                              onClick={() => handleApprovePayment(ord.id, ord.code)}
                              disabled={submittingId === ord.id}
                              className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg shadow-sm transition-all active:scale-95"
                            >
                              Aprovar Manual
                            </button>
                          )}
                          {!isManualApprovePossible && (
                            <span className="text-slate-300 font-semibold text-[10px]">-</span>
                          )}
                          <button
                            onClick={() => handleDeleteOrder(ord.id, ord.code)}
                            disabled={submittingId === ord.id}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 transition-colors border border-rose-100 disabled:opacity-50"
                            title="Excluir Pedido"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
