"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      setEmail(user.email || null)

      const { data: userData } = await supabase
        .from("users")
        .select("full_name, client_id, clients(name)")
        .eq("id", user.id)
        .single()

      if (userData && (userData as any).clients) {
        setCompanyName((userData as any).clients.name)
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return <main style={{ padding: 40, fontFamily: "sans-serif" }}>Chargement...</main>
  }

  const btnStyle = {
    padding: "12px 20px",
    fontSize: 16,
    background: "#111",
    color: "white",
    borderRadius: 6,
    textDecoration: "none" as const,
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto" }}>
      <h1>Tableau de bord – Freitdomo</h1>

      <div style={{ marginTop: 20, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
        <p><strong>Entreprise :</strong> {companyName || "Non définie"}</p>
        <p><strong>Email :</strong> {email}</p>
      </div>

      <div style={{ marginTop: 32, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <a href="/recipes/new" style={btnStyle}>Nouvelle recette</a>
        <a href="/recipes" style={btnStyle}>Mes recettes</a>
        <a href="/ingredients" style={btnStyle}>Base d’ingrédients</a>
      </div>

      <button
        onClick={handleLogout}
        style={{ marginTop: 40, padding: "10px 16px", cursor: "pointer", background: "#eee" }}
      >
        Se déconnecter
      </button>
    </main>
  )
}
