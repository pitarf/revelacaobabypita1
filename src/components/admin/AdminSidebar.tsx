"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { 
  LayoutDashboard, 
  Users, 
  Gift, 
  Tags, 
  Heart, 
  Image as ImageIcon, 
  DollarSign, 
  Paintbrush, 
  Settings, 
  LogOut,
  Menu,
  X,
  UserCheck,
  MessageSquare,
  Mail
} from "lucide-react";

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [adminName, setAdminName] = useState("Administrador");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Valida a sessão localmente ao carregar
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/verify");
        const data = await res.json();
        
        if (!res.ok) {
          toast.error("Por favor, faça login para acessar esta página.");
          router.push("/admin/login");
        } else {
          setAdminName(data.user.name || "Administrador");
        }
      } catch (err) {
        console.error(err);
        router.push("/admin/login");
      }
    }
    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Deseja realmente encerrar sua sessão administrativa?");
    if (!confirmLogout) return;

    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Sessão administrativa encerrada.");
        router.push("/admin/login");
      } else {
        toast.error("Erro ao deslogar.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao conectar.");
    }
  };

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Confirmados (RSVP)", path: "/admin/confirmacoes", icon: Users },
    { name: "Presentes", path: "/admin/presentes", icon: Gift },
    { name: "Categorias", path: "/admin/categorias", icon: Tags },
    { name: "Votação Placar", path: "/admin/votacao", icon: Heart },
    { name: "Mural de Recados", path: "/admin/recados", icon: MessageSquare },
    { name: "Mídias & Galeria", path: "/admin/midias", icon: ImageIcon },
    { name: "Extrato Financeiro", path: "/admin/extrato", icon: DollarSign },
    { name: "Histórico de E-mails", path: "/admin/emails", icon: Mail },
    { name: "Configurações & Temas", path: "/admin/configuracoes", icon: Settings },
  ];

  return (
    <>
      {/* Topbar compacta para Mobile */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex justify-between items-center shadow-md sticky top-0 z-30">
        <span className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-baby-blue to-baby-pink bg-clip-text text-transparent">
          Admin - Chá Revelação
        </span>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Lateral */}
      <aside className={`fixed top-0 bottom-0 left-0 z-40 bg-slate-900 text-slate-300 w-64 border-r border-slate-800 p-5 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div>
          {/* Cabeçalho do menu */}
          <div className="mb-8 pt-4 pb-4 border-b border-slate-800 text-center">
            <span className="text-lg font-black bg-gradient-to-r from-baby-blue to-baby-pink bg-clip-text text-transparent">
              Chá Revelação
            </span>
            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-slate-400 font-bold">
              <UserCheck className="h-3.5 w-3.5 text-baby-gold" />
              <span className="truncate max-w-[150px]">{adminName}</span>
            </div>
          </div>

          {/* Links do Menu */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setMobileOpen(false);
                    router.push(item.path);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                    isActive 
                      ? "bg-gradient-to-r from-baby-blue to-baby-pink text-white shadow-md scale-[1.02]" 
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 flex-none" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Botão de Logout */}
        <div className="border-t border-slate-800 pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all active:scale-95"
          >
            <LogOut className="h-4.5 w-4.5 flex-none" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* Overlay de fundo preto para fechar no Mobile */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-20 md:hidden animate-fade-in"
        />
      )}
    </>
  );
}
