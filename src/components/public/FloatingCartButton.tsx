"use client";

import React from "react";
import { useCart } from "@/context/CartContext";
import { ShoppingCart } from "lucide-react";

interface FloatingCartButtonProps {
  onClick: () => void;
}

export default function FloatingCartButton({ onClick }: FloatingCartButtonProps) {
  const { cartCount, totalValue } = useCart();

  if (cartCount === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50 animate-bounce">
      <button
        onClick={onClick}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-baby-pink to-baby-blue text-white shadow-2xl hover:scale-110 active:scale-95 transition-all relative border-2 border-white"
        title={`Ver carrinho - ${cartCount} item(ns)`}
      >
        <ShoppingCart className="h-6 w-6" />

        {/* Badge Vermelho/Rosa com o contador */}
        <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-baby-gold text-white text-[11px] font-black shadow-md border-2 border-white">
          {cartCount}
        </span>

        {/* Efeito de Ondas de Pulso no Fundo */}
        <span className="absolute inset-0 rounded-full bg-baby-pink/30 -z-10 animate-ping opacity-75" />
      </button>
    </div>
  );
}
