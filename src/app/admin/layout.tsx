import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administração - Chá Revelação",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
