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
  cost: number
}

export default function IngredientsPage() {
  const router = useRouter()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Récupérer le client_id de l'utilisateur
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

      // Charger les ingrédients du client
      const { data, error } = await supabase
        .from("ingredients")
        .select("id, name, category, fat, protein, sugar, cost")
        .eq("client_id", userData.client_id)
        .eq("is_active", true)
        .order("name")

      if (error) {
        setError(error.message)
      } else {
        setIngredients(data || [])
      }

      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return <main style={{ padding: 40, fontFamily: "sans-serif" }}>Chargement...</main>
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Base d’ingrédients</h1>
        <Link 
          href="/ingredients/new"
          style={{ padding: "10px 18px", background: "#111", color: "white", borderRadius: 6, textDecoration: "none" }}
        >
          + Ajouter un ingrédient
        </Link>
      </div>

      <p style={{ marginBottom: 20 }}>
        <Link href="/dashboard">← Retour au tableau de bord</Link>
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {ingredients.length === 0 ? (
        <p>Aucun ingrédient pour le moment. Ajoutez-en un pour commencer.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
              <th style={{ padding: 10 }}>Nom</th>
              <th style={{ padding: 10 }}>Catégorie</th>
              <th style={{ padding: 10 }}>MG %</th>
              <th style={{ padding: 10 }}>Protéines %</th>
              <th style={{ padding: 10 }}>Sucres %</th>
              <th style={{ padding: 10 }}>Coût</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing) => (
              <tr key={ing.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 10 }}>{ing.name}</td>
                <td style={{ padding: 10 }}>{ing.category || "—"}</td>
                <td style={{ padding: 10 }}>{ing.fat}</td>
                <td style={{ padding: 10 }}>{ing.protein}</td>
                <td style={{ padding: 10 }}>{ing.sugar}</td>
                <td style={{ padding: 10 }}>{ing.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
