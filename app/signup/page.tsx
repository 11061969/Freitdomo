"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    // 1. Créer le compte Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const userId = authData.user?.id
    if (!userId) {
      setError("Erreur lors de la création du compte")
      setLoading(false)
      return
    }

    // 2. Créer le Client (entreprise)
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .insert({
        name: companyName || fullName + " (entreprise)",
        serving_temperature: "hard",
      })
      .select()
      .single()

    if (clientError) {
      setError("Erreur création client : " + clientError.message)
      setLoading(false)
      return
    }

    // 3. Créer l'utilisateur lié au client
    const { error: userError } = await supabase.from("users").insert({
      id: userId,
      client_id: clientData.id,
      email: email,
      full_name: fullName,
      role: "admin",
      language: "fr",
    })

    if (userError) {
      setError("Erreur création utilisateur : " + userError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    setTimeout(() => {
      router.push("/login")
    }, 1500)
  }

  return (
    <main style={{ maxWidth: 400, margin: "80px auto", fontFamily: "sans-serif" }}>
      <h1>Créer un compte – Freitdomo</h1>
      <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        <input
          type="text"
          placeholder="Nom de l'entreprise"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          style={{ padding: 10, fontSize: 16 }}
        />
        <input
          type="text"
          placeholder="Votre nom"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          style={{ padding: 10, fontSize: 16 }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 10, fontSize: 16 }}
        />
        <input
          type="password"
          placeholder="Mot de passe (min. 6 caractères)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ padding: 10, fontSize: 16 }}
        />
        <button type="submit" disabled={loading} style={{ padding: 12, fontSize: 16, cursor: "pointer" }}>
          {loading ? "Création..." : "Créer mon compte"}
        </button>
      </form>
      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      {success && <p style={{ color: "green", marginTop: 12 }}>Compte créé ! Redirection...</p>}
      <p style={{ marginTop: 20 }}>
        Déjà un compte ? <a href="/login">Se connecter</a>
      </p>
    </main>
  )
}
