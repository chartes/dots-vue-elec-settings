<template>
  <article class="home">
    <div class="home-content app-width-padding">
      <p>Achevé au plus tard au début de 1427, le formulaire d'Odart Morchesne, ici édité dans la version la plus proche de l'auteur, est riche de quelque 270 modèles d'actes que les notaires et secrétaires du roi de France pouvaient être amenés à composer. Aucun recueil n'était jusque-là parvenu à ce degré de pertinence et de variété dans le choix des textes, aucun n'avait encore organisé la matière de façon aussi efficace et structurée. De fait, la compilation de Morchesne forma le socle d'un grand nombre de formulaires postérieurs, puis, au début du XVI<sup>e</sup> siècle, du <i>Grand stille</i> officiel de la chancellerie. Sa capacité de séduction ne tient pas qu'à son efficacité, mais aussi au double souci de l'auteur de livrer des matériaux d'une actualité immédiate, autant que des formules éprouvées ; il fait pénétrer de plain-pied dans l'écritoire du notaire du roi en même temps que dans les années troubles du « royaume de Bourges ».</p>
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
