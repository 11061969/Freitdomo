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
  totalQty: number
  fat: number
  protein: number
  sugar: number
  fiber: number
  minerals: number
  alcohol: number
  stabilizer: number
  saturatedFat: number
  sodium: number
  calcium: number
  cost: number
  totalSolids: number
  sweetness: number
  creaminess: number
  density: number
  waterFraction: number
  esdl: number
  freezingPoint: number
  iceFraction: number
  molarMassStabi: number
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

      // Température de service du client
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

  // Calculs dès que les lignes sont chargées
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

    // Pourcentages
    const fatPct = (fat / totalQty) * 100
    const proteinPct = (protein / totalQty) * 100
    const sugarPct = (sugar / totalQty) * 100
    const fiberPct = (fiber / totalQty) * 100
    const mineralsPct = (minerals / totalQty) * 100
    const totalSolids = fatPct + proteinPct + sugarPct + fiberPct + mineralsPct
    const waterFraction = 100 - totalSolids

    // Densité (formule Excel)
    const density = 1 / (
      (fatPct / 100) * 1.07527 +
      ((totalSolids / 100) - (fatPct / 100)) * 0.6329 +
      (1 - totalSolids / 100)
    )

    // ESDL simplifié (protéines + lactose approximé via sucre laitier — pour l'instant protéines + part sucres)
    // Version simple : protéines laitières approx = protéines (affiné plus tard)
    const esdl = proteinPct

    // Point de congélation — approche molalité simplifiée
    // PAC total approximé, puis FP = - (molalité effective) * 1.86
    const pacTotal = (pacCarbSum + pacSaltsSum) / totalQty
    const waterKg = waterFraction / 100
    const molality = waterKg > 0 ? pacTotal / waterKg : 0
    const freezingPoint = -(molality * 1.86)

    // Fraction de glace — formule logarithmique simplifiée selon température de service
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

    setCalcs({
      totalQty,
      fat: fatPct,
      protein: proteinPct,
      sugar: sugarPct,
      fiber: fiberPct,
      minerals: mineralsPct,
      alcohol: (alcohol / totalQty) * 100,
      stabilizer: (stabilizer / totalQty) * 100,
      saturatedFat: (saturatedFat / totalQty) * 100,
      sodium: sodium / totalQty,
      calcium: calcium / totalQty,
      cost: cost / totalQty,
      totalSolids,
      sweetness: (sweetness / totalQty) * 100,
      creaminess: (creaminess / totalQty) * 100,
      density,
      waterFraction,
      esdl,
      freezingPoint,
      iceFraction,
      molarMassStabi,
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
        Température de service : {tempLabel[servingTemp]}
      </p>

      <h3 style={{ marginTop: 32, marginBottom: 12 }}>Composition</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 32 }}>
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
          <h3 style={{ marginBottom: 12 }}>Résultats de calcul</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {[
              ["Solides totaux", `${calcs.totalSolids.toFixed(2)} %`],
              ["Matière grasse", `${calcs.fat.toFixed(2)} %`],
              ["Protéines", `${calcs.protein.toFixed(2)} %`],
              ["Glucides", `${calcs.sugar.toFixed(2)} %`],
              ["Fibres", `${calcs.fiber.toFixed(2)} %`],
              ["Sels minéraux", `${calcs.minerals.toFixed(2)} %`],
              ["Taux sucrant", `${calcs.sweetness.toFixed(2)}`],
              ["Densité", calcs.density.toFixed(4)],
              ["ESDL (approx.)", `${calcs.esdl.toFixed(2)} %`],
              ["Point de congélation", `${calcs.freezingPoint.toFixed(2)} °C`],
              ["Fraction de glace", `${calcs.iceFraction.toFixed(2)} %`],
              ["Onctuosité", `${calcs.creaminess.toFixed(2)}`],
              ["Masse molaire stabi", calcs.molarMassStabi > 0 ? calcs.molarMassStabi.toFixed(0) : "—"],
              ["Stabilisant", `${calcs.stabilizer.toFixed(3)} %`],
              ["Coût / unité", calcs.cost.toFixed(4)],
            ].map(([label, value]) => (
              <div key={label as string} style={{ padding: 12, background: "#f8f8f8", borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{value}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
