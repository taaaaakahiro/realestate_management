"use client";

import { useState } from "react";
import { Link, usePathname } from "@/router";
import { cn } from "@/shared/lib/cn";

const LINKS = [
  { href: "/", label: "ダッシュボード" },
  { href: "/properties", label: "物件一覧" },
  { href: "/transactions/new", label: "収支登録" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          onClick={close}
          className="flex shrink-0 items-center gap-2 text-lg font-extrabold whitespace-nowrap tracking-tight"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl brand-gradient text-white shadow-sm">
            🏠
          </span>
          <span className="brand-text">PropFolio</span>
        </Link>

        {/* デスクトップ: 横並び */}
        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-1.5 whitespace-nowrap transition",
                isActive(pathname, l.href)
                  ? "bg-green-50 text-green-700"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/properties/new"
            className="ml-1 rounded-xl brand-gradient px-3.5 py-1.5 whitespace-nowrap text-white shadow-sm transition hover:shadow-md hover:brightness-105"
          >
            ＋ 物件登録
          </Link>
        </nav>

        {/* モバイル: ハンバーガー */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="メニュー"
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 md:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* モバイル: ドロップダウン */}
      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 py-2 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              className={cn(
                "block rounded-lg px-3 py-2.5 text-sm font-medium transition",
                isActive(pathname, l.href)
                  ? "bg-green-50 text-green-700"
                  : "text-slate-700 hover:bg-slate-100",
              )}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/properties/new"
            onClick={close}
            className="mt-1 block rounded-xl brand-gradient px-3 py-2.5 text-center text-sm font-semibold text-white shadow-sm"
          >
            ＋ 物件登録
          </Link>
        </nav>
      )}
    </header>
  );
}
