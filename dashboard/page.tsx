"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setEmail(user.email || null)
      setLoading(false)
    }
    checkUser()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return <main style={{ padding: 40, fontFamily: "sans-serif" }}>Chargement...</main>
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto" }}>
      <h1>Tableau de bord – Freitdomo</h1>
      <p style={{ marginTop: 16 }}>Connecté en tant que : <strong>{email}</strong></p>
      
      <div style={{ marginTop: 32, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <button style={{ padding: "12px 20px", fontSize: 16, cursor: "pointer" }}>
          Nouvelle recette
        </button>
        <button style={{ padding: "12px 20px", fontSize: 16, cursor: "pointer" }}>
          Mes recettes
        </button>
        <button style={{ padding: "12px 20px", fontSize: 16, cursor: "pointer" }}>
          Base d’ingrédients
        </button>
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
