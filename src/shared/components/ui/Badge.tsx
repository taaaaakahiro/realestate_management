import { cn } from "@/shared/lib/cn";

type Tone = "neutral" | "income" | "expense" | "success";

const toneClass: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  income: "bg-emerald-50 text-emerald-700",
  expense: "bg-rose-50 text-rose-700",
  success: "bg-indigo-50 text-indigo-700",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClass[tone],
      )}
    >
      {children}
    </span>
  );
}
