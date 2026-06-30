"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { X, Trash2, ShoppingBag, CreditCard, QrCode, MapPin, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
}

// Validador matemático de CPF brasileiro
function isValidCPF(cpf: string) {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;
  
  let sum = 0;
  let remainder;
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(clean.substring(i - 1, i)) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(clean.substring(i - 1, i)) * (12 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(10, 11))) return false;
  
  return true;
}

export default function CartModal({ isOpen, onClose, initialStep }: CartModalProps) {
  const { cartItems, totalValue, loading, updateQuantity, removeFromCart, addToCart, sessionId, clearCartLocal } = useCart();
  const router = useRouter();

  // Estados do Multi-step: 1 = Carrinho, 2 = Dados Pessoais, 3 = Pagamento
  const [step, setStep] = useState(initialStep || 1);
  
  // Dados de Identificação do Convidado
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Método de pagamento selecionado
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "personal" | "link">("pix");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Lista geral de presentes para cross-sell
  const [allGifts, setAllGifts] = useState<any[]>([]);

  useEffect(() => {
    async function loadGifts() {
      try {
        const res = await fetch("/api/gifts");
        const data = await res.json();
        if (res.ok) {
          setAllGifts(data.data || []);
        }
      } catch (err) {
        console.error("Erro ao carregar presentes para sugestão:", err);
      }
    }
    if (isOpen) {
      loadGifts();
    }
  }, [isOpen]);

  // Resetar etapa ao abrir/fechar modal
  useEffect(() => {
    if (isOpen) {
      setStep(initialStep || 1);
    }
  }, [isOpen, initialStep]);

  if (!isOpen) return null;

  // Filtra sugestões (presentes disponíveis não inseridos no carrinho, ordenados do mais barato pro mais caro)
  const suggestions = allGifts
    .filter((g) => {
      const inCart = cartItems.some((item) => item.giftId === g.id);
      const remaining = g.maxQuantity - g.chosenQuantity;
      return !inCart && remaining > 0;
    })
    .sort((a, b) => a.value - b.value)
    .slice(0, 5);

  // Cálculo da parcela simulada do cartão com juros padrão do MP
  const installmentValue = (totalValue * 1.15) / 5;

  // Formatação de CPF em tempo real (000.000.000-00)
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 11) {
      let val = raw;
      if (raw.length > 3) val = `${raw.substring(0, 3)}.${raw.substring(3)}`;
      if (raw.length > 6) val = `${raw.substring(0, 3)}.${raw.substring(3, 6)}.${raw.substring(6)}`;
      if (raw.length > 9) val = `${raw.substring(0, 3)}.${raw.substring(3, 6)}.${raw.substring(6, 9)}-${raw.substring(9, 11)}`;
      setCpf(val);
    }
  };

  // Formatação de telefone em tempo real ((00) 00000-0000)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 11) {
      let val = raw;
      if (raw.length > 2) val = `(${raw.substring(0, 2)}) ${raw.substring(2)}`;
      if (raw.length > 7) val = `(${raw.substring(0, 2)}) ${raw.substring(2, 7)}-${raw.substring(7)}`;
      setPhone(val);
    }
  };

  // Ir para formulário
  const handleGoToDetails = () => {
    if (cartItems.length === 0) {
      toast.error("Adicione presentes ao seu carrinho primeiro!");
      return;
    }
    setStep(2);
  };

  // Ir para pagamento
  const handleGoToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nome completo é obrigatório.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("E-mail inválido ou obrigatório.");
      return;
    }
    // WhatsApp agora é opcional, mas se preenchido, validamos
    if (phone.trim() && phone.replace(/\D/g, "").length < 10) {
      toast.error("Se inserir um WhatsApp, informe um número válido.");
      return;
    }
    setStep(3);
  };

  // Finalizar e redirecionar
  const handleFinalizeCheckout = async () => {
    try {
      setCheckoutLoading(true);

      const payload = {
        sessionId,
        gifterName: name.trim(),
        gifterEmail: email.trim().toLowerCase(),
        gifterPhone: phone.replace(/\D/g, ""),
        message: message.trim() || null,
        isAnonymous,
        paymentMethod,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao processar o presente.");
        return;
      }

      toast.success("Contribuição finalizada com sucesso!");
      clearCartLocal();
      onClose();

      if (paymentMethod === "card" && data.payment?.initPoint) {
        window.location.href = data.payment.initPoint;
      } else {
        router.push(`/presentes/conclusao/${data.order.code}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Identifica se há links externos
  const hasExternalLink = cartItems.some((item) => item.externalLink && item.externalLink.trim() !== "");

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      {/* Clique no fundo fecha */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      {/* Janela do Modal */}
      <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl border border-baby-beige overflow-hidden animate-scale-up my-8 relative flex flex-col">
        
        {/* Botão Fechar */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-50 transition-all z-10"
          title="Fechar"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-6 md:p-10 flex-1 overflow-y-auto no-scrollbar">
          
          {step === 1 && (
            /* ETAPA 1: CARRINHO DE PRESENTES */
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Lista de Presentes no Carrinho */}
                <div className="lg:col-span-3 space-y-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                      🛒 Carrinho de Presentes
                    </h2>
                    <p className="text-sm text-[#f6b26b] font-bold mt-2">Descrição do presente</p>
                  </div>

                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {cartItems.length === 0 ? (
                      <div className="text-center py-12 flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-baby-beige">
                        <ShoppingBag className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-sm font-bold text-gray-400">Seu carrinho de presentes está vazio.</p>
                      </div>
                    ) : (
                      cartItems.map((item) => (
                        <div 
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[#faf6f0]/40 border border-baby-beige/60 rounded-2xl p-4 shadow-sm hover:bg-white transition-all relative group"
                        >
                          <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                            {/* Miniatura do Presente */}
                            <div className="h-16 w-16 rounded-xl bg-white border border-baby-beige overflow-hidden flex-none">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-baby-gold/30">
                                  <ShoppingBag className="h-6 w-6" />
                                </div>
                              )}
                            </div>

                            {/* Nome e Preço */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-extrabold text-slate-800 leading-tight truncate pr-2">
                                {item.name}
                              </h4>
                              <p className="text-sm font-black text-[#5c5bd5] mt-1">
                                {item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-0 border-baby-beige/50 pt-3 sm:pt-0">
                            {/* Seletor Quantidade Pill */}
                            <div className="flex items-center gap-3 border-2 border-[#5c5bd5] px-4 py-1.5 rounded-full text-xs font-black text-[#5c5bd5] bg-white shadow-sm flex-none">
                              <button 
                                type="button" 
                                onClick={() => updateQuantity(item.giftId, item.quantity - 1)}
                                className="hover:scale-125 transition-transform"
                              >
                                -
                              </button>
                              <span className="w-4 text-center">{item.quantity}</span>
                              <button 
                                type="button" 
                                onClick={() => updateQuantity(item.giftId, item.quantity + 1)}
                                className="hover:scale-125 transition-transform"
                              >
                                +
                              </button>
                            </div>

                            {/* Lixeira */}
                            <button
                              onClick={() => removeFromCart(item.giftId)}
                              className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all ml-2 flex-none"
                              title="Remover presente"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Resumo Financeiro Direita */}
                <div className="lg:col-span-2">
                  <div className="bg-[#faf6f0]/50 border border-baby-beige/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-lg font-bold text-slate-500">Total</span>
                        <span className="text-3xl font-black text-slate-800">
                          {totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                        Ou em até 5 parcelas de {installmentValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={handleGoToDetails}
                        disabled={cartItems.length === 0}
                        className="w-full bg-[#00b23d] hover:bg-[#009632] text-white font-extrabold py-4 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 text-center flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Presentear Agora
                      </button>
                      <button
                        onClick={onClose}
                        className="w-full bg-cyan-100 hover:bg-cyan-200 text-cyan-800 font-extrabold py-3 rounded-full transition-all text-xs uppercase tracking-wider text-center"
                      >
                        Escolher mais itens
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recomendados / Cross-Sell */}
              {suggestions.length > 0 && (
                <div className="border-t border-baby-beige pt-8 space-y-4">
                  <h3 className="text-xs font-black text-[#5c5bd5] flex items-center gap-1.5 uppercase tracking-wider">
                    🔥 A maioria das pessoas também presenteou
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {suggestions.map((gift) => (
                      <div 
                        key={gift.id}
                        className="bg-white border border-baby-beige rounded-2xl p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 group"
                      >
                        <div className="space-y-2">
                          <div className="aspect-square w-full rounded-xl bg-gray-50 border border-baby-beige overflow-hidden flex items-center justify-center">
                            {gift.imageUrl ? (
                              <img src={gift.imageUrl} alt={gift.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <ShoppingBag className="h-8 w-8 text-gray-200" />
                            )}
                          </div>
                          <h4 className="text-[11px] font-extrabold text-slate-800 leading-snug line-clamp-2 min-h-[32px]">
                            {gift.name}
                          </h4>
                        </div>

                        <div className="space-y-2 mt-2">
                          <p className="text-xs font-black text-slate-800">
                            {gift.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </p>
                          <button
                            onClick={() => addToCart(gift.id)}
                            className="w-full border-2 border-[#00b23d] text-[#00b23d] hover:bg-[#00b23d]/5 font-black py-1.5 rounded-xl text-[10px] uppercase transition-all"
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            /* ETAPA 2: DADOS PESSOAIS */
            <form onSubmit={handleGoToPayment} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Lado Esquerdo: Formulário */}
              <div className="lg:col-span-3 space-y-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                    Preencha seus dados pessoais
                  </h2>
                  <p className="text-xs text-gray-400 font-semibold mt-1">
                    Insira seus dados reais para que os pais saibam quem enviou o carinho.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Seu Nome (obrigatório)
                    </label>
                    <input
                      type="text"
                      placeholder="Digite seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 focus:border-[#f6b26b] rounded-xl px-4 py-3 text-sm focus:outline-none font-semibold transition-all shadow-sm"
                    />
                  </div>

                  <div className="w-full">
                    <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Seu E-mail (obrigatório)
                    </label>
                    <input
                      type="email"
                      placeholder="exemplo@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 focus:border-[#f6b26b] rounded-xl px-4 py-3 text-sm focus:outline-none font-semibold transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Seu Whatsapp (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="w-full bg-white border border-slate-200 focus:border-[#f6b26b] rounded-xl px-4 py-3 text-sm focus:outline-none font-semibold transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wide">
                        Digite um recadinho (opcional)
                      </label>
                    </div>
                    <textarea
                      placeholder="Envie uma mensagem de carinho aos pais!"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-slate-200 focus:border-[#f6b26b] rounded-xl px-4 py-3 text-sm focus:outline-none font-semibold transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Lado Direito: Resumo Financeiro */}
              <div className="lg:col-span-2">
                <div className="bg-[#faf6f0]/50 border border-baby-beige/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-bold text-slate-500">Total</span>
                      <span className="text-3xl font-black text-slate-800">
                        {totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                      Ou em até 12 parcelas de {installmentValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="submit"
                      className="w-full bg-[#00b23d] hover:bg-[#009632] text-white font-extrabold py-4 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 text-center flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                    >
                      Ir Para Pagamento
                    </button>
                    {initialStep !== 2 && (
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-full bg-cyan-100 hover:bg-cyan-200 text-cyan-800 font-extrabold py-3 rounded-full transition-all text-xs uppercase tracking-wider text-center"
                      >
                        Voltar ao carrinho
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          )}

          {step === 3 && (
            /* ETAPA 3: ESCOLHA DA FORMA DE PAGAMENTO */
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Lado Esquerdo: Métodos */}
              <div className="lg:col-span-3 space-y-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                    Escolha a forma de pagamento
                  </h2>
                  <p className="text-xs text-gray-400 font-semibold mt-1">
                    Selecione como quer concretizar a entrega do seu presente.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Opção Pix */}
                  <label 
                    className={`flex items-center gap-4 border-2 rounded-2xl p-4 cursor-pointer transition-all shadow-sm ${
                      paymentMethod === "pix"
                        ? "border-[#f6b26b] bg-[#f6b26b]/5"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="pix"
                      checked={paymentMethod === "pix"}
                      onChange={() => setPaymentMethod("pix")}
                      className="accent-[#f6b26b]"
                    />
                    <div className="h-10 w-10 rounded-full bg-[#f6b26b]/10 flex items-center justify-center text-[#f6b26b] flex-none">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">Enviar por Pix</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5 leading-normal">
                        O QR Code e chave Pix copia-e-cola serão exibidos na próxima tela de conclusão.
                      </p>
                    </div>
                  </label>

                  {/* Opção Cartão de Crédito */}
                  <label 
                    className={`flex items-center gap-4 border-2 rounded-2xl p-4 cursor-pointer transition-all shadow-sm ${
                      paymentMethod === "card"
                        ? "border-[#f6b26b] bg-[#f6b26b]/5"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="accent-[#f6b26b]"
                    />
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-none">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">Cartão de Crédito</h4>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">
                        Parcele em até 12x via Mercado Pago.
                      </p>
                    </div>
                  </label>

                  {/* Opção Link Externo (Se houver link) */}
                  {hasExternalLink && (
                    <label 
                      className={`flex items-center gap-4 border-2 rounded-2xl p-4 cursor-pointer transition-all shadow-sm ${
                        paymentMethod === "link"
                          ? "border-[#f6b26b] bg-[#f6b26b]/5"
                          : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value="link"
                        checked={paymentMethod === "link"}
                        onChange={() => setPaymentMethod("link")}
                        className="accent-[#f6b26b]"
                      />
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-none">
                        <ExternalLink className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-800">Comprar em Loja Virtual</h4>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5 leading-normal">
                          Você compra no link oficial da loja parceira e nós damos baixa no presente.
                        </p>
                      </div>
                    </label>
                  )}

                  {/* Opção Pessoalmente */}
                  <label 
                    className={`flex items-center gap-4 border-2 rounded-2xl p-4 cursor-pointer transition-all shadow-sm ${
                      paymentMethod === "personal"
                        ? "border-[#f6b26b] bg-[#f6b26b]/5"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="personal"
                      checked={paymentMethod === "personal"}
                      onChange={() => setPaymentMethod("personal")}
                      className="accent-[#f6b26b]"
                    />
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-none">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">Levar no dia do Evento</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5 leading-normal">
                        Você compra o presente físico e o entrega pessoalmente no Espaço Kolina.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Lado Direito: Resumo e Envio */}
              <div className="lg:col-span-2">
                <div className="bg-[#faf6f0]/50 border border-baby-beige/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-bold text-slate-500">Total</span>
                      <span className="text-3xl font-black text-slate-800">
                        {totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                      Ou em até 12 parcelas de {installmentValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleFinalizeCheckout}
                      disabled={checkoutLoading}
                      className="w-full bg-[#00b23d] hover:bg-[#009632] text-white font-extrabold py-4 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 text-center flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50"
                    >
                      {checkoutLoading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        "Confirmar e Finalizar"
                      )}
                    </button>
                    <button
                      onClick={() => setStep(2)}
                      disabled={checkoutLoading}
                      className="w-full bg-cyan-100 hover:bg-cyan-200 text-cyan-800 font-extrabold py-3 rounded-full transition-all text-xs uppercase tracking-wider text-center"
                    >
                      Voltar aos dados
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
