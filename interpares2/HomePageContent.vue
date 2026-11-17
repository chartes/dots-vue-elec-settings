<template>
  <article class="home">
    <div class="home-content app-width-padding">
      <p>L’École des chartes et les Archives de France se sont associées pour fournir la traduction en français des principaux travaux du groupe de recherche InterPares (International Research on Permanent Authentic Records in Electronic Systems : <a href="http://www.interpares.org/" target="_blank">http://www.interpares.org/</a>) sur la conservation pérenne de documents authentiques dans les systèmes électroniques. Cette traduction a pour objectif de diffuser dans la communauté archivistique francophone les concepts et la réflexion théorique élaborés par InterPares, contribuant ainsi à l’élaboration d’une archivistique et d’une diplomatique numériques.</p>
      <p>Outre la traduction des principaux livrables, dont un glossaire de près de 600 termes, le lecteur trouvera ici une introduction présentant les principaux apports d’InterPares tant dans le domaine de la définition des documents numériques que dans celui des critères d’authenticité qui en gouvernent la production et la conservation.</p>
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
}
</style>
