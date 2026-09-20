"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

type Ingredient = {
  id: string
  name: string
  category: string | null
}

type Line = {
  ingredient_id: string
  quantity: string
}

export default function NewRecipePage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [category, setCategory] = useState<"ice_cream" | "sorbet" | "vegan">("ice_cream")
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [lines, setLines] = useState<Line[]>([{ ingredient_id: "", quantity: "" }])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
        .select("client_id")
        .eq("id", user.id)
        .single()

      if (!userData) {
        setError("Utilisateur non trouvé")
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from("ingredients")
        .select("id, name, category")
        .eq("client_id", userData.client_id)
        .eq("is_active", true)
        .order("name")

      setIngredients(data || [])
      setLoading(false)
    }

    load()
  }, [router])

  function addLine() {
    setLines([...lines, { ingredient_id: "", quantity: "" }])
  }

  function updateLine(index: number, field: "ingredient_id" | "quantity", value: string) {
    const updated = [...lines]
    updated[index] = { ...updated[index], [field]: value }
    setLines(updated)
  }

  function removeLine(index: number) {
    if (lines.length === 1) return
    setLines(lines.filter((_, i) => i !== index))
  }

  const total = lines.reduce((sum, line) => sum + (parseFloat(line.quantity) || 0), 0)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    const validLines = lines.filter((l) => l.ingredient_id && parseFloat(l.quantity) > 0)
    if (validLines.length === 0) {
      setError("Ajoutez au moins un ingrédient avec une quantité")
      setSaving(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }

    const { data: userData } = await supabase
      .from("users")
      .select("client_id")
      .eq("id", user.id)
      .single()

    if (!userData) {
      setError("Utilisateur non trouvé")
      setSaving(false)
      return
    }

    // Créer la recette
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        client_id: userData.client_id,
        user_id: user.id,
        name,
        category,
        total_quantity: total,
      })
      .select()
      .single()

    if (recipeError || !recipe) {
      setError(recipeError?.message || "Erreur création recette")
      setSaving(false)
      return
    }

    // Ajouter les ingrédients
    const rows = validLines.map((l) => ({
      recipe_id: recipe.id,
      ingredient_id: l.ingredient_id,
      quantity: parseFloat(l.quantity),
    }))

    const { error: linesError } = await supabase
      .from("recipe_ingredients")
      .insert(rows)

    if (linesError) {
      setError(linesError.message)
      setSaving(false)
      return
    }

    router.push(`/recipes/${recipe.id}`)
  }

  if (loading) {
    return <main style={{ padding: 40, fontFamily: "sans-serif" }}>Chargement...</main>
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto" }}>
      <h1>Nouvelle recette</h1>
      <p style={{ margin: "12px 0 24px" }}>
        <Link href="/dashboard">← Retour au tableau de bord</Link>
      </p>

      <form onSubmit={handleSave}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Nom de la recette *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ padding: 10, fontSize: 16, width: "100%", maxWidth: 400 }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Catégorie *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            style={{ padding: 10, fontSize: 16 }}
          >
            <option value="ice_cream">Crème glacée</option>
            <option value="sorbet">Sorbet</option>
            <option value="vegan">Vegan</option>
          </select>
        </div>

        <h3 style={{ marginBottom: 12 }}>Ingrédients</h3>

        {lines.map((line, index) => (
          <div key={index} style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={line.ingredient_id}
              onChange={(e) => updateLine(index, "ingredient_id", e.target.value)}
              required
              style={{ padding: 8, fontSize: 15, minWidth: 220, flex: 1 }}
            >
              <option value="">Choisir un ingrédient...</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name}{ing.category ? ` (${ing.category})` : ""}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Quantité"
              value={line.quantity}
              onChange={(e) => updateLine(index, "quantity", e.target.value)}
              required
              style={{ padding: 8, fontSize: 15, width: 120 }}
            />
            <button
              type="button"
              onClick={() => removeLine(index)}
              style={{ padding: "8px 12px", cursor: "pointer", background: "#fee", border: "1px solid #fcc" }}
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addLine}
          style={{ padding: "8px 14px", marginTop: 4, marginBottom: 16, cursor: "pointer" }}
        >
          + Ajouter une ligne
        </button>

        <p style={{ marginBottom: 20, fontSize: 16 }}>
          <strong>Total quantités :</strong> {total.toFixed(2)}
        </p>

        <button
          type="submit"
          disabled={saving}
          style={{ padding: "12px 24px", fontSize: 16, cursor: "pointer", background: "#111", color: "white", border: "none", borderRadius: 6 }}
        >
          {saving ? "Enregistrement..." : "Enregistrer la recette"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: 16 }}>{error}</p>}
    </main>
  )
}
