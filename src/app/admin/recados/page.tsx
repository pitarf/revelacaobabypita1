"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Trash2, RefreshCw, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface GuestMessage {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/messages");
      const json = await res.json();
      if (res.ok) {
        setMessages(json.data || []);
      } else {
        toast.error(json.error || "Erro ao carregar recados.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`Deseja realmente excluir o recado de "${name}"?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/messages?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (res.ok) {
        toast.success("Recado excluído com sucesso!");
        setMessages((prev) => prev.filter((msg) => msg.id !== id));
      } else {
        toast.error(json.error || "Erro ao excluir recado.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao conectar ao servidor.");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      <AdminSidebar />
      
      <main className="flex-1 p-6 md:p-10 md:ml-64">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-baby-gold" />
              Mural de Recados
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase mt-1">
              Visualize, modere e exclua recados enviados pelos convidados no mural
            </p>
          </div>
          
          <button
            onClick={fetchMessages}
            disabled={loading}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>

        {/* Lista/Tabela */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 text-center text-slate-400 font-bold">
              Carregando recados...
            </div>
          ) : messages.length === 0 ? (
            <div className="py-20 text-center text-slate-400 font-bold">
              Nenhum recado encontrado no mural.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-xs font-black uppercase tracking-wider text-slate-400">
                    <th className="p-4">Convidado</th>
                    <th className="p-4">Recado</th>
                    <th className="p-4">Enviado em</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {messages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-white whitespace-nowrap">
                        {msg.name}
                      </td>
                      <td className="p-4 text-slate-300 max-w-md break-words whitespace-pre-wrap">
                        {msg.message}
                      </td>
                      <td className="p-4 text-slate-400 text-xs font-bold whitespace-nowrap">
                        {formatDate(msg.createdAt)}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(msg.id, msg.name)}
                          className="p-2 text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="Excluir Recado"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
