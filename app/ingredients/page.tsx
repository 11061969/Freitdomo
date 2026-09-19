"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

type Ingredient = {
  id: string
  name: string
  category: string | null
  fat: number
  protein: number
  sugar: number
  fiber: number
  stabilizer: number
  creaminess: number
  cost: number
}

export default function IngredientsPage() {
  const router = useRouter()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [filtered, setFiltered] = useState<Ingredient[]>([])
  const [search, setSearch] = useState("")
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
        .select("client_id")
        .eq("id", user.id)
        .single()

      if (!userData) {
        setError("Utilisateur non trouvé")
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("ingredients")
        .select("id, name, category, fat, protein, sugar, fiber, stabilizer, creaminess, cost")
        .eq("client_id", userData.client_id)
        .eq("is_active", true)
        .order("name")

      if (error) {
        setError(error.message)
      } else {
        setIngredients(data || [])
        setFiltered(data || [])
      }

      setLoading(false)
    }

    load()
  }, [router])

  // Filtre de recherche
  useEffect(() => {
    const q = search.toLowerCase().trim()
    if (!q) {
      setFiltered(ingredients)
      return
    }
    setFiltered(
      ingredients.filter(
        (ing) =>
          ing.name.toLowerCase().includes(q) ||
          (ing.category && ing.category.toLowerCase().includes(q))
      )
    )
  }, [search, ingredients])

  if (loading) {
    return <main style={{ padding: 40, fontFamily: "sans-serif" }}>Chargement...</main>
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Base d’ingrédients</h1>
        <Link 
          href="/ingredients/new"
          style={{ padding: "10px 18px", background: "#111", color: "white", borderRadius: 6, textDecoration: "none" }}
        >
          + Ajouter un ingrédient
        </Link>
      </div>

      <p style={{ marginBottom: 16 }}>
        <Link href="/dashboard">← Retour au tableau de bord</Link>
      </p>

      <input
        type="text"
        placeholder="Rechercher un ingrédient ou une catégorie..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: 10, fontSize: 15, width: "100%", maxWidth: 400, marginBottom: 20, border: "1px solid #ccc", borderRadius: 6 }}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <p style={{ color: "#666", marginBottom: 12 }}>
        {filtered.length} ingrédient{filtered.length > 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <p>Aucun ingrédient trouvé.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left", background: "#fafafa" }}>
                <th style={{ padding: "10px 8px" }}>Nom</th>
                <th style={{ padding: "10px 8px" }}>Catégorie</th>
                <th style={{ padding: "10px 8px" }}>MG %</th>
                <th style={{ padding: "10px 8px" }}>Prot. %</th>
                <th style={{ padding: "10px 8px" }}>Sucres %</th>
                <th style={{ padding: "10px 8px" }}>Fibres %</th>
                <th style={{ padding: "10px 8px" }}>Stabi %</th>
                <th style={{ padding: "10px 8px" }}>Onctuosité</th>
                <th style={{ padding: "10px 8px" }}>Coût</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ing) => (
                <tr key={ing.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "10px 8px", fontWeight: 500 }}>{ing.name}</td>
                  <td style={{ padding: "10px 8px" }}>{ing.category || "—"}</td>
                  <td style={{ padding: "10px 8px" }}>{ing.fat}</td>
                  <td style={{ padding: "10px 8px" }}>{ing.protein}</td>
                  <td style={{ padding: "10px 8px" }}>{ing.sugar}</td>
                  <td style={{ padding: "10px 8px" }}>{ing.fiber}</td>
                  <td style={{ padding: "10px 8px" }}>{ing.stabilizer}</td>
                  <td style={{ padding: "10px 8px" }}>{ing.creaminess}</td>
                  <td style={{ padding: "10px 8px" }}>{ing.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
