"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Settings, Save, Calendar, ShieldCheck, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados - Site/Tema
  const [faviconUrl, setFaviconUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0ea5e9"); // Default sky-500
  const [fontFamily, setFontFamily] = useState("font-sans");


  // Estados - Evento
  const [title, setTitle] = useState("");
  const [babyOption1, setBabyOption1] = useState("");
  const [babyOption2, setBabyOption2] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [showCountdown, setShowCountdown] = useState(true);
  const [hideResults, setHideResults] = useState(false);

  // Estados - Pagamento
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [cardInstallmentsLimit, setCardInstallmentsLimit] = useState("5");
  const [cardFeeAbsorbed, setCardFeeAbsorbed] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        const res = await fetch("/api/settings");
        const data = await res.json();
        
        if (res.ok) {
          const { site, event, payment } = data;
          
          if (site) {
            setFaviconUrl(site.faviconUrl || "");
            if (site.themeJson) {
              try {
                const parsed = JSON.parse(site.themeJson);
                setPrimaryColor(parsed.primaryColor || "#0ea5e9");
                setFontFamily(parsed.fontFamily || "font-sans");
              } catch (e) {}
            }
          }

          // Preenche Evento
          setTitle(event.title || "");
          setBabyOption1(event.babyOption1 || "");
          setBabyOption2(event.babyOption2 || "");
          
          // Formata data YYYY-MM-DD para input date
          if (event.eventDate) {
            setEventDate(new Date(event.eventDate).toISOString().split("T")[0]);
          }
          setEventTime(event.eventTime || "");
          setLocationName(event.locationName || "");
          setAddress(event.address || "");
          setGoogleMapsUrl(event.googleMapsUrl || "");
          setDeliveryAddress(event.deliveryAddress || "");
          setShowCountdown(event.showCountdown);
          setHideResults(event.hideResults);

          // Preenche Pagamento
          if (payment) {
            setMpAccessToken(payment.mpAccessToken || "");
            setPixKey(payment.pixKey || "");
            setCardInstallmentsLimit(String(payment.cardInstallmentsLimit || 5));
            setCardFeeAbsorbed(payment.cardFeeAbsorbed);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar configurações do banco.");
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !babyOption1.trim() || !babyOption2.trim() || !eventDate || !eventTime || !locationName || !address) {
      toast.error("Por favor, preencha os campos obrigatórios do evento.");
      return;
    }

    try {
      setSaving(true);
      
      const payload = {
        site: {
          siteTitle: title.trim(),
          faviconUrl: faviconUrl.trim() || null,
          themeJson: JSON.stringify({
            primaryColor,
            fontFamily,
          }),
        },
        event: {
          title: title.trim(),
          babyOption1: babyOption1.trim(),
          babyOption2: babyOption2.trim(),
          eventDate: new Date(eventDate).toISOString(),
          eventTime: eventTime.trim(),
          locationName: locationName.trim(),
          address: address.trim(),
          googleMapsUrl: googleMapsUrl.trim() || null,
          deliveryAddress: deliveryAddress.trim() || null,
          showCountdown,
          hideResults,
        },
        payment: {
          mpAccessToken: mpAccessToken.trim() || null,
          pixKey: pixKey.trim() || null,
          cardInstallmentsLimit: parseInt(cardInstallmentsLimit) || 5,
          cardFeeAbsorbed,
        },
      };

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao salvar configurações.");
        return;
      }

      toast.success("Configurações gerais atualizadas com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full mb-2"></div>
          <p className="text-xs text-gray-400 font-bold">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 md:pl-72 md:pr-8 md:py-8 space-y-6 overflow-x-hidden">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 font-sans">Configurações Gerais</h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">Ajuste os dados logísticos do Chá e chaves de pagamento</p>
          </div>
        </div>

        {/* Formulário Duas Colunas */}
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            
            {/* Coluna 1: Dados do Evento */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-2">
                <Calendar className="h-4.5 w-4.5 text-sky-500" />
                Detalhes do Evento
              </h3>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Título do Evento *</label>
                <input
                  type="text"
                  placeholder="Ex: Chá Revelação do nosso bebê"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Opção Masculina *</label>
                  <input
                    type="text"
                    value={babyOption1}
                    onChange={(e) => setBabyOption1(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-center focus:outline-none focus:border-slate-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Opção Feminina *</label>
                  <input
                    type="text"
                    value={babyOption2}
                    onChange={(e) => setBabyOption2(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-center focus:outline-none focus:border-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Data do Evento *</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Horário de Início (HH:MM) *</label>
                  <input
                    type="text"
                    placeholder="Ex: 14:00"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-center focus:outline-none focus:border-slate-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Local (Espaço / Salão) *</label>
                <input
                  type="text"
                  placeholder="Ex: Espaço Kolina"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Endereço Físico do Evento *</label>
                <input
                  type="text"
                  placeholder="Rua Nabôr do Rêgo, 384 – Ramos"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-slate-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">URL Google Maps</label>
                <input
                  type="text"
                  placeholder="https://maps.google.com/..."
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-slate-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Endereço Seguro de Entrega (Maternidade/Pais)</label>
                <input
                  type="text"
                  placeholder="Endereço exposto apenas em presentes de e-commerce..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-slate-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <input
                    type="checkbox"
                    id="countdown"
                    checked={showCountdown}
                    onChange={(e) => setShowCountdown(e.target.checked)}
                    className="accent-slate-900 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="countdown" className="text-xs font-bold text-slate-600 cursor-pointer select-none">Exibir Relógio</label>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <input
                    type="checkbox"
                    id="hideresults"
                    checked={hideResults}
                    onChange={(e) => setHideResults(e.target.checked)}
                    className="accent-slate-900 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="hideresults" className="text-xs font-bold text-slate-600 cursor-pointer select-none">Ocultar Placar público</label>
                </div>
              </div>

            </div>

            {/* Coluna 2: Configurações Financeiras */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
              
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-2">
                  <DollarSign className="h-4.5 w-4.5 text-emerald-500" />
                  Configurações Financeiras & Gateways
                </h3>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Chave Pix Manual (Para os Pais)</label>
                  <input
                    type="text"
                    placeholder="Chave Pix (CPF, Celular ou Aleatória)"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Mercado Pago Access Token (Produção / Homologação)</label>
                  <input
                    type="password"
                    placeholder="TEST-..."
                    value={mpAccessToken}
                    onChange={(e) => setMpAccessToken(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:outline-none focus:border-slate-400 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Parcelas no Cartão</label>
                    <select
                      value={cardInstallmentsLimit}
                      onChange={(e) => setCardInstallmentsLimit(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-400 cursor-pointer"
                    >
                      <option value="1">Apenas à vista (1x)</option>
                      <option value="2">Até 2x sem juros</option>
                      <option value="3">Até 3x sem juros</option>
                      <option value="4">Até 4x sem juros</option>
                      <option value="5">Até 5x sem juros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Taxas do Cartão</label>
                    <select
                      value={String(cardFeeAbsorbed)}
                      onChange={(e) => setCardFeeAbsorbed(e.target.value === "true")}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-400 cursor-pointer"
                    >
                      <option value="false">Adicionar taxa ao convidado</option>
                      <option value="true">Absorver taxas (descontar do saldo)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start bg-blue-50 border border-blue-500/10 rounded-xl p-3 text-[10px] text-blue-800 font-semibold mt-4">
                  <ShieldCheck className="h-4 w-4 text-blue-500 flex-none mt-0.5" />
                  <p className="leading-normal">
                    Nota: Se as chaves do Mercado Pago estiverem ausentes, o sistema operará automaticamente em modo de simulação, permitindo aprovação via Pix cópia e cola fictício e checkout simulado de cartão para testes sem quebrar a experiência do usuário.
                  </p>
                </div>
              </div>

              {/* Botão de Envio */}
              <div className="pt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-slate-900 hover:bg-black text-white font-extrabold py-4 rounded-full text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {saving ? (
                    <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  ) : (
                    <>
                      <Save className="h-4.5 w-4.5" />
                      <span>Salvar Configurações</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

          {/* Seção 3: Personalização Visual (Branding & Theme) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="m2 11 3-3a1 1 0 0 1 1.414 0l6.586 6.586a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414 0L2 12.414a1 1 0 0 1 0-1.414Z"/><path d="M11 20h11"/><path d="M19 7a4 4 0 0 0-4-4l-4 4"/></svg>
              Personalização Visual (Tema)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Cor Principal</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-xl border border-slate-200 p-0"
                  />
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">{primaryColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Família da Fonte</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-slate-400 cursor-pointer"
                >
                  <option value="font-sans">Sans (Moderna)</option>
                  <option value="font-serif">Serif (Clássica)</option>
                  <option value="font-mono">Mono (Técnica)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Favicon URL (Ícone da aba)</label>
                <input
                  type="text"
                  placeholder="https://exemplo.com/favicon.ico"
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-slate-400 transition-all"
                />
              </div>
            </div>
          </div>

        </form>

      </main>
    </div>
  );
}
