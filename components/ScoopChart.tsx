"use client"

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
}

function normalize(value: number, min?: number, max?: number) {
  if (min == null || max == null || max === min) return 50
  const n = ((value - min) / (max - min)) * 100
  return Math.max(0, Math.min(100, n))
}

export default function ScoopChart({ axes }: { axes: AxisItem[] }) {
  const data = axes.map((a) => ({
    axis: a.label,
    score: normalize(a.value, a.min, a.max),
    fullMark: 100,
  }))

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        height: 360,
        margin: "24px auto",
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
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
