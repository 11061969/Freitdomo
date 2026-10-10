"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import ScoopChart from "@/components/ScoopChart"

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
  id: string
  quantity: number
  ingredients: IngredientData | null
}

type Limit = { min: number; max: number }

function getLimits(category: string, temp: string): Record<string, Limit> {
  const composition: Record<string, Limit> = {
    fat: { min: 6, max: 14 },
    protein: { min: 1, max: 7 },
    sugar: { min: 20, max: 26 },
    fiber: { min: 0, max: 3 },
    stabilizer: { min: 0.15, max: 0.25 },
    sodium: { min: 0, max: 100 },
    saturatedFat: { min: 3, max: 8 },
    minerals: { min: 0, max: 2 },
    alcohol: { min: 0, max: 3 },
    emulsifier: { min: 0.05, max: 0.25 },
  }


  if (category === "sorbet") {
    composition.fat = { min: 0, max: 1 }
    composition.protein = { min: 0, max: 5 }
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
        esdlVsSolvent: { min: 10, max: 17 },
    freezingPoint: { min: -3.3, max: -2.3 },
    iceFraction: { min: 87.7, max: 88.1 },
    molarMassStabi: { min: 170000, max: 220000 },
    emulsifierVsFat: { min: 1, max: 2.5 },
    mgSolide: { min: 45, max: 75 },
    saturation: { min: 0, max: 100 },
    sweetness: { min: 12, max: 22 }
  }

  if (category === "sorbet") {
    structure.totalSolids = { min: 27, max: 33 }
    structure.iceFraction = { min: 87.8, max: 88.1 }
    structure.molarMassStabi = { min: 175000, max: 225000 }
    structure.sweetness = { min: 20, max: 26 }
    structure.foisonnement = { min: 25, max: 45 }
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
function idealEmulsifierVsFat(fatPct: number): number {
  const points = [
    { fat: 4, ratio: 4 },
    { fat: 6, ratio: 2.5 },
    { fat: 8, ratio: 1.88 },
    { fat: 9, ratio: 1.7 },
    { fat: 10, ratio: 1.5 },
    { fat: 12, ratio: 1.25 },
    { fat: 14, ratio: 0.71 },
    { fat: 16, ratio: 0 },
  ]
  if (fatPct <= points[0].fat) return points[0].ratio
  if (fatPct >= points[points.length - 1].fat) return points[points.length - 1].ratio
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    if (fatPct >= a.fat && fatPct <= b.fat) {
      const t = (fatPct - a.fat) / (b.fat - a.fat)
      return a.ratio + t * (b.ratio - a.ratio)
    }
  }
  return 1.25
}

function emulsifierVsFatLimits(fatPct: number) {
  const ideal = idealEmulsifierVsFat(fatPct)
  return {
    min: ideal * 0.85,
    max: ideal * 1.15,
  }
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
  const [scaleTarget, setScaleTarget] = useState("")
  const [scaling, setScaling] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
    const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState("")
    const [allIngredients, setAllIngredients] = useState<any[]>([])
  const [addIngId, setAddIngId] = useState("")
  const [addQty, setAddQty] = useState("1")
  
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      const { data: ings } = await supabase
        .from("ingredients")
        .select("id, name, category")
        .order("name")
      setAllIngredients(ings || [])
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
        .select("id, name, category, total_quantity, updated_at")
        .eq("id", id)
        .single()

      if (recipeError || !recipeData) {
        setError("Recette non trouvée")
        setLoading(false)
        return
      }

      setRecipe(recipeData)
      setNameDraft(recipeData.name || "")
      const { data: linesData } = await supabase
        .from("recipe_ingredients")
        .select(
  "id, quantity, ingredients(name, category, fat, protein, sugar, fiber, minerals, alcohol, stabilizer, sweetness_factor, molar_mass, saturated_fat, sodium, calcium, cost, solubility)"
)
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
    let fiberForSolids = 0
    let dairyLiquidMass = 0
    let plantMilkMass = 0
    let solventNeeded = 0
    let waterForSaturation = 0
    let esdlMass = 0
    let totalQty = 0
    let fat = 0, protein = 0, sugar = 0, fiber = 0, minerals = 0
    let alcohol = 0, stabilizer = 0, emulsifier = 0, saturatedFat = 0
    let sodium = 0, calcium = 0, cost = 0
    let sweetness = 0
    let stabiMassSum = 0, stabiQtySum = 0
    let moles = 0
        let fatMix = 0, proteinMix = 0, sugarMix = 0, fiberMix = 0
    let mineralsMix = 0, alcoholMix = 0, saturatedFatMix = 0
    let fatIncl = 0, proteinIncl = 0, sugarIncl = 0, fiberIncl = 0
    let mineralsIncl = 0, alcoholIncl = 0, saturatedFatIncl = 0
        let parfumMass = 0

    for (const line of lines) {
      const q = line.quantity || 0
      const ing = line.ingredients
      if (!ing || q <= 0) continue

      const cat = (ing.category || "").toLowerCase()
      const nameLow = (ing.name || "").toLowerCase()
         const isInsolubleVegan =
        nameLow.includes("chocolat") ||
        nameLow.includes("cacao") ||
        nameLow.includes("noisette") ||
        nameLow.includes("noix") ||
        nameLow.includes("pistache") ||
        nameLow.includes("cajou") ||
        nameLow.includes("pralin") ||
        nameLow.includes("lait de soja") ||
        nameLow.includes("lait d'amande") ||
        nameLow.includes("lait d’amande") ||
        nameLow.includes("lait amande") ||
        nameLow.includes("lait soja")
            const isParfumCat =
        cat.includes("infusion") ||
        cat.includes("alcool") ||
        cat.includes("alcohol") ||
        cat.includes("aromat") ||
        cat.includes("parfum") ||
        cat.includes("fruit") ||
        (cat.includes("vegan") && Number(ing.fat || 0) < 99.5)
          const isInfusion = cat.includes("infusion")
      const isInclusion = cat.includes("inclusion")

            if (isInfusion) {
        cost += q * (ing.cost || 0)
        if (isParfumCat) parfumMass += q
        continue
      }

      if (isInclusion) {
        cost += q * (ing.cost || 0)
        fatIncl += (q * (ing.fat || 0)) / 100
        proteinIncl += (q * (ing.protein || 0)) / 100
        sugarIncl += (q * (ing.sugar || 0)) / 100
        fiberIncl += (q * (ing.fiber || 0)) / 100
        mineralsIncl += (q * (ing.minerals || 0)) / 100
        alcoholIncl += (q * (ing.alcohol || 0)) / 100
        saturatedFatIncl +=
          (q * (ing.fat || 0) / 100) * ((ing.saturated_fat || 0) / 100)
        sodium += (q * (ing.sodium || 0)) / 100
        calcium += (q * (ing.calcium || 0)) / 100
        sweetness +=
          ((q * (ing.sugar || 0)) / 100) * (ing.sweetness_factor || 1)
        continue
      }

           totalQty += q
      fatMix += (q * (ing.fat || 0)) / 100
      proteinMix += (q * (ing.protein || 0)) / 100
      sugarMix += (q * (ing.sugar || 0)) / 100
      fiberMix += (q * (ing.fiber || 0)) / 100
      mineralsMix += (q * (ing.minerals || 0)) / 100
      alcoholMix += (q * (ing.alcohol || 0)) / 100
      saturatedFatMix +=
        (q * (ing.fat || 0) / 100) * ((ing.saturated_fat || 0) / 100)
      sodium += (q * (ing.sodium || 0)) / 100
      calcium += (q * (ing.calcium || 0)) / 100
      cost += q * (ing.cost || 0)
      sweetness += ((q * (ing.sugar || 0)) / 100) * (ing.sweetness_factor || 1)
            if (isParfumCat) {
        parfumMass += q
      }

      // ESDL : laitiers uniquement
      if (cat.includes("lait")) {
        esdlMass += (q * (ing.protein || 0)) / 100
        esdlMass += (q * (ing.sugar || 0)) / 100
      }

      // Stabilisant / emulsifiant
      const isEmulStabi = cat.includes("stabil") || cat.includes("emuls")
      let stabiMass = 0
      let emulsMass = 0
      if (isEmulStabi) {
        stabiMass = (q * (ing.fiber || 0)) / 100
        emulsMass = (q * (ing.fat || 0)) / 100
      }
      stabilizer += stabiMass
      emulsifier += emulsMass

      if (isEmulStabi && ing.molar_mass) {
        if (stabiMass > 0) {
          stabiMassSum += stabiMass * ing.molar_mass
        } else if (
          nameLow.includes("stabi") &&
          !nameLow.includes("emuls") &&
          !nameLow.includes("mix")
        ) {
          stabiMassSum += q * ing.molar_mass
        }
      }

      // Saturation
      const isPoudre = nameLow.includes("poudre") || nameLow.includes("powder")
      const isEau = nameLow.includes("eau")
      const sol = Number(ing.solubility) || 0
      if (sol > 0) {
        if (cat.includes("sucre")) {
          solventNeeded += q / sol
        } else if (isEmulStabi) {
          if (stabiMass > 0) solventNeeded += stabiMass / sol
        } else if (cat.includes("lait") && isPoudre) {
          solventNeeded += q / sol
        }
      }
      if (isEau) waterForSaturation += q
      if (cat.includes("lait") && !isPoudre) dairyLiquidMass += q
      if (
        !isEau &&
        (cat.includes("vegan") ||
          cat.includes("vegetal") ||
          nameLow.includes("amande") ||
          nameLow.includes("soja") ||
          nameLow.includes("avoine") ||
          nameLow.includes("riz") ||
          nameLow.includes("coco"))
      ) {
        plantMilkMass += q
      }

      // Molalite
      const mCarb = cat.includes("sucre") && ing.molar_mass ? ing.molar_mass : 342
      const alcoholMass = (q * (ing.alcohol || 0)) / 100
      if (!isInsolubleVegan) {
        const sugarMass = (q * (ing.sugar || 0)) / 100
        const saltMass = (q * (ing.minerals || 0)) / 100
        if (mCarb > 0) moles += sugarMass / mCarb
        moles += saltMass / 58
      }
      moles += alcoholMass / 46
    }

    if (totalQty <= 0) {
      setCalcs(null)
      return
    }

    const catRecipe = (recipe?.category || "").toLowerCase()
    let solventAvailable = waterForSaturation
    if (
      catRecipe.includes("ice") ||
      catRecipe.includes("cream") ||
      catRecipe === "ice_cream"
    ) {
      solventAvailable = waterForSaturation + dairyLiquidMass
    } else if (catRecipe.includes("vegan")) {
      solventAvailable = waterForSaturation + plantMilkMass
    } else {
      solventAvailable = waterForSaturation
    }

    const saturationPct =
      solventAvailable > 0 ? (solventNeeded / solventAvailable) * 100 : 0

        // Structure = mix seul
    const fatPctStruct = (fatMix / totalQty) * 100
    const proteinPctStruct = (proteinMix / totalQty) * 100
    const sugarPctStruct = (sugarMix / totalQty) * 100
    const fiberPctStruct = (fiberMix / totalQty) * 100
    const fiberSolidsPct = (fiberForSolids / totalQty) * 100
    const mineralsPctStruct = (mineralsMix / totalQty) * 100
    const saturatedFatPctStruct = (saturatedFatMix / totalQty) * 100
    const alcoholPctStruct = (alcoholMix / totalQty) * 100

    const totalSolids =
      fatPctStruct + proteinPctStruct + sugarPctStruct + fiberSolidsPct + mineralsPctStruct

    // Composition = mix + inclusions
    const fatPct = ((fatMix + fatIncl) / totalQty) * 100
    const proteinPct = ((proteinMix + proteinIncl) / totalQty) * 100
    const sugarPct = ((sugarMix + sugarIncl) / totalQty) * 100
    const fiberPct = ((fiberMix + fiberIncl) / totalQty) * 100
    const mineralsPct = ((mineralsMix + mineralsIncl) / totalQty) * 100
    const alcoholPct = ((alcoholMix + alcoholIncl) / totalQty) * 100
    const saturatedFatPct = ((saturatedFatMix + saturatedFatIncl) / totalQty) * 100
    const waterFraction = Math.max(0, 100 - totalSolids)
    const esdlPct = (esdlMass / totalQty) * 100
    const esdlVsSolvent =
      waterFraction > 0 ? (esdlPct / waterFraction) * 100 : 0
    const stabilizerPct = (stabilizer / totalQty) * 100
    const emulsifierPct = (emulsifier / totalQty) * 100
    
    const density =
      1 /
      ((fatPctStruct / 100) * 1.07527 +
        (totalSolids / 100 - fatPctStruct / 100) * 0.6329 +
        (1 - totalSolids / 100))

    // Onctuosité = MG saturée (comme Excel V51)
       const onctuosite = saturatedFatPctStruct
    
    // MG solide = MG saturée / MG * 100
    const mgSolide =
      fatPctStruct > 0 ? (saturatedFatPctStruct / fatPctStruct) * 100 : 0

        // Point de congélation (molalité)
    const waterKg = (waterFraction / 100) * (totalQty / 1000) // approx si quantités en g → kg
    // Si quantités sont en %, totalQty ~ 100 ; on travaille en fraction
        const waterFraction01 = waterFraction / 100
    const waterG = totalQty * waterFraction01
    const molality = waterG > 0 ? (moles * 1000) / waterG : 0
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
    const parfumPct = totalQty > 0 ? (parfumMass / totalQty) * 100 : 0
    
    setCalcs({
         totalSolids,
      fat: fatPct,
      protein: proteinPct,
      sugar: sugarPct,
      fiber: fiberPct,
      minerals: mineralsPct,
      alcohol: alcoholPct,
      parfum: parfumPct,
      emulsifier: emulsifierPct,
      stabilizer: stabilizerPct,
      saturatedFat: saturatedFatPct,
      saturation: saturationPct,
      sodium: (sodium / totalQty) * 100,
      calcium: (calcium / totalQty) * 100,
      cost: cost / totalQty,
      sweetness: (sweetness / totalQty) * 100,
      creaminess: onctuosite,
          
      density,
      esdl: esdlPct,
      esdlVsSolvent,
      esdlOptimized: (17 * (100 - totalSolids)) / 117,
            foisonnement: fatPctStruct + proteinPctStruct + totalSolids,
      freezingPoint,
      iceFraction,
      molarMassStabi: totalQty > 0 ? (stabiMassSum * 100) / totalQty : 0,
            emulsifierVsFat:
        fatPctStruct > 0 ? (emulsifierPct / fatPctStruct) * 100 : 0,
      mgSolide,
      kcal: 9 * fatPct + 4 * proteinPct + 4 * sugarPct + 7 * alcoholPct,
    })
  }, [lines, servingTemp])

   if (loading) {
    return (
      <main style={{ padding: 40, fontFamily: "sans-serif" }}>Chargement...</main>
    )
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
           const limit =
      limitKey === "emulsifierVsFat"
        ? { min: 0, max: 4 }
        : limitKey
          ? limits[limitKey]
          : undefined
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
          {value != null && !Number.isNaN(Number(value))
            ? Number(value).toFixed(digits)
            : "-"}
          {unit ? " " + unit : ""}
        </div>
               {limit && (
          <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
            Min {Number(limit.min).toFixed(digits)} - Max{" "}
            {Number(limit.max).toFixed(digits)}
          </div>
        )}
      </div>
    )
  }
  const currentTotal = lines.reduce((s, l) => s + (l.quantity || 0), 0)
  function updateQuantity(index: number, value: string) {
    const n = value === "" ? 0 : Number(value)
    if (Number.isNaN(n) || n < 0) return
    setLines((prev) =>
      prev.map((line, i) =>
        i === index ? { ...line, quantity: n } : line
      )
    )
    setDirty(true)
  }
  async function saveName() {
    if (!recipe?.id || !nameDraft.trim()) return
    const { error } = await supabase
      .from("recipes")
      .update({ name: nameDraft.trim() })
      .eq("id", recipe.id)
    if (error) {
      alert(error.message)
      return
    }
    setRecipe({ ...recipe, name: nameDraft.trim() })
    setEditingName(false)
  }
    async function removeIngredient(lineId: string, index: number) {
    if (!confirm("Retirer cet ingredient de la recette ?")) return
    await supabase.from("recipe_ingredients").delete().eq("id", lineId)
    setLines((prev) => prev.filter((_, i) => i !== index))
  }
    async function addIngredient() {
    if (!recipe?.id || !addIngId) return
    const qty = Number(addQty) || 0
    if (qty <= 0) {
      alert("Quantite invalide")
      return
    }
    const { error } = await supabase.from("recipe_ingredients").insert({
      recipe_id: recipe.id,
      ingredient_id: addIngId,
      quantity: qty,
    })
    if (error) {
      alert(error.message)
      return
    }
    // recharger les lignes
    const { data } = await supabase
      .from("recipe_ingredients")
      .select(
        "id, quantity, ingredients(name, category, fat, protein, sugar, fiber, minerals, alcohol, stabilizer, sweetness_factor, molar_mass, saturated_fat, sodium, calcium, cost, solubility)"
      )
      .eq("recipe_id", recipe.id)
    setLines((data as unknown as RecipeLine[]) || [])
    setAddIngId("")
    setAddQty("1")
  }
  async function saveQuantities() {
    if (!recipe?.id) return
    setSaving(true)
    for (const line of lines) {
      if (!line.id) continue
      await supabase
        .from("recipe_ingredients")
        .update({ quantity: line.quantity })
        .eq("id", line.id)
    }
    setDirty(false)
    setSaving(false)
  }
    async function deleteRecipe() {
    if (!recipe?.id) return
    if (
      !confirm(
        `Supprimer definitivement la recette « ${recipe.name} » ?\nCette action est irreversible.`
      )
    ) {
      return
    }

    await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("recipe_id", recipe.id)

    const { error: delError } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipe.id)

    if (delError) {
      alert("Erreur lors de la suppression : " + delError.message)
      return
    }

    router.push("/recipes")
  }

  async function applyScale() {
    const target = Number(scaleTarget)
    if (!target || target <= 0 || currentTotal <= 0) {
      alert("Indique un total desire valide.")
      return
    }
    if (
      !confirm(
        `Passer la recette de ${currentTotal.toFixed(2)} a ${target} ?\nLes quantites seront enregistrees.`
      )
    ) {
      return
    }
    setScaling(true)
    const factor = target / currentTotal
    for (const line of lines) {
      Math.round((line.quantity || 0) * factor * 10000) / 10000
      await supabase
        .from("recipe_ingredients")
        .update({ quantity: newQty })
        .eq("id", line.id)
    }
    const { data } = await supabase
      .from("recipe_ingredients")
      .select(
        "id, quantity, ingredients(name, category, fat, protein, sugar, fiber, minerals, alcohol, stabilizer, sweetness_factor, molar_mass, saturated_fat, sodium, calcium, cost, solubility)"
      )
      .eq("recipe_id", recipe.id)
    setLines((data as unknown as RecipeLine[]) || [])
    setScaleTarget("")
    setScaling(false)
  }


  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <p style={{ marginBottom: 12 }}>
        <Link href="/dashboard">Tableau de bord</Link>
        {" · "}
        <Link href="/recipes">Mes recettes</Link>
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <select
          value={addIngId}
          onChange={(e) => setAddIngId(e.target.value)}
          style={{ padding: 8, minWidth: 200 }}
        >
          <option value="">— Choisir un ingredient —</option>
          {allIngredients.map((ing) => (
            <option key={ing.id} value={ing.id}>
              {ing.name} ({ing.category})
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          min="0"
          value={addQty}
          onChange={(e) => setAddQty(e.target.value)}
          style={{ width: 90, padding: 8 }}
        />
        <button type="button" onClick={addIngredient} style={{ padding: "8px 14px", fontWeight: 600 }}>
          Ajouter
        </button>
      </div>
            {editingName ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            style={{ fontSize: 24, fontWeight: 700, padding: "6px 10px", flex: 1 }}
          />
          <button type="button" onClick={saveName}>OK</button>
          <button type="button" onClick={() => { setEditingName(false); setNameDraft(recipe.name) }}>
            Annuler
          </button>
        </div>
      ) : (
        <h1 style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {recipe.name}
          <button
            type="button"
            onClick={() => setEditingName(true)}
            style={{ fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            Renommer
          </button>
        </h1>
      )}
                      <p style={{ color: "#555", marginTop: 8 }}>
        {categoryLabel[recipe.category] || recipe.category}
        {" · "}
        {tempLabel[servingTemp] || servingTemp}
        {recipe.updated_at && (
          <>
            {" · "}
            {new Date(recipe.updated_at).toLocaleDateString("fr-FR")}
          </>
        )}
      </p>

      <div
        className="recipe-layout"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 1fr) minmax(280px, 420px)",
          gap: 24,
          alignItems: "start",
          marginBottom: 28,
        }}
      >
        <div>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Ingredients</h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Ingredient</th>
                <th style={{ padding: 8, width: 110 }}>Quantite</th>
                <th style={{ padding: 8, width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
                        {lines.map((line, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>{line.ingredients?.name || "-"}</td>
                  <td style={{ padding: 8 }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                                            value={
                        line.quantity != null
                          ? Number(line.quantity).toFixed(2)
                          : "0.00"
                      }
                      onChange={(e) => updateQuantity(i, e.target.value)}
                      style={{
                        width: 100,
                        padding: "6px 8px",
                        border: "1px solid #ccc",
                        borderRadius: 6,
                        fontSize: 14,
                      }}
                    />
                  </td>
                  <td style={{ padding: 8 }}>
                    <button
                      type="button"
                      onClick={() => line.id && removeIngredient(line.id, i)}
                      style={{
                        color: "#c62828",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                      }}
                    >
                      Retirer
                    </button>
                  </td>
                </tr>
              ))}
             </tbody>
      </table>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600 }}>
          Total actuel : {currentTotal.toFixed(2)}
        </div>
        <label style={{ fontSize: 14 }}>
          Total desire :{" "}
          <input
            type="number"
            step="0.01"
            min="0"
            value={scaleTarget}
            onChange={(e) => setScaleTarget(e.target.value)}
            style={{
              width: 100,
              padding: "6px 8px",
              border: "1px solid #ccc",
              borderRadius: 6,
              marginLeft: 6,
            }}
          />
        </label>
        <button
          type="button"
          onClick={applyScale}
          disabled={scaling || !scaleTarget}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "#fff",
            cursor: scaling ? "default" : "pointer",
            fontWeight: 600,
          }}
        >
          {scaling ? "Calcul..." : "Appliquer le total"}
        </button>
      </div>
      <div style={{ marginBottom: 24, display: "flex", gap: 12, alignItems: "center" }}>
        <button
          type="button"
          onClick={saveQuantities}
          disabled={!dirty || saving}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            background: dirty ? "#9b1b33" : "#ccc",
            color: "#fff",
            cursor: dirty ? "pointer" : "default",
            fontWeight: 600,
          }}
        >
          {saving ? "Enregistrement..." : "Enregistrer les quantites"}
        </button>
        {dirty && (
          <span style={{ fontSize: 13, color: "#9b1b33" }}>
            Modifications non enregistrees
          </span>
        )}
      </div>
            <button
        type="button"
        onClick={deleteRecipe}
        style={{
          padding: "10px 18px",
          borderRadius: 8,
          border: "1px solid #c62828",
          background: "#fff",
          color: "#c62828",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
                       Supprimer la recette
      </button>
        </div>

        <div>
          {calcs &&
            (() => {
              const L = limits
              const axes: {
                key: string
                label: string
                value: number
                min?: number
                max?: number
                subLabel?: string
                subValue?: number
                subUnit?: string
                subMin?: number
                subMax?: number
              }[] = []

              axes.push({
                key: "totalSolids",
                label: "Solides totaux",
                value: calcs.totalSolids,
                min: L.totalSolids?.min,
                max: L.totalSolids?.max,
                subLabel: "Densite",
                subValue: calcs.density,
                subUnit: "",
                subMin: L.density?.min,
                subMax: L.density?.max,
              })

              if (!isSorbet) {
                axes.push({
                  key: "creaminess",
                  label: "Onctuosite",
                  value: calcs.creaminess,
                  min: L.creaminess?.min,
                  max: L.creaminess?.max,
                  subLabel: "MG solide",
                  subValue: calcs.mgSolide,
                  subUnit: "%",
                  subMin: L.mgSolide?.min,
                  subMax: L.mgSolide?.max,
                })
                const el = emulsifierVsFatLimits(calcs.fat)
                axes.push({
                  key: "emulsifierVsFat",
                  label: "Emulsif/MG",
                  value: calcs.emulsifierVsFat,
                  min: el.min,
                  max: el.max,
                })
              }

              axes.push({
                key: "molarMassStabi",
                label: "Indice de viscosite",
                value: calcs.molarMassStabi,
                min: L.molarMassStabi?.min,
                max: L.molarMassStabi?.max,
              })

              if (!isSorbet && !isVegan) {
                axes.push({
                  key: "esdl",
                  label: "ESDL",
                  value: calcs.esdl ?? 0,
                  min: L.esdl?.min,
                  max: L.esdl?.max,
                  subLabel: "ESDL vs solvant",
                  subValue: calcs.esdlVsSolvent ?? 0,
                  subUnit: "%",
                  subMin: L.esdlVsSolvent?.min,
                  subMax: L.esdlVsSolvent?.max,
                })
              }

              if (isSorbet || isVegan) {
                axes.push({
                  key: "saturation",
                  label: "Saturation solution",
                  value: calcs.saturation,
                  min: L.saturation?.min,
                  max: L.saturation?.max,
                })
              }

              if (isSorbet) {
                axes.push({
                  key: "foisonnement",
                  label: "Foisonnement",
                  value: calcs.foisonnement ?? 0,
                  min: L.foisonnement?.min,
                  max: L.foisonnement?.max,
                })
              }

              axes.push({
                key: "sweetness",
                label: "Taux sucrant",
                value: calcs.sweetness ?? 0,
                min: L.sweetness?.min,
                max: L.sweetness?.max,
              })

              axes.push({
                key: "iceFraction",
                label: "Fraction de glace",
                value: calcs.iceFraction,
                min: L.iceFraction?.min,
                max: L.iceFraction?.max,
                subLabel: "Point de congelation",
                subValue: calcs.freezingPoint,
                subUnit: "C",
                subMin: L.freezingPoint?.min,
                subMax: L.freezingPoint?.max,
              })

              return (
                <>
                                    <h2 style={{ fontSize: 18, marginBottom: 8, textAlign: "center" }}>
                    Graphe de Structure & Texture
                  </h2>
                  <ScoopChart axes={axes} />
                </>
              )
            })()}
        </div>
      </div>

      {calcs && (
        <div>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
            Vert = dans les limites · Rouge = hors limites
          </p>
          {isSorbet ? (
            <>
              <h2 style={{ fontSize: 20, marginBottom: 12 }}>Composition</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                {renderCard("Glucides", calcs.sugar, "%", "sugar", 1)}
                {renderCard("Proteines", calcs.protein, "%", "protein", 1)}
                {renderCard("Stabilisant", calcs.stabilizer, "%", "stabilizer", 2)}
                {renderCard("Alcool", calcs.alcohol, "%", "alcohol", 1)}
                {renderCard("Kcal / 100g", calcs.kcal ?? 0, "", undefined, 0)}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 40 }}>
                {renderCard("Fibres", calcs.fiber, "%", "fiber", 1)}
                {renderCard("Sodium", calcs.sodium, "mg", "sodium", 0)}
                {renderCard("Calcium", calcs.calcium ?? 0, "mg", undefined, 0)}
                {renderCard("Parfum", calcs.parfum ?? 0, "%", undefined, 1)}
                {renderCard("Cout", calcs.cost, "", undefined, 2)}
              </div>

              <h2 style={{ fontSize: 20, marginBottom: 12 }}>Structure et Texture</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                {renderCard("Solides totaux", calcs.totalSolids, "%", "totalSolids", 1)}
                {renderCard("Taux sucrant", calcs.sweetness ?? 0, "%", "sweetness", 1)}
                {renderCard("Saturation", calcs.saturation, "%", "saturation", 0)}
                {renderCard("Fraction de glace", calcs.iceFraction, "%", "iceFraction", 2)}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {renderCard("Densite", calcs.density, "", "density", 3)}
                {renderCard("Masse molaire stabi", calcs.molarMassStabi, "", "molarMassStabi", 0)}
                {renderCard("Foisonnement", calcs.foisonnement ?? 0, "%", "foisonnement", 0)}
                {renderCard("Point de congelation", calcs.freezingPoint, "C", "freezingPoint", 2)}
              </div>
            </>
          ) : isVegan ? (
            <>
              <h2 style={{ fontSize: 20, marginBottom: 12 }}>Composition</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                {renderCard("Matiere grasse", calcs.fat, "%", "fat", 1)}
                {renderCard("Glucides", calcs.sugar, "%", "sugar", 1)}
                {renderCard("Proteines", calcs.protein, "%", "protein", 1)}
                {renderCard("Sodium", calcs.sodium, "mg", "sodium", 0)}
                {renderCard("Alcool", calcs.alcohol, "%", "alcohol", 1)}
                {renderCard("Kcal / 100g", calcs.kcal ?? 0, "", undefined, 0)}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 40 }}>
                {renderCard("MG saturee", calcs.saturatedFat, "%", "saturatedFat", 1)}
                {renderCard("Fibres", calcs.fiber, "%", "fiber", 1)}
                {renderCard("Stabilisant", calcs.stabilizer, "%", "stabilizer", 2)}
                {renderCard("Emulsifiant", calcs.emulsifier ?? 0, "%", "emulsifier", 2)}
                {renderCard("Calcium", calcs.calcium ?? 0, "mg", undefined, 0)}  
                {renderCard("Parfum", calcs.parfum ?? 0, "%", undefined, 1)}
                {renderCard("Cout", calcs.cost, "", undefined, 2)}
              </div>

              <h2 style={{ fontSize: 20, marginBottom: 12 }}>Structure et Texture</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                {renderCard("Solides totaux", calcs.totalSolids, "%", "totalSolids", 1)}
                {renderCard("Onctuosite", calcs.creaminess, "", "creaminess", 0)}
                {renderCard("Emulsifiant vs MG", calcs.emulsifierVsFat, "%", "emulsifierVsFat", 2)}
                {renderCard("Taux sucrant", calcs.sweetness ?? 0, "%", "sweetness", 1)}
                {renderCard("Fraction de glace", calcs.iceFraction, "%", "iceFraction", 2)}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {renderCard("Densite", calcs.density, "", "density", 3)}
                {renderCard("MG solide", calcs.mgSolide, "%", "mgSolide", 1)}
                {renderCard("Masse molaire stabi", calcs.molarMassStabi, "", "molarMassStabi", 0)}
                {renderCard("Saturation", calcs.saturation, "%", "saturation", 0)}
                {renderCard("Point de congelation", calcs.freezingPoint, "C", "freezingPoint", 2)}
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 20, marginBottom: 12 }}>Composition</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                {renderCard("Matiere grasse", calcs.fat, "%", "fat", 1)}
                {renderCard("Glucides", calcs.sugar, "%", "sugar", 1)}
                {renderCard("Proteines", calcs.protein, "%", "protein", 1)}
                {renderCard("Sodium", calcs.sodium, "mg", "sodium", 0)}
                {renderCard("Alcool", calcs.alcohol, "%", "alcohol", 1)}
                {renderCard("Kcal / 100g", calcs.kcal ?? 0, "", undefined, 0)}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 40 }}>
                {renderCard("MG saturee", calcs.saturatedFat, "%", "saturatedFat", 1)}
                {renderCard("Fibres", calcs.fiber, "%", "fiber", 1)}
                {renderCard("Stabilisant", calcs.stabilizer, "%", "stabilizer", 2)}
                {renderCard("Emulsifiant", calcs.emulsifier ?? 0, "%", "emulsifier", 2)}
                {renderCard("Calcium", calcs.calcium ?? 0, "mg", undefined, 0)}
               {renderCard("Parfum", calcs.parfum ?? 0, "%", undefined, 1)}
                {renderCard("Cout", calcs.cost, "", undefined, 2)}
              </div>

              <h2 style={{ fontSize: 20, marginBottom: 12 }}>Structure et Texture</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                {renderCard("Solides totaux", calcs.totalSolids, "%", "totalSolids", 1)}
                {renderCard("Onctuosite", calcs.creaminess, "", "creaminess", 0)}
                {renderCard("Emulsifiant vs MG", calcs.emulsifierVsFat, "%", "emulsifierVsFat", 2)}
                {renderCard("ESDL", calcs.esdl ?? 0, "%", "esdl", 1)}
                {renderCard("ESDL vs solvant", calcs.esdlVsSolvent ?? 0, "%", "esdlVsSolvent", 1)}
                {renderCard("Fraction de glace", calcs.iceFraction, "%", "iceFraction", 2)}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {renderCard("Densite", calcs.density, "", "density", 3)}
                {renderCard("MG solide", calcs.mgSolide, "%", "mgSolide", 1)}
                {renderCard("Masse molaire stabi", calcs.molarMassStabi, "", "molarMassStabi", 0)}
                {renderCard("ESDL optimise", calcs.esdlOptimized ?? 0, "%", undefined, 1)}
                {renderCard("Taux sucrant", calcs.sweetness ?? 0, "%", "sweetness", 1)}
                {renderCard("Point de congelation", calcs.freezingPoint, "C", "freezingPoint", 2)}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  )
}

