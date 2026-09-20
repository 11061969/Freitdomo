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

// Limites par défaut (extraites de notre cahier des charges)
function getDefaultLimits(
  category: string,
  temp: "soft" | "gelato" | "hard"
): Record<string, Limit> {
  // Structure - valeurs de base hard (-18)
  const structureHard: Record<string, Limit> = {
    totalSolids: { min: 34, max: 42 },
    density: { min: 1.08, max: 1.13 },
    creaminess: { min: 5, max: 8 },
    saturatedFatSolid: { min: 45, max: 75 },
    emulsifierVsFat: { min: 1.25, max: 2.5 },
    molarMassStabi: { min: 170000, max: 210000 },
    esdl: { min: 6, max: 12 },
    sweetness: { min: 12, max: 22 },
    freezingPoint: { min: -3.3, max: -2.3 },
    iceFraction: { min: 87.7, max: 88.1 },
  }

  if (category === "sorbet") {
    return {
      totalSolids: { min: 27, max: 33 },
      density: { min: 1.08, max: 1.13 },
      molarMassStabi: { min: 175000, max: 220000 },
      esdl: { min: 0, max: 5 },
      sweetness: { min: 20, max: 26 },
      freezingPoint:
        temp === "soft"
          ? { min: -2.6, max: -1.9 }
          : temp === "gelato"
          ? { min: -2.8, max: -2.0 }
          : { min: -3.3, max: -2.3 },
      iceFraction:
        temp === "soft"
          ? { min: 74.5, max: 76.5 }
          : temp === "gelato"
          ? { min: 85, max: 86 }
          : { min: 87.8, max: 88.1 },
    }
  }

  // ice_cream & vegan - ajustements par température
  const base = { ...structureHard }

  if (category === "vegan") {
    base.esdl = { min: 0, max: 0 } // non pertinent
    base.sweetness = { min: 12, max: 22 }
    if (temp === "hard") {
      base.freezingPoint = { min: -3.5, max: -2.5 }
    }
  }

  if (temp === "gelato") {
    base.freezingPoint = category === "vegan"
      ? { min: -3.1, max: -2.3 }
      : { min: -2.8, max: -2.0 }
    base.iceFraction = { min: 85, max: 86 }
    if (category === "vegan") {
      base.totalSolids = { min: 34, max: 42 }
      base.creaminess = { min: 5, max: 8 }
    }
  }

  if (temp === "soft") {
    base.totalSolids = { min: 30, max: 38 }
    base.creaminess = { min: 2, max: 6 }
    base.saturatedFatSolid = { min: 35, max: 65 }
    base.sweetness = { min: 10, max: 20 }
    base.freezingPoint = category === "vegan"
      ? { min: -2.8, max: -2.1 }
      : { min: -2.6, max: -1.9 }
    base.iceFraction = { min: 74.5, max: 76.5 }
    base.esdl = { min: 6, max: 14 }
  }

  return base
}

function statusColor(value: number, limit?: Limit): string {
  if (!limit) return "#666"
  if (value >= limit.min && value <= limit.max) return "#1a7f37" // vert
  // proche des bornes → orange
  const margin = (limit.max - limit.min) * 0.15
  if (value >= limit.min - margin && value <= limit.max + margin) return "#b86e00"
  return "#c62828" // rouge
}

function StatusDot({ value, limit }: { value: number; limit?: Limit }) {
  const color = statusColor(value, limit)
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
        marginRight: 8,
      }}
    />
  )
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

    const molarMassStabi = stabiQtySum > 0 ? stabiMassSum / stabiQtySum : 0
    const emulsifierVsFat = fatPct > 0 ? (stabilizerPct / fatPct) * 100 : 0

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
      molarMassStabi,
      emulsifierVsFat,
    })
  }, [lines, servingTemp])

  const categoryLabel: Record<string, string> = {
    ice_cream: "Crème glacée",
    sorbet: "Sorbet",
    vegan: "Vegan",
  }

  const tempLabel = { soft: "Soft (-6°C)", gelato: "Gelato (-11°C)", hard: "Hard (-18°C)" }

  if (loading) {
    return <main style={{ padding: 40, fontFamily: "sans-serif" }}>Chargement...</main>
  }

  if (error || !recipe) {
    return (
      <main style={{ padding: 40, fontFamily: "sans-serif" }}>
        <p style={{ color: "red" }}>{error || "Erreur"}</p>
        <Link href="/dashboard">← Retour</Link>
      </main>
    )
  }

  const limits = getDefaultLimits(recipe.category, servingTemp)

  const rows: { key: string; label: string; value: number; unit: string; limitKey?: string }[] = calcs
    ? [
        { key: "ts", label: "Solides totaux", value: calcs.totalSolids, unit: "%", limitKey: "totalSolids" },
        { key: "dens", label: "Densité", value: calcs.density, unit: "", limitKey: "density" },
        { key: "fat", label: "Matière grasse", value: calcs.fat, unit: "%" },
        { key: "prot", label: "Protéines", value: calcs.protein, unit: "%" },
        { key: "sugar", label: "Glucides", value: calcs.sugar, unit: "%" },
        { key: "sweet", label: "Taux sucrant", value: calcs.sweetness, unit: "", limitKey: "sweetness" },
        { key: "cream", label: "Onctuosité", value: calcs.creaminess, unit: "", limitKey: "creaminess" },
        { key: "esdl", label: "ESDL", value: calcs.esdl, unit: "%", limitKey: "esdl" },
        { key: "fp", label: "Point de congélation", value: calcs.freezingPoint, unit: "°C", limitKey: "freezingPoint" },
        { key: "ice", label: "Fraction de glace", value: calcs.iceFraction, unit: "%", limitKey: "iceFraction" },
        { key: "mm", label: "Masse molaire stabi", value: calcs.molarMassStabi, unit: "", limitKey: "molarMassStabi" },
        { key: "emf", label: "Émulsifiant vs MG", value: calcs.emulsifierVsFat, unit: "%", limitKey: "emulsifierVsFat" },
        { key: "stabi", label: "Stabilisant", value: calcs.stabilizer, unit: "%" },
        { key: "cost", label: "Coût / unité", value: calcs.cost, unit: "" },
      ]
    : []

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 1000, margin: "0 auto" }}>
      <p style={{ marginBottom: 12 }}>
        <Link href="/dashboard">← Tableau de bord</Link>
        {" · "}
        <Link href="/recipes">Mes recettes</Link>
      </p>

      <h1>{recipe.name}</h1>
      <p style={{ color: "#555", marginTop: 8 }}>
        {categoryLabel[recipe.category] || recipe.category}
        {" · "}
        {tempLabel[servingTemp]}
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
            <StatusDot value={1} limit={{ min: 0, max: 2 }} /> Dans les limites
            <span style={{ marginLeft: 16 }}><StatusDot value={10} limit={{ min: 0, max: 2 }} /> Hors limites</span>
          </p>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left", background: "#fafafa" }}>
                <th style={{ padding: 10 }}>Paramètre</th>
                <th style={{ padding: 10 }}>Valeur</th>
                <th style={{ padding: 10 }}>Min</th>
                <th style={{ padding: 10 }}>Max</th>
                <th style={{ padding: 10 }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const limit = row.limitKey ? limits[row.limitKey] : undefined
                const color = statusColor(row.value, limit)
                return (
                  <tr key={row.key} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 10 }}>{row.label}</td>
                    <td style={{ padding: 10, fontWeight: 600, color }}>
                      {row.value.toFixed(row.unit === "°C" || row.key === "dens" ? 2 : 2)}
                      {row.unit ? ` ${row.unit}` : ""}
                    </td>
                    <td style={{ padding: 10, color: "#666" }}>
                      {limit ? limit.min : "—"}
                    </td>
                    <td style={{ padding: 10, color: "#666" }}>
                      {limit ? limit.max : "—"}
                    </td>
                    <td style={{ padding: 10 }}>
                      {limit ? <StatusDot value={row.value} limit={limit} /> : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}
    </main>
  )
}
