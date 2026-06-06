import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/shared/components/Nav";

export const metadata: Metadata = {
  title: "不動産回収率マネージャー",
  description: "購入原価・支出・家賃収入から投資回収率を見える化する不動産管理モック",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          不動産回収率マネージャー — モックデータで動作するデモ
        </footer>
      </body>
    </html>
  );
}
