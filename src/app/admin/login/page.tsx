"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Mail, Eye, EyeOff, KeyRound } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Se o administrador já possuir sessão ativa, redireciona-o automaticamente para o dashboard
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/admin/verify");
        if (res.ok) {
          router.push("/admin/dashboard");
        }
      } catch (err) {
        console.error(err);
      }
    }
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast.error("Por favor, preencha a senha.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Credenciais inválidas.");
        return;
      }

      toast.success("Login realizado com sucesso! Bem-vindo.");
      router.push("/admin/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Servidor indisponível no momento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-baby-gradient min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-xl border border-baby-beige relative">
        
        {/* Marca/Título */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-baby-gold-light text-baby-gold mb-3 animate-float-cloud">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 font-sans tracking-tight">Painel Administrativo</h1>
          <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">Acesso Restrito</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Senha de Acesso</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-gray-50 border border-baby-beige-dark rounded-xl px-4 py-3 pl-11 pr-11 text-sm focus:outline-none focus:border-baby-gold font-semibold transition-all"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              
              {/* Botão Olho mostrar/ocultar senha */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-baby-blue to-baby-pink text-white font-extrabold py-3.5 rounded-full text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 mt-6"
          >
            {loading ? (
              <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <span>Entrar no Painel</span>
            )}
          </button>

        </form>

      </div>
    </main>
  );
}
