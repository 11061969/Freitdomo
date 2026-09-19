"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

export default function NewIngredientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Champs de base
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
  const [pacCarb, setPacCarb] = useState("0")
  const [pacSalts, setPacSalts] = useState("0")
  const [solubility, setSolubility] = useState("0")
  const [creaminess, setCreaminess] = useState("0")
  const [saturatedFat, setSaturatedFat] = useState("0")
  const [sodium, setSodium] = useState("0")
  const [calcium, setCalcium] = useState("0")
  const [cost, setCost] = useState("0")

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
      minerals: parseFloat(minerals) || 0,
      alcohol: parseFloat(alcohol) || 0,
      stabilizer: parseFloat(stabilizer) || 0,
      sweetness_factor: parseFloat(sweetnessFactor) || 0,
      molar_mass: molarMass ? parseFloat(molarMass) : null,
      pac_carb: parseFloat(pacCarb) || 0,
      pac_salts: parseFloat(pacSalts) || 0,
      solubility: parseFloat(solubility) || 0,
      creaminess: parseFloat(creaminess) || 0,
      saturated_fat: parseFloat(saturatedFat) || 0,
      sodium: parseFloat(sodium) || 0,
      calcium: parseFloat(calcium) || 0,
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

  const inputStyle = { padding: 10, fontSize: 15, width: "100%" }
  const labelStyle = { fontSize: 13, color: "#555", marginBottom: 4, display: "block" as const }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 640, margin: "0 auto" }}>
      <h1>Ajouter un ingrédient</h1>
      <p style={{ margin: "12px 0 24px" }}>
        <Link href="/ingredients">← Retour à la liste</Link>
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        
        <div>
          <label style={labelStyle}>Nom *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Catégorie</label>
          <input type="text" placeholder="Laitiers, Sucres, Stabilisants, Fruits..." value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} />
        </div>

        <h3 style={{ marginTop: 12, marginBottom: 4 }}>Composition (%)</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Matière grasse</label>
            <input type="number" step="0.01" value={fat} onChange={(e) => setFat(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>MG saturée</label>
            <input type="number" step="0.01" value={saturatedFat} onChange={(e) => setSaturatedFat(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Protéines</label>
            <input type="number" step="0.01" value={protein} onChange={(e) => setProtein(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Sucres</label>
            <input type="number" step="0.01" value={sugar} onChange={(e) => setSugar(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Fibres</label>
            <input type="number" step="0.01" value={fiber} onChange={(e) => setFiber(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Minéraux / Sels</label>
            <input type="number" step="0.01" value={minerals} onChange={(e) => setMinerals(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Alcool</label>
            <input type="number" step="0.01" value={alcohol} onChange={(e) => setAlcohol(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Stabilisant</label>
            <input type="number" step="0.01" value={stabilizer} onChange={(e) => setStabilizer(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <h3 style={{ marginTop: 12, marginBottom: 4 }}>Paramètres techniques</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Facteur sucrant</label>
            <input type="number" step="0.01" value={sweetnessFactor} onChange={(e) => setSweetnessFactor(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Masse molaire</label>
            <input type="number" step="1" value={molarMass} onChange={(e) => setMolarMass(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>PAC carb</label>
            <input type="number" step="0.01" value={pacCarb} onChange={(e) => setPacCarb(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>PAC sels / alcool</label>
            <input type="number" step="0.01" value={pacSalts} onChange={(e) => setPacSalts(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Solubilité</label>
            <input type="number" step="0.01" value={solubility} onChange={(e) => setSolubility(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Onctuosité (creaminess)</label>
            <input type="number" step="0.01" value={creaminess} onChange={(e) => setCreaminess(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Sodium (mg)</label>
            <input type="number" step="0.1" value={sodium} onChange={(e) => setSodium(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Calcium (mg)</label>
            <input type="number" step="0.1" value={calcium} onChange={(e) => setCalcium(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Coût</label>
            <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ padding: 14, fontSize: 16, cursor: "pointer", marginTop: 16 }}>
          {loading ? "Enregistrement..." : "Enregistrer l'ingrédient"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
    </main>
  )
}
