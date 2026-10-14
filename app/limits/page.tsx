"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

type LimitRow = {
  id: string
  param_key: string
  min_value: number
  max_value: number
}

const COMPOSITION_KEYS = [
  "fat",
  "saturatedFat",
  "sugar",
  "fiber",
  "protein",
  "stabilizer",
  "emulsifier",
  "sodium",
  "alcohol",
  
]

const STRUCTURE_KEYS = [
  "totalSolids",
  "density",
  "creaminess",
  "mgSolide",
  "emulsifierVsFat",
  "molarMassStabi",
  "esdl",
  "esdlVsSolvent", 
  "saturation",
  "sweetness",
  "freezingPoint",
  "iceFraction",
  "foisonnement",
]

const PARAM_LABELS: Record<string, string> = {
  fat: "Matiere grasse %",
  protein: "Proteines %",
  sugar: "Glucides %",
  fiber: "Fibres %",
  stabilizer: "Stabilisant %",
  sodium: "Sodium mg",
  saturatedFat: "MG saturee %",
  alcohol: "Alcool %",
  emulsifier: "Emulsifiant %",
  totalSolids: "Solides totaux %",
  density: "Densite",
  creaminess: "Onctuosite",
  esdl: "ESDL %",
  esdlVsSolvent: "ESDL vs solvant %",
  freezingPoint: "Point de congelation C",
  iceFraction: "Fraction de glace %",
  molarMassStabi: "Masse molaire stabi",
  emulsifierVsFat: "Emulsifiant vs MG %",
  mgSolide: "MG solide %",
  saturation: "Saturation solution %",
  sweetness: "Taux sucrant %",
  foisonnement: "Foisonnement %",
}

export default function LimitsPage() {
  const router = useRouter()
  const [clientId, setClientId] = useState<string | null>(null)
  const [category, setCategory] = useState("ice_cream")
  const [temp, setTemp] = useState("hard")
  const [rows, setRows] = useState<LimitRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      const { data: userData } = await supabase
        .from("users")
        .select("client_id")
        .eq("id", user.id)
        .single()
      if (!userData?.client_id) {
        setLoading(false)
        return
      }
      setClientId(userData.client_id)
      setLoading(false)
    }
    init()
  }, [router])

  useEffect(() => {
    async function load() {
      if (!clientId) return
      setLoading(true)
      const { data, error } = await supabase
        .from("client_limits")
        .select("id, param_key, min_value, max_value")
        .eq("client_id", clientId)
        .eq("category", category)
        .eq("serving_temp", temp)
        .order("param_key")

      if (error) {
        setMessage(error.message)
        setRows([])
      } else {
        setRows((data as LimitRow[]) || [])
        setMessage("")
      }
      setLoading(false)
    }
    load()
  }, [clientId, category, temp])

  function updateLocal(id: string, field: "min_value" | "max_value", value: string) {
    const n = value === "" ? 0 : Number(value)
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: n } : r))
    )
  }

  async function saveAll() {
    if (!clientId) return
    setSaving(true)
    setMessage("")
    for (const r of rows) {
      if (r.min_value > r.max_value) {
        setMessage(
          `Erreur : min > max pour ${PARAM_LABELS[r.param_key] || r.param_key}`
        )
        setSaving(false)
        return
      }
      const { error } = await supabase
        .from("client_limits")
        .update({ min_value: r.min_value, max_value: r.max_value })
        .eq("id", r.id)
      if (error) {
        setMessage(error.message)
        setSaving(false)
        return
      }
    }
    setMessage("Limites enregistrees.")
    setSaving(false)
  }

  if (loading && !clientId) {
    return (
      <main style={{ padding: 40, fontFamily: "sans-serif" }}>Chargement...</main>
    )
  }

  return (
    <main
      style={{
        padding: 40,
        fontFamily: "sans-serif",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <p style={{ marginBottom: 12 }}>
        <Link href="/dashboard">← Tableau de bord</Link>
      </p>
      <h1>Mes limites</h1>
      <p style={{ color: "#555", marginBottom: 20 }}>
        Ces valeurs definissent le vert / rouge sur la page d&apos;equilibrage et
        la boule. Elles sont propres a ton compte.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
          alignItems: "center",
        }}
      >
        <label>
          Categorie{" "}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ padding: 8, marginLeft: 6 }}
          >
            <option value="ice_cream">Creme glacee</option>
            <option value="sorbet">Sorbet</option>
            <option value="vegan">Vegan</option>
          </select>
        </label>
        <label>
          Temperature{" "}
          <select
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            style={{ padding: 8, marginLeft: 6 }}
          >
            <option value="hard">Hard (-18C)</option>
            <option value="gelato">Gelato (-11C)</option>
            <option value="soft">Soft (-6C)</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p>Chargement des limites...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: "#c62828" }}>
          Aucune limite en base pour cette combinaison. Verifie l&apos;insertion
          SQL.
        </p>
      ) : (
        <>
                   {(["Composition", "Structure"] as const).map((section) => {
            const keys = section === "Composition" ? COMPOSITION_KEYS : STRUCTURE_KEYS
            const sectionRows = keys
              .map((k) => rows.find((r) => r.param_key === k))
              .filter(Boolean) as LimitRow[]
            if (sectionRows.length === 0) return null
            return (
              <div key={section} style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 18, marginBottom: 10 }}>{section}</h2>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 14,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "2px solid #ddd",
                        textAlign: "left",
                      }}
                    >
                      <th style={{ padding: 8 }}>Parametre</th>
                      <th style={{ padding: 8, width: 120 }}>Min</th>
                      <th style={{ padding: 8, width: 120 }}>Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionRows.map((r) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: 8 }}>
                          {PARAM_LABELS[r.param_key] || r.param_key}
                        </td>
                        <td style={{ padding: 8 }}>
                          <input
                            type="number"
                            step="any"
                            value={r.min_value}
                            onChange={(e) =>
                              updateLocal(r.id, "min_value", e.target.value)
                            }
                            style={{ width: 100, padding: 6 }}
                          />
                        </td>
                        <td style={{ padding: 8 }}>
                          <input
                            type="number"
                            step="any"
                            value={r.max_value}
                            onChange={(e) =>
                              updateLocal(r.id, "max_value", e.target.value)
                            }
                            style={{ width: 100, padding: 6 }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}

          <button
            type="button"
            onClick={saveAll}
            disabled={saving}
            style={{
              marginTop: 20,
              padding: "10px 18px",
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </>
      )}

      {message && (
        <p
          style={{
            marginTop: 12,
            color: message.includes("Erreur") ? "#c62828" : "#1b5e20",
          }}
        >
          {message}
        </p>
      )}
    </main>
  )
}
