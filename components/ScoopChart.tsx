"use client"

import { useState } from "react"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts"

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
  if (min == null || max == null || max === min) return 50
  const n = ((value - min) / (max - min)) * 100
  return Math.max(0, Math.min(100, n))
}

export default function ScoopChart({ axes }: { axes: AxisItem[] }) {
  const [selected, setSelected] = useState<string | null>(null)

  const data = axes.map((a) => ({
    axis: a.label,
    key: a.key,
    score: normalize(a.value, a.min, a.max),
    fullMark: 100,
  }))

  const selectedAxis = axes.find((a) => a.key === selected)

  return (
    <div style={{ maxWidth: 440, margin: "28px auto 12px", textAlign: "center" }}>
      {/* Boule */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 380,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 30%, #ffffff 0%, #ffe8ec 35%, #f7c4cc 70%, #e8a0ab 100%)",
            boxShadow:
              "inset -12px -18px 28px rgba(180, 70, 90, 0.12), 0 14px 28px rgba(160, 60, 80, 0.18)",
            border: "1px solid rgba(220, 140, 150, 0.35)",
          }}
        />
        {/* Reflet */}
        <div
          style={{
            position: "absolute",
            top: "12%",
            left: "18%",
            width: "28%",
            height: "18%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", width: "100%", height: "100%", padding: 18 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="68%">
              <PolarGrid stroke="rgba(180, 90, 110, 0.25)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: "#6b3a44", fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="Recette"
                dataKey="score"
                stroke="#c45c6a"
                fill="#e8919c"
                fillOpacity={0.5}
                strokeWidth={2.5}
                style={{ cursor: "pointer" }}
                onClick={(payload: any) => {
                  const label = payload?.payload?.axis
                  const found = axes.find((a) => a.label === label)
                  if (found) setSelected(found.key === selected ? null : found.key)
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Petit cone decoratif */}
      <div
        style={{
          width: 0,
          height: 0,
          margin: "-6px auto 0",
          borderLeft: "28px solid transparent",
          borderRight: "28px solid transparent",
          borderTop: "36px solid #e8c39a",
          filter: "drop-shadow(0 4px 6px rgba(120,80,40,0.2))",
        }}
      />

      {/* Boutons sous-axes */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
          marginTop: 16,
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
                  selected === a.key
                    ? "2px solid #c45c6a"
                    : "1px solid #e8b4bc",
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
          <div style={{ fontSize: 22, fontWeight: 700, color: "#c45c6a" }}>
            {selectedAxis.subValue != null
              ? Number(selectedAxis.subValue).toFixed(
                  selectedAxis.subLabel === "Densite" ? 3 : 2
                )
              : "-"}
            {selectedAxis.subUnit ? ` ${selectedAxis.subUnit}` : ""}
          </div>
        </div>
      )}
    </div>
  )
}
