import { cn } from "@/shared/lib/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-slate-500">{children}</p>;
}

export function CardValue({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // 既定色は付けず本文色（≒slate-900）を継承。色を渡したとき（損益の赤など）に確実に反映される
  const hasColor = className?.includes("text-");
  return (
    <p
      className={cn(
        "mt-1 text-2xl font-bold tabular-nums",
        !hasColor && "text-slate-900",
        className,
      )}
    >
      {children}
    </p>
  );
}
