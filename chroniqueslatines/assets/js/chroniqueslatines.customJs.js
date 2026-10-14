// Chroniques latines : comportements des pages de l'édition (2026-10-14). La XSL ne produit
// que des classes (page Références : transform/chroniqueslatines/liste-repliable.xsl, classes
// lr-*) ; aucun JavaScript dans le HTML. Chargé par dots-vue via
// "collectionCustomJs": "chroniqueslatines".

// --- Liste repliable : ouvrir l'entrée visée par l'ancre de l'URL ---
// Un renvoi de note (…?refId=chroniqueslatines_refs#caesar, ou #caesar--chroniqueslatines_0-2
// pour un chapitre) amène sur une entrée repliée : on l'ouvre, avec son groupe, on la marque
// (lr-vise) et on la place sous l'en-tête. Le contenu arrive après la navigation, d'où
// l'observation du document plutôt que :target.

function viser () {
  const id = decodeURIComponent(location.hash.slice(1))
  const el = id && document.getElementById(id)
  document.querySelectorAll('.lr-vise').forEach(x => { if (x !== el) x.classList.remove('lr-vise') })
  if (!el || !el.closest('.lr-liste')) return
  for (let d = el.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) d.open = true
  el.classList.add('lr-vise')
  el.scrollIntoView({ block: 'start' })
}

if (!window.lrComportements) {
  window.lrComportements = true
  const vues = new WeakSet()
  let adresse = ''
  const passe = () => {
    let nouvelle = location.href !== adresse
    document.querySelectorAll('.lr-liste').forEach(l => {
      if (!vues.has(l)) { vues.add(l); nouvelle = true }
    })
    if (!nouvelle) return
    adresse = location.href
    if (document.querySelector('.lr-liste')) viser()
  }
  new MutationObserver(passe).observe(document.documentElement, { childList: true, subtree: true })
  window.addEventListener('hashchange', passe)
  window.addEventListener('popstate', passe)
  passe()
}
