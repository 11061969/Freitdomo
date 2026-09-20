"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

type RecipeLine = {
  quantity: number
  ingredients: {
    name: string
    category: string | null
  } | null
}

type Recipe = {
  id: string
  name: string
  category: string
  total_quantity: number | null
  created_at: string
}

export default function RecipeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [lines, setLines] = useState<RecipeLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .select("id, name, category, total_quantity, created_at")
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
        .select("quantity, ingredients(name, category)")
        .eq("recipe_id", id)

      setLines((linesData as any) || [])
      setLoading(false)
    }

    load()
  }, [id, router])

  const categoryLabel: Record<string, string> = {
    ice_cream: "Crème glacée",
    sorbet: "Sorbet",
    vegan: "Vegan",
  }

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
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <p style={{ marginBottom: 12 }}>
        <Link href="/dashboard">← Tableau de bord</Link>
        {" · "}
        <Link href="/recipes">Mes recettes</Link>
      </p>

      <h1>{recipe.name}</h1>
      <p style={{ color: "#555", marginTop: 8 }}>
        {categoryLabel[recipe.category] || recipe.category}
        {recipe.total_quantity != null && ` · Total : ${recipe.total_quantity}`}
      </p>

      <h3 style={{ marginTop: 32, marginBottom: 12 }}>Composition</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: 10 }}>Ingrédient</th>
            <th style={{ padding: 10 }}>Catégorie</th>
            <th style={{ padding: 10 }}>Quantité</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 10 }}>{line.ingredients?.name || "—"}</td>
              <td style={{ padding: 10 }}>{line.ingredients?.category || "—"}</td>
              <td style={{ padding: 10 }}>{line.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 40, padding: 20, background: "#f8f8f8", borderRadius: 8 }}>
        <p style={{ color: "#666" }}>
          Les calculs (Solides totaux, Point de congélation, Fraction de glace, Boule de glace…) arriveront dans la prochaine étape.
        </p>
      </div>
    </main>
  )
}
