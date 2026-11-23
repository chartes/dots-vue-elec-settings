<template>
  <article class="home">
    <div class="home-content app-width-padding">
      <p>Accordant à la liturgie une place centrale dans leur vie religieuse, les Prêcheurs attachèrent une grande importance à son unification. Accomplie en 1254-1256, sous la direction du cinquième maître de l’ordre, Humbert de Romans, celle-ci fut aussitôt fixée dans les quatorze livres de la liturgie dominicaine, dont le lectionnaire de l’office et son sanctoral. Le manuscrit apographe de ces textes, dit le « Prototype », est parvenu indemne jusqu’à nous : il est aujourd’hui conservé aux Archives générales de l’ordre, au couvent Sainte-Sabine de Rome, sous la cote XIV L 1.</p>
      <p>L’édition et l’étude du sanctoral appellent l’attention, non seulement des liturgistes, mais plus largement des historiens des savoirs médiévaux, sur la technique des citations et de l’emploi des sources ainsi que sur l’originalité dans la composition même du lectionnaire – étonnante pour le XIII<sup>e</sup> siècle.</p>
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
