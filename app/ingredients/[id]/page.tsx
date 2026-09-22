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
        setError("Recette non trouvee")
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

  // PLACEHOLDER_CALCS
  // PLACEHOLDER_RENDER
}
