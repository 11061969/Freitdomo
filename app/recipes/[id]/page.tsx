"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import ScoopChart from "@/components/ScoopChart"

// --- VOS TYPES ET FONCTIONS LOGIQUES (INCHANGÉS) ---
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
    creaminess: { min: 4, max: 9 },
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
    structure.freezingPoint = { min: -2.6, max: -1.8 }
    structure.iceFraction = { min: 84, max: 86 }
  }

  if (temp === "soft") {
    structure.totalSolids = { min: 30, max: 38 }
    structure.creaminess = { min: 2, max: 6 }
    structure.freezingPoint = { min: -2.4, max: -1.7 }
    structure.iceFraction = { min: 75.5, max: 77.5 }
    structure.mgSolide = { min: 35, max: 65 }
  }

  return { ...composition, ...structure }
}

function getStatus(value: number, limit?: Limit) {
  if (!limit) return "none"
  if (value >= limit.min && value <= limit.max) return "ok"
  return "bad"
}

// Nouvelles couleurs Tailwind (plus douces)
const colors: Record<string, string> = {
  ok: "bg-emerald-50 border-emerald-200 text-emerald-900",
  bad: "bg-rose-50 border-rose-200 text-rose-900",
  none: "bg-gray-50 border-gray-200 text-gray-800",
}

function idealEmulsifierVsFat(fatPct: number): number {
  const points = [
    { fat: 4, ratio: 4 }, { fat: 6, ratio: 2.5 }, { fat: 8, ratio: 1.88 },
    { fat: 9, ratio: 1.7 }, { fat: 10, ratio: 1.5 }, { fat: 12, ratio: 1.25 },
    { fat: 14, ratio: 0.71 }, { fat: 16, ratio: 0 },
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
  return { min: ideal * 0.85, max: ideal * 1.15 }
}

export default function RecipeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  // --- TOUS VOS ÉTATS ET USEEFFECTS (INCHANGÉS) ---
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
  const [dbLimits, setDbLimits] = useState<Record<string, Limit> | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  
  // (Vos useEffect de chargement et de calculs sont ici - je les ai gardés identiques)
  // ... [Copier-coller vos 3 useEffect ici] ...

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      const { data: userData } = await supabase.from("users").select("client_id, clients(serving_temperature)").eq("id", user.id).single()
      if (userData?.client_id) setClientId(userData.client_id)
      if (userData && (userData as any).clients?.serving_temperature) setServingTemp((userData as any).clients.serving_temperature)
      
      let ingQuery = supabase.from("ingredients").select("id, name, category").eq("is_active", true).order("name")
      if (userData?.client_id) ingQuery = ingQuery.eq("client_id", userData.client_id)
      const { data: ings } = await ingQuery
      const seen = new Set<string>()
      const unique = (ings || []).filter((ing) => {
        const key = (ing.name || "").trim().toLowerCase() + "|" + (ing.category || "").trim().toLowerCase()
        if (seen.has(key)) return false
        seen.add(key); return true
      })
      setAllIngredients(unique)

      const { data: recipeData, error: recipeError } = await supabase.from("recipes").select("id, name, category, total_quantity, updated_at, client_id, serving_temperature").eq("id", id).single()
      if (recipeError || !recipeData) { setError("Recette non trouvée"); setLoading(false); return }

      setRecipe(recipeData)
      if (recipeData.serving_temperature) setServingTemp(recipeData.serving_temperature)
      setNameDraft(recipeData.name || "")

      const { data: linesData } = await supabase.from("recipe_ingredients").select("id, quantity, ingredients(name, category, fat, protein, sugar, fiber, minerals, alcohol, stabilizer, sweetness_factor, molar_mass, saturated_fat, sodium, calcium, cost, solubility)").eq("recipe_id", id)
      setLines((linesData as any) || [])
      setLoading(false)
    }
    load()
  }, [id, router])

  useEffect(() => {
    async function loadLimits() {
      if (!clientId || !recipe) return
      const raw = (recipe.category || "").toLowerCase()
      const cat = raw.includes("sorbet") ? "sorbet" : raw.includes("vegan") ? "vegan" : "ice_cream"
      const { data, error } = await supabase.from("client_limits").select("param_key, min_value, max_value").eq("client_id", clientId).eq("category", cat).eq("serving_temp", servingTemp)
      if (error || !data || data.length === 0) { setDbLimits(null); return }
      const map: Record<string, Limit> = {}
      for (const row of data) { map[row.param_key] = { min: Number(row.min_value), max: Number(row.max_value) } }
      setDbLimits(map)
    }
    loadLimits()
  }, [clientId, recipe, servingTemp])

  // ... [Le gros useEffect de calculs (lignes 145 à 350) est à copier-coller ici tel quel] ...
  
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
    const [dbLimits, setDbLimits] = useState<Record<string, Limit> | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  
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
      
      if (userData?.client_id) {
        setClientId(userData.client_id)
      }
      if (userData && (userData as any).clients?.serving_temperature) {
        setServingTemp((userData as any).clients.serving_temperature)
      }
      let ingQuery = supabase
        .from("ingredients")
        .select("id, name, category")
        .eq("is_active", true)
        .order("name")
      if (userData?.client_id) {
        ingQuery = ingQuery.eq("client_id", userData.client_id)
      }
      const { data: ings } = await ingQuery
      const seen = new Set<string>()
      const unique = (ings || []).filter((ing) => {
        const key =
          (ing.name || "").trim().toLowerCase() +
          "|" +
          (ing.category || "").trim().toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      setAllIngredients(unique)
      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
       .select("id, name, category, total_quantity, updated_at, client_id, serving_temperature")
        .eq("id", id)
        .single()

      if (recipeError || !recipeData) {
        setError("Recette non trouvée")
        setLoading(false)
        return
      }

      setRecipe(recipeData)
      if (recipeData.serving_temperature) {
  setServingTemp(recipeData.serving_temperature)
}
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
    async function loadLimits() {
      if (!clientId || !recipe) return
      const raw = (recipe.category || "").toLowerCase()
      const cat = raw.includes("sorbet")
        ? "sorbet"
        : raw.includes("vegan")
          ? "vegan"
          : "ice_cream"
      const { data, error } = await supabase
        .from("client_limits")
        .select("param_key, min_value, max_value")
        .eq("client_id", clientId)
        .eq("category", cat)
        .eq("serving_temp", servingTemp)

      if (error || !data || data.length === 0) {
        setDbLimits(null)
        return
      }
      const map: Record<string, Limit> = {}
      for (const row of data) {
        map[row.param_key] = {
          min: Number(row.min_value),
          max: Number(row.max_value),
        }
      }
      setDbLimits(map)
    }
    loadLimits()
  }, [clientId, recipe, servingTemp])

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

  useEffect(() => {
    if (lines.length === 0) { setCalcs(null); return }
    // COPIER TOUT LE BLOC DE CALCUL ICI SANS MODIFICATION
    // (Pour des raisons de longueur, je ne le remets pas, mais gardez-le exactement tel quel)
  }, [lines, servingTemp]);

  // --- FONCTIONS D'ACTION (INCHANGÉES) ---
  function updateQuantity(index: number, value: string) { const n = value === "" ? 0 : Number(value); if (Number.isNaN(n) || n < 0) return; setLines((prev) => prev.map((line, i) => i === index ? { ...line, quantity: n } : line)); setDirty(true) }
  async function saveName() { /* ... garder tel quel ... */ }
  async function removeIngredient(lineId: string, index: number) { /* ... garder tel quel ... */ }
  async function addIngredient() { /* ... garder tel quel ... */ }
  async function saveQuantities() { /* ... garder tel quel ... */ }
  async function deleteRecipe() { /* ... garder tel quel ... */ }
  function exportPdf() { window.print() }
  async function applyScale() { /* ... garder tel quel ... */ }

  // --- RENDU VISUEL (NOUVEAU DESIGN) ---
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-sans">Chargement de la recette...</div>
  if (error || !recipe) return <div className="p-10 text-center text-red-500 font-sans">{error || "Erreur"} <br/><Link href="/dashboard" className="underline mt-4 block">Retour au tableau de bord</Link></div>

  const limits = dbLimits && Object.keys(dbLimits).length > 0 ? dbLimits : getLimits((recipe.category || "").toLowerCase().includes("sorbet") ? "sorbet" : (recipe.category || "").toLowerCase().includes("vegan") ? "vegan" : "ice_cream", servingTemp)
  const isSorbet = (recipe.category || "").toLowerCase().includes("sorbet")
  const isVegan = (recipe.category || "").toLowerCase().includes("vegan")
  const currentTotal = lines.reduce((s, l) => s + (l.quantity || 0), 0)

  const categoryLabel: Record<string, string> = { ice_cream: "Crème glacée", sorbet: "Sorbet", vegan: "Vegan" }
  const tempLabel: Record<string, string> = { soft: "-6 °C", gelato: "-11 °C", hard: "-18 °C" }

  // Nouvelle fonction de rendu des cartes avec Tailwind
  function renderCard(label: string, value: number, unit: string, limitKey?: string, digits = 2) {
    const limit = limitKey === "emulsifierVsFat" ? { min: 0, max: 4 } : limitKey ? limits[limitKey] : undefined
    const status = getStatus(value, limit)
    const colorClasses = colors[status]
    
    return (
      <div key={label} className={`p-4 rounded-xl border ${colorClasses} shadow-sm flex flex-col justify-between`}>
        <div className="text-xs font-medium opacity-70 mb-1">{label}</div>
        <div className="text-2xl font-bold tracking-tight">
          {value != null && !Number.isNaN(Number(value)) ? Number(value).toFixed(digits) : "-"}
          <span className="text-sm font-normal ml-1 opacity-80">{unit}</span>
        </div>
        {limit && <div className="text-[10px] mt-2 opacity-60">Min {Number(limit.min).toFixed(digits)} · Max {Number(limit.max).toFixed(digits)}</div>}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20 print:bg-white">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            {editingName ? (
              <div className="flex items-center gap-2 flex-1 max-w-lg">
                <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} className="text-xl font-bold px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9b1b33] flex-1" />
                <button onClick={saveName} className="px-3 py-1.5 bg-[#9b1b33] text-white text-sm font-medium rounded-lg hover:bg-[#7a1528]">Créer</button>
                <button onClick={() => { setEditingName(false); setNameDraft(recipe.name) }} className="px-3 py-1.5 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-lg">Annuler</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 truncate">{recipe.name}</h1>
                <button onClick={() => setEditingName(true)} className="text-xs font-medium text-[#9b1b33] bg-rose-50 px-2 py-1 rounded-md hover:bg-rose-100 transition-colors flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                  Dupliquer
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
             <div className="text-sm text-gray-500 hidden sm:block">
               {categoryLabel[recipe.category] || recipe.category} · {tempLabel[servingTemp] || ""}
             </div>
             <button onClick={saveQuantities} disabled={!dirty || saving} className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm ${dirty ? 'bg-[#9b1b33] text-white hover:bg-[#7a1528]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
              {saving ? "Enregistrement..." : "Enregistrer"}
             </button>
          </div>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLONNE GAUCHE (Ingrédients) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ingrédients</h3>
            
            {/* Barre d'ajout */}
            <div className="flex gap-2 mb-6 print:hidden">
              <select value={addIngId} onChange={(e) => setAddIngId(e.target.value)} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9b1b33] focus:border-transparent">
                <option value="">— Choisir un ingrédient —</option>
                {allIngredients.map((ing) => <option key={ing.id} value={ing.id}>{ing.name} ({ing.category})</option>)}
              </select>
              <input type="number" step="0.01" min="0" value={addQty} onChange={(e) => setAddQty(e.target.value)} className="w-24 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#9b1b33]" placeholder="Qté" />
              <button onClick={addIngredient} className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">Ajouter</button>
            </div>

            {/* Liste des ingrédients */}
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow group">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{line.ingredients?.name || "-"}</span>
                    <span className="text-xs text-gray-400">{line.ingredients?.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" step="0.01" min="0" value={line.quantity != null ? Number(line.quantity).toFixed(2) : "0.00"} onChange={(e) => updateQuantity(i, e.target.value)} className="w-24 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#9b1b33]" />
                    <button onClick={() => line.id && removeIngredient(line.id, i)} className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors print:hidden" title="Retirer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
              {lines.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucun ingrédient. Ajoutez-en un ci-dessus.</p>}
            </div>

            {/* Totaux */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-4">
              <div className="text-sm font-medium text-gray-600">Total actuel : <span className="text-lg font-bold text-gray-900">{currentTotal.toFixed(2)}</span></div>
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-sm text-gray-500">Total désiré :</label>
                <input type="number" step="0.01" min="0" value={scaleTarget} onChange={(e) => setScaleTarget(e.target.value)} className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#9b1b33]" />
                <button onClick={applyScale} disabled={scaling || !scaleTarget} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors">Équilibrer</button>
              </div>
            </div>
          </div>

          {/* Actions secondaires */}
          <div className="flex justify-between items-center print:hidden">
            <button onClick={deleteRecipe} className="text-sm font-medium text-rose-500 hover:text-rose-700 px-2 py-1 transition-colors">Supprimer la recette</button>
            <button onClick={exportPdf} className="text-sm font-medium text-gray-500 hover:text-gray-800 flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Exporter en PDF
            </button>
          </div>
        </div>

        {/* COLONNE DROITE (Analyse) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {calcs && (() => {
            const axes: any[] = []
            axes.push({ key: "totalSolids", label: "Solides totaux", value: calcs.totalSolids, min: limits.totalSolids?.min, max: limits.totalSolids?.max, subLabel: "Densité", subValue: calcs.density, subUnit: "", subMin: limits.density?.min, subMax: limits.density?.max })
            if (!isSorbet) {
              axes.push({ key: "creaminess", label: "Onctuosité", value: calcs.creaminess, min: limits.creaminess?.min, max: limits.creaminess?.max, subLabel: "MG solide", subValue: calcs.mgSolide, subUnit: "%", subMin: limits.mgSolide?.min, subMax: limits.mgSolide?.max })
              const el = emulsifierVsFatLimits(calcs.fat)
              axes.push({ key: "emulsifierVsFat", label: "Émulsif/MG", value: calcs.emulsifierVsFat, min: el.min, max: el.max })
            }
            axes.push({ key: "molarMassStabi", label: "Indice de viscosité", value: calcs.molarMassStabi, min: limits.molarMassStabi?.min, max: limits.molarMassStabi?.max })
            if (!isSorbet && !isVegan) {
              axes.push({ key: "esdl", label: "ESDL", value: calcs.esdl ?? 0, min: limits.esdl?.min, max: limits.esdl?.max, subLabel: "ESDL vs solvant", subValue: calcs.esdlVsSolvent ?? 0, subUnit: "%", subMin: limits.esdlVsSolvent?.min, subMax: limits.esdlVsSolvent?.max })
            }
            if (isSorbet || isVegan) {
              axes.push({ key: "saturation", label: "Saturation solution", value: calcs.saturation, min: limits.saturation?.min, max: limits.saturation?.max })
            }
            if (isSorbet) {
              axes.push({ key: "foisonnement", label: "Foisonnement", value: calcs.foisonnement ?? 0, min: limits.foisonnement?.min, max: limits.foisonnement?.max })
            }
            axes.push({ key: "sweetness", label: "Taux sucrant", value: calcs.sweetness ?? 0, min: limits.sweetness?.min, max: limits.sweetness?.max })
            axes.push({ key: "iceFraction", label: "Fraction de glace", value: calcs.iceFraction, min: limits.iceFraction?.min, max: limits.iceFraction?.max, subLabel: "Point de congélation", subValue: calcs.freezingPoint, subUnit: "C", subMin: limits.freezingPoint?.min, subMax: limits.freezingPoint?.max })

            return (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="text-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Structure & Texture</h2>
                  <Link href="/aide/indicateurs" className="text-xs text-[#9b1b33] hover:underline">Comprendre les indicateurs</Link>
                </div>
                <div className="flex justify-center">
                  <ScoopChart axes={axes} />
                </div>
              </div>
            )
          })()}
        </div>
      </main>

      {/* SECTION DÉTAILS (Cartes en bas) */}
      {calcs && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="flex h-3 w-3 rounded-full bg-emerald-500"></span><span className="text-xs text-gray-500">Dans les limites</span>
              <span className="flex h-3 w-3 rounded-full bg-rose-500 ml-4"></span><span className="text-xs text-gray-500">Hors limites</span>
            </div>

            {isSorbet ? (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Composition</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
                  {renderCard("Glucides", calcs.sugar, "%", "sugar", 1)}
                  {renderCard("Protéines", calcs.protein, "%", "protein", 1)}
                  {renderCard("Stabilisant", calcs.stabilizer, "%", "stabilizer", 2)}
                  {renderCard("Alcool", calcs.alcohol, "%", "alcohol", 1)}
                  {renderCard("Kcal / 100g", calcs.kcal ?? 0, "", undefined, 0)}
                  {renderCard("Fibres", calcs.fiber, "%", "fiber", 1)}
                  {renderCard("Sodium", calcs.sodium, "mg", "sodium", 0)}
                  {renderCard("Calcium", calcs.calcium ?? 0, "mg", undefined, 0)}
                  {renderCard("Parfum", calcs.parfum ?? 0, "%", undefined, 1)}
                  {renderCard("Coût", calcs.cost, "", undefined, 2)}
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 mt-8">Structure et Texture</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {renderCard("Solides totaux", calcs.totalSolids, "%", "totalSolids", 1)}
                  {renderCard("Taux sucrant", calcs.sweetness ?? 0, "%", "sweetness", 1)}
                  {renderCard("Saturation", calcs.saturation, "%", "saturation", 0)}
                  {renderCard("Fraction de glace", calcs.iceFraction, "%", "iceFraction", 2)}
                  {renderCard("Densité", calcs.density, "", "density", 3)}
                  {renderCard("Masse molaire stabi", calcs.molarMassStabi, "", "molarMassStabi", 0)}
                  {renderCard("Foisonnement", calcs.foisonnement ?? 0, "%", "foisonnement", 0)}
                  {renderCard("Point de congélation", calcs.freezingPoint, "C", "freezingPoint", 2)}
                </div>
              </>
            ) : isVegan ? (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Composition</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
                  {renderCard("Matière grasse", calcs.fat, "%", "fat", 1)}
                  {renderCard("Glucides", calcs.sugar, "%", "sugar", 1)}
                  {renderCard("Protéines", calcs.protein, "%", "protein", 1)}
                  {renderCard("Sodium", calcs.sodium, "mg", "sodium", 0)}
                  {renderCard("Alcool", calcs.alcohol, "%", "alcohol", 1)}
                  {renderCard("Kcal / 100g", calcs.kcal ?? 0, "", undefined, 0)}
                  {renderCard("MG saturée", calcs.saturatedFat, "%", "saturatedFat", 1)}
                  {renderCard("Fibres", calcs.fiber, "%", "fiber", 1)}
                  {renderCard("Stabilisant", calcs.stabilizer, "%", "stabilizer", 2)}
                  {renderCard("Émulsifiant", calcs.emulsifier ?? 0, "%", "emulsifier", 2)}
                  {renderCard("Calcium", calcs.calcium ?? 0, "mg", undefined, 0)}
                  {renderCard("Parfum", calcs.parfum ?? 0, "%", undefined, 1)}
                  {renderCard("Coût", calcs.cost, "", undefined, 2)}
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 mt-8">Structure et Texture</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {renderCard("Solides totaux", calcs.totalSolids, "%", "totalSolids", 1)}
                  {renderCard("Onctuosité", calcs.creaminess, "", "creaminess", 0)}
                  {renderCard("Émulsifiant vs MG", calcs.emulsifierVsFat, "%", "emulsifierVsFat", 2)}
                  {renderCard("Taux sucrant", calcs.sweetness ?? 0, "%", "sweetness", 1)}
                  {renderCard("Fraction de glace", calcs.iceFraction, "%", "iceFraction", 2)}
                  {renderCard("Densité", calcs.density, "", "density", 3)}
                  {renderCard("MG solide", calcs.mgSolide, "%", "mgSolide", 1)}
                  {renderCard("Masse molaire stabi", calcs.molarMassStabi, "", "molarMassStabi", 0)}
                  {renderCard("Saturation", calcs.saturation, "%", "saturation", 0)}
                  {renderCard("Point de congélation", calcs.freezingPoint, "C", "freezingPoint", 2)}
                </div>
              </>
            ) : (
              <>
                 <h2 className="text-lg font-bold text-gray-900 mb-4">Composition</h2>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
                  {renderCard("Matière grasse", calcs.fat, "%", "fat", 1)}
                  {renderCard("Glucides", calcs.sugar, "%", "sugar", 1)}
                  {renderCard("Protéines", calcs.protein, "%", "protein", 1)}
                  {renderCard("Sodium", calcs.sodium, "mg", "sodium", 0)}
                  {renderCard("Alcool", calcs.alcohol, "%", "alcohol", 1)}
                  {renderCard("Kcal / 100g", calcs.kcal ?? 0, "", undefined, 0)}
                  {renderCard("MG saturée", calcs.saturatedFat, "%", "saturatedFat", 1)}
                  {renderCard("Fibres", calcs.fiber, "%", "fiber", 1)}
                  {renderCard("Stabilisant", calcs.stabilizer, "%", "stabilizer", 2)}
                  {renderCard("Émulsifiant", calcs.emulsifier ?? 0, "%", "emulsifier", 2)}
                  {renderCard("Calcium", calcs.calcium ?? 0, "mg", undefined, 0)}
                  {renderCard("Parfum", calcs.parfum ?? 0, "%", undefined, 1)}
                  {renderCard("Coût", calcs.cost, "", undefined, 2)}
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 mt-8">Structure et Texture</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {renderCard("Solides totaux", calcs.totalSolids, "%", "totalSolids", 1)}
                  {renderCard("Onctuosité", calcs.creaminess, "", "creaminess", 0)}
                  {renderCard("Émulsifiant vs MG", calcs.emulsifierVsFat, "%", "emulsifierVsFat", 2)}
                  {renderCard("ESDL", calcs.esdl ?? 0, "%", "esdl", 1)}
                  {renderCard("ESDL vs solvant", calcs.esdlVsSolvent ?? 0, "%", "esdlVsSolvent", 1)}
                  {renderCard("Fraction de glace", calcs.iceFraction, "%", "iceFraction", 2)}
                  {renderCard("Densité", calcs.density, "", "density", 3)}
                  {renderCard("MG solide", calcs.mgSolide, "%", "mgSolide", 1)}
                  {renderCard("Masse molaire stabi", calcs.molarMassStabi, "", "molarMassStabi", 0)}
                  {renderCard("ESDL optimisé", calcs.esdlOptimized ?? 0, "%", undefined, 1)}
                  {renderCard("Taux sucrant", calcs.sweetness ?? 0, "%", "sweetness", 1)}
                  {renderCard("Point de congélation", calcs.freezingPoint, "C", "freezingPoint", 2)}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

