"use client"

import Link from "next/link"

export default function AidePage() {
  return (
    <main
      style={{
        padding: 40,
        fontFamily: "sans-serif",
        maxWidth: 800,
        margin: "0 auto",
        lineHeight: 1.5,
      }}
    >
      <p style={{ marginBottom: 12 }}>
        <Link href="/dashboard">← Tableau de bord</Link>
      </p>
      <h1>Aide – Freitdomo</h1>
      <p style={{ color: "#555", marginBottom: 28 }}>
        Manuel utilisateur (contenu a completer).
      </p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18 }}>1. Premiers pas</h2>
        <p>
          [A completer : creer un compte, se connecter, tableau de bord…]
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18 }}>2. Base d&apos;ingredients</h2>
        <p>
          [A completer : ajouter / modifier un ingredient, categories,
          masses molaires…]
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18 }}>3. Recettes</h2>
        <p>
          [A completer : nouvelle recette, quantites, total desire, nouvelle
          recette a partir d&apos;une autre…]
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18 }}>4. Equilibrage</h2>
        <p>
          [A completer : lecture des cases vert / rouge, boule, export PDF…]
        </p>
        <p>
          <Link href="/aide/indicateurs">
            → Comprendre les indicateurs Structure &amp; Texture
          </Link>
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18 }}>5. Limites personnalisees</h2>
        <p>
          [A completer : page Mes limites, min / max par categorie et
          temperature…]
        </p>
      </section>
    </main>
  )
}
