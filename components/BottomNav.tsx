"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

export default function BottomNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const isIngredients =
    pathname?.startsWith("/ingredients") ?? false
  const isRecipes =
    pathname?.startsWith("/recipes") || pathname === "/dashboard"
  const isAccount =
    pathname?.startsWith("/account") || pathname?.startsWith("/limits")

  return (
    <>
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 72,
            right: 16,
            background: "var(--fd-brown)",
            borderRadius: 12,
            overflow: "hidden",
            zIndex: 101,
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          <Link
            href="/recipes/new"
            onClick={() => setMenuOpen(false)}
            style={{
              display: "block",
              padding: "14px 20px",
              color: "#fff",
              borderBottom: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            Create new recipe
          </Link>
          <Link
            href="/ingredients/new"
            onClick={() => setMenuOpen(false)}
            style={{
              display: "block",
              padding: "14px 20px",
              color: "#fff",
            }}
          >
            Add new ingredient
          </Link>
        </div>
      )}

      <nav className="fd-bottom-nav">
        {/* Gauche : Ingredients */}
        <Link
          href="/ingredients"
          className={"fd-nav-item" + (isIngredients ? " active" : "")}
        >
          <span style={{ fontSize: 20 }}>☰</span>
          Ingredients
        </Link>

        {/* Centre : Recettes */}
        <Link
          href="/recipes"
          className={"fd-nav-item" + (isRecipes ? " active" : "")}
        >
          <span style={{ fontSize: 20 }}>📁</span>
          Recipes
        </Link>

        {/* Droite de recettes : Mon compte */}
        <Link
          href="/account"
          className={"fd-nav-item" + (isAccount ? " active" : "")}
        >
          <span style={{ fontSize: 20 }}>👤</span>
          Account
        </Link>

        {/* + */}
        <button
          type="button"
          className="fd-nav-plus"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Add"
        >
          {menuOpen ? "×" : "+"}
        </button>
      </nav>
    </>
  )
}
