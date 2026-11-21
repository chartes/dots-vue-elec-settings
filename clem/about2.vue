<template>
  <article class="about">
    <!--<div class="title app-width-padding">Signes critiques :</div>-->
    <div class="about-content app-width-padding">
      <p>
        <b>Signes critiques :</b>
      </p>
      <ul>
        <li>
          <code>( )</code> : développements d’abréviations
        </li>
        <li>
          <code>[ ]</code> : restitutions de passages manquants
        </li>
        <li>
          <code>< ></code> : correction par addition
        </li>
      </ul>
        <p>
          Nous marquons la quantité des syllabes pour souligner les erreurs de versification.
        </p>

    </div>
  </article>

</template>
<script>
export default {
  name: 'AboutSecondSection',

  setup () {
  }
}
</script>
<style scoped>
pre {
  height: fit-content;
  width: fit-content;
}
</style>
