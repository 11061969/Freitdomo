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
        lineHeight: 1.55,
      }}
    >
      <p style={{ marginBottom: 12 }}>
        <Link href="/dashboard">← Tableau de bord</Link>
      </p>
      <h1>Manuel de l’utilisateur</h1>

      <section style={{ marginTop: 36 }}>
        <h2>1. Premiers pas</h2>
        <ul>
          <li>Créez un compte et connectez-vous.</li>
          <li>Vos recettes, votre base d’ingrédients et vos limites sont privées : un autre compte ne les voit pas.</li>
          <li>
            Le tableau de bord comprend 3 boutons principaux : <strong>Mes ingrédients</strong> / <strong>Mes recettes</strong> / <strong>Mon compte</strong>. Dans ce dernier vous trouverez les informations utiles concernant votre compte : le paramétrage de votre température de service, le <strong>Manuel de l’utilisateur</strong>, la description des <strong>Indicateurs</strong> et la personnalisation des valeurs des limites.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2>2. Mes ingrédients</h2>
        <p>
          Cliquez sur le bouton <strong>Ingrédients</strong>. La base de données doit intégrer tous les ingrédients susceptibles d’être utilisés dans une recette.
        </p>
        <p>
          Pour ajouter un ingrédient, cliquez sur le bouton <strong>+</strong> ou sur le bouton <strong>Ajouter un ingrédient</strong>. Renseignez la catégorie, puis détaillez sa composition le plus précisément possible. Si vous n’êtes pas sûr, vérifiez dans la base de données les ingrédients de la même catégorie, ou sur{" "}
          <a href="https://fineli.fi/fineli/en/index" target="_blank" rel="noreferrer">
            fineli.fi
          </a>
          .
        </p>
        <p>
          Vous pouvez aussi modifier un ingrédient existant : cliquez sur l’ingrédient en question, modifiez sa composition, puis le bouton <strong>Enregistrer</strong>.
        </p>
        <p>Lorsque l’on ajoute ou modifie un ingrédient :</p>
        <ul>
          <li>La MG saturée est précisée en % de la MG totale pour tous les ingrédients qui contiennent de la MG (exemple pour le lait : MG saturée 64 %).</li>
          <li>La masse molaire et la solubilité doivent être précisées pour les sucres et les stabilisants.</li>
          <li>
            Le taux sucrant doit être précisé pour tous les ingrédients qui contiennent des glucides / sucres (les catégories sucre / fruit / vegan, etc.). Taux sucrant pour les laitiers = 0,14 (taux sucrant du lactose).
          </li>
          <li>
            Pour les parfums infusés (gousses de vanille, menthe fraîche, cannelle, etc.), utilisez la catégorie Infusion lorsque vous créez cet ingrédient dans la base de données.
          </li>
          <li>Entrez votre coût ingrédient dans la même unité que vous entrez vos recettes (g ou kg).</li>
        </ul>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2>3. Mes recettes</h2>
        <ul>
          <li>
            Les recettes sont classées par ordre chronologique. Vous pouvez chercher un parfum dans la barre de recherche, ou cliquer sur le bouton <strong>Toutes les catégories</strong> (<strong>crème glacée</strong> / <strong>sorbet</strong> / <strong>vegan</strong>) pour trier les parfums par catégorie.
          </li>
          <li>Assurez-vous que tous les ingrédients que vous souhaitez utiliser sont disponibles dans la base de données, et que leur composition correspond à vos attentes.</li>
          <li>Pour une nouvelle recette, cliquez sur <strong>Nouvelle recette</strong> ou sur le bouton <strong>+</strong>.</li>
          <li>Entrez votre recette avec la même unité pour tous les ingrédients (g ou kg).</li>
          <li>Appliquez le total désiré si besoin est, puis arrondissez vos recettes si vous le désirez.</li>
          <li><strong>Enregistrez</strong>.</li>
          <li>Vous pouvez modifier une recette existante : cliquez sur la recette, changez, ajoutez ou supprimez un ingrédient ou une quantité, <strong>enregistrez</strong>.</li>
          <li>
            Vous pouvez aussi partir d’une recette existante qui marche bien dans votre cas pour créer une nouvelle recette avec ces mêmes caractéristiques (par exemple créer un parfum chocolat-cointreau à partir d’une recette de chocolat qui a déjà toutes les qualités désirées) : cliquez sur le bouton <strong>Nouvelle recette à partir de…</strong>, changez le nom de la recette, bouton <strong>Créer</strong>. Modifiez la recette. <strong>Enregistrez</strong>.
          </li>
          <li>Bouton <strong>Exporter en PDF</strong> pour sauvegarder cette recette et son évaluation visuelle.</li>
          <li>Bouton <strong>Supprimer</strong> si vous ne désirez pas conserver une recette.</li>
        </ul>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2>4. Équilibrage — lecture du graphe</h2>
        <p>
          Observez le graphe. La ligne rouge continue représente la recette, et les lignes vertes en pointillés délimitent les valeurs minimales et maximales pour chaque indicateur.
        </p>
        <p>
          Ceci vous permet de détecter en un coup d’œil un défaut potentiel de structure ou de texture. Observez ensuite les valeurs des indicateurs dans les cases au-dessous pour plus de précision. Ces cases sont vertes ou rouges en fonction du respect ou du dépassement des limites prévues pour chaque indicateur.
        </p>
        <p>Voir <strong>Comprendre les indicateurs</strong>, modifiez la recette si besoin est : les modifications apparaissent en temps réel sur le graphe.</p>
        <p>
          NB : ne soyez pas surpris si des indicateurs sont hors limites lorsque vous rentrez vos recettes. En effet, ces limites, bien que standard, peuvent ne pas correspondre au cadre de votre produit. D’où l’intérêt de pouvoir les personnaliser en fonction de ce qui marche précisément dans le cas de chacun.
        </p>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2>5. Personnalisez les valeurs Min et Max des indicateurs</h2>
        <p>
          Les « limites » font donc référence aux valeurs minimales et maximales des indicateurs et elles sont matérialisées sur le graphe par les lignes vertes en pointillés. Elles définissent la zone adéquate dans laquelle devrait se trouver la recette. Elles sont standards par défaut, mais elles sont personnalisables pour coller parfaitement aux caractéristiques que vous recherchez. C’est une fonctionnalité très utile car cette plus grande précision débouche sur un gain de temps et une économie de matières premières.
        </p>
        <p>
          Comment procéder ? Saisissez quelques recettes de catégories différentes (crème glacée, sorbet, vegan) dont les caractéristiques sont idéales dans votre cas. Repérez ces valeurs optimales dans les cases, allez dans <strong>Mon compte</strong>, puis <strong>Mes limites</strong>, réglez les limites que vous souhaitez : faire en sorte que la valeur idéale pour l’indicateur en question soit à égale distance des limites min et max. Vous pouvez aussi « resserrer » les limites Min et Max pour une plus grande précision, puis <strong>enregistrez</strong>.
        </p>
      </section>
    </main>
  )
}
