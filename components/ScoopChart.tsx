"use client"

import { useState } from "react"

type AxisItem = {
  key: string
  label: string
  value: number
  min?: number
  max?: number
  subLabel?: string
  subValue?: number
  subUnit?: string
}

function normalize(value: number, min?: number, max?: number) {
  const v = Number(value)
  if (!Number.isFinite(v)) return 52.5
  if (min == null || max == null || max === min) return 52.5
  if (v < min) {
    const span = Math.abs(min) > 1e-9 ? Math.abs(min) : 1
    return Math.max(0, Math.min(40, (1 - (min - v) / span) * 40))
  }
  if (v > max) {
    const span = Math.abs(max) > 1e-9 ? Math.abs(max) : 1
    return Math.max(65, Math.min(100, 65 + Math.min(1, (v - max) / span) * 35))
  }
  return 40 + ((v - min) / (max - min)) * 25
}
  if (v > max) {
    const span = Math.abs(max) > 1e-9 ? Math.abs(max) : 1
    return Math.max(75, Math.min(100, 75 + Math.min(1, (v - max) / span) * 25))
  }
  return 25 + ((v - min) / (max - min)) * 50
}

function polar(cx: number, cy: number, r: number, i: number, n: number) {
  const angle = (Math.PI * 2 * i) / n - Math.PI / 2
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  }
}

function ringPoints(cx: number, cy: number, r: number, n: number) {
  return Array.from({ length: n }, (_, i) => {
    const p = polar(cx, cy, r, i, n)
    return `${p.x},${p.y}`
  }).join(" ")
}

export default function ScoopChart({ axes }: { axes: AxisItem[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const n = axes.length
  if (n === 0) return null

  const size = 360
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.36

  const recipePts = axes
    .map((a, i) => {
      const score = normalize(a.value, a.min, a.max) / 100
      const p = polar(cx, cy, maxR * score, i, n)
      return `${p.x},${p.y}`
    })
    .join(" ")

   const minPts = ringPoints(cx, cy, maxR * 0.4, n)
  const maxPts = ringPoints(cx, cy, maxR * 0.65, n)
  const outerPts = ringPoints(cx, cy, maxR, n)

  const selectedAxis = axes.find((a) => a.key === selected)

  return (
    <div style={{ maxWidth: 440, margin: "28px auto 12px", textAlign: "center" }}>
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          margin: "0 auto",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 35% 30%, #ffffff 0%, #ffe8ec 35%, #f7c4cc 70%, #e8a0ab 100%)",
          boxShadow:
            "inset -12px -18px 28px rgba(180, 70, 90, 0.12), 0 14px 28px rgba(160, 60, 80, 0.18)",
          border: "1px solid rgba(220, 140, 150, 0.35)",
        }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Grille */}
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <polygon
              key={f}
              points={ringPoints(cx, cy, maxR * f, n)}
              fill="none"
              stroke="rgba(180,90,110,0.25)"
              strokeWidth={1}
            />
          ))}
          {/* Axes */}
          {axes.map((_, i) => {
            const p = polar(cx, cy, maxR, i, n)
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={p.x}
                y2={p.y}
                stroke="rgba(180,90,110,0.25)"
                strokeWidth={1}
              />
            )
          })}

          {/* Limite max */}
          <polygon
            points={maxPts}
            fill="none"
            stroke="#1b5e3a"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
          {/* Limite min */}
          <polygon
            points={minPts}
            fill="none"
            stroke="#1b5e3a"
            strokeWidth={2}
            strokeDasharray="6 4"
          />

          {/* Recette — ligne rouge */}
          <polygon
            points={recipePts}
            fill="none"
            stroke="#9b1b33"
            strokeWidth={3}
            strokeLinejoin="round"
          />
          {/* Points recette */}
          {axes.map((a, i) => {
            const score = normalize(a.value, a.min, a.max) / 100
            const p = polar(cx, cy, maxR * score, i, n)
            return (
              <circle
                key={a.key}
                cx={p.x}
                cy={p.y}
                r={5}
                fill="#9b1b33"
                stroke="#fff"
                strokeWidth={1.5}
                style={{ cursor: a.subLabel ? "pointer" : "default" }}
                onClick={() =>
                  a.subLabel && setSelected(a.key === selected ? null : a.key)
                }
              />
            )
          })}

          {/* Labels */}
          {axes.map((a, i) => {
            const p = polar(cx, cy, maxR + 22, i, n)
            return (
              <text
                key={a.key + "-label"}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#6b3a44"
                fontSize={11}
                fontWeight={600}
              >
                {a.label}
              </text>
            )
          })}
        </svg>
      </div>

      <div
        style={{
          width: 0,
          height: 0,
          margin: "4px auto 0",
          borderLeft: "28px solid transparent",
          borderRight: "28px solid transparent",
          borderTop: "36px solid #e8c39a",
          filter: "drop-shadow(0 4px 6px rgba(120,80,40,0.2))",
        }}
      />

      <p style={{ fontSize: 11, color: "#888", marginTop: 14 }}>
        Vert pointille = limites Min / Max · Rouge = recette
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
          marginTop: 12,
        }}
      >
        {axes
          .filter((a) => a.subLabel)
          .map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setSelected(a.key === selected ? null : a.key)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                border:
                  selected === a.key ? "2px solid #9b1b33" : "1px solid #e8b4bc",
                background: selected === a.key ? "#ffe4e8" : "#fff",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              {a.label}
            </button>
          ))}
      </div>

      {selectedAxis?.subLabel && (
        <div
          style={{
            marginTop: 12,
            padding: 14,
            background: "#fff5f5",
            border: "1px solid #e8b4bc",
            borderRadius: 10,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 12, color: "#666" }}>
            {selectedAxis.label} → {selectedAxis.subLabel}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#9b1b33" }}>
            {selectedAxis.subValue != null
              ? Number(selectedAxis.subValue).toFixed(
                  selectedAxis.subLabel === "Densite" ? 3 : 2
                )
              : "-"}
            {selectedAxis.subUnit ? ` ${selectedAxis.subUnit}` : ""}
          </div>
          {selectedAxis.min != null && selectedAxis.max != null && (
            <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
              Limites axe : {selectedAxis.min} – {selectedAxis.max}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
