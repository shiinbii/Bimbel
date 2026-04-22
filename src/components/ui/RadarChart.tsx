"use client";

import { motion } from "framer-motion";

interface Stat {
  key: string;
  label: string;
  value: number;
}

interface Props {
  stats: Stat[];
  size?: number;
  color?: string;
  showLabels?: boolean;
  showGrid?: boolean;
  maxValue?: number;
}

export default function RadarChart({
  stats,
  size = 260,
  color = "#6366f1",
  showLabels = true,
  showGrid = true,
  maxValue = 10,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - (showLabels ? 32 : 4);
  const n = stats.length;
  const step = (Math.PI * 2) / n;

  const angleAt = (i: number) => -Math.PI / 2 + i * step;

  const polygon = (ratio: number) =>
    stats
      .map((_, i) => {
        const a = angleAt(i);
        const r = radius * ratio;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      })
      .join(" ");

  const valuePoints = stats.map((s, i) => {
    const a = angleAt(i);
    const r = radius * Math.min(1, Math.max(0, s.value / maxValue));
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });

  const valuePath =
    valuePoints.map((p) => `${p.x},${p.y}`).join(" ");

  const grids = [0.25, 0.5, 0.75, 1];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="block"
    >
      <defs>
        <radialGradient id="rg-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="80%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </radialGradient>
      </defs>

      {showGrid && (
        <g>
          {grids.map((r) => (
            <polygon
              key={r}
              points={polygon(r)}
              fill={r === 1 ? "rgba(99,102,241,0.03)" : "none"}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={r === 1 ? 1.2 : 0.8}
            />
          ))}
          {stats.map((_, i) => {
            const a = angleAt(i);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={cx + radius * Math.cos(a)}
                y2={cy + radius * Math.sin(a)}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={0.8}
              />
            );
          })}
        </g>
      )}

      <motion.polygon
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        points={valuePath}
        fill="url(#rg-fill)"
        stroke={color}
        strokeWidth={1.8}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />

      {valuePoints.map((p, i) => (
        <motion.circle
          key={i}
          initial={{ opacity: 0, r: 0 }}
          animate={{ opacity: 1, r: 4 }}
          transition={{ delay: 0.3 + i * 0.05 }}
          cx={p.x}
          cy={p.y}
          fill={color}
          stroke="white"
          strokeWidth={1.5}
        />
      ))}

      {showLabels &&
        stats.map((s, i) => {
          const a = angleAt(i);
          const lr = radius + 18;
          const x = cx + lr * Math.cos(a);
          const y = cy + lr * Math.sin(a);
          const align =
            x < cx - 8 ? "end" : x > cx + 8 ? "start" : "middle";
          return (
            <g key={s.key}>
              <text
                x={x}
                y={y}
                textAnchor={align}
                dominantBaseline="middle"
                fontSize="10"
                fontWeight="600"
                fill="#e2e8f0"
                style={{
                  fontFamily: "var(--font-sans)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </text>
              <text
                x={x}
                y={y + 11}
                textAnchor={align}
                dominantBaseline="middle"
                fontSize="10"
                fill={color}
                fontWeight="700"
              >
                {(Math.round(s.value * 10) / 10).toFixed(1)}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
