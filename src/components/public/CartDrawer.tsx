"use client";

import React from "react";
import { useCart } from "@/context/CartContext";
import { X, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cartItems, totalValue, loading, updateQuantity, removeFromCart, cartCount } = useCart();
  const router = useRouter();

  if (!isOpen) return null;

  const handleCheckoutRedirect = () => {
    if (cartItems.length === 0) {
      toast.error("Seu carrinho está vazio!");
      return;
    }
    onClose();
    router.push("/presentes/finalizar");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in">
      {/* Clique fora para fechar */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      {/* Painel lateral do carrinho */}
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-baby-beige animate-slide-in relative">
        
        {/* Topo do Carrinho */}
        <div className="flex justify-between items-center border-b border-baby-beige px-6 py-5">
          <div className="flex items-center gap-2 text-gray-700">
            <ShoppingBag className="h-5 w-5 text-baby-pink" />
            <h3 className="text-lg font-black font-serif">Seu Carrinho ({cartCount})</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-50 transition-all hover:scale-105 active:scale-95"
            title="Fechar carrinho"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lista de Itens (Corpo rolável) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {loading && cartItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="animate-spin inline-block h-6 w-6 border-2 border-baby-gold border-t-transparent rounded-full mb-2"></div>
              <p className="text-xs text-gray-400 font-bold">Atualizando carrinho...</p>
            </div>
          ) : cartItems.length === 0 ? (
            /* Carrinho Vazio */
            <div className="text-center py-20 flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-baby-beige-dark/10 flex items-center justify-center text-baby-gold/30 mb-4 animate-pulse-soft">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h4 className="text-gray-700 font-extrabold text-sm mb-1">Carrinho vazio</h4>
              <p className="text-xs text-gray-400 font-semibold max-w-xs leading-relaxed">
                Você ainda não escolheu nenhum presente da lista. Navegue e adicione presentes para retribuir aos pais!
              </p>
            </div>
          ) : (
            /* Listagem de itens */
            cartItems.map((item) => {
              const itemPrice = item.price;
              const itemSubtotal = item.subtotal;

              return (
                <div 
                  key={item.id}
                  className="flex gap-3 bg-gray-50 border border-baby-beige rounded-2xl p-3 shadow-inner hover:bg-white transition-all duration-300 relative group"
                >
                  {/* Foto miniatura */}
                  <div className="h-16 w-16 rounded-xl bg-white border border-baby-beige overflow-hidden flex-none">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-baby-gold/30">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  {/* Detalhes do item */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-gray-700 leading-tight line-clamp-1 pr-6" title={item.name}>
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{item.category}</p>
                    </div>

                    <div className="flex justify-between items-center mt-2.5">
                      {/* Seletores de quantidade */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.giftId, item.quantity - 1)}
                          className="bg-white border border-baby-beige h-7 w-7 flex items-center justify-center rounded-md font-bold text-gray-500 active:scale-95 transition-all shadow-sm"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-extrabold text-xs text-gray-700">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.giftId, item.quantity + 1)}
                          className="bg-white border border-baby-beige h-7 w-7 flex items-center justify-center rounded-md font-bold text-gray-500 active:scale-95 transition-all shadow-sm"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <span className="text-xs font-black text-gray-700">
                          {itemSubtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lixeira de remoção rápida */}
                  <button
                    onClick={() => removeFromCart(item.giftId)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50/50 hover:scale-105 transition-all"
                    title="Remover do carrinho"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Resumo Final (Rodapé) */}
        {cartItems.length > 0 && (
          <div className="border-t border-baby-beige p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center text-sm font-black text-gray-600">
              <span>Subtotal dos Presentes</span>
              <span className="text-lg font-black text-gray-700">
                {totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>

            <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
              * A disponibilidade dos itens é revalidada no servidor ao finalizar a compra para evitar duplicidade de escolhas.
            </p>

            <button
              onClick={handleCheckoutRedirect}
              disabled={loading}
              className="w-full bg-gradient-to-r from-baby-blue to-baby-pink text-white font-extrabold py-4 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Finalizar Presentes</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
