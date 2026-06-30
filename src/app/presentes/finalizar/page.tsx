"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Copy, Check, ShoppingBag, EyeOff, MapPin, ExternalLink, HelpCircle, ShoppingCart } from "lucide-react";

export default function CheckoutPage() {
  const { cartItems, totalValue, sessionId, clearCartLocal } = useCart();
  const router = useRouter();

  // Estados do Formulário
  const [step, setStep] = useState(1);
  const [gifterName, setGifterName] = useState("");
  const [gifterEmail, setGifterEmail] = useState("");
  const [gifterPhone, setGifterPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Forma de Presentear selecionada
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "personal" | "link">("pix");
  
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Configurações do evento obtidas do banco
  const [eventConfig, setEventConfig] = useState<any>(null);

  // Calcula meios de pagamento comuns a todos os presentes no carrinho
  const availablePaymentMethods = React.useMemo(() => {
    if (!cartItems || cartItems.length === 0) return ["pix", "card", "personal", "link"];
    
    // Calcula interseção
    const intersection = cartItems.reduce((acc, item) => {
      const itemMethods = (item.allowedPaymentMethods || "pix,card,personal,link").split(",");
      return acc.filter(m => itemMethods.includes(m));
    }, ["pix", "card", "personal", "link"]);
    
    // Se não houver interseção, libera apenas pix
    if (intersection.length === 0) return ["pix"];
    return intersection;
  }, [cartItems]);

  // Força o reset do método se o selecionado atualmente ficar indisponível
  useEffect(() => {
    if (paymentMethod && !availablePaymentMethods.includes(paymentMethod)) {
      setPaymentMethod((availablePaymentMethods[0] as any) || "pix");
    } else if (!paymentMethod && availablePaymentMethods.length > 0) {
      setPaymentMethod(availablePaymentMethods[0] as any);
    }
  }, [availablePaymentMethods, paymentMethod]);

  useEffect(() => {
    // Busca dados de localização/endereço seguro do backend
    async function loadConfig() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (res.ok) {
          setEventConfig(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadConfig();
  }, []);

  // Impede entrada direta no checkout se o carrinho estiver vazio
  useEffect(() => {
    if (cartItems.length === 0 && !loading) {
      toast.error("Adicione presentes ao seu carrinho primeiro!");
      router.push("/");
    }
  }, [cartItems]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gifterName.trim() || !gifterEmail.trim() || !gifterPhone.trim()) {
      toast.error("Por favor, preencha todos os campos de identificação.");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(gifterEmail)) {
      toast.error("Por favor, insira um e-mail válido.");
      return;
    }

    const rawPhone = gifterPhone.replace(/\D/g, "");
    if (rawPhone.length < 10) {
      toast.error("Por favor, insira um WhatsApp válido.");
      return;
    }

    setStep(2);
  };

  const handleCopyAddress = () => {
    if (!eventConfig?.event?.deliveryAddress) return;
    navigator.clipboard.writeText(eventConfig.event.deliveryAddress);
    setCopied(true);
    toast.success("Endereço copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinalize = async () => {
    try {
      setLoading(true);

      const payload = {
        sessionId,
        gifterName: gifterName.trim(),
        gifterEmail: gifterEmail.trim().toLowerCase(),
        gifterPhone: gifterPhone.replace(/\D/g, ""),
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
        toast.error(data.error || "Erro ao processar o checkout de presentes.");
        return;
      }

      // Mensagem de sucesso apropriada
      if (paymentMethod === "card") {
        toast.info("Redirecionando para o pagamento seguro...");
      } else if (paymentMethod === "pix") {
        toast.info("Gerando seu QR Code Pix...");
      } else {
        toast.success("Pedido reservado com sucesso!");
      }
      
      clearCartLocal(); // limpa carrinho localmente

      // Se for Cartão de Crédito e o gateway gerou o link de redirecionamento
      if (paymentMethod === "card" && data.payment?.initPoint) {
        window.location.href = data.payment.initPoint;
      } else {
        // Redireciona para tela de conclusão local
        router.push(`/presentes/conclusao/${data.order.code}`);
      }

    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar transação.");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) return null;

  return (
    <main className="bg-baby-gradient min-h-screen py-10 px-4">
      <div className="container mx-auto max-w-2xl bg-white rounded-3xl border border-baby-beige shadow-lg overflow-hidden">
        
        {/* Cabeçalho do Checkout */}
        <div className="bg-gradient-to-r from-baby-blue/10 to-baby-pink/10 border-b border-baby-beige p-6 flex items-center justify-between">
          <button 
            onClick={() => step === 2 ? setStep(1) : router.push("/")}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-all hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </button>
          
          <span className="text-sm font-extrabold text-baby-gold">
            Etapa {step} de 2
          </span>
        </div>

        {/* Corpo principal */}
        <div className="p-6 md:p-8">
          
          {/* Indicador visual de progresso */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-baby-blue" : "bg-gray-100"}`} />
            <div className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-baby-pink" : "bg-gray-100"}`} />
          </div>

          {step === 1 ? (
            /* ETAPA 1: IDENTIFICAÇÃO DO CONVIDADO */
            <form onSubmit={handleNextStep} className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-xl font-extrabold text-gray-800 font-serif">Quem está presenteando?</h2>
                <p className="text-xs text-gray-400 font-semibold mt-1">Preencha seus dados para identificar a contribuição.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Seu Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={gifterName}
                  onChange={(e) => setGifterName(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-baby-beige-dark rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-baby-gold font-semibold transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Seu E-mail *</label>
                  <input
                    type="email"
                    placeholder="Ex: seuemail@exemplo.com"
                    value={gifterEmail}
                    onChange={(e) => setGifterEmail(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-baby-beige-dark rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-baby-gold font-semibold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">WhatsApp / Celular *</label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={gifterPhone}
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
                      setGifterPhone(val);
                    }}
                    required
                    className="w-full bg-gray-50 border border-baby-beige-dark rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-baby-gold font-semibold transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Recadinho para os Pais (Opcional)</label>
                <textarea
                  placeholder="Escreva uma bela mensagem de carinho para os pais e para o bebê..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-50 border border-baby-beige-dark rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-baby-gold font-semibold transition-all"
                />
              </div>

              {/* Toggle Presente Anônimo */}
              <div className="flex items-center justify-between bg-baby-beige-dark/10 border border-baby-beige-dark/20 rounded-xl p-4">
                <div className="flex gap-2.5 items-start">
                  <div className="mt-0.5 text-baby-gold">
                    <EyeOff className="h-4 w-4" />
                  </div>
                  <div>
                    <label htmlFor="anonymous" className="block text-xs font-extrabold text-gray-700 cursor-pointer select-none">Quero presentear de forma anônima</label>
                    <p className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">Seu nome não aparecerá publicamente no painel de presentes do site (visível apenas para os pais).</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="accent-baby-gold h-4 w-4 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-baby-blue to-baby-pink text-white font-extrabold py-4 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 text-center text-sm"
              >
                Prosseguir para Forma de Presentear
              </button>
            </form>
          ) : (
            /* ETAPA 2: ESCOLHA DA FORMA DE PRESENTEAR */
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-xl font-extrabold text-gray-800 font-serif">Como deseja presentear?</h2>
                <p className="text-xs text-gray-400 font-semibold mt-1">Selecione o método de sua preferência para concluir.</p>
              </div>

              {/* Resumo Simplificado do Carrinho */}
              <div className="bg-gray-50 border border-baby-beige rounded-2xl p-4 shadow-inner">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5" /> Presentes no seu carrinho
                </p>
                <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 no-scrollbar text-xs">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-gray-600">
                      <span className="truncate pr-4 font-semibold">{item.name} <strong className="text-gray-400">x{item.quantity}</strong></span>
                      <span className="font-extrabold">{item.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-baby-beige mt-3 pt-3 flex justify-between items-center text-sm font-black text-gray-700">
                  <span>Valor Total</span>
                  <span>{totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
              </div>

              {/* Seleção do Método */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Opção 1: Pix */}
                {availablePaymentMethods.includes("pix") && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("pix")}
                    className={`flex items-start gap-3 rounded-2xl p-4 border-2 text-left transition-all ${
                      paymentMethod === "pix"
                        ? "border-baby-gold bg-baby-gold-light/20 shadow-sm"
                        : "border-baby-beige bg-white hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-2xl mt-0.5">📱</span>
                    <div>
                      <h4 className="text-xs font-black text-gray-700">Presentear via Pix</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-medium leading-snug">Gera QR Code copia e cola do valor correspondente para os pais comprarem o item físico.</p>
                    </div>
                  </button>
                )}

                {/* Opção 2: Cartão de Crédito */}
                {availablePaymentMethods.includes("card") && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-start gap-3 rounded-2xl p-4 border-2 text-left transition-all ${
                      paymentMethod === "card"
                        ? "border-baby-gold bg-baby-gold-light/20 shadow-sm"
                        : "border-baby-beige bg-white hover:bg-gray-50"
                    }`}
                  >
                    <CreditCard className="h-5 w-5 text-gray-600 mt-1" />
                    <div>
                      <h4 className="text-xs font-black text-gray-700">Cartão de Crédito</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-medium leading-snug">Parcelamento seguro em até 5x via Mercado Pago. O valor será enviado aos pais para compra.</p>
                    </div>
                  </button>
                )}

                {/* Opção 3: Levar Pessoalmente */}
                {availablePaymentMethods.includes("personal") && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("personal")}
                    className={`flex items-start gap-3 rounded-2xl p-4 border-2 text-left transition-all ${
                      paymentMethod === "personal"
                        ? "border-baby-gold bg-baby-gold-light/20 shadow-sm"
                        : "border-baby-beige bg-white hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-2xl mt-0.5">🎁</span>
                    <div>
                      <h4 className="text-xs font-black text-gray-700">Levar Pessoalmente</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-medium leading-snug">Você mesmo compra o presente físico e entrega pessoalmente no dia e local do Chá Revelação.</p>
                    </div>
                  </button>
                )}

                {/* Opção 4: Comprar pelo Link */}
                {availablePaymentMethods.includes("link") && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("link")}
                    className={`flex items-start gap-3 rounded-2xl p-4 border-2 text-left transition-all ${
                      paymentMethod === "link"
                        ? "border-baby-gold bg-baby-gold-light/20 shadow-sm"
                        : "border-baby-beige bg-white hover:bg-gray-50"
                    }`}
                  >
                    <ShoppingCart className="h-5 w-5 text-gray-600 mt-1" />
                    <div>
                      <h4 className="text-xs font-black text-gray-700">Link Externo de Compra</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-medium leading-snug">Te redireciona para a loja externa do item. Você compra e envia para o endereço dos pais.</p>
                    </div>
                  </button>
                )}

              </div>

              {/* Informações detalhadas do método ativo */}
              <div className="bg-amber-50/40 border border-amber-500/10 rounded-2xl p-4 text-xs font-medium text-amber-800 leading-relaxed">
                
                {paymentMethod === "pix" && (
                  <p>✔ Ao finalizar, você receberá a chave Pix Copia e Cola para pagamento do valor dos itens. O dinheiro vai direto para os pais comprarem os presentes físicos.</p>
                )}

                {paymentMethod === "card" && (
                  <p>✔ Ao finalizar, você será redirecionado para a tela de pagamento seguro do Mercado Pago para parcelar suas contribuições em até 5x.</p>
                )}

                {paymentMethod === "personal" && (
                  <p>✔ O presente será marcado como prometido e reservado para você. Você deve comprar o produto físico na loja de sua preferência e levá-lo no dia da festa.</p>
                )}

                {paymentMethod === "link" && (
                  <div className="space-y-4">
                    <p className="text-amber-800">
                      ✔ Clique abaixo para abrir as lojas externas e comprar seus itens. O endereço seguro para envio dos produtos foi revelado abaixo. Copie e cole na loja de destino:
                    </p>

                    {/* Exposição do Endereço Seguro de Entrega */}
                    {eventConfig?.event?.deliveryAddress ? (
                      <div className="bg-white rounded-xl p-3 border border-baby-gold/20 shadow-sm flex items-center justify-between text-gray-600 gap-3">
                        <div className="flex gap-2 items-start truncate text-[11px]">
                          <MapPin className="h-4 w-4 text-baby-gold flex-none mt-0.5" />
                          <div className="truncate">
                            <p className="font-extrabold text-gray-800">Endereço de Entrega dos Pais:</p>
                            <p className="truncate" title={eventConfig.event.deliveryAddress}>{eventConfig.event.deliveryAddress}</p>
                          </div>
                        </div>
                        <button
                          onClick={handleCopyAddress}
                          className="flex-none bg-baby-gold hover:bg-baby-gold-hover text-white p-2.5 rounded-lg active:scale-95 transition-all"
                          title="Copiar endereço completo"
                        >
                          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-400 italic">Nenhum endereço alternativo cadastrado.</p>
                    )}

                    {/* Links dos produtos */}
                    <div className="space-y-2 border-t border-baby-beige/10 pt-3">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Links de Compra dos Presentes:</p>
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-xs">
                          <span className="truncate pr-4 font-semibold text-gray-600">{item.name}</span>
                          {item.available > 0 ? (
                            <a
                              href={item.available ? "http://google.com/search?q=" + encodeURIComponent(item.name) : "#"} // fallback search
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-none flex items-center gap-1 bg-baby-blue text-white font-bold px-3.5 py-1.5 rounded-full hover:scale-105 transition-all shadow-sm text-[10px]"
                            >
                              <span>Ir para Loja</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-red-500 font-bold text-[10px]">Sem Link</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botões Finais de Ação */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 hover:bg-gray-250 text-gray-500 font-bold py-4 rounded-full text-sm transition-all"
                >
                  Voltar Etapa
                </button>
                
                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-baby-blue to-baby-pink text-white font-bold py-4 rounded-full text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  ) : (
                    <span>Finalizar Presentes</span>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
