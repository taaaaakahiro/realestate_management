import { cn } from "@/shared/lib/cn";

type Tone = "neutral" | "income" | "expense" | "success";

const toneClass: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  income: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  expense: "bg-rose-50 text-rose-700 ring-rose-200",
  success: "bg-indigo-50 text-indigo-700 ring-indigo-200",
};

const dotClass: Record<Tone, string> = {
  neutral: "bg-slate-400",
  income: "bg-emerald-500",
  expense: "bg-rose-500",
  success: "bg-indigo-500",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
}: {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClass[tone],
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotClass[tone])} />}
      {children}
    </span>
  );
}
