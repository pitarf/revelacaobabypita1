"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
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

        <div className="flex items-center gap-2 mb-6 text-baby-gold">
          <Shield className="h-6 w-6" />
          <h1 className="text-xl md:text-2xl font-black font-serif text-gray-800">Política de Privacidade (LGPD)</h1>
        </div>

        <div className="text-sm text-gray-600 space-y-4 leading-relaxed font-medium">
          <p>
            Esta Política de Privacidade estabelece o compromisso com a proteção e tratamento adequado dos dados pessoais dos convidados e visitantes deste site do <strong>Chá Revelação</strong>, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD).
          </p>

          <h3 className="font-extrabold text-gray-700 pt-2">1. Dados Pessoais Coletados</h3>
          <p>
            Coletamos apenas os dados estritamente necessários para a organização do evento e controle de presentes:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Confirmação de Presença (RSVP):</strong> Nome completo, e-mail, telefone/WhatsApp, número de acompanhantes e restrições alimentares.</li>
            <li><strong>Lista de Presentes:</strong> Nome completo, e-mail, celular e mensagem pessoal.</li>
            <li><strong>Votação Placar:</strong> IP de rede, celular ou e-mail (usados estritamente como hashes para prevenção de spams/votos duplicados).</li>
          </ul>

          <h3 className="font-extrabold text-gray-700 pt-2">2. Finalidade do Tratamento</h3>
          <p>
            Os dados coletados são tratados exclusivamente para:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Dimensionar a quantidade de comida, bebida e acomodações (RSVP);</li>
            <li>Registrar as promessas de entrega física de presentes e repasses financeiros;</li>
            <li>Permitir que os convidados consultem, editem ou cancelem sua confirmação pelo código de acesso;</li>
            <li>Evitar fraudes ou votos automatizados duplicados no placar.</li>
          </ul>

          <h3 className="font-extrabold text-gray-700 pt-2">3. Retenção e Segurança dos Dados</h3>
          <p>
            Os dados são armazenados em banco de dados relacional seguro sob criptografia (SSL). Eles não são compartilhados com empresas parceiras de publicidade ou terceiros sob nenhuma hipótese. Apenas os pais (administradores do painel) e os desenvolvedores técnicos têm acesso a essas planilhas.
          </p>

          <h3 className="font-extrabold text-gray-700 pt-2">4. Seus Direitos</h3>
          <p>
            O titular dos dados tem o direito de solicitar a confirmação da existência de tratamento, o acesso aos seus dados, a retificação de dados incorretos, a eliminação de seus dados pessoais coletados ou a revogação do consentimento fornecido. Para solicitar a exclusão de seus contatos de nossas planilhas, entre em contato diretamente com os pais responsáveis pelo evento.
          </p>

          <div className="border-t border-baby-beige pt-4 mt-8 text-center text-xs text-gray-400 font-bold">
            Última atualização: 29 de junho de 2026.
          </div>
        </div>

      </div>
    </main>
  );
}
