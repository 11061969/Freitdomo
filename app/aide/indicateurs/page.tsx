"use client"

import Link from "next/link"

export default function IndicateursPage() {
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
        <Link href="/aide">← Aide</Link>
        {" · "}
        <Link href="/dashboard">Tableau de bord</Link>
      </p>
      <h1>Indicateurs Structure &amp; Texture</h1>
      <p style={{ color: "#555", marginBottom: 28 }}>
        Explications detaillees (contenu a completer).
      </p>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17 }}>Solides totaux</h2>
        <p>[A completer]</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17 }}>Densite</h2>
        <p>[A completer]</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17 }}>Onctuosite / MG solide</h2>
        <p>[A completer]</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17 }}>Emulsifiant vs MG</h2>
        <p>[A completer]</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17 }}>ESDL / ESDL vs solvant / ESDL optimise</h2>
        <p>[A completer]</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17 }}>Indice de viscosite (masse molaire stabi)</h2>
        <p>[A completer]</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17 }}>Saturation de la solution</h2>
        <p>[A completer]</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17 }}>Taux sucrant</h2>
        <p>[A completer]</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17 }}>Fraction de glace / Point de congelation</h2>
        <p>[A completer]</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17 }}>Foisonnement (sorbets)</h2>
        <p>[A completer]</p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 17 }}>Lire la boule (graphe)</h2>
        <p>
          [A completer : ligne rouge = recette, vert pointille = min/max…]
        </p>
      </section>
    </main>
  )
}
