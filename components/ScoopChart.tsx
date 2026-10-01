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
    <div style={{ maxWidth: 420, margin: "24px auto" }}>
      <div
        style={{
          width: "100%",
          height: 360,
          background:
            "radial-gradient(circle at 50% 45%, #fff5f5 0%, #ffe4e8 55%, #f5d0d6 100%)",
          borderRadius: "50%",
          padding: 16,
          boxShadow: "0 8px 24px rgba(180,80,100,0.15)",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#e8b4bc" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "#5a3a40", fontSize: 11 }}
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
              fillOpacity={0.45}
              strokeWidth={2}
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
