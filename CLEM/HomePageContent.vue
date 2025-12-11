<template>
  <article class="home">
    <div class="home-content app-width-padding">
      <!--<h1>A custom title </h1>
      <h2>In the default custom component, you can use either: </h2>
      <p>
        <b>a DTS API collection description if available:</b>
      </p>
      <p>
        {{ dtsCollDescription ? dtsCollDescription : 'No DTS API collection description available' }}
      </p>
      <p>
        <b>a custom collection description (homePageSettings.collectionDescription) if available:</b>
      </p>-->
      <p>
        {{ customCollDescription ? customCollDescription : 'No homePageSettings.collectionDescription available' }}
      </p>
      <!--<p>
        <b>...or use a complete custom default description:</b>
      </p>
      <p class="header-baseline"><span>Position</span> : à l’origine, les positions prises et à défendre par l’élève, face au jury. Depuis, un résumé de la thèse soutenue. </p>-->
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
    }
  },
  setup (props) {
    const dtsCollDescription = ref(props.dtsCollectionDescription)
    const customCollDescription = ref(props.customCollectionDescription)

    watch(props, async (newProps) => {
      dtsCollDescription.value = newProps.dtsCollectionDescription
      customCollDescription.value = newProps.customCollectionDescription
    }, { deep: true, immediate: true })

    return {
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
  padding-top: 40px;
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
</style>
