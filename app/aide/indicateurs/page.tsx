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
        lineHeight: 1.55,
      }}
    >
      <p style={{ marginBottom: 12 }}>
        <Link href="/aide">← Manuel de l’utilisateur</Link>
        {" · "}
        <Link href="/dashboard">Tableau de bord</Link>
      </p>
      <h1>Comprendre les indicateurs de Structure & Texture</h1>

      <section style={{ marginTop: 36 }}>
        <h2>Introduction</h2>
        <p>
          Ces indicateurs que l’on retrouve sur les axes de la boule dévoilent les caractéristiques de la structure et permettent d’anticiper certains aspects de la texture qui en découle. En partant du sommet, puis dans le sens des aiguilles d’une montre :
        </p>
        <p>
          L’indicateur <strong>extrait sec</strong>, et son sous-paramètre <strong>densité</strong>, révèlent la composition globale de la recette.
        </p>
        <p>
          Les indicateurs 2 et 3 portent un regard sur le réseau adipeux, avec l’<strong>onctuosité</strong>, son sous-paramètre le <strong>contenu en matières grasses solides (CMGS)</strong>, et le dosage de l’<strong>émulsifiant</strong>.
        </p>
        <p>L’indicateur 4 facilite le dosage du stabilisant, en se basant sur sa <strong>masse molaire</strong>.</p>
        <p>
          L’indicateur 5 <strong>ESDL</strong>, et son sous-paramètre <strong>ESDL vs Solvant</strong>, fournissent des informations sur le dosage optimal de l’<strong>ESDL</strong>.
        </p>
        <p>
          Les indicateurs 6 et 7 portent sur la cuillérabilité. Ils illustrent l’équilibre nécessaire entre la <strong>Fraction de glace</strong> (avec son sous-paramètre le <strong>point de congélation</strong>), et le <strong>taux sucrant</strong>, qui doivent être équilibrés conjointement selon le goût du client et la température de service.
        </p>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2>À propos de la matière grasse en général</h2>
        <p>
          La matière grasse est essentielle dans la fabrication de la crème glacée car elle facilite l’incorporation et la rétention de bulles d’air, elle fournit le matériau pour construire l’échafaudage semi-rigide qui soutient toute la structure mousseuse, et enfin elle donne une sensation crémeuse agréable, ainsi qu’une libération de saveur en temps opportun et une vitesse de fonte appropriée.
        </p>
        <p>
          Pendant le processus de production, lors du turbinage, un ratio propice de <strong>CMGS</strong> facilite une « coalescence partielle » dans laquelle un contenu équilibré de matières grasses solides et liquides permet la connexion des globules gras sans qu’ils ne coalescent ni flocculent.
        </p>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2>Onctuosité et Contenu en matière grasse solide (CMGS)</h2>
        <p>L’<strong>onctuosité</strong> est déduite de la teneur totale en acides gras saturés.</p>
        <p>
          Une texture onctueuse, c-à-d légèrement résistante, puis fondante entre la langue et le palais, reflète l’état encore en partie solide de la MG à la température à laquelle elle est dégustée (température en bouche). A contrario, la texture apparaîtra aqueuse, fluide, n’offrant aucune résistance en bouche, si la recette ne contient pas assez de MG en partie solide lors de la dégustation.
        </p>
        <p>
          Le <strong>contenu en matière grasse solide CMGS</strong> (ou SFC en anglais, pour Solid Fat Content) reflète la part du réseau adipeux qui est sous forme solide (cristallisée) à une température donnée (+4 °C dans notre cas). Il est lié au point de fusion de chaque MG.
        </p>
        <p>NB : le <strong>CMGS</strong> est une donnée qualitative, qui ne dépend pas de la MG totale (contrairement à l’<strong>onctuosité</strong>).</p>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2>Dosage de l’émulsifiant</h2>
        <p>
          Les émulsifiants sont utiles pour former le réseau de matières grasses adéquat conduisant à une finesse désirée (finesse définie comme la quantité, la taille et la dispersion des bulles d’air), ainsi qu’à une résistance à la fonte notable.
        </p>
        <p>L’optimisation de son dosage se base sur les travaux de Goff and Hartel.</p>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2>Indice de viscosité</h2>
        <p>
          Le principal agent « épaississant » d’un mix de crème glacée est le stabilisant. En effet, un mix de crème glacée non stabilisé est intrinsèquement très peu visqueux à +4 °C.
        </p>
        <p>
          Ainsi, l’<strong>indice de viscosité</strong>, une fois paramétré en fonction des caractéristiques de vos stabilisants (case <strong>masse molaire</strong>), vous permet de régler de manière optimale la viscosité de votre mix.
        </p>
        <p>
          Comment procéder ? Dans <strong>Mes limites</strong>, modifiez les valeurs Min et Max de l’indicateur « <strong>masse molaire stabi</strong> » à partir de vos recettes qui ont une viscosité idéale : le point rouge de l’indicateur « <strong>indice de viscosité</strong> » doit être à égale distance des limites Min et Max.
        </p>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2>ESDL / ESDL vs solvant / ESDL optimisé</h2>
        <p>
          Ces indicateurs fournissent des informations sur la solubilité de la solution (mix), sur le risque de cristallisation du lactose, et sur l’optimisation de l’<strong>ESDL</strong>.
        </p>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2>Saturation de la solution</h2>
        <p>
          Cet indicateur considère le mix en cours de pasteurisation (avant d’ajouter les fruits par exemple pour un sorbet). Il compare la solubilité des ingrédients en poudre avec le solvant disponible total (eau, lait, lait de soja, etc.).
        </p>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2>Cuillérabilité</h2>
        <p>Cette caractéristique est bien sûr un critère éminemment important pour le glacier.</p>
        <p>
          Nous savons que la crème glacée est unique en ce sens qu’elle est le seul aliment composé principalement d’eau ({"> 50 %"}) qui peut être consommé à −18 °C, alors qu’habituellement à cette température l’eau est à l’état solide.
        </p>
        <p>
          Ainsi, lorsque l’on déguste une crème glacée, sa texture moelleuse nous apparaît comme un état particulier de la matière, ni trop dur ni trop mou, ce qui revient à dire un peu dur ET un peu mou à la fois. En fait, cette texture souple au premier contact, puis fondante en bouche, se base sur ces deux conditions combinées, avec une partie du produit dans un état solide ET une autre partie dans un état liquide.
        </p>
        <p>
          Cet état combiné, à la fois solide et liquide repose principalement sur l’état de la phase aqueuse, et plus particulièrement sur une proportion adéquate entre la quantité d’eau congelée (ce qui est dur) et la quantité d’eau liquide (ce qui est mou) à une température donnée.
        </p>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2>Fraction de glace / point de congélation</h2>
        <p>
          Le ratio <strong>Fraction de glace</strong> représente ainsi la quantité d’eau congelée par rapport à la quantité d’eau totale, et c’est lui qui nous servira de guide dans la recherche d’une cuillérabilité désirée dans le cas de chacun.
        </p>
        <p>
          Cette notion de <strong>fraction de glace</strong> n’implique pas qu’il existe une valeur spécifique idéale à atteindre. Par contre son intérêt pratique est réel car c’est un marqueur précis de la dureté d’une recette, qui plus est cohérent sur un large éventail de formulations et de températures de service. Ainsi, lorsque vous aurez identifié votre <strong>fraction de glace</strong> propice à partir des parfums qui se travaillent idéalement dans votre cas, alors toutes vos recettes suivantes auront ce même standard du premier coup : droit au but donc !
        </p>
        <p>
          Le <strong>point de congélation</strong> quant à lui est calculé par la méthode de la molalité car il est une propriété colligative d’une solution, c-à-d que cette propriété dépend du nombre de particules (moles) de soluté dans la solution.
        </p>
        <p>
          Notez que lors de la production, dans la turbine, de l’eau commencera à cristalliser (devenir solide) dès que la température atteindra le <strong>point de congélation</strong>. À partir de là, à mesure que la température baisse et que plus d’eau est congelée, moins d’eau est disponible et la concentration de la solution augmente, abaissant à son tour le <strong>point de congélation</strong>.
        </p>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2>Foisonnement (sorbets)</h2>
        <p>
          Il s’agit d’un « <strong>foisonnement recommandé</strong> », afin d’assurer une texture convenable, ni trop lourde ni trop légère. Sa détermination se base sur la composition de la recette.
        </p>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2>Lecture du graphe</h2>
        <p>
          Le graphe permet de visualiser en un instant les caractéristiques essentielles d’une recette. C’est un outil visuel et intuitif qui dévoile en temps réel l’impact du dosage des ingrédients sur les contours du produit final, et vous permet ainsi d’aller droit au but lors de la création de vos recettes.
        </p>
      </section>
    </main>
  )
}
