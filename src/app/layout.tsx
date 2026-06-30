import type { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chá Revelação - Miguel ou Rafaella?",
  description: "Venha participar do nosso Chá Revelação e deixe o seu palpite!",
  robots: "noindex, nofollow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth h-full antialiased">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className="min-h-full flex flex-col bg-baby-beige text-gray-700">
        <CartProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </CartProvider>
      </body>
    </html>
  );
}
