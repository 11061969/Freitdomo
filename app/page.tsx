export default function Home() {
  return (
    <main style={{ padding: "60px 40px", fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: 36, marginBottom: 12 }}>Freitdomo</h1>
      <p style={{ fontSize: 18, color: "#444", marginBottom: 32 }}>
        Application de formulation de crèmes glacées, sorbets et vegan.
      </p>

      <div style={{ display: "flex", gap: 16 }}>
        <a 
          href="/login" 
          style={{ 
            padding: "12px 24px", 
            background: "#111", 
            color: "white", 
            borderRadius: 6,
            textDecoration: "none",
            fontSize: 16
          }}
        >
          Se connecter
        </a>
        <a 
          href="/signup" 
          style={{ 
            padding: "12px 24px", 
            border: "1px solid #111", 
            borderRadius: 6,
            textDecoration: "none",
            fontSize: 16,
            color: "#111"
          }}
        >
          Créer un compte
        </a>
      </div>
    </main>
  )
}
