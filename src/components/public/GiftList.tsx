"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { Search, SlidersHorizontal, ArrowUpDown, X, ExternalLink, HelpCircle, Check, Gift } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface GiftItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  value: number;
  maxQuantity: number;
  chosenQuantity: number;
  remainingQuantity: number;
  externalLink: string | null;
  isFeatured: boolean;
  status: string;
  category: Category;
}

interface GiftListProps {
  onOpenCart?: () => void;
  onDirectCheckout?: () => void;
}

export default function GiftList({ onOpenCart, onDirectCheckout }: GiftListProps) {
  const { addToCart, cartCount } = useCart();
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Filtros
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [orderBy, setOrderBy] = useState("relevant");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyWithLink, setOnlyWithLink] = useState(false);
  
  // Painel de Filtros Mobile
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Estados temporários do modal de filtros
  const [tempCategory, setTempCategory] = useState("todos");
  const [tempPriceRange, setTempPriceRange] = useState("todos");
  const [tempOrderBy, setTempOrderBy] = useState("relevant");

  useEffect(() => {
    if (filtersOpen) {
      setTempCategory(selectedCategory);
      setTempOrderBy(orderBy);
      
      // Determina tempPriceRange
      if (minPrice === "" && maxPrice === "50") {
        setTempPriceRange("0-50");
      } else if (minPrice === "50" && maxPrice === "100") {
        setTempPriceRange("50-100");
      } else if (minPrice === "100" && maxPrice === "200") {
        setTempPriceRange("100-200");
      } else if (minPrice === "200" && maxPrice === "") {
        setTempPriceRange("200-plus");
      } else {
        setTempPriceRange("todos");
      }
    }
  }, [filtersOpen, selectedCategory, orderBy, minPrice, maxPrice]);

  const handleApplyFilters = () => {
    setSelectedCategory(tempCategory);
    setOrderBy(tempOrderBy);
    
    if (tempPriceRange === "0-50") {
      setMinPrice("");
      setMaxPrice("50");
    } else if (tempPriceRange === "50-100") {
      setMinPrice("50");
      setMaxPrice("100");
    } else if (tempPriceRange === "100-200") {
      setMinPrice("100");
      setMaxPrice("200");
    } else if (tempPriceRange === "200-plus") {
      setMinPrice("200");
      setMaxPrice("");
    } else {
      setMinPrice("");
      setMaxPrice("");
    }

    setFiltersOpen(false);
    toast.success("Filtros aplicados!");
  };

  const handleClearTempFilters = () => {
    setTempCategory("todos");
    setTempPriceRange("todos");
    setTempOrderBy("relevant");
    
    setSelectedCategory("todos");
    setOrderBy("relevant");
    setMinPrice("");
    setMaxPrice("");
    toast.info("Filtros limpos.");
  };

  // Carrega as categorias de forma estática
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (res.ok) {
          setCategories(data.data || []);
        }
      } catch (err) {
        console.error("Erro ao carregar categorias:", err);
      }
    }
    loadCategories();
  }, []);

  // Monitora alterações nos filtros e executa a requisição de busca
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchGifts();
    }, 300); // Debounce de 300ms na busca para evitar requisições a cada tecla digitada

    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedCategory, orderBy, minPrice, maxPrice, onlyAvailable, onlyWithLink]);

  const fetchGifts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        category: selectedCategory,
        orderBy,
        minPrice,
        maxPrice,
        search,
        onlyAvailable: String(onlyAvailable),
        onlyWithLink: String(onlyWithLink),
      });

      const res = await fetch(`/api/gifts?${queryParams.toString()}`);
      const data = await res.json();
      
      if (res.ok) {
        setGifts(data.data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar presentes:", err);
      toast.error("Erro ao carregar lista de presentes.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedCategory("todos");
    setOrderBy("relevant");
    setMinPrice("");
    setMaxPrice("");
    setOnlyAvailable(false);
    setOnlyWithLink(false);
    toast.info("Filtros limpos.");
  };

  const activeFiltersCount = [
    search !== "",
    selectedCategory !== "todos",
    minPrice !== "",
    maxPrice !== "",
    onlyAvailable,
    onlyWithLink,
  ].filter(Boolean).length;

  return (
    <section id="presentes" className="py-20 bg-baby-gradient w-full border-t border-baby-beige-dark/20 pb-28 md:pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Cabeçalho de Apresentação */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="flex items-center justify-center gap-2 mb-3 text-baby-pink">
            <Gift className="h-5 w-5 fill-baby-pink/20" />
            <span className="text-xs font-bold uppercase tracking-wider">Lista de Presentes</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-tight font-serif mb-3">
            Escolha um Presente
          </h2>
          
          <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed max-w-2xl mx-auto">
            Você poderá levar o presente pessoalmente no dia do evento, presentear o valor via Pix/Cartão, ou comprar diretamente pela internet no link indicado.
          </p>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          
          {/* Busca por Texto */}
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="Buscar presentes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-baby-beige-dark rounded-full px-5 py-3 pl-12 text-sm focus:outline-none focus:border-baby-gold font-semibold shadow-sm transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

          {/* Botões de Ação de Filtros */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <button
              onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-2 bg-[#f6b26b] hover:bg-[#e09d56] text-white rounded-full px-5 py-3 text-sm font-bold shadow-sm transition-all active:scale-95 hover:scale-105"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filtrar Itens {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>

            {onOpenCart && (
              <button
                onClick={onOpenCart}
                className="flex items-center gap-2 bg-[#f6b26b] hover:bg-[#e09d56] text-white rounded-full px-5 py-3 text-sm font-bold shadow-sm transition-all active:scale-95 hover:scale-105"
              >
                <span>Carrinho({cartCount > 0 ? `${cartCount} itens` : "Vazio"})</span>
              </button>
            )}
          </div>

        </div>

        {/* Pílulas (Badges) Rápidas de Categorias - Scroll Horizontal no Mobile */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-4 no-scrollbar mb-8 -mx-4 px-4 scroll-smooth">
          <button
            onClick={() => setSelectedCategory("todos")}
            className={`flex-none rounded-full px-5 py-2 text-xs font-bold transition-all shadow-sm ${
              selectedCategory === "todos"
                ? "bg-baby-gold text-white"
                : "bg-white text-gray-500 border border-baby-beige hover:border-baby-gold/30"
            }`}
          >
            Todos
          </button>
          
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`flex-none rounded-full px-5 py-2 text-xs font-bold transition-all shadow-sm ${
                selectedCategory === cat.slug
                  ? "bg-baby-gold text-white"
                  : "bg-white text-gray-500 border border-baby-beige hover:border-baby-gold/30"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Exibição dos Presentes (Grid) */}
        {loading ? (
          <div className="text-center py-20 w-full">
            <div className="animate-spin inline-block h-8 w-8 border-4 border-baby-gold border-t-transparent rounded-full mb-2"></div>
            <p className="text-sm text-gray-400 font-bold">Carregando lista de presentes...</p>
          </div>
        ) : gifts.length === 0 ? (
          /* Estado Vazio */
          <div className="glass-card rounded-3xl p-12 text-center max-w-md mx-auto border border-white/60 shadow-sm mt-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-baby-gold-light text-baby-gold mb-3">
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <h4 className="text-gray-700 font-bold text-lg mb-1">Nenhum presente localizado</h4>
            <p className="text-xs text-gray-400 font-medium leading-relaxed mb-6">
              Não encontramos presentes correspondentes aos filtros selecionados. Tente limpar os filtros.
            </p>
            <button
              onClick={handleClearFilters}
              className="bg-baby-gold hover:bg-baby-gold-hover text-white text-xs font-extrabold px-6 py-2.5 rounded-full shadow-sm active:scale-95 transition-all"
            >
              Limpar Todos os Filtros
            </button>
          </div>
        ) : (
          /* Grid de Cards */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 items-stretch">
            {gifts.map((gift) => {
              const isEsgotado = gift.remainingQuantity <= 0;

              return (
                <div 
                  key={gift.id} 
                  className={`flex flex-col rounded-3xl bg-white border border-baby-beige shadow-sm hover:shadow-md hover:scale-[1.01] transition-all overflow-hidden relative ${
                    isEsgotado ? "opacity-75" : ""
                  }`}
                >
                  {/* Selos Promocionais no Topo */}
                  <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                    {gift.isFeatured && (
                      <span className="bg-baby-gold text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                        ⭐ Recomendado
                      </span>
                    )}
                    {isEsgotado ? (
                      <span className="bg-red-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                        🚫 Esgotado
                      </span>
                    ) : (
                      gift.remainingQuantity <= 2 && (
                        <span className="bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm animate-pulse-soft">
                          ⏳ Últimas unidades
                        </span>
                      )
                    )}
                  </div>

                  {/* Foto do Presente */}
                  <div className="relative aspect-square w-full bg-gray-50 border-b border-baby-beige overflow-hidden">
                    {gift.imageUrl ? (
                      <img
                        src={gift.imageUrl}
                        alt={gift.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-baby-beige-dark/10 text-baby-gold/30">
                        <Gift className="h-14 w-14" />
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                        {gift.category.name}
                      </p>
                      
                      <h4 className="text-sm font-extrabold text-gray-700 tracking-tight leading-tight line-clamp-2 min-h-[2.5rem]" title={gift.name}>
                        {gift.name}
                      </h4>

                      {gift.description && (
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1.5 leading-relaxed font-medium">
                          {gift.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-baby-beige">
                      {/* Disponibilidade e Links */}
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 mb-2">
                        <span>Restam: {gift.remainingQuantity}</span>
                        {gift.externalLink && (
                          <a 
                            href={gift.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-baby-blue hover:text-baby-blue-hover"
                            title="Comprar em loja externa"
                          >
                            <span>Ver em Loja</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      {/* Preço e Botão */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] text-gray-400 font-bold uppercase truncate">Valor</span>
                          <span className="text-sm xl:text-base font-black text-gray-700 truncate">
                            {gift.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>

                        <button
                          onClick={async () => {
                            const success = await addToCart(gift.id);
                            if (success && onDirectCheckout) {
                              onDirectCheckout();
                            }
                          }}
                          disabled={isEsgotado}
                          className={`flex-shrink-0 px-3 py-2 rounded-full text-[11px] font-black shadow-sm transition-all active:scale-95 ${
                            isEsgotado
                              ? "bg-gray-150 text-gray-400 cursor-not-allowed shadow-none"
                              : "bg-gradient-to-r from-baby-blue to-baby-pink text-white hover:shadow-md hover:scale-105"
                          }`}
                        >
                          {isEsgotado ? "Indisponível" : "Presentear"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Centered Modal de Filtros */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={() => setFiltersOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Container */}
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full relative z-10 shadow-2xl border border-baby-beige animate-scale-up">
            
            {/* Botão Fechar no Topo Direito */}
            <button 
              onClick={() => setFiltersOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-150 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Título do Modal */}
            <h3 className="text-xl font-extrabold text-gray-800 tracking-tight mb-6 text-left border-b border-baby-beige pb-3 font-serif">
              Filtrar Itens
            </h3>

            {/* Dropdowns em Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
              
              {/* Dropdown Categoria */}
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                  Categoria:
                </label>
                <select
                  value={tempCategory}
                  onChange={(e) => setTempCategory(e.target.value)}
                  className="w-full bg-[#faf6f0] border-2 border-[#f6b26b] text-gray-800 px-4 py-3 rounded-full font-extrabold outline-none cursor-pointer shadow-sm transition-all focus:ring-4 focus:ring-[#f6b26b]/20 text-center"
                >
                  <option value="todos" className="bg-[#faf6f0] text-gray-800 font-semibold">Selecione</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug} className="bg-[#faf6f0] text-gray-800 font-semibold">
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown Preço */}
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                  Preço:
                </label>
                <select
                  value={tempPriceRange}
                  onChange={(e) => setTempPriceRange(e.target.value)}
                  className="w-full bg-[#faf6f0] border-2 border-[#f6b26b] text-gray-800 px-4 py-3 rounded-full font-extrabold outline-none cursor-pointer shadow-sm transition-all focus:ring-4 focus:ring-[#f6b26b]/20 text-center"
                >
                  <option value="todos" className="bg-[#faf6f0] text-gray-800 font-semibold">Selecione</option>
                  <option value="0-50" className="bg-[#faf6f0] text-gray-800 font-semibold">Até R$ 50,00</option>
                  <option value="50-100" className="bg-[#faf6f0] text-gray-800 font-semibold">R$ 50,00 a R$ 100,00</option>
                  <option value="100-200" className="bg-[#faf6f0] text-gray-800 font-semibold">R$ 100,00 a R$ 200,00</option>
                  <option value="200-plus" className="bg-[#faf6f0] text-gray-800 font-semibold">Acima de R$ 200,00</option>
                </select>
              </div>

              {/* Dropdown Ordenação */}
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                  Ordenar por:
                </label>
                <select
                  value={tempOrderBy}
                  onChange={(e) => setTempOrderBy(e.target.value)}
                  className="w-full bg-[#faf6f0] border-2 border-[#f6b26b] text-gray-800 px-4 py-3 rounded-full font-extrabold outline-none cursor-pointer shadow-sm transition-all focus:ring-4 focus:ring-[#f6b26b]/20 text-center"
                >
                  <option value="relevant" className="bg-[#faf6f0] text-gray-800 font-semibold">Selecione</option>
                  <option value="price-desc" className="bg-[#faf6f0] text-gray-800 font-semibold">Preço Maior para Menor</option>
                  <option value="price-asc" className="bg-[#faf6f0] text-gray-800 font-semibold">Preço Menor para Maior</option>
                  <option value="name-asc" className="bg-[#faf6f0] text-gray-800 font-semibold">Nome A a Z</option>
                  <option value="name-desc" className="bg-[#faf6f0] text-gray-800 font-semibold">Nome Z a A</option>
                </select>
              </div>

            </div>

            {/* Ações Inferiores (Alinhadas à direita) */}
            <div className="border-t border-baby-beige pt-4 flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="bg-[#f6b26b] hover:bg-[#e09d56] text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                Filtrar
              </button>
              
              <button
                type="button"
                onClick={handleClearTempFilters}
                className="bg-[#f1c232] hover:bg-[#dfb22b] text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                Limpar
              </button>

              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
