"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Mail, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<string | null>(null);

  const loadEmails = async () => {
    try {
      const res = await fetch("/api/admin/emails");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setEmails(json.data);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar e-mails:", err);
      toast.error("Erro ao carregar lista de e-mails.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  const handleResend = async (id: string) => {
    try {
      setResendingId(id);
      const res = await fetch("/api/admin/emails/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailLogId: id }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success("E-mail reenviado com sucesso!");
        loadEmails(); // Recarrega a lista para mostrar o novo log
      } else {
        toast.error(data.error || "Erro ao reenviar e-mail.");
      }
    } catch (error) {
      toast.error("Erro na comunicação com o servidor.");
    } finally {
      setResendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full mb-2"></div>
          <p className="text-xs text-gray-400 font-bold">Carregando e-mails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex">
      <AdminSidebar />
      <div className="flex-1 p-8 overflow-y-auto ml-64">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                <Mail className="h-8 w-8 text-[#f6b26b]" />
                Histórico de E-mails
              </h1>
              <p className="text-slate-500 mt-2 text-sm font-medium">
                Monitore os envios do sistema e reenvie e-mails que falharam.
              </p>
            </div>
            <div>
              <button onClick={loadEmails} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors">
                <RefreshCw className="w-4 h-4" /> Atualizar Lista
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Destinatário</th>
                    <th className="px-6 py-4">Assunto</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {emails.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                        Nenhum e-mail registrado ainda.
                      </td>
                    </tr>
                  ) : (
                    emails.map((email) => (
                      <tr key={email.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(email.createdAt).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {email.to}
                        </td>
                        <td className="px-6 py-4">
                          {email.subject}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {email.status === "sent" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                              <CheckCircle className="w-3.5 h-3.5" /> Enviado
                            </span>
                          )}
                          {email.status === "failed" && (
                            <button
                              onClick={() => setSelectedError(email.errorMessage || "Erro desconhecido")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors cursor-pointer"
                              title="Clique para ver o erro"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Falhou
                            </button>
                          )}
                          {email.status === "pending" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                              <Clock className="w-3.5 h-3.5" /> Pendente
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleResend(email.id)}
                            disabled={resendingId === email.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md transition-colors disabled:opacity-50"
                          >
                            {resendingId === email.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            Reenviar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Modal de Erro */}
      {selectedError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <h3 className="text-lg font-bold text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Detalhes do Erro
              </h3>
              <button 
                onClick={() => setSelectedError(null)}
                className="text-rose-400 hover:text-rose-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-emerald-400 whitespace-pre-wrap word-break">
                  {selectedError}
                </pre>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedError(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
