"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

export default function IngredientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [fat, setFat] = useState("0")
  const [protein, setProtein] = useState("0")
  const [sugar, setSugar] = useState("0")
  const [fiber, setFiber] = useState("0")
  const [minerals, setMinerals] = useState("0")
  const [alcohol, setAlcohol] = useState("0")
  const [stabilizer, setStabilizer] = useState("0")
  const [sweetnessFactor, setSweetnessFactor] = useState("0")
  const [molarMass, setMolarMass] = useState("")
  const [solubility, setSolubility] = useState("0")
  const [saturatedFat, setSaturatedFat] = useState("0")
  const [sodium, setSodium] = useState("0")
  const [calcium, setCalcium] = useState("0")
  const [cost, setCost] = useState("0")

  const showMolarMass =
    category.toLowerCase().includes("sucre") ||
    category.toLowerCase().includes("stabil")

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .eq("id", id)
        .single()

      if (error || !data) {
        setError("Ingredient non trouve")
        setLoading(false)
        return
      }

      setName(data.name || "")
      setCategory(data.category || "")
      setFat(String(data.fat ?? 0))
      setProtein(String(data.protein ?? 0))
      setSugar(String(data.sugar ?? 0))
      setFiber(String(data.fiber ?? 0))
      setMinerals(String(data.minerals ?? 0))
      setAlcohol(String(data.alcohol ?? 0))
      setStabilizer(String(data.stabilizer ?? 0))
      setSweetnessFactor(String(data.sweetness_factor ?? 0))
      setMolarMass(data.molar_mass != null ? String(data.molar_mass) : "")
      setSolubility(String(data.solubility ?? 0))
      setSaturatedFat(String(data.saturated_fat ?? 0))
      setSodium(String(data.sodium ?? 0))
      setCalcium(String(data.calcium ?? 0))
      setCost(String(data.cost ?? 0))
      setLoading(false)
    }
    load()
  }, [id, router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess(false)

    const { error } = await supabase
      .from("ingredients")
      .update({
        name,
        category: category || null,
        fat: parseFloat(fat) || 0,
        protein: parseFloat(protein) || 0,
        sugar: parseFloat(sugar) || 0,
        fiber: parseFloat(fiber) || 0,
        minerals: parseFloat(minerals) || 0,
        alcohol: parseFloat(alcohol) || 0,
        stabilizer: parseFloat(stabilizer) || 0,
        sweetness_factor: parseFloat(sweetnessFactor) || 0,
        molar_mass: showMolarMass && molarMass ? parseFloat(molarMass) : null,
        solubility: parseFloat(solubility) || 0,
        saturated_fat: parseFloat(saturatedFat) || 0,
        sodium: parseFloat(sodium) || 0,
        calcium: parseFloat(calcium) || 0,
        cost: parseFloat(cost) || 0,
        creaminess: 0,
        pac_carb: 0,
        pac_salts: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm("Supprimer cet ingredient ?")) return
    const { error } = await supabase
      .from("ingredients")
      .update({ is_active: false })
      .eq("id", id)
    if (error) {
      setError(error.message)
      return
    }
    router.push("/ingredients")
  }

  const inputStyle = { padding: 10, fontSize: 15, width: "100%" }
  const labelStyle = { fontSize: 13, color: "#555", marginBottom: 4, display: "block" as const }

  if (loading) {
    return <main style={{ padding: 40, fontFamily: "sans-serif" }}>Chargement...</main>
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto" }}>
      <h1>Detail ingredient</h1>
      <p style={{ margin: "12px 0 24px" }}>
        <Link href="/ingredients">Retour liste</Link>
      </p>

      <form onSubmit={handleSave}>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Nom</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Categorie</label>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} />
        </div>

        <h3>Composition</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Matiere grasse</label>
            <input type="number" step="0.01" value={fat} onChange={(e) => setFat(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>MG saturee</label>
            <input type="number" step="0.01" value={saturatedFat} onChange={(e) => setSaturatedFat(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Glucides / Sucres</label>
            <input type="number" step="0.01" value={sugar} onChange={(e) => setSugar(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Fibres</label>
            <input type="number" step="0.01" value={fiber} onChange={(e) => setFiber(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Proteines</label>
            <input type="number" step="0.01" value={protein} onChange={(e) => setProtein(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Sels mineraux</label>
            <input type="number" step="0.01" value={minerals} onChange={(e) => setMinerals(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Stabilisant</label>
            <input type="number" step="0.01" value={stabilizer} onChange={(e) => setStabilizer(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Sodium (mg)</label>
            <input type="number" step="0.1" value={sodium} onChange={(e) => setSodium(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Alcool</label>
            <input type="number" step="0.01" value={alcohol} onChange={(e) => setAlcohol(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Calcium (mg)</label>
            <input type="number" step="0.1" value={calcium} onChange={(e) => setCalcium(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Cout</label>
            <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <h3>Parametres techniques</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Taux sucrant</label>
            <input type="number" step="0.01" value={sweetnessFactor} onChange={(e) => setSweetnessFactor(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Masse molaire</label>
            <input
              type="number"
              step="1"
              value={molarMass}
              onChange={(e) => setMolarMass(e.target.value)}
              disabled={!showMolarMass}
              style={{ ...inputStyle, opacity: showMolarMass ? 1 : 0.5 }}
            />
          </div>
          <div>
            <label style={labelStyle}>Solubilite</label>
            <input type="number" step="0.01" value={solubility} onChange={(e) => setSolubility(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <button type="submit" disabled={saving} style={{ padding: 12, marginRight: 8, cursor: "pointer" }}>
          {saving ? "..." : "Enregistrer"}
        </button>
        <button type="button" onClick={handleDelete} style={{ padding: 12, cursor: "pointer", background: "#fee" }}>
          Supprimer
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>OK</p>}
    </main>
  )
}
