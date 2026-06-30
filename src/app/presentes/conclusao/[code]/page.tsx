"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { CheckCircle2, Copy, Check, Clock, Calendar, MapPin, Heart, Share2, HelpCircle, PhoneCall } from "lucide-react";

export default function OrderCompletionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = params.code as string;
  const paymentStatusUrl = searchParams.get("payment_status");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (code) {
      fetchOrder();
    }
  }, [code]);

  // Polling: se o status for pending, verifica a cada 5 segundos
  useEffect(() => {
    if (order && order.paymentStatus === "pending") {
      const interval = setInterval(() => {
        fetchOrder();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [order?.paymentStatus, code]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/order?code=${code}`);
      const data = await res.json();
      if (res.ok) {
        // Atualização Otimista: se a URL diz que foi aprovado pelo MP, mas o BD ainda não atualizou (atraso de webhook)
        if (paymentStatusUrl === "approved" && data.order.paymentStatus !== "approved") {
          data.order.paymentStatus = "approved";
        }
        
        setOrder(data.order);
        // Se o pedido acabou de ser aprovado na recarga (ou URL), comemora com confete
        if (data.order.paymentStatus === "approved") {
          triggerSuccessConfetti();
        }
      } else {
        toast.error("Pedido não localizado.");
        router.push("/");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados do pedido.");
    } finally {
      setLoading(false);
    }
  };

  const triggerSuccessConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#57a3e2", "#e0589a", "#f6b26b"],
    });
  };

  const handleCopyPix = () => {
    const payment = order?.payments?.[0];
    const key = payment?.pixCopiaCola;
    if (!key) return;

    navigator.clipboard.writeText(key);
    setCopied(true);
    toast.success("Código Pix Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Aciona o simulador de webhook no backend para aprovar o pagamento de testes imediatamente
  const handleSimulatedApprove = async () => {
    try {
      setSimulating(true);
      const res = await fetch(`/api/webhooks/payment?action=simulated_approve&orderCode=${order.code}`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Simulação: Pagamento aprovado via Webhook!");
        fetchOrder(); // recarrega dados do pedido
      } else {
        toast.error(data.error || "Erro na simulação.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao simular webhook.");
    } finally {
      setSimulating(false);
    }
  };

  const handleShare = () => {
    const itemsText = order?.orderItems ? order.orderItems.map((i: any) => i.name).join(", ") : "um presente da lista";
    const shareText = `Acabei de presentear os pais do Chá Revelação com ${itemsText}! Evento: Miguel ou Rafaella? Pedido: ${order?.code}`;
    if (navigator.share) {
      navigator.share({
        title: "Chá Revelação - Presente Enviado",
        text: shareText,
        url: window.location.origin,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${shareText} - ${window.location.origin}`);
      toast.success("Link e mensagem copiados para compartilhar!");
    }
  };

  // Redireciona o convidado para enviar comprovante via WhatsApp
  const handleWhatsAppReceipt = () => {
    const phone = "21993439161"; // telefone padrão de contato dos pais
    const text = encodeURIComponent(
      `Olá! Enviei meu presente para o Chá Revelação. Segue o comprovante do pedido ${order?.code} (${order?.paymentMethod.toUpperCase()}) no valor de R$ ${parseFloat(order?.totalValue).toFixed(2)}.`
    );
    window.open(`https://api.whatsapp.com/send?phone=55${phone}&text=${text}`, "_blank");
  };

  if (loading) {
    return (
      <main className="bg-baby-gradient min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block h-8 w-8 border-4 border-baby-gold border-t-transparent rounded-full mb-2"></div>
          <p className="text-sm text-gray-400 font-bold">Carregando conclusão de pedido...</p>
        </div>
      </main>
    );
  }

  if (!order) return null;

  const mainPayment = order.payments?.[0];
  const isPix = order.paymentMethod === "pix";
  const isCard = order.paymentMethod === "card";
  const isPersonal = order.paymentMethod === "personal";
  const isLink = order.paymentMethod === "link";
  const isApproved = order.paymentStatus === "approved";

  return (
    <main className="bg-baby-gradient min-h-screen py-10 px-4 flex items-center justify-center">
      <div className="container mx-auto max-w-xl bg-white rounded-3xl border border-baby-beige shadow-lg overflow-hidden">
        
        {/* Corpo principal */}
        <div className="p-6 md:p-8 text-center">
          
          {/* Ícone de Sucesso */}
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 ${
            isApproved 
              ? "bg-emerald-100 text-emerald-600 animate-pulse-soft" 
              : "bg-baby-blue-light text-baby-blue animate-bounce"
          }`}>
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <h2 className="text-2xl font-black text-gray-800 font-serif">
            {isApproved || isPersonal || isLink ? "Obrigado pelo Presente!" : "Falta pouco!"}
          </h2>
          <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">Código do pedido: {order.code}</p>

          <div className="mt-2 text-sm text-gray-500 font-medium max-w-sm mx-auto leading-relaxed">
            {isApproved || isPersonal || isLink ? (
              order.isAnonymous ? (
                <p>Sua contribuição anônima foi registrada de forma segura para os pais.</p>
              ) : (
                <p>Ficamos muito felizes com o seu carinho, <strong className="text-gray-700">{order.gifterName}</strong>!</p>
              )
            ) : (
              <p>O seu pedido foi recebido. Finalize o pagamento para confirmar o seu presente!</p>
            )}
          </div>

          {/* Resumo do Pedido */}
          <div className="bg-gray-50 border border-baby-beige rounded-2xl p-4 shadow-inner text-left my-6 text-xs font-semibold">
            <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Resumo dos Presentes</h4>
            <div className="space-y-1.5 border-b border-baby-beige pb-3 mb-3 text-gray-600">
              {order.orderItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span>{item.name} <strong className="text-gray-400">x{item.quantity}</strong></span>
                  <span className="font-extrabold">{item.priceAtPurchase.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center text-sm font-black text-gray-700">
              <span>Valor Total</span>
              <span>{order.totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wide">
              <span>Método: {order.paymentMethod.toUpperCase()}</span>
              {isPersonal ? (
                <span className="px-2 py-0.5 rounded-md bg-baby-blue-light text-baby-blue-dark">
                  ENTREGA NO DIA
                </span>
              ) : (
                <span className={`px-2 py-0.5 rounded-md ${
                  isApproved 
                    ? "bg-emerald-100 text-emerald-700" 
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {order.paymentStatus === "approved" ? "PAGO / APROVADO" : "AGUARDANDO PAGAMENTO"}
                </span>
              )}
            </div>
          </div>

          {/* Área Dinâmica de Instruções de Pagamento */}
          <div className="border border-baby-beige rounded-2xl p-6 bg-baby-beige-dark/10 shadow-sm text-center">
            
            {isPix && (
              <div className="space-y-4">
                <h4 className="text-lg font-extrabold text-gray-700 font-serif">Pagamento via Pix Copia e Cola</h4>
                <p className="text-sm text-gray-500 leading-snug">Efetue a transferência Pix copia e cola abaixo para aprovação automática do pedido.</p>

                {/* Exibição do QR Code se gerado */}
                {mainPayment?.pixQrCode && mainPayment.pixQrCode.startsWith("data:image") ? (
                  <div className="mx-auto h-56 w-56 md:h-64 md:w-64 bg-white p-2 rounded-xl border border-baby-beige shadow-inner flex items-center justify-center">
                    <img src={mainPayment.pixQrCode} alt="QR Code Pix" className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div className="mx-auto h-56 w-56 md:h-64 md:w-64 bg-white rounded-xl border border-dashed border-baby-gold/30 flex flex-col items-center justify-center text-baby-gold/40 text-xs">
                    <span>📱 QR Code Pix</span>
                  </div>
                )}

                {/* Botão Copia e Cola */}
                {mainPayment?.pixCopiaCola && (
                  <div className="flex gap-2 max-w-md mx-auto">
                    <input
                      type="text"
                      readOnly
                      value={mainPayment.pixCopiaCola}
                      className="flex-1 bg-white border border-baby-beige-dark rounded-xl px-4 py-3 text-sm font-mono truncate text-gray-700"
                    />
                    <button
                      onClick={handleCopyPix}
                      className="bg-baby-gold hover:bg-baby-gold-hover text-white px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2 flex-none"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? "Copiado" : "Copiar"}</span>
                    </button>
                  </div>
                )}

                {/* Botão de Homologação / Mudar Pagamento */}
                {!isApproved && (
                  <div className="pt-2 border-t border-baby-beige/40 mt-4 flex flex-col gap-2">
                    <button
                      onClick={async () => {
                        const confirm = window.confirm("Deseja trocar o método de pagamento para Cartão de Crédito?");
                        if (!confirm) return;
                        try {
                          const res = await fetch("/api/order/payment", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ orderCode: order.code, paymentMethod: "card" }),
                          });
                          if (res.ok) window.location.reload();
                          else alert("Erro ao trocar método de pagamento.");
                        } catch (err) {
                          alert("Erro de conexão.");
                        }
                      }}
                      className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all w-full md:w-auto mx-auto"
                    >
                      💳 Trocar para Cartão de Crédito
                    </button>
                  </div>
                )}
              </div>
            )}

            {isCard && (
              <div className="space-y-3">
                <h4 className="text-sm font-extrabold text-gray-700 font-serif">Pagamento via Cartão de Crédito</h4>
                {isApproved ? (
                  <p className="text-xs text-emerald-600 font-bold">✔ Pagamento aprovado no cartão com sucesso!</p>
                ) : (
                  <div>
                    <p className="text-xs text-gray-400 leading-snug">Seu pagamento está pendente de processamento. Clique abaixo para abrir o checkout caso não tenha concluído.</p>
                    <a
                      href={mainPayment?.transactionId ? `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${mainPayment.transactionId}` : "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 mb-4 bg-baby-blue hover:bg-baby-blue-hover text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-sm w-full md:w-auto"
                    >
                      Pagar com Cartão
                    </a>

                    <div className="pt-2 border-t border-baby-beige/40">
                      <button
                        onClick={async () => {
                          const confirm = window.confirm("Deseja trocar o método de pagamento para Pix?");
                          if (!confirm) return;
                          try {
                            const res = await fetch("/api/order/payment", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ orderCode: order.code, paymentMethod: "pix" }),
                            });
                            if (res.ok) window.location.reload();
                            else alert("Erro ao trocar método de pagamento.");
                          } catch (err) {
                            alert("Erro de conexão.");
                          }
                        }}
                        className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
                      >
                        📱 Trocar para Pix
                      </button>
                    </div>
                  </div>

                )}
              </div>
            )}

            {isPersonal && (
              <div className="space-y-2.5 text-left text-xs font-semibold text-gray-500">
                <h4 className="text-sm font-extrabold text-gray-700 font-serif text-center mb-1">Entrega Pessoal</h4>
                <p>✔ O presente físico foi reservado no seu nome.</p>
                <p>✔ Você poderá comprar em qualquer loja de sua preferência e levá-lo no dia da festa.</p>
                <div className="mt-3 bg-white p-3.5 border border-baby-beige rounded-2xl shadow-inner text-gray-600">
                  <p className="font-extrabold text-gray-800 flex items-center gap-1"><MapPin className="h-4 w-4 text-baby-gold" /> Endereço do Evento:</p>
                  <p className="mt-1 font-medium">Espaço Kolina - Rua Nabôr do Rêgo, 384 – Ramos</p>
                </div>
              </div>
            )}

            {isLink && (
              <div className="space-y-2.5 text-left text-xs font-semibold text-gray-500">
                <h4 className="text-sm font-extrabold text-gray-700 font-serif text-center mb-1">Compra Realizada</h4>
                <p>✔ Seu presente foi marcado como prometido e aguardando entrega física da loja de destino.</p>
                <p>✔ Certifique-se de configurar o endereço correto de entrega na loja externa selecionada.</p>
              </div>
            )}

          </div>

          {/* Compartilhamento e Voltar */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={() => router.push("/")}
              className="flex-1 bg-gray-100 hover:bg-gray-250 text-gray-600 font-extrabold py-3.5 rounded-full text-xs transition-all active:scale-95"
            >
              Voltar ao Site
            </button>

            {/* Enviar comprovante se Pix manual */}
            {isPix && (
              <button
                onClick={handleWhatsAppReceipt}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-3.5 rounded-full text-xs shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Enviar Comprovante</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="flex-1 bg-baby-gold hover:bg-baby-gold-hover text-white font-extrabold py-3.5 rounded-full text-xs shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Share2 className="h-4 w-4" />
              <span>Compartilhar</span>
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
