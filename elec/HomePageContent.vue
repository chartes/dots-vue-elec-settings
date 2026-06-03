<template>
  <article class="home">
    <div class="home-content app-width-padding">
      <p>
        Parallèlement à ses différentes
        <a
          href="https://www.chartes.psl.eu/les-editions"
          target="_blank"
          rel="noopener noreferrer"
        >
          collections de publications imprimées
        </a>,
        l’École des chartes propose sur ce site une collection de publications
        électroniques. Celle-ci permet d’offrir à des travaux scientifiques des
        fonctionnalités propres au numérique. Elle réunit essentiellement des
        répertoires et des bases de données, ainsi que des éditions de textes, qui
        peuvent ainsi être explorées plus finement que par la consultation d’une
        version imprimée.
      </p>

      <p>
        Cette collection est complétée par&nbsp;:
      </p>

      <ul>
        <li>
          des
          <a
            href="http://corpus.enc.sorbonne.fr/"
            target="_blank"
            rel="noopener noreferrer"
          >
            corpus
          </a>
          textuels mis en ligne à des fins de recherche, sans intervention éditoriale de
          l’École des chartes,
        </li>

        <li>
          des réalisations à finalité pédagogique, disponible sur le site
          <a
            href="http://theleme.enc.sorbonne.fr/"
            target="_blank"
            rel="noopener noreferrer"
          >
            THELEME
          </a>,
        </li>

        <li>
          un
          <a
            href="http://developpements.enc.sorbonne.fr/"
            target="_blank"
            rel="noopener noreferrer"
          >
            espace de présentation
          </a>
          des différents outils et méthodes informatiques développés par l’École
          des chartes.
        </li>
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
</style>