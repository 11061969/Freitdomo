"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import BottomNav from "@/components/BottomNav"

export default function AccountPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [servingTemp, setServingTemp] = useState("hard")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

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

      if (userData) {
        setClientId(userData.client_id)
        const clients = (userData as any).clients
        if (clients) {
          setCompanyName(clients.name)
          if (clients.serving_temperature) {
            setServingTemp(clients.serving_temperature)
          }
        }
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function saveTemp(temp: string) {
    if (!clientId) return
    setSaving(true)
    setMessage("")
    setServingTemp(temp)
    const { error } = await supabase
      .from("clients")
      .update({ serving_temperature: temp })
      .eq("id", clientId)
    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Temperature enregistree.")
    }
    setSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <main style={{ padding: 40 }}>
        Chargement...
        <BottomNav />
      </main>
    )
  }

  const temps = [
    { id: "soft", label: "Soft (-6 °C)" },
    { id: "gelato", label: "Gelato (-11 °C)" },
    { id: "hard", label: "Hard (-18 °C)" },
  ]

  return (
    <main style={{ minHeight: "100vh", paddingBottom: 80 }}>
      <div className="fd-header">
        <div className="fd-logo">freitdomo</div>
        <p style={{ textAlign: "center", opacity: 0.85, fontSize: 14 }}>
          Mon compte
        </p>
      </div>

      <div className="fd-card" style={{ padding: 20 }}>
        <p>
          <strong>Entreprise :</strong> {companyName || "—"}
        </p>
        <p style={{ marginTop: 8 }}>
          <strong>Email :</strong> {email}
        </p>
      </div>

      <div className="fd-card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>
          Temperature de service
        </h2>
        <p style={{ fontSize: 13, color: "var(--fd-muted)", marginBottom: 12 }}>
          Definit les limites min/max utilisees pour toutes tes recettes.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {temps.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={saving}
              onClick={() => saveTemp(t.id)}
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border:
                  servingTemp === t.id
                    ? "2px solid var(--fd-brown)"
                    : "1px solid var(--fd-border)",
                background:
                  servingTemp === t.id ? "#efe6dc" : "#fff",
                fontWeight: servingTemp === t.id ? 700 : 400,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {message && (
          <p style={{ marginTop: 10, fontSize: 13, color: "#1b5e20" }}>
            {message}
          </p>
        )}
      </div>

      <div className="fd-card" style={{ padding: 12 }}>
        <Link
          href="/limits"
          style={{ display: "block", padding: 12 }}
        >
          Mes limites →
        </Link>
        <Link href="/aide" style={{ display: "block", padding: 12 }}>
          Aide / Manuel →
        </Link>
      </div>

      <div style={{ padding: 16 }}>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid var(--fd-border)",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Se deconnecter
        </button>
      </div>

      <BottomNav />
    </main>
  )
}
