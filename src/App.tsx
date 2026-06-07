import { Link, usePathname } from "@/router";
import { Nav } from "@/shared/components/Nav";
import { Dashboard } from "@/pages/Dashboard";
import { Properties } from "@/pages/Properties";
import { NewProperty } from "@/pages/NewProperty";
import { NewTransaction } from "@/pages/NewTransaction";
import { EditTransaction } from "@/pages/EditTransaction";
import { PropertyDetailView } from "@/features/property/components/PropertyDetailView";
import { PropertyEditView } from "@/features/property/components/PropertyEditView";

function NotFound() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">ページが見つかりませんでした。</p>
      <Link href="/" className="text-sm text-green-700 hover:underline">
        ← ダッシュボードへ
      </Link>
    </div>
  );
}

function Routed() {
  const path = usePathname();
  switch (path) {
    case "/":
      return <Dashboard />;
    case "/properties":
      return <Properties />;
    case "/properties/new":
      return <NewProperty />;
    case "/properties/detail":
      return <PropertyDetailView />;
    case "/properties/edit":
      return <PropertyEditView />;
    case "/transactions/new":
      return <NewTransaction />;
    case "/transactions/edit":
      return <EditTransaction />;
    default:
      return <NotFound />;
  }
}

export function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <Routed />
      </main>
      <footer className="mt-auto border-t border-slate-200/70 bg-white/40 py-6 text-center text-xs text-slate-400 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-1.5">
          <img
            src={`${import.meta.env.BASE_URL}icon.svg`}
            alt=""
            className="h-4 w-4 rounded"
          />
          <span>
            <span className="font-semibold brand-text">PropFolio</span> by Maa&apos;un Japan
          </span>
        </div>
        <p className="mt-1">モックデータで動作するデモ ・ © 2026 Maa&apos;un Japan</p>
      </footer>
    </div>
  );
}
