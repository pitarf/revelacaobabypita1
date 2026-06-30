"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Mail, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);

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
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700" title={email.errorMessage}>
                              <XCircle className="w-3.5 h-3.5" /> Falhou
                            </span>
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
    </div>
  );
}
