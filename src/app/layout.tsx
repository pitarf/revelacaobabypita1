import { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "sonner";
import { prisma } from "@/lib/prisma";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  let siteSetting = null;
  try {
    siteSetting = await prisma.siteSetting.findFirst();
  } catch (error) {
    console.error("Erro ao buscar SiteSetting para metadata:", error);
  }

  const title = siteSetting?.siteTitle || "Chá Revelação";
  const description = siteSetting?.siteDescription || "Venha participar do nosso Chá Revelação e deixe o seu palpite!";
  const keywords = siteSetting?.siteKeywords || "chá revelação, bebê";

  return {
    title,
    description,
    keywords,
    // Em áreas logadas (admin), nós iremos sobrescrever isso nos layouts locais, mas aqui é global
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let siteSetting = null;
  try {
    siteSetting = await prisma.siteSetting.findFirst();
  } catch (error) {}

  const faviconUrl = siteSetting?.faviconUrl || "/favicon.png";
  
  let fontClass = "font-sans";
  let primaryColor = "#0ea5e9"; // default tailwind sky-500

  if (siteSetting?.themeJson) {
    try {
      const parsed = JSON.parse(siteSetting.themeJson);
      if (parsed.fontFamily) fontClass = parsed.fontFamily;
      if (parsed.primaryColor) primaryColor = parsed.primaryColor;
    } catch (e) {}
  }

  return (
    <html lang="pt-BR" className={`scroll-smooth h-full antialiased ${fontClass}`}>
      <head>
        <link rel="icon" href={faviconUrl} />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary-color: ${primaryColor};
          }
        `}} />
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
