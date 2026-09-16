"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Redirection après un court délai
    setTimeout(() => {
      router.push("/login")
    }, 2000)
  }

  return (
    <main style={{ maxWidth: 400, margin: "80px auto", fontFamily: "sans-serif" }}>
      <h1>Créer un compte – Freitdomo</h1>
      <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        <input
          type="text"
          placeholder="Nom complet"
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
      {success && <p style={{ color: "green", marginTop: 12 }}>Compte créé avec succès ! Redirection...</p>}
      <p style={{ marginTop: 20 }}>
        Déjà un compte ? <a href="/login">Se connecter</a>
      </p>
    </main>
  )
}
