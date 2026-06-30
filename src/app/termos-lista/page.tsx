"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Gift } from "lucide-react";

export default function GiftTermsPage() {
  const router = useRouter();

  return (
    <main className="bg-baby-gradient min-h-screen py-10 px-4">
      <div className="container mx-auto max-w-2xl bg-white rounded-3xl border border-baby-beige p-6 md:p-8 shadow-lg">
        
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-all hover:scale-105 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Início</span>
        </button>

        <div className="flex items-center gap-2 mb-6 text-baby-pink">
          <Gift className="h-6 w-6" />
          <h1 className="text-xl md:text-2xl font-black font-serif text-gray-800">Termos de Uso da Lista de Presentes</h1>
        </div>

        <div className="text-sm text-gray-600 space-y-4 leading-relaxed font-medium">
          <p>
            Estes Termos de Uso regulam o funcionamento do sistema de presentes do <strong>Chá Revelação</strong>. Ao interagir ou presentear no site, você declara estar ciente das seguintes regras:
          </p>

          <h3 className="font-extrabold text-gray-700 pt-2">1. Natureza das Contribuições Online (Pix / Cartão)</h3>
          <p>
            Ao presentear através de Pix ou Cartão de crédito diretamente pelo site, o convidado declara estar ciente de que está realizando o repasse financeiro do valor do presente correspondente aos pais do bebê. 
          </p>
          <p>
            O site funciona exclusivamente como uma ferramenta facilitadora: <strong>não realizamos a compra, estoque físico ou entrega de produtos reais por e-commerce próprio.</strong> Os pais receberão o valor arrecadado líquido e farão a compra dos presentes físicos na marca/modelo de sua preferência.
          </p>

          <h3 className="font-extrabold text-gray-700 pt-2">2. Entrega Pessoal</h3>
          <p>
            Ao selecionar a opção "Levar Pessoalmente", o presente correspondente é reservado temporariamente no seu nome no site. O convidado assume a responsabilidade de comprar o produto físico de forma autônoma e levá-lo no dia do evento (18 de Julho de 2026, no Espaço Kolina).
          </p>

          <h3 className="font-extrabold text-gray-700 pt-2">3. Compras por Links Externos</h3>
          <p>
            Os links fornecidos levam para lojas virtuais externas (como Amazon, Mercado Livre, etc.). A transação comercial, faturamento e rastreamento de entrega é de responsabilidade exclusiva da loja parceira. Os pais disponibilizam o endereço de entrega para facilitação de preenchimento no checkout dessas lojas.
          </p>

          <h3 className="font-extrabold text-gray-700 pt-2">4. Tarifas e Taxas</h3>
          <p>
            As transações de Pix e Cartão de crédito estão sujeitas às taxas operacionais cobradas pelos gateways de pagamentos integrados. Conforme configurado pelos organizadores no painel de controle, essas taxas podem ser absorvidas pelos pais ou adicionadas de forma transparente na finalização do pedido. Não há taxas ocultas adicionais.
          </p>

          <div className="border-t border-baby-beige pt-4 mt-8 text-center text-xs text-gray-400 font-bold">
            Última atualização: 29 de junho de 2026.
          </div>
        </div>

      </div>
    </main>
  );
}
