"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, ShieldCheck, ArrowRight, Lock } from "lucide-react";

function SimulatedCardForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code") || "";

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [installments, setInstallments] = useState("1");
  const [loading, setLoading] = useState(false);
  
  const [orderAmount, setOrderAmount] = useState(0);

  useEffect(() => {
    if (!code) {
      toast.error("Pedido não fornecido.");
      router.push("/");
      return;
    }
    // Carrega o valor do pedido para exibir na tela
    async function loadOrder() {
      try {
        const res = await fetch(`/api/order?code=${code}`);
        const data = await res.json();
        if (res.ok) {
          setOrderAmount(data.order.totalValue);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadOrder();
  }, [code]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cardNumber.length < 19 || cardName.length < 3 || expiry.length < 5 || cvv.length < 3) {
      toast.error("Por favor, preencha todos os dados do cartão de crédito corretamente.");
      return;
    }

    try {
      setLoading(true);
      toast.info("Processando pagamento em ambiente seguro (Simulador)...");

      // Simula uma chamada ao Webhook de aprovação do Mercado Pago
      const res = await fetch(`/api/webhooks/payment?action=simulated_approve&orderCode=${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulated_card: true,
          installments: parseInt(installments),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Pagamento via cartão aprovado!");
        // Redireciona para a tela de conclusão
        router.push(`/presentes/conclusao/${code}?payment_status=approved`);
      } else {
        toast.error(data.error || "Erro no gateway simulado.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Falha ao processar simulação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md bg-white rounded-3xl border border-baby-beige shadow-lg overflow-hidden">
      
      {/* Topo do Checkout de Cartão */}
      <div className="bg-slate-900 text-white p-6 text-center relative">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white mb-2">
          <Lock className="h-5 w-5" />
        </div>
        <h2 className="text-sm font-extrabold tracking-wider uppercase">Checkout Seguro Simplificado</h2>
        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Sandbox de Simulação Homologado</p>
      </div>

      {/* Formulário do Cartão */}
      <form onSubmit={handlePay} className="p-6 space-y-4">
        
        <div className="flex justify-between items-center text-xs font-bold text-gray-400 border-b border-baby-beige pb-3 mb-2">
          <span>Total da Contribuição:</span>
          <span className="text-lg font-black text-gray-700">
            {orderAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Número do Cartão</label>
          <input
            type="text"
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChange={(e) => {
              let val = e.target.value.replace(/\D/g, "");
              if (val.length > 16) val = val.substring(0, 16);
              const matches = val.match(/\d{1,4}/g);
              setCardNumber(matches ? matches.join(" ") : val);
            }}
            required
            className="w-full bg-gray-50 border border-baby-beige-dark rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:outline-none focus:border-baby-gold transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Nome no Cartão (como impresso)</label>
          <input
            type="text"
            placeholder="Ex: JOAO D SILVA"
            value={cardName}
            onChange={(e) => setCardName(e.target.value.toUpperCase())}
            required
            className="w-full bg-gray-50 border border-baby-beige-dark rounded-xl px-4 py-2.5 text-xs font-bold uppercase focus:outline-none focus:border-baby-gold transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Validade (MM/AA)</label>
            <input
              type="text"
              placeholder="12/28"
              value={expiry}
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, "");
                if (val.length > 4) val = val.substring(0, 4);
                if (val.length > 2) {
                  val = `${val.substring(0, 2)}/${val.substring(2)}`;
                }
                setExpiry(val);
              }}
              required
              className="w-full bg-gray-50 border border-baby-beige-dark rounded-xl px-4 py-2.5 text-xs font-bold text-center focus:outline-none focus:border-baby-gold transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">CVV / Segurança</label>
            <input
              type="password"
              placeholder="***"
              value={cvv}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 3) setCvv(val);
              }}
              required
              className="w-full bg-gray-50 border border-baby-beige-dark rounded-xl px-4 py-2.5 text-xs font-bold text-center focus:outline-none focus:border-baby-gold transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Opções de Parcelamento</label>
          <select
            value={installments}
            onChange={(e) => setInstallments(e.target.value)}
            className="w-full bg-gray-50 border border-baby-beige-dark rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-baby-gold cursor-pointer"
          >
            <option value="1">1x de {(orderAmount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} sem juros</option>
            <option value="2">2x de {(orderAmount / 2).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} sem juros</option>
            <option value="3">3x de {(orderAmount / 3).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} sem juros</option>
            <option value="4">4x de {(orderAmount / 4).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} sem juros</option>
            <option value="5">5x de {(orderAmount / 5).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} sem juros</option>
          </select>
        </div>

        <div className="flex gap-2.5 items-start bg-blue-50/50 border border-blue-500/10 rounded-xl p-3 text-[10px] text-blue-800 font-semibold font-sans">
          <ShieldCheck className="h-4 w-4 text-blue-500 flex-none mt-0.5" />
          <p className="leading-normal">Dados protegidos. O número completo do seu cartão de crédito nunca será exposto ou armazenado em nossos servidores locais.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-black text-white font-extrabold py-3.5 rounded-full text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          ) : (
            <>
              <span>Pagar Contribuição</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>

      </form>
    </div>
  );
}

export default function SimulatedCardPage() {
  return (
    <main className="bg-baby-gradient min-h-screen py-10 px-4 flex items-center justify-center">
      <Suspense fallback={
        <div className="bg-white rounded-3xl p-8 border border-baby-beige shadow-lg max-w-md w-full text-center">
          <div className="animate-spin inline-block h-6 w-6 border-2 border-baby-gold border-t-transparent rounded-full mb-2"></div>
          <p className="text-xs text-gray-400 font-bold">Aguardando simulador...</p>
        </div>
      }>
        <SimulatedCardForm />
      </Suspense>
    </main>
  );
}
