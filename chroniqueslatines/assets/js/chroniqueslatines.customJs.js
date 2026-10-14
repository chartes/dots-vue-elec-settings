// Chroniques latines : comportements des pages de l'édition (2026-10-14). La XSL ne produit
// que des classes ; aucun JavaScript dans le HTML. Chargé par dots-vue via
// "collectionCustomJs": "chroniqueslatines".

// --- Page Références : ouvrir l'œuvre visée par l'ancre de l'URL ---
// Un renvoi de note (…?refId=chroniqueslatines_refs#caesar, ou #caesar--chroniqueslatines_0-2
// pour un chapitre) amène sur une œuvre repliée (details.bibl). On l'ouvre avec son groupe
// (details.listBibl), on pose sur la cible la classe dots-target, que la CSS du corpus
// surligne, et on la place sous l'en-tête. Le front ne pose plus dots-target lui-même, et le
// contenu arrive après la navigation : d'où l'observation du document plutôt que :target.

function viser () {
  const id = decodeURIComponent(location.hash.slice(1))
  const el = id && document.getElementById(id)
  if (!el || !el.closest('details.listBibl, details.bibl')) return
  document.querySelectorAll('details.listBibl .dots-target, details.bibl.dots-target').forEach(x => { if (x !== el) x.classList.remove('dots-target') })
  for (let d = el.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) d.open = true
  el.classList.add('dots-target')
  el.scrollIntoView({ block: 'start' })
}

if (!window.clComportements) {
  window.clComportements = true
  const vues = new WeakSet()
  let adresse = ''
  const passe = () => {
    let nouvelle = location.href !== adresse
    document.querySelectorAll('details.listBibl').forEach(l => {
      if (!vues.has(l)) { vues.add(l); nouvelle = true }
    })
    if (!nouvelle) return
    adresse = location.href
    if (document.querySelector('details.listBibl')) viser()
  }
  new MutationObserver(passe).observe(document.documentElement, { childList: true, subtree: true })
  window.addEventListener('hashchange', passe)
  window.addEventListener('popstate', passe)
  passe()
}
