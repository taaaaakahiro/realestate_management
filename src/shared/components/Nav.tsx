import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span>🏠</span>
          <span>PropFolio</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100"
          >
            ダッシュボード
          </Link>
          <Link
            href="/properties"
            className="rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100"
          >
            物件一覧
          </Link>
          <Link
            href="/transactions/new"
            className="rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100"
          >
            収支登録
          </Link>
          <Link
            href="/properties/new"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-white transition hover:bg-indigo-700"
          >
            ＋ 物件登録
          </Link>
        </nav>
      </div>
    </header>
  );
}
