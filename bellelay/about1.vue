<script setup>
// 2026-11-26 (Maxime) : texte de la page « Présentation » de l'ancien site (TEI legacy-presentation), sorti de
// l'édition, qui commence désormais à l'Introduction.
const edition = (refId) => ({ path: '/bellelay/document/bellelay-edition', query: { refId } })
</script>
<template>
  <div class="about-content">
    <div>
      <p>La provenance du manuscrit a toujours posé problème. De même, le contenu musical, tout en appartenant de manière
        large à la tradition grégorienne, présente de très nombreuses originalités qui distinguent ce graduel. L'étude
        menée dans cette édition tente de répondre à ces questions.</p>
      <p>Après une <router-link :to="edition('introduction')">introduction</router-link> qui fournit les principales clés
        pour lire le manuscrit, une <router-link :to="edition('etude-generale')">étude générale</router-link> résume les
        principaux acquis musicologiques auxquels nous sommes parvenus. Le mode original d'édition électronique permet deux
        types de consultation : on peut feuilleter <router-link :to="edition('legacy-feuillet1')">le manuscrit page par
        page</router-link> ou bien en consultant <router-link :to="edition('legacy-indexmanuscrit')">l'index effectuer une
        recherche par champs</router-link>, avec la possibilité de croiser les requêtes. Les nombreuses pièces remarquables
        font l'objet d'un dossier d'analyse auquel on peut accéder par l'<router-link :to="edition('legacy-indexmanuscrit')">index</router-link>
        ou directement par l'<router-link :to="edition('analyse')">« Analyse »</router-link>.</p>
      <p>L'intérêt de l'édition électronique du Graduel de Bellelay est double : elle préserve l'intégrité du document
        elle propose une étude génétique de son contenu.</p>
      <p>L'édition électronique du Graduel prémontré de Bellelay (XII<sup>e</sup> s.) n'aurait pas été possible sans le
        soutien et l'apport des institutions suivantes :</p>
      <ul>
        <li>Le <a href="http://www.cnrs.fr/" target="_blank" rel="noopener">Centre National de la Recherche Scientifique
          (CNRS)</a>, Programme « Société de l'Information » dirigé par Jean-Louis Lebrave, ACI « Archivage et Patrimoine
          documentaire. Apport des sciences de l'information et de la cognition ». Son soutien financier a été déterminant
          pour la réalisation de cette édition.</li>
        <li>L'<a href="https://www.jura.ch/occ" target="_blank" rel="noopener">Office de la Culture de la République et du
          Canton du Jura</a> (Suisse) et la <a href="https://www.jura.ch/bicj" target="_blank" rel="noopener">Bibliothèque
          cantonale jurassienne à Porrentruy</a> pour l'intérêt et l'accueil réservés au projet de mise en valeur de leur
          patrimoine.</li>
        <li>L'<a href="https://www.chartes.psl.eu/" target="_blank" rel="noopener">Ecole nationales des chartes</a>,
          co-partenaire du programme financé par le CNRS. L'accueil de ce projet dans la collection d'éditions
          électroniques de l'ENC a été primordial pour la réussite de cette édition.</li>
        <li>Le <a href="https://cescm.labo.univ-poitiers.fr/" target="_blank" rel="noopener">Centre d'Etudes Supérieures de
          Civilisation Médiévale</a> (CESCM-CNRS, Poitiers), équipe à laquelle je suis rattaché et qui a soutenu moralement
          et financièrement ce programme.</li>
        <li>L'atelier d'<a href="http://www.axiane.ch" target="_blank" rel="noopener">Axiane</a> (Porrentruy, Suisse) qui a
          gracieusement fourni les images numérisées du Graduel de Bellelay dans une réalisation de très haute qualité.</li>
        <li>L'<a href="http://palmus.free.fr/" target="_blank" rel="noopener">Atelier de Paléographie Musicale</a> (Abbaye
          Saint-Pierre de Solesmes) pour la générosité avec laquelle nous avons pu consulter leurs archives et dossiers
          d'études.</li>
      </ul>
      <p>A toutes ces institutions, j'adresse mes remerciements les plus sincères.</p>
      <p>De manière plus particulière, je souhaite profondément remercier le service Recherche et valorisation de l'École
        nationale des chartes dirigé par Madame Sylvie Fayet et, en son sein, la cellule d'édition (Gautier Poupeau,
        Aurélien Girard, Nicolas Legrand, Quentin Bauden). Leur accueil, l'apport de leurs compétences et leur généreuse
        disponibilité, les échanges constants et fructueux ont réellement permis de donner vie à ce projet. Mes
        remerciements chaleureux s'adressent aussi à Jocelyn Chalicarne qui m'a assisté tout au long de ce programme avec
        une attention, un dévouement et une efficacité sans failles. Que tous ici veuillent bien trouver l'expression de
        mon infinie gratitude.</p>
      <p class="about-signature">Olivier Cullin, directeur scientifique de la publication.</p>
    </div>
  </div>
</template>
<style scoped>
.about-signature { text-align: right; font-style: italic; }
</style>
