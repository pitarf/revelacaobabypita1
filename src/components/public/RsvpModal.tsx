"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Info, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface RsvpData {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  adultsCount: number;
  childrenCount: number;
  companionsNames?: string | null;
  foodRestriction?: string | null;
  notes?: string | null;
  accessCode?: string;
  status?: string;
}

interface RsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: RsvpData | null; // Se fornecido, indica Edição de RSVP
  onSuccess: (data: any) => void;
}

export default function RsvpModal({ isOpen, onClose, initialData, onSuccess }: RsvpModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [companionsNames, setCompanionsNames] = useState("");
  const [foodRestriction, setFoodRestriction] = useState("");
  const [notes, setNotes] = useState("");
  const [lgpdConsent, setLgpdConsent] = useState(true); // Assume consentimento com a nota de rodapé
  const [loading, setLoading] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [isAttending, setIsAttending] = useState(true);

  // Preenche dados caso seja uma Edição (initialData ativo)
  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName || "");
      setEmail(initialData.email || "");
      
      // Aplica máscara ao telefone inicial
      let rawPhone = initialData.phone || "";
      if (rawPhone.length === 11) {
        setPhone(`(${rawPhone.substring(0, 2)}) ${rawPhone.substring(2, 7)}-${rawPhone.substring(7)}`);
      } else {
        setPhone(rawPhone);
      }

      setAdultsCount(initialData.adultsCount || 1);
      setChildrenCount(initialData.childrenCount || 0);
      setCompanionsNames(initialData.companionsNames || "");
      setFoodRestriction(initialData.foodRestriction || "");
      setNotes(initialData.notes || "");
      setLgpdConsent(true); // Se já estava cadastrado, assume consentimento
      setIsAttending(initialData.status !== "cancelled");
    } else {
      // Limpa os campos para novo cadastro
      setFullName("");
      setEmail("");
      setPhone("");
      setAdultsCount(1);
      setChildrenCount(0);
      setCompanionsNames("");
      setFoodRestriction("");
      setNotes("");
      setLgpdConsent(false);
      setIsAttending(true);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (!captchaChecked) {
      toast.error("Por favor, marque a caixa 'Não sou um robô' para confirmar sua presença.");
      return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Por favor, insira um e-mail válido.");
      return;
    }

    // Validação de telefone (mínimo 10 dígitos numéricos)
    const rawPhone = phone.replace(/\D/g, "");
    if (rawPhone.length < 10) {
      toast.error("Por favor, insira um número de telefone com DDD válido.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: rawPhone,
        adultsCount: isAttending ? adultsCount : 0,
        childrenCount: isAttending ? childrenCount : 0,
        companionsNames: isAttending && (adultsCount + childrenCount > 1) ? companionsNames.trim() : null,
        foodRestriction: isAttending ? (foodRestriction.trim() || null) : null,
        notes: notes.trim() || null,
        accessCode: initialData?.accessCode || null, // Passa o código se for Edição
        isAttending,
      };

      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao registrar confirmação.");
        return;
      }

      toast.success(data.message || "Presença confirmada!");
      onSuccess(data.data);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl border border-baby-beige relative my-8 max-h-[95vh] overflow-y-auto no-scrollbar">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 hover:scale-105 active:scale-95 transition-all p-2 rounded-full hover:bg-gray-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Título do Modal */}
        <h3 className="text-xl font-bold text-gray-800 mb-1">
          {initialData ? "Alterar sua presença" : "Confirmar sua presença"}
        </h3>
        <p className="text-xs text-gray-400 font-medium mb-6">
          Preencha o formulário abaixo para confirmar a sua presença no Chá Revelação.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="flex gap-4 mb-2">
            <button
              type="button"
              onClick={() => setIsAttending(true)}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all border-2 ${isAttending ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300'}`}
            >
              Sim, eu vou! 🥳
            </button>
            <button
              type="button"
              onClick={() => setIsAttending(false)}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all border-2 ${!isAttending ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300'}`}
            >
              Não poderei ir 😢
            </button>
          </div>

          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Seu nome<span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              placeholder="Digite seu nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-baby-gold font-semibold transition-all"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Seu whatsapp<span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, "");
                if (val.length > 11) val = val.substring(0, 11);
                if (val.length > 10) {
                  val = `(${val.substring(0, 2)}) ${val.substring(2, 7)}-${val.substring(7)}`;
                } else if (val.length > 2) {
                  val = `(${val.substring(0, 2)}) ${val.substring(2, 6)}-${val.substring(6)}`;
                } else if (val.length > 0) {
                  val = `(${val}`;
                }
                setPhone(val);
              }}
              required
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-baby-gold font-semibold transition-all"
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Seu e-mail<span className="text-red-500">*</span>:
            </label>
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-baby-gold font-semibold transition-all"
            />
          </div>

          {isAttending && (
            <>
              {/* Seletores Dropdown de Adultos e Crianças */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantidade de Adultos</label>
              <select
                value={adultsCount}
                onChange={(e) => setAdultsCount(Number(e.target.value))}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-baby-gold font-semibold transition-all"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantidade de Crianças</label>
              <select
                value={childrenCount}
                onChange={(e) => setChildrenCount(Number(e.target.value))}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-baby-gold font-semibold transition-all"
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Nome de Acompanhantes */}
          {adultsCount + childrenCount > 1 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nome dos Acompanhantes
              </label>
              <textarea
                placeholder="Ex: Maria da Silva (esposa), Pedro da Silva (filho)"
                value={companionsNames}
                onChange={(e) => setCompanionsNames(e.target.value)}
                rows={2}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-baby-gold font-semibold transition-all"
              />
            </div>
          )}

          {/* Restrição Alimentar */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Restrições Alimentares (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Vegetariano, alérgico a glúten/lactose"
              value={foodRestriction}
              onChange={(e) => setFoodRestriction(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-baby-gold font-semibold transition-all"
            />
            </div>
            </>
          )}

          {/* Mensagem Opcional */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Recadinho para os Pais (Opcional)
            </label>
            <textarea
              placeholder="Deixe um recado carinhoso para nós..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-baby-gold font-semibold transition-all"
            />
          </div>

          {/* Card reCAPTCHA Mockup - Idêntico ao print */}
          <div className="bg-gray-50 border border-gray-250 rounded-xl p-4 flex items-center justify-between shadow-inner max-w-sm">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="recaptcha"
                checked={captchaChecked}
                onChange={(e) => setCaptchaChecked(e.target.checked)}
                className="h-6 w-6 border-2 border-gray-300 text-[#f6b26b] rounded focus:ring-[#f6b26b] cursor-pointer accent-[#f6b26b]"
              />
              <label htmlFor="recaptcha" className="text-sm font-semibold text-gray-600 cursor-pointer select-none">
                Não sou um robô
              </label>
            </div>
            <div className="flex flex-col items-center justify-center shrink-0 ml-4">
              <svg className="w-8 h-8 text-blue-500 animate-pulse-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12c0-2.3.77-4.42 2.07-6.13" />
                <path d="m21.88 9-2.88 2.88L17.5 10.5" />
              </svg>
              <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wide mt-1">reCAPTCHA</span>
            </div>
          </div>

          {/* Nota LGPD do rodapé */}
          <p className="text-[10px] text-gray-400 leading-relaxed text-left border-t border-slate-100 pt-3.5">
            * Seus dados de contato são armazenados de forma segura e utilizados estritamente para a organização deste Chá Revelação, em total conformidade com a LGPD.
          </p>

          {/* Botões do Rodapé Alinhados à Direita - Idêntico ao print */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#f6b26b] hover:bg-[#e09d56] text-white font-bold py-2.5 px-6 rounded-full text-sm shadow-md transition-all active:scale-95 flex items-center justify-center"
            >
              {loading ? (
                <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <span>Confirmar</span>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-[#6c757d] hover:bg-[#5a6268] text-white font-bold py-2.5 px-6 rounded-full text-sm shadow-sm transition-all active:scale-95"
            >
              Fechar
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
