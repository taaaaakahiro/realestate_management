import { cn } from "@/shared/lib/cn";

/**
 * 回収率などの進捗を可視化するバー。
 * 100% を超えた分は色を変えて「回収完了（黒字化）」を表現する。
 */
export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.min(percent, 100);
  const over = percent > 100;

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          over ? "bg-emerald-500" : "bg-indigo-500",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
