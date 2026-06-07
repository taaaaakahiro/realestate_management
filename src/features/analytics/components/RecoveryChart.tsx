"use client";

import { useState } from "react";
import type { CumulativePoint } from "@/features/analytics/service";
import { formatMan, formatMonth } from "@/shared/lib/format";

/**
 * 累計収入 vs 累計コストの推移を描く依存ライブラリ不要のSVGチャート。
 * 2線の交点が「損益分岐（回収完了）」を表す。
 */
export function RecoveryChart({ data }: { data: CumulativePoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 720;
  const H = 280;
  const pad = { top: 16, right: 16, bottom: 28, left: 56 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  if (data.length === 0) {
    return <p className="text-sm text-slate-500">データがありません。</p>;
  }

  const maxY = Math.max(...data.map((d) => Math.max(d.cumulativeIncome, d.cumulativeCost)));
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const x = (i: number) => pad.left + i * stepX;
  const y = (v: number) => pad.top + innerH - (v / maxY) * innerH;

  const line = (key: "cumulativeIncome" | "cumulativeCost") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d[key])}`).join(" ");

  const areaIncome = `${line("cumulativeIncome")} L ${x(data.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`;

  const gridLines = 4;
  const active = hover ?? data.length - 1;
  const point = data[active];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="回収率の推移チャート"
      >
        {/* 横グリッド + Y軸ラベル */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const v = (maxY / gridLines) * i;
          const gy = y(v);
          return (
            <g key={i}>
              <line
                x1={pad.left}
                x2={W - pad.right}
                y1={gy}
                y2={gy}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              <text x={pad.left - 8} y={gy + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
                {formatMan(v)}
              </text>
            </g>
          );
        })}

        {/* 収入エリア */}
        <path d={areaIncome} fill="rgba(16,185,129,0.10)" />

        {/* コスト線 */}
        <path d={line("cumulativeCost")} fill="none" stroke="#f43f5e" strokeWidth={2} />
        {/* 収入線 */}
        <path d={line("cumulativeIncome")} fill="none" stroke="#10b981" strokeWidth={2.5} />

        {/* ホバー用の縦線とマーカー */}
        <line
          x1={x(active)}
          x2={x(active)}
          y1={pad.top}
          y2={pad.top + innerH}
          stroke="#94a3b8"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <circle cx={x(active)} cy={y(point.cumulativeIncome)} r={4} fill="#10b981" />
        <circle cx={x(active)} cy={y(point.cumulativeCost)} r={4} fill="#f43f5e" />

        {/* X軸ラベル（端と中央） */}
        {[0, Math.floor(data.length / 2), data.length - 1].map((i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            className="fill-slate-400 text-[10px]"
          >
            {formatMonth(data[i].month + "-01")}
          </text>
        ))}

        {/* ホバー判定用の透明オーバーレイ */}
        {data.map((_, i) => (
          <rect
            key={i}
            x={x(i) - stepX / 2}
            y={0}
            width={stepX || innerW}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          累計収入
          <strong className="tabular-nums">{formatMan(point.cumulativeIncome)}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
          投資総額
          <strong className="tabular-nums">{formatMan(point.cumulativeCost)}</strong>
        </span>
        <span className="ml-auto text-slate-500">
          {formatMonth(point.month + "-01")} 時点 / 回収率{" "}
          <strong className="text-green-700">{point.recoveryRate.toFixed(1)}%</strong>
        </span>
      </div>
    </div>
  );
}
