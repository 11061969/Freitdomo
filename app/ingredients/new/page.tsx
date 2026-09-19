"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

export default function NewIngredientPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [fat, setFat] = useState("0")
  const [protein, setProtein] = useState("0")
  const [sugar, setSugar] = useState("0")
  const [fiber, setFiber] = useState("0")
  const [cost, setCost] = useState("0")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

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

    const { error } = await supabase.from("ingredients").insert({
      client_id: userData.client_id,
      name,
      category: category || null,
      fat: parseFloat(fat) || 0,
      protein: parseFloat(protein) || 0,
      sugar: parseFloat(sugar) || 0,
      fiber: parseFloat(fiber) || 0,
      cost: parseFloat(cost) || 0,
      is_active: true,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/ingredients")
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 500, margin: "0 auto" }}>
      <h1>Ajouter un ingrédient</h1>
      <p style={{ margin: "12px 0 24px" }}>
        <Link href="/ingredients">← Retour à la liste</Link>
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="text"
          placeholder="Nom de l'ingrédient *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ padding: 10, fontSize: 16 }}
        />
        <input
          type="text"
          placeholder="Catégorie (ex: Laitiers, Sucres, Stabilisants)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: 10, fontSize: 16 }}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Matière grasse %"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
          style={{ padding: 10, fontSize: 16 }}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Protéines %"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          style={{ padding: 10, fontSize: 16 }}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Sucres %"
          value={sugar}
          onChange={(e) => setSugar(e.target.value)}
          style={{ padding: 10, fontSize: 16 }}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Fibres %"
          value={fiber}
          onChange={(e) => setFiber(e.target.value)}
          style={{ padding: 10, fontSize: 16 }}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Coût"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          style={{ padding: 10, fontSize: 16 }}
        />

        <button type="submit" disabled={loading} style={{ padding: 12, fontSize: 16, cursor: "pointer", marginTop: 8 }}>
          {loading ? "Enregistrement..." : "Enregistrer l'ingrédient"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
    </main>
  )
}
