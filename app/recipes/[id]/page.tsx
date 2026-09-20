"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

type IngredientData = {
  name: string
  category: string | null
  fat: number
  protein: number
  sugar: number
  fiber: number
  minerals: number
  alcohol: number
  stabilizer: number
  sweetness_factor: number
  molar_mass: number | null
  pac_carb: number
  pac_salts: number
  solubility: number
  creaminess: number
  saturated_fat: number
  sodium: number
  calcium: number
  cost: number
}

type RecipeLine = {
  quantity: number
  ingredients: IngredientData | null
}

type Recipe = {
  id: string
  name: string
  category: string
  total_quantity: number | null
}

type CalcResults = {
  totalSolids: number
  fat: number
  protein: number
  sugar: number
  fiber: number
  minerals: number
  stabilizer: number
  saturatedFat: number
  sodium: number
  calcium: number
  cost: number
  sweetness: number
  creaminess: number
  density: number
  esdl: number
  freezingPoint: number
  iceFraction: number
  molarMassStabi: number
  emulsifierVsFat: number
}

type Limit = { min: number; max: number }

function getLimits(category: string, temp: "soft" | "gelato" | "hard"): Record<string, Limit> {
  // --- Composition ---
  let composition: Record<string, Limit> = {
    fat: { min: 6, max: 14 },
    saturatedFat: { min: 3, max: 8 },
    protein: { min: 2, max: 7 },
    sugar: { min: 20, max: 26 },
    fiber: { min: 0, max: 3 },
    stabilizer: { min: 0.15, max: 0.25 },
    sodium: { min: 0, max: 100 },
    calcium: { min: 50, max: 200 },
  }

  if (category === "sorbet") {
    composition = {
      fat: { min: 0, max: 1 },
      protein: { min: 0, max: 1 },
      sugar: { min: 23, max: 33 },
      fiber: { min: 0, max: 3 },
      stabilizer: { min: 0.15, max: 0.3 },
      sodium: { min: 0, max: 100 },
    }
  }

  if (temp === "soft" && category !== "sorbet") {
    composition.fat = { min: 4, max: 8 }
    composition.saturatedFat = { min: 2, max: 6 }
    composition.sugar = { min: 18, max: 24 }
    composition.stabilizer = { min: 0.15, max: 0.3 }
    composition.sodium = { min: 30, max: 100 }
    if (category === "vegan") {
      composition.protein = { min: 2, max: 3 }
      composition.sugar = { min: 20, max: 30 }
    }
  }

  // --- Structure ---
  let structure: Record<string, Limit> = {
    totalSolids: { min: 34, max: 42 },
    density: { min: 1.08, max: 1.13 },
    creaminess: { min: 5, max: 8 },
    emulsifierVsFat: { min: 1.25, max: 2.5 },
    molarMassStabi: { min: 170000, max: 210000 },
    esdl: { min: 6, max: 12 },
    sweetness: { min: 12, max: 22 },
    freezingPoint: { min: -3.3, max: -2.3 },
    iceFraction: { min: 87.7, max: 88.1 },
  }

  if (category === "sorbet") {
    structure = {
      totalSolids: { min: 27, max: 33 },
      density: { min: 1.08, max: 1.13 },
      molarMassStabi: { min: 175000, max: 220000 },
      esdl: { min: 0, max: 5 },
      sweetness: { min: 20, max: 26 },
      freezingPoint: { min: -3.3, max: -2.3 },
      iceFraction: { min: 87.8, max: 88.1 },
    }
  }

  if (temp === "gelato") {
    structure.freezingPoint = { min: -2.8, max: -2.0 }
    structure.iceFraction = { min: 85, max: 86 }
    if (category === "vegan") {
      structure.freezingPoint = { min: -3.1, max: -2.3 }
    }
  }

  if (temp === "soft") {
    structure.totalSolids = { min: 30, max: 38 }
    structure.creaminess = { min: 2, max: 6 }
    structure.sweetness = category === "sorbet" ? { min: 20, max: 26 } : { min: 10, max: 20 }
    structure.freezingPoint = { min: -2.6, max: -1.9 }
    structure.iceFraction = { min: 74.5, max: 76.5 }
    if (category !== "sorbet") structure.esdl = { min: 6, max: 14 }
    if (category === "vegan") {
      structure.freezingPoint = { min: -2.8, max: -2.1 }
    }
  }

  return { ...composition, ...structure }
}

function getStatus(value: number, limit?: Limit): "ok" | "warn" | "bad" | "none" {
  if (!limit) return "none"
  if (value >= limit.min && value <= limit.max) return "ok"
  const range = limit.max - limit.min || 1
  const margin = range * 0.2
  if (value >= limit.min - margin && value <= limit.max + margin) return "warn"
  return "bad"
}

const statusStyles = {
  ok: { bg: "#e8f5e9", border: "#a5d6a7", text: "#1b5e20" },
  warn: { bg: "#fff8e1", border: "#ffe082", text: "#e65100" },
  bad: { bg: "#ffebee", border: "#ef9a9a", text: "#b71c1c" },
  none: { bg: "#f5f5f5", border: "#e0e0e0", text: "#333" },
}

export default function RecipeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [lines, setLines] = useState<RecipeLine[]>([])
  const [servingTemp, setServingTemp] = useState<"soft" | "gelato" | "hard">("hard")
  const [calcs, setCalcs] = useState<CalcResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: userData } = await supabase
        .from("users")
        .select("client_id, clients(serving_temperature)")
        .eq("id", user.id)
        .single()

      if (userData && (userData as any).clients?.serving_temperature) {
        setServingTemp((userData as any).clients.serving_temperature)
      }

      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .select("id, name, category, total_quantity")
        .eq("id", id)
        .single()

      if (recipeError || !recipeData) {
        setError("Recette non trouvée")
        setLoading(false)
        return
      }

      setRecipe(recipeData)

      const { data: linesData } = await supabase
        .from("recipe_ingredients")
        .select(`
          quantity,
          ingredients (
            name, category, fat, protein, sugar, fiber, minerals, alcohol,
            stabilizer, sweetness_factor, molar_mass, pac_carb, pac_salts,
            solubility, creaminess, saturated_fat, sodium, calcium, cost
          )
        `)
        .eq("recipe_id", id)

      setLines((linesData as any) || [])
      setLoading(false)
    }

    load()
  }, [id, router])

  useEffect(() => {
    if (lines.length === 0) {
      setCalcs(null)
      return
    }

    let totalQty = 0
    let fat = 0, protein = 0, sugar = 0, fiber = 0, minerals = 0
    let alcohol = 0, stabilizer = 0, saturatedFat = 0
    let sodium = 0, calcium = 0, cost = 0
    let sweetness = 0, creaminess = 0
    let stabiMassSum = 0, stabiQtySum = 0
    let pacCarbSum = 0, pacSaltsSum = 0

    for (const line of lines) {
      const q = line.quantity || 0
      const ing = line.ingredients
      if (!ing || q <= 0) continue

      totalQty += q
      fat += q * (ing.fat || 0) / 100
      protein += q * (ing.protein || 0) / 100
      sugar += q * (ing.sugar || 0) / 100
      fiber += q * (ing.fiber || 0) / 100
      minerals += q * (ing.minerals || 0) / 100
      alcohol += q * (ing.alcohol || 0) / 100
      stabilizer += q * (ing.stabilizer || 0) / 100
      saturatedFat += q * (ing.saturated_fat || 0) / 100
      sodium += q * (ing.sodium || 0) / 100
      calcium += q * (ing.calcium || 0) / 100
      cost += q * (ing.cost || 0)
      sweetness += q * (ing.sugar || 0) / 100 * (ing.sweetness_factor || 1)
      creaminess += q * (ing.creaminess || 0) / 100

      const stabiPart = q * (ing.stabilizer || 0) / 100
      if (stabiPart > 0 && ing.molar_mass) {
        stabiMassSum += stabiPart * ing.molar_mass
        stabiQtySum += stabiPart
      }

      pacCarbSum += q * (ing.pac_carb || 0)
      pacSaltsSum += q * (ing.pac_salts || 0)
    }

    if (totalQty <= 0) {
      setCalcs(null)
      return
    }

    const fatPct = (fat / totalQty) * 100
    const proteinPct = (protein / totalQty) * 100
    const sugarPct = (sugar / totalQty) * 100
    const fiberPct = (fiber / totalQty) * 100
    const mineralsPct = (minerals / totalQty) * 100
    const totalSolids = fatPct + proteinPct + sugarPct + fiberPct + mineralsPct
    const waterFraction = 100 - totalSolids
    const stabilizerPct = (stabilizer / totalQty) * 100
    const saturatedFatPct = (saturatedFat / totalQty) * 100

    const density = 1 / (
      (fatPct / 100) * 1.07527 +
      ((totalSolids / 100) - (fatPct / 100)) * 0.6329 +
      (1 - totalSolids / 100)
    )

    const esdl = proteinPct
    const pacTotal = (pacCarbSum + pacSaltsSum) / totalQty
    const waterKg = waterFraction / 100
    const molality = waterKg > 0 ? pacTotal / waterKg : 0
    const freezingPoint = -(molality * 1.86)

    const tempMap = { soft: -6, gelato: -11, hard: -18 }
    const T = tempMap[servingTemp]
    let iceFraction = 0
    if (waterKg > 0 && freezingPoint < 0) {
      const numerateur = 1.105 * waterKg * 100
      const denomTemp = (freezingPoint - T) + 1
      if (denomTemp > 0) {
        const lnVal = Math.log(denomTemp)
        if (lnVal !== 0) {
          const facteur = 0.7138 / lnVal
          const totalDenom = 1 + facteur
          const iceQty = numerateur / totalDenom
          iceFraction = (iceQty / (waterKg * 100)) * 100
        }
      }
    }

    setCalcs({
      totalSolids,
      fat: fatPct,
      protein: proteinPct,
      sugar: sugarPct,
      fiber: fiberPct,
      minerals: mineralsPct,
      stabilizer: stabilizerPct,
      saturatedFat: saturatedFatPct,
      sodium: sodium / totalQty,
      calcium: calcium / totalQty,
      cost: cost / totalQty,
      sweetness: (sweetness / totalQty) * 100,
      creaminess: (creaminess / totalQty) * 100,
      density,
      esdl,
      freezingPoint,
      iceFraction,
      molarMassStabi: stabiQtySum > 0 ? stabiMassSum / stabiQtySum : 0,
      emulsifierVsFat: fatPct > 0 ? (stabilizerPct / fatPct) * 100 : 0,
    })
  }, [lines, servingTemp])

  const categoryLabel: Record<string, string> = {
    ice_cream: "Crème glacée",
    sorbet: "Sorbet",
    vegan: "Vegan",
  }
  const tempLabel = { soft: "Soft (-6°C)", gelato: "Gelato (-11°C)", hard: "Hard (-18°C)" }

  if (loading) return <main style={{ padding: 40, fontFamily: "sans-serif" }}>Chargement...</main>
  if (error || !recipe) {
    return (
      <main style={{ padding: 40, fontFamily: "sans-serif" }}>
        <p style={{ color: "red" }}>{error || "Erreur"}</p>
        <Link href="/dashboard">← Retour</Link>
      </main>
    )
  }

  const limits = getLimits(recipe.category, servingTemp)

  const cards: { label: string; value: number; unit: string; limitKey?: string; digits?: number }[] = calcs
    ? [
        { label: "Solides totaux", value: calcs.totalSolids, unit: "%", limitKey: "totalSolids" },
        { label: "Densité", value: calcs.density, unit: "", limitKey: "density", digits: 3 },
        { label: "Matière grasse", value: calcs.fat, unit: "%", limitKey: "fat" },
        { label: "Protéines", value: calcs.protein, unit: "%", limitKey: "protein" },
        { label: "Glucides", value: calcs.sugar, unit: "%", limitKey: "sugar" },
        { label: "Fibres", value: calcs.fiber, unit: "%", limitKey: "fiber" },
        { label: "Stabilisant", value: calcs.stabilizer, unit: "%", limitKey: "stabilizer", digits: 3 },
        { label: "Taux sucrant", value: calcs.sweetness, unit: "", limitKey: "sweetness" },
        { label: "Onctuosité", value: calcs.creaminess, unit: "", limitKey: "creaminess" },
        { label: "ESDL", value: calcs.esdl, unit: "%", limitKey: "esdl" },
        { label: "Point de congélation", value: calcs.freezingPoint, unit: "°C", limitKey: "freezingPoint" },
        { label: "Fraction de glace", value: calcs.iceFraction, unit: "%", limitKey: "iceFraction" },
        { label: "Masse molaire stabi", value: calcs.molarMassStabi, unit: "", limitKey: "molarMassStabi", digits: 0 },
        { label: "Émulsifiant vs MG", value: calcs.emulsifierVsFat, unit: "%", limitKey: "emulsifierVsFat" },
        { label: "Sodium", value: calcs.sodium, unit: "mg", limitKey: "sodium", digits: 1 },
        { label: "Calcium", value: calcs.calcium, unit: "mg", limitKey: "calcium", digits: 1 },
        { label: "Coût / unité", value: calcs.cost, unit: "", digits: 4 },
      ]
    : []

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <p style={{ marginBottom: 12 }}>
        <Link href="/dashboard">← Tableau de bord</Link>
        {" · "}
        <Link href="/recipes">Mes recettes</Link>
      </p>

      <h1>{recipe.name}</h1>
      <p style={{ color: "#555", marginTop: 8 }}>
        {categoryLabel[recipe.category] || recipe.category} · {tempLabel[servingTemp]}
      </p>

      <h3 style={{ marginTop: 28, marginBottom: 12 }}>Composition</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 28 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: 8 }}>Ingrédient</th>
            <th style={{ padding: 8 }}>Catégorie</th>
            <th style={{ padding: 8 }}>Quantité</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{line.ingredients?.name || "—"}</td>
              <td style={{ padding: 8 }}>{line.ingredients?.category || "—"}</td>
              <td style={{ padding: 8 }}>{line.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {calcs && (
        <>
          <h3 style={{ marginBottom: 8 }}>Résultats & limites</h3>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
            <span style={{ color: "#1b5e20" }}>● Vert</span> = dans les limites &nbsp;&nbsp;
            <span style={{ color: "#e65100" }}>● Orange</span> = proche &nbsp;&nbsp;
            <span style={{ color: "#b71c1c" }}>● Rouge</span> = hors limites
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {cards.map((card) => {
              const limit = card.limitKey ? limits[card.limitKey] : undefined
              const status = getStatus(card.value, limit)
              const style = statusStyles[status]
              const digits = card.digits ?? 2
              return (
                <div
                  key={card.label}
                  style={{
                    padding: 14,
                    background: style.bg,
                    border: `1px solid ${style.border}`,
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{card.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: style.text }}>
                    {card.value.toFixed(digits)}
                    {card.unit ? ` ${card.unit}` : ""}
                  </div>
                  {limit && (
                    <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
                      Min {limit.min} → Max {limit.max}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </main>
  )
}
