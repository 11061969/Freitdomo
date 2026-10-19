"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import BottomNav from "@/components/BottomNav"

type Recipe = {
  id: string
  name: string
  category: string
  updated_at: string
}

const tempLabel: Record<string, string> = {
  soft: "Soft (-6 °C)",
  gelato: "Gelato (-11 °C)",
  hard: "Hard (-18 °C)",
}

const categoryLabel: Record<string, string> = {
  ice_cream: "Creme glacee",
  sorbet: "Sorbet",
  vegan: "Vegan",
}

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [servingTemp, setServingTemp] = useState("hard")
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setEmail(user.email || null)

      const { data: userData } = await supabase
        .from("users")
        .select("client_id, clients(name, serving_temperature)")
        .eq("id", user.id)
        .single()

      if (!userData?.client_id) {
        setLoading(false)
        return
      }

      const clients = (userData as any).clients
      if (clients) {
        setCompanyName(clients.name)
        if (clients.serving_temperature) {
          setServingTemp(clients.serving_temperature)
        }
      }

      const { data: recipeData } = await supabase
        .from("recipes")
        .select("id, name, category, updated_at")
        .eq("client_id", userData.client_id)
        .order("updated_at", { ascending: false })
        .limit(5)

      setRecipes(recipeData || [])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <main style={{ padding: 40 }}>
        Chargement...
        <BottomNav />
      </main>
    )
  }

  return (
    <>
      <main style={{ minHeight: "100vh", paddingBottom: 80 }}>
        {/* En-tete */}
        <div className="fd-header">
          <div className="fd-logo">freitdomo</div>
          <p
            style={{
              textAlign: "center",
              fontSize: 14,
              opacity: 0.9,
              maxWidth: 320,
              margin: "0 auto",
              lineHeight: 1.4,
            }}
          >
            Equilibrez vos cremes glacees, sorbets et recettes vegan —
            composition, structure et texture sous controle.
          </p>
        </div>

        {/* Bienvenue */}
        <div className="fd-card" style={{ padding: 20 }}>
          <p style={{ fontSize: 18, fontWeight: 600 }}>
            Bonjour{companyName ? `, ${companyName}` : ""}
          </p>
          {email && (
            <p style={{ fontSize: 13, color: "var(--fd-muted)", marginTop: 4 }}>
              {email}
            </p>
          )}
        </div>

        {/* Temperature de service */}
        <div className="fd-card" style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: "var(--fd-muted)", marginBottom: 6 }}>
            Temperature de service
          </p>
          <p style={{ fontSize: 16, fontWeight: 600 }}>
            {tempLabel[servingTemp] || servingTemp}
          </p>
          <Link
            href="/account"
            style={{
              fontSize: 13,
              marginTop: 8,
              display: "inline-block",
              textDecoration: "underline",
            }}
          >
            Modifier dans Mon compte
          </Link>
        </div>

        {/* Dernieres recettes */}
        <div className="fd-card" style={{ padding: "12px 0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 20px 12px",
            }}
          >
            <h2 style={{ fontSize: 16, margin: 0 }}>Recettes recentes</h2>
            <Link href="/recipes" style={{ fontSize: 13, textDecoration: "underline" }}>
              Tout voir
            </Link>
          </div>

          {recipes.length === 0 ? (
            <p style={{ padding: "8px 20px 16px", color: "var(--fd-muted)", fontSize: 14 }}>
              Aucune recette pour le moment.{" "}
              <Link href="/recipes/new" style={{ textDecoration: "underline" }}>
                Creer une recette
              </Link>
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {recipes.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/recipes/${r.id}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 20px",
                      borderTop: "1px solid var(--fd-border)",
                    }}
                  >
                    <span>
                      <span style={{ fontWeight: 500 }}>{r.name}</span>
                      <span
                        style={{
                          display: "block",
                          fontSize: 12,
                          color: "var(--fd-muted)",
                          marginTop: 2,
                        }}
                      >
                        {categoryLabel[r.category] || r.category}
                      </span>
                    </span>
                    <span style={{ fontSize: 12, color: "var(--fd-muted)" }}>
                      {new Date(r.updated_at).toLocaleDateString("fr-FR")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Raccourcis aide */}
        <div className="fd-card" style={{ padding: 8 }}>
          <Link
            href="/aide/indicateurs"
            style={{ display: "block", padding: "12px 16px" }}
          >
            Comprendre les indicateurs →
          </Link>
          <Link
            href="/aide"
            style={{
              display: "block",
              padding: "12px 16px",
              borderTop: "1px solid var(--fd-border)",
            }}
          >
            Manuel utilisateur →
          </Link>
          <Link
            href="/limits"
            style={{
              display: "block",
              padding: "12px 16px",
              borderTop: "1px solid var(--fd-border)",
            }}
          >
            Mes limites →
          </Link>
        </div>
      </main>
      <BottomNav />
    </>
  )
}
