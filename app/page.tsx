import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Freitdomo",
  description: "Simulateur de recettes de crèmes glacées, sorbets et vegan",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
