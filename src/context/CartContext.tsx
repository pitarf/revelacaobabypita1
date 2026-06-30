"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  giftId: string;
  name: string;
  imageUrl: string;
  category: string;
  price: number;
  quantity: number;
  subtotal: number;
  available: number;
  externalLink?: string | null;
}

interface CartContextType {
  cartItems: CartItem[];
  totalValue: number;
  loading: boolean;
  sessionId: string;
  cartCount: number;
  addToCart: (giftId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (giftId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (giftId: string) => Promise<boolean>;
  refreshCart: () => Promise<void>;
  clearCartLocal: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");

  // Inicializa o sessionId persistente no localStorage do navegador
  useEffect(() => {
    let id = localStorage.getItem("baby_shower_session_id");
    if (!id) {
      id = "session_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("baby_shower_session_id", id);
    }
    setSessionId(id);
  }, []);

  // Recarrega o carrinho assim que o sessionId é definido
  useEffect(() => {
    if (sessionId) {
      refreshCart();
    }
  }, [sessionId]);

  const refreshCart = async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/cart?sessionId=${sessionId}`);
      const data = await res.json();
      
      if (res.ok) {
        setCartItems(data.items || []);
        setTotalValue(data.totalValue || 0);
        
        // Notifica o convidado se o estoque mudou e o carrinho foi auto-ajustado no backend
        if (data.adjusted) {
          toast.warning(
            "Alguns presentes no seu carrinho foram ajustados ou removidos porque o estoque foi atualizado por outro convidado."
          );
        }
      }
    } catch (err) {
      console.error("Erro ao carregar carrinho:", err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (giftId: string, quantity = 1): Promise<boolean> => {
    if (!sessionId) return false;
    try {
      setLoading(true);
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, giftId, action: "add", quantity }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao adicionar presente.");
        return false;
      }

      setCartItems(data.items || []);
      setTotalValue(data.totalValue || 0);
      toast.success("Presente adicionado ao carrinho!");
      return true;
    } catch (err) {
      console.error("Erro ao adicionar item:", err);
      toast.error("Erro de conexão. Tente novamente.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (giftId: string, quantity: number): Promise<boolean> => {
    if (!sessionId) return false;
    try {
      setLoading(true);
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, giftId, action: "update", quantity }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao alterar quantidade.");
        return false;
      }

      setCartItems(data.items || []);
      setTotalValue(data.totalValue || 0);
      return true;
    } catch (err) {
      console.error("Erro ao atualizar quantidade:", err);
      toast.error("Erro de conexão.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (giftId: string): Promise<boolean> => {
    if (!sessionId) return false;
    try {
      setLoading(true);
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, giftId, action: "remove" }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao remover item.");
        return false;
      }

      setCartItems(data.items || []);
      setTotalValue(data.totalValue || 0);
      toast.info("Presente removido do carrinho.");
      return true;
    } catch (err) {
      console.error("Erro ao remover item:", err);
      toast.error("Erro de conexão.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearCartLocal = () => {
    setCartItems([]);
    setTotalValue(0);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalValue,
        loading,
        sessionId,
        cartCount,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart,
        clearCartLocal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
}
