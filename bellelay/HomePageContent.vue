<script setup>
// 2026-11-26 (Maxime) : l'ancienne page d'accueil de l'édition (TEI legacy-index : texte, image, crédits) devient
// l'accueil de dots-vue ; l'édition commence à l'Introduction. Les logos et la mention de reproduction sont dans
// le pied de page (bellelay.conf.json), la présentation dans « À propos » (about1.vue).
// Image provisoire : Maxime veut en refaire une.
import imageAccueil from './assets/images/michiautembellelay.jpg'
</script>
<template>
  <section class="bellelay-accueil">
    <figure class="bellelay-accueil-image">
      <img :src="imageAccueil" alt="Mich autem. Extrait du graduel de Bellelay">
      <figcaption>Mich autem. Extrait du graduel de Bellelay</figcaption>
    </figure>
    <p>Le graduel de Bellelay est l'un des premiers livres liturgiques notés de l'ordre des Prémontrés. Il contient tout le
      répertoire des messes et des offices pour le cycle liturgique de l'année, plus quelques ajouts marginaux
      (compositions musicales, donation).</p>
    <p>Pour l'interprétation du graduel de Bellelay, merci de consulter le site de l'<a href="https://www.axiane.ch" target="_blank" rel="noopener">atelier d'Axiane</a>.</p>
  </section>
</template>
<style scoped>
.bellelay-accueil-image { margin: 0 0 1rem; }
.bellelay-accueil-image img { display: block; max-width: 100%; height: auto; }
.bellelay-accueil-image figcaption { font-size: .85rem; font-style: italic; color: #6b6b6b; margin-top: .3rem; }
</style>
