<template>
  <article class="home">
    <div class="home-content app-width-padding">
      <p><i>Corpus juris civilis</i> regroupe des compilations et traductions médiévales françaises en lien avec le droit romain. Cet ensemble d’éditions vise à faciliter l’étude de la réception du droit romain en France à partir du XIII<sup>e</sup> siècle. Il comprend des éditions de textes complets, comme <i>Li livres de jostice et de plet</i>, mais aussi des éditions partielles, notamment une série d’éditions du livre 2 du <i>Code</i> et du <i>Digeste</i> d’après toutes les traductions connues, ce qui permet des comparaisons fructueuses.</p>
      <p>Les notices détaillées des manuscrits utilisés dans ces éditions sont consultables dans la section juridique du <a :href="appRootUrl + 'miroir'">Miroir des classiques</a>. Les traductions du <i>Corpus juris civilis</i> ont été décrites dans Frédéric Duval, avec la collab. d’Hélène Biu, Viola Mariotti et Graziella Pastore <i>Les traductions médiévales des compilations de Justinien</i>, Paris, Académie des inscriptions et belles lettres, 2024, 506 p. (<i>Histoire littéraire de la France</i>, t. 48). Ce projet a bénéficié du financement des Equipex Biblissima et Biblissima+ (ANR-21-ESRE-0005).</p>
      <p class="byline">Frédéric Duval</p>
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
  padding-top: 40px; /* adjust depending if you also have a title - see below */
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
  color: var(--text-color);
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

.home p.byline {
  text-align: right;
  margin-left: 45%;
  margin-top: 4ex;
  text-indent: 0;
  font-variant: small-caps;
}

.home-content {
  padding-top: 40px;
}
</style>
