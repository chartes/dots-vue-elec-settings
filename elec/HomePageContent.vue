<template>
  <article class="home">
    <div class="home-content app-width-padding">
      <p>
        ELEC est la plateforme d’édition scientifique ouverte de l’École nationale
        des chartes – PSL. Elle rassemble des corpus documentaires et textuels
        publiés selon les principes FAIR et accessibles pour les usages de la
        recherche via l’<a
          href="https://data.chartes.psl.eu/api/dts/"
          target="_blank"
          rel="noopener noreferrer"
        >API DTS</a>.
      </p>

      <p class="themes-intro">
        Explorez les collections&nbsp;:
      </p>

      <!-- Each data-filter is a key of homePageSettings.filters (elec.conf.json): a click filters the cards below -->
      <ul class="themes">
        <li data-filter="Actes diplomatiques">Actes diplomatiques</li>
        <li data-filter="Textes juridiques">Textes juridiques</li>
        <li data-filter="Documents d’archives">Documents d’archives</li>
        <li data-filter="Textes historiographiques et liturgiques">Textes historiographiques et liturgiques</li>
        <li data-filter="Actes de colloques">Actes de colloques</li>
      </ul>
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
/* A blank line between the presentation and the themes */
.home p.themes-intro {
  margin-top: 1em;
}
/* Themes: dashes instead of the default bullets, no extra indent */
.home ul.themes {
  list-style: none;
  padding-left: 0;
}
/* Inline-block dash: the active filter underline and colour (set by dots-vue) leave it out */
.home ul.themes li::before {
  content: '–';
  display: inline-block;
  width: 1em;
  color: #333333;
  font-weight: 400;
}

.home p.byline {
  text-align: right;
  margin-left: 45%;
  margin-top: 4ex;
  text-indent: 0;
  font-variant: small-caps;
}
</style>