"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

type Recipe = {
  id: string
  name: string
  category: string
  total_quantity: number | null
  updated_at: string
}

export default function RecipesPage() {
  const router = useRouter()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
    const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("")

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
        .from("recipes")
        .select("id, name, category, total_quantity, updated_at")
        .eq("client_id", userData.client_id)
        .order("updated_at", { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setRecipes(data || [])
      }

      setLoading(false)
    }

    load()
  }, [router])

  const categoryLabel: Record<string, string> = {
    ice_cream: "Crème glacée",
    sorbet: "Sorbet",
    vegan: "Vegan",
  }
  const filtered = recipes.filter((r) => {
    const nameOk =
      !search.trim() ||
      (r.name || "").toLowerCase().includes(search.trim().toLowerCase())
    const catOk =
      !filterCategory ||
      (r.category || "").toLowerCase() === filterCategory.toLowerCase()
    return nameOk && catOk
  })
  if (loading) {
    return <main style={{ padding: 40, fontFamily: "sans-serif" }}>Chargement...</main>
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Mes recettes</h1>
        <Link
          href="/recipes/new"
          style={{ padding: "10px 18px", background: "#111", color: "white", borderRadius: 6, textDecoration: "none" }}
        >
          + Nouvelle recette
        </Link>
      </div>

      <p style={{ marginBottom: 20 }}>
        <Link href="/dashboard">← Retour au tableau de bord</Link>
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <input
          type="search"
          placeholder="Rechercher par nom / parfum…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 200px",
            padding: "10px 12px",
            border: "1px solid #ccc",
            borderRadius: 8,
            fontSize: 14,
          }}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: "10px 12px",
            border: "1px solid #ccc",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          <option value="">Toutes les categories</option>
          <option value="ice_cream">Creme glacee</option>
          <option value="sorbet">Sorbet</option>
          <option value="vegan">Vegan</option>
        </select>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {filtered.length === 0 ? (
        <p>Aucune recette pour le moment.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
              <th style={{ padding: 10 }}>Nom</th>
              <th style={{ padding: 10 }}>Catégorie</th>
              <th style={{ padding: 10 }}>Total</th>
              <th style={{ padding: 10 }}>Modifiée</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                style={{ borderBottom: "1px solid #eee", cursor: "pointer" }}
                onClick={() => router.push(`/recipes/${r.id}`)}
              >
                <td style={{ padding: 10, fontWeight: 500 }}>{r.name}</td>
                <td style={{ padding: 10 }}>{categoryLabel[r.category] || r.category}</td>
                <td style={{ padding: 10 }}>
                   {r.total_quantity != null
                     ? Number(r.total_quantity).toFixed(2)
                   : "—"}
</td>
                <td style={{ padding: 10 }}>{new Date(r.updated_at).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
