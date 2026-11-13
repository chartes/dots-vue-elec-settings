<template>
  <article class="home">
    <div class="home-content app-width-padding">
      <p>Le formulaire d'Odart Morchesne est célèbre chez les historiens de la France du XV<sup>e</sup> siècle comme chez les diplomatistes. Chez les premiers, déjà, Gaston Du Fresne de Beaucourt y a puisé nombre de renseignements inédits pour son Histoire de Charles VII (Paris, 1881-1891, 6 vol.). Chez les seconds, Georges Tessier l'a mis en lumière, montrant tout le prix des données relatives à la conception de l'office et aux lettres de finances (Le formulaire d'Odart Morchesne, 1427, dans Mélanges dédiés à la mémoire de Félix Grat, t. II, Paris, 1949, p. 75-102).</p>
      <p>Le recueil mérite bien sa réputation. Riche, dans la version ici éditée, de quelque 270 formules, il est d'abord et avant tout une compilation de modèles d'actes royaux (essentiellement de ceux qui étaient préparés au sein même de la chancellerie : chartes, lettres scellées sur simple et double queue de parchemin). Aucun recueil n'était jusque-là parvenu à ce degré de pertinence dans le choix des types d'actes les plus variés, aucun n'avait encore organisé la matière de façon aussi efficace et structurée.</p>
      <p>Mais le formulaire a un autre atout : plus encore que recueil de formules, il se veut outil d'apprentissage et de transmission d'un savoir-faire. Son auteur fait suivre la plupart de ses modèles d'actes de copieux commentaires, introduits par la formule <i>Nota [bene]</i>, mais bientôt qualifiés d'un substantif : les <i>notas</i>. Où l'entreprise devient unique, c'est que les notas de Morchesne ne se limitent pas, et de loin, à des formulations alternatives, à des remarques d'ordre diplomatique, à des recettes de fabrication. Ils entendent transmettre tout le savoir rédactionnel, juridique, institutionnel qui à la fois éclaire et conditionne la conception et la recevabilité des actes royaux.</p>
      <p>Aujourd'hui, le formulaire de Morchesne est donc un formidable moyen de pénétrer dans le jeu concret des institutions royales du XV<sup>e</sup> siècle comme dans le dialogue entre les sujets, le roi et ses clercs.</p>
    </div>
  </article>

</template>
<script>
import { ref, watch } from 'vue'

export default {
  name: 'HomePageContent',
  props: {
    dtsCollectionDescription: {
      type: String,
      required: false
    },
    customCollectionDescription: {
      type: String,
      required: false
    },
    applicationRootUrl: {
      type: String,
      required: true
    }
  },
  setup (props) {
    /* Use appRootUrl to create links within the application with the relevant base url for the current deployment */
    const appRootUrl = ref(props.applicationRootUrl)
    /* Use dtsCollDescription to display the DTS API 'description' data */
    const dtsCollDescription = ref(props.dtsCollectionDescription)
    /* Use customCollDescription to display the homePageSettings.descriptionSection.collectionDescription data of the collection conf.json */
    const customCollDescription = ref(props.customCollectionDescription)

    watch(props, async (newProps) => {
      appRootUrl.value = newProps.applicationRootUrl
      dtsCollDescription.value = newProps.dtsCollectionDescription
      customCollDescription.value = newProps.customCollectionDescription
    }, { deep: true, immediate: true })

    return {
      appRootUrl,
      dtsCollDescription,
      customCollDescription
    }
  }
}
</script>
<style scoped>
.home {
  font-family: "Barlow", sans-serif;
}
.home-content {
  padding-top: 15px; /* adjust depending if you also have a title - see below */
}
.home h1 {
  padding-top: 20px;
  padding-bottom: 20px;
  text-align: left;
  font-family: "Barlow", sans-serif;
  font-size: 25px;
  font-weight: 500;
  line-height: 33px;
  text-transform: none;
  color: var(--fill-color);
}
.home h2 {
  margin: 0 !important;
  padding-top: 20px;
  padding-bottom: 20px;
  text-align: left;
  font-family: "Barlow", sans-serif;
  font-size: 20px;
  font-weight: 500;
  line-height: 28px;
  text-transform: none;
  color: #4a4a4a !important;
}
.home p {
  text-align: left;
  text-indent: 0;
  line-height: 24px;
  margin: 5px 0;
}

.home p.byline {
  text-align: right;
  margin-left: 45%;
  margin-top: 4ex;
  text-indent: 0;
  font-variant: small-caps;
}

.home-content {
  padding-top: 15px;
}
</style>
