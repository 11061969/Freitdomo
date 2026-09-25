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
  saturated_fat: number
  sodium: number
  calcium: number
  cost: number
  solubility: number
}

type RecipeLine = {
  quantity: number
  ingredients: IngredientData | null
}

type Limit = { min: number; max: number }

function getLimits(category: string, temp: string): Record<string, Limit> {
  const composition: Record<string, Limit> = {
    fat: { min: 6, max: 14 },
    protein: { min: 2, max: 7 },
    sugar: { min: 20, max: 26 },
    fiber: { min: 0, max: 3 },
    stabilizer: { min: 0.15, max: 0.25 },
    sodium: { min: 0, max: 100 },
    saturatedFat: { min: 3, max: 8 },
    minerals: { min: 0, max: 2 },
    alcohol: { min: 0, max: 3 },
  }

  if (category === "sorbet") {
    composition.fat = { min: 0, max: 1 }
    composition.protein = { min: 0, max: 1 }
    composition.sugar = { min: 23, max: 33 }
    composition.stabilizer = { min: 0.15, max: 0.3 }
  }

  if (temp === "soft" && category !== "sorbet") {
    composition.fat = { min: 4, max: 8 }
    composition.sugar = { min: 18, max: 24 }
    composition.stabilizer = { min: 0.15, max: 0.3 }
    composition.saturatedFat = { min: 2, max: 6 }
  }

  const structure: Record<string, Limit> = {
    totalSolids: { min: 34, max: 42 },
    density: { min: 1.08, max: 1.13 },
    creaminess: { min: 5, max: 8 },
    esdl: { min: 6, max: 12 },
    freezingPoint: { min: -3.3, max: -2.3 },
    iceFraction: { min: 87.7, max: 88.1 },
    molarMassStabi: { min: 170000, max: 210000 },
    emulsifierVsFat: { min: 1.25, max: 2.5 },
    mgSolide: { min: 45, max: 75 },
    saturation: { min: 50, max: 100 },
  }

  if (category === "sorbet") {
    structure.totalSolids = { min: 27, max: 33 }
    structure.iceFraction = { min: 87.8, max: 88.1 }
    structure.molarMassStabi = { min: 175000, max: 220000 }
  }

  if (temp === "gelato") {
    structure.freezingPoint = { min: -2.8, max: -2.0 }
    structure.iceFraction = { min: 85, max: 86 }
  }

  if (temp === "soft") {
    structure.totalSolids = { min: 30, max: 38 }
    structure.creaminess = { min: 2, max: 6 }
    structure.freezingPoint = { min: -2.6, max: -1.9 }
    structure.iceFraction = { min: 74.5, max: 76.5 }
    structure.mgSolide = { min: 35, max: 65 }
  }

  return { ...composition, ...structure }
}

function getStatus(value: number, limit?: Limit) {
  if (!limit) return "none"
  if (value >= limit.min && value <= limit.max) return "ok"
  return "bad"
}

const colors: Record<string, { bg: string; border: string; text: string }> = {
  ok: { bg: "#e8f5e9", border: "#a5d6a7", text: "#1b5e20" },
  bad: { bg: "#ffebee", border: "#ef9a9a", text: "#b71c1c" },
  none: { bg: "#f5f5f5", border: "#e0e0e0", text: "#333" },
}

export default function RecipeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [recipe, setRecipe] = useState<any>(null)
  const [lines, setLines] = useState<RecipeLine[]>([])
  const [servingTemp, setServingTemp] = useState("hard")
  const [calcs, setCalcs] = useState<any>(null)
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
        .select("quantity, ingredients(name, category, fat, protein, sugar, fiber, minerals, alcohol, stabilizer, sweetness_factor, molar_mass, saturated_fat, sodium, calcium, cost, solubility)")
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
    let sweetness = 0
    let stabiMassSum = 0, stabiQtySum = 0
    let moles = 0

    for (const line of lines) {
      const q = line.quantity || 0
      const ing = line.ingredients
      if (!ing || q <= 0) continue

      totalQty += q
      fat += (q * (ing.fat || 0)) / 100
      protein += (q * (ing.protein || 0)) / 100
      sugar += (q * (ing.sugar || 0)) / 100
      fiber += (q * (ing.fiber || 0)) / 100
      minerals += (q * (ing.minerals || 0)) / 100
      alcohol += (q * (ing.alcohol || 0)) / 100
      stabilizer += (q * (ing.stabilizer || 0)) / 100
      saturatedFat += (q * (ing.saturated_fat || 0)) / 100
      sodium += (q * (ing.sodium || 0)) / 100
      calcium += (q * (ing.calcium || 0)) / 100
      cost += q * (ing.cost || 0)
      sweetness += ((q * (ing.sugar || 0)) / 100) * (ing.sweetness_factor || 1)

      // Masse molaire stabilisant (pondérée)
      const stabiPart = (q * (ing.stabilizer || 0)) / 100
      if (stabiPart > 0 && ing.molar_mass) {
        stabiMassSum += stabiPart * ing.molar_mass
        stabiQtySum += stabiPart
      }

      // Molalité : glucides / sels / alcool
      const cat = (ing.category || "").toLowerCase()
      const mCarb = cat.includes("sucre") && ing.molar_mass ? ing.molar_mass : 342
      const sugarMass = (q * (ing.sugar || 0)) / 100
      const saltMass = (q * (ing.minerals || 0)) / 100
      const alcoholMass = (q * (ing.alcohol || 0)) / 100
      if (mCarb > 0) moles += sugarMass / mCarb
      moles += saltMass / 58
      moles += alcoholMass / 46
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
    const alcoholPct = (alcohol / totalQty) * 100
    const saturatedFatPct = (saturatedFat / totalQty) * 100
    const totalSolids = fatPct + proteinPct + sugarPct + fiberPct + mineralsPct
    const waterFraction = Math.max(0, 100 - totalSolids)
    const stabilizerPct = (stabilizer / totalQty) * 100

    const density =
      1 /
      ((fatPct / 100) * 1.07527 +
        (totalSolids / 100 - fatPct / 100) * 0.6329 +
        (1 - totalSolids / 100))

    // Onctuosité = MG saturée (comme Excel V51)
    const onctuosite = saturatedFatPct

    // MG solide = MG saturée / MG * 100
    const mgSolide = fatPct > 0 ? (saturatedFatPct / fatPct) * 100 : 0

    // Point de congélation (molalité)
    const waterKg = (waterFraction / 100) * (totalQty / 1000) // approx si quantités en g → kg
    // Si quantités sont en %, totalQty ~ 100 ; on travaille en fraction
    const waterFraction01 = waterFraction / 100
    const molality = waterFraction01 > 0 ? moles / (totalQty * waterFraction01) : 0
    // moles sont en "g / M" = mol pour quantités en g ; si totalQty est une base 100, c'est cohérent en relatif
    const freezingPoint = -(molality * 1.86)

    const tempMap: Record<string, number> = { soft: -6, gelato: -11, hard: -18 }
    const T = tempMap[servingTemp] || -18
    let iceFraction = 0
    if (waterFraction01 > 0 && freezingPoint < 0) {
      const numerateur = 1.105 * waterFraction01 * 100
      const denomTemp = freezingPoint - T + 1
      if (denomTemp > 0) {
        const lnVal = Math.log(denomTemp)
        if (lnVal !== 0) {
          const facteur = 0.7138 / lnVal
          const iceQty = numerateur / (1 + facteur)
          iceFraction = (iceQty / (waterFraction01 * 100)) * 100
        }
      }
    }

    const saturation = waterFraction > 0 ? (sugarPct / waterFraction) * 100 : 0

    setCalcs({
      totalSolids,
      fat: fatPct,
      protein: proteinPct,
      sugar: sugarPct,
      fiber: fiberPct,
      minerals: mineralsPct,
      alcohol: alcoholPct,
      stabilizer: stabilizerPct,
      saturatedFat: saturatedFatPct,
      sodium: sodium / totalQty,
      calcium: calcium / totalQty,
      cost: cost / totalQty,
      sweetness: (sweetness / totalQty) * 100,
      creaminess: onctuosite,
      density,
      esdl: proteinPct,
      freezingPoint,
      iceFraction,
      molarMassStabi: stabiQtySum > 0 ? stabiMassSum / stabiQtySum : 0,
      emulsifierVsFat: fatPct > 0 ? (stabilizerPct / fatPct) * 100 : 0,
      mgSolide,
      saturation,
      kcal: 9 * fatPct + 4 * proteinPct + 4 * sugarPct + 7 * alcoholPct,
    })
  }, [lines, servingTemp])

  if (loading) {
    return <main style={{ padding: 40, fontFamily: "sans-serif" }}>Chargement...</main>
  }

  if (error || !recipe) {
    return (
      <main style={{ padding: 40, fontFamily: "sans-serif" }}>
        <p style={{ color: "red" }}>{error || "Erreur"}</p>
        <Link href="/dashboard">Retour</Link>
      </main>
    )
  }

  const limits = getLimits(recipe.category, servingTemp)
  const isSorbet = (recipe.category || "").toLowerCase().includes("sorbet")
  const isVegan = (recipe.category || "").toLowerCase().includes("vegan")

  const categoryLabel: Record<string, string> = {
    ice_cream: "Creme glacee",
    sorbet: "Sorbet",
    vegan: "Vegan",
  }

  const tempLabel: Record<string, string> = {
    soft: "Soft (-6C)",
    gelato: "Gelato (-11C)",
    hard: "Hard (-18C)",
  }

  function renderCard(label: string, value: number, unit: string, limitKey?: string, digits = 2) {
    const limit = limitKey ? limits[limitKey] : undefined
    const status = getStatus(value, limit)
    const style = colors[status]
    return (
      <div
        key={label}
        style={{
          padding: 14,
          background: style.bg,
          border: "1px solid " + style.border,
          borderRadius: 10,
        }}
      >
        <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: style.text }}>
          {value.toFixed(digits)}
          {unit ? " " + unit : ""}
        </div>
        {limit && (
          <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
            Min {limit.min} - Max {limit.max}
          </div>
        )}
      </div>
    )
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <p style={{ marginBottom: 12 }}>
        <Link href="/dashboard">Tableau de bord</Link>
        {" · "}
        <Link href="/recipes">Mes recettes</Link>
      </p>

      <h1>{recipe.name}</h1>
      <p style={{ color: "#555", marginTop: 8 }}>
        {categoryLabel[recipe.category] || recipe.category}
        {" · "}
        {tempLabel[servingTemp] || servingTemp}
      </p>

      <h3 style={{ marginTop: 28, marginBottom: 12 }}>Ingredients</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 36 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: 8 }}>Ingredient</th>
            <th style={{ padding: 8 }}>Categorie</th>
            <th style={{ padding: 8 }}>Quantite</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{line.ingredients?.name || "-"}</td>
              <td style={{ padding: 8 }}>{line.ingredients?.category || "-"}</td>
              <td style={{ padding: 8 }}>{line.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {calcs && (
        <div>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
            Vert = dans les limites · Rouge = hors limites
          </p>

                   <h2 style={{ fontSize: 20, marginBottom: 12 }}>Composition</h2>
          {isSorbet ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
                {renderCard("Glucides", calcs.sugar, "%", "sugar")}
                {renderCard("Proteines", calcs.protein, "%", "protein")}
                {renderCard("Stabilisant", calcs.stabilizer, "%", "stabilizer", 3)}
                {renderCard("Alcool", calcs.alcohol, "%", "alcohol")}
                {renderCard("Kcal / 100g", calcs.kcal, "", undefined, 0)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 40 }}>
                {renderCard("Fibres", calcs.fiber, "%", "fiber")}
                {renderCard("Sels mineraux", calcs.minerals, "%", "minerals")}
                {renderCard("Sodium", calcs.sodium, "mg", "sodium", 1)}
                {renderCard("Cout", calcs.cost, "", undefined, 4)}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
                {renderCard("Matiere grasse", calcs.fat, "%", "fat")}
                {renderCard("Glucides", calcs.sugar, "%", "sugar")}
                {renderCard("Proteines", calcs.protein, "%", "protein")}
                {renderCard("Stabilisant", calcs.stabilizer, "%", "stabilizer", 3)}
                {renderCard("Alcool", calcs.alcohol, "%", "alcohol")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 40 }}>
                {renderCard("MG saturee", calcs.saturatedFat, "%", "saturatedFat")}
                {renderCard("Fibres", calcs.fiber, "%", "fiber")}
                {renderCard("Sels mineraux", calcs.minerals, "%", "minerals")}
                {renderCard("Sodium", calcs.sodium, "mg", "sodium", 1)}
                {renderCard("Kcal / 100g", calcs.kcal, "", undefined, 0)}
                {renderCard("Cout", calcs.cost, "", undefined, 4)}
              </div>
            </>
          )}

                        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Structure et Texture</h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            {renderCard("Solides totaux", calcs.totalSolids, "%", "totalSolids")}
            {!isSorbet && renderCard("Onctuosite", calcs.creaminess, "%", "creaminess")}
            {!isSorbet && renderCard("Emulsifiant vs MG", calcs.emulsifierVsFat, "%", "emulsifierVsFat")}
            {!isSorbet && !isVegan && renderCard("ESDL", calcs.esdl, "%", "esdl")}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 180 }}>
              {renderCard("Fraction de glace", calcs.iceFraction, "%", "iceFraction")}
              {renderCard("Point de congelation", calcs.freezingPoint, "C", "freezingPoint")}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            {renderCard("Densite", calcs.density, "", "density", 3)}
            {!isSorbet && renderCard("MG solide", calcs.mgSolide, "%", "mgSolide")}
            {renderCard("Masse molaire stabi", calcs.molarMassStabi, "", "molarMassStabi", 0)}
            {renderCard("Saturation", calcs.saturation, "%", "saturation")}
          </div>
        </div>
      )}
    </main>
  )
}
