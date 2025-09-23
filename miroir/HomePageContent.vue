<template>
  <article class="about">
    <div class="about-content app-width-padding">
     <p>{{dtsCollectionDescription}}</p>
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
.about {
  font-family: "Barlow", sans-serif;
}
.about-content {
  padding-top: 40px;
}
.about h1 {
  padding-top: 20px;
  padding-bottom: 20px;
  text-align: left;
  font-size: 25px;
  font-weight: 500;
  line-height: 33px;
  text-transform: none;
  color: var(--text-color);
}
.about h2 {
  padding-top: 20px;
  padding-bottom: 20px;
  text-align: left;
  font-size: 20px;
  font-weight: 500;
  line-height: 33px;
  text-transform: none;
}
.about p {
  text-align: left;
  text-indent: 0;
}
</style>
