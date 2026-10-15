// arbrissel : comportements des pages de l'édition (2026-10-15). La XSL ne produit que des
// classes ; aucun JavaScript dans le HTML. Chargé par dots-vue via "collectionCustomJs": "arbrissel".

// --- Arrivée sur une ancre : bloc commun à tous les corpus (2026-10-15), copié à l'identique ---
// Quand l'URL vise un élément de la page (#note1, ?refId=…#Daugerant, renvoi d'un tableau…) :
// on ouvre les details repliés qui le contiennent, on le place juste sous ce qui reste collé en
// haut (barre de navigation de dots-vue, en-tête et barre de filtres d'un tableau) et on le
// surligne d'un jaune qui fond en 3 s (classe cible-arrivee, bloc CSS « Arrivée sur une ancre »).
// Pas de jaune pour un clic sur un numéro de note dans la même page (appel → note, note → appel) :
// la cible est seulement placée.
// Le front ne pose plus .dots-target et monte le contenu après la navigation : d'où
// l'observation du document plutôt que :target.

// Hauteur occupée en haut de l'écran par ce qui colle au-dessus de la cible
function hauteurCollee (cible) {
  let h = 0
  document.querySelectorAll('nav.navigation-row').forEach(n => {
    const s = getComputedStyle(n)
    if (s.position === 'sticky' || s.position === 'fixed') h = Math.max(h, (parseFloat(s.top) || 0) + n.offsetHeight)
  })
  const t = cible.closest('table')
  if (t && t.tHead && cible.closest('tbody') && getComputedStyle(t.tHead).position === 'sticky') h += t.tHead.offsetHeight
  const cadre = cible.closest('.tf-cadre')
  const barre = cadre && cadre.querySelector('.tf-barre')
  if (barre && getComputedStyle(barre).position === 'sticky') h += barre.offsetHeight
  return h
}

function placerSous (cible) {
  const y = cible.getBoundingClientRect().top + window.scrollY - hauteurCollee(cible) - 12
  if (Math.abs(window.scrollY - y) > 3) window.scrollTo({ top: Math.max(0, y), behavior: 'instant' })
}

function arriverSur (cible, jaune = true) {
  for (let d = cible.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) d.open = true
  document.querySelectorAll('.cible-arrivee').forEach(x => x.classList.remove('cible-arrivee'))
  if (jaune) {
    void cible.offsetWidth
    cible.classList.add('cible-arrivee')
  }
  placerSous(cible)
  // le front peut encore faire défiler la page ou décaler la mise en page (images) : on recale
  setTimeout(() => placerSous(cible), 300)
  setTimeout(() => placerSous(cible), 1000)
}

function cibleDeLUrl () {
  const id = decodeURIComponent(location.hash.slice(1))
  const el = id && document.getElementById(id)
  return el && el.closest('#article') ? el : null
}

// Lien ou cible qui relève d'une note (appel, retour, corps de note)
const estNote = x => !!x && (x.matches('[class*="note"]') || !!x.closest('[class*="note"], .footnotes'))

if (!window.arriveeAncre) {
  window.arriveeAncre = true
  let faite = ''
  let sansJaune = false
  const passe = () => {
    if (location.href === faite) return
    const el = cibleDeLUrl()
    if (!el) return
    faite = location.href
    const jaune = !sansJaune
    sansJaune = false
    setTimeout(() => arriverSur(el, jaune), 150)
  }
  new MutationObserver(passe).observe(document.documentElement, { childList: true, subtree: true })
  window.addEventListener('hashchange', passe)
  window.addEventListener('popstate', passe)
  // Clic sur un lien de la page : numéro de note → pas de jaune ; lien vers l'ancre déjà dans
  // l'URL → pas de hashchange, on rejoue l'arrivée
  document.addEventListener('click', event => {
    const a = event.target.closest('a[href*="#"]')
    if (!a || a.closest('.tf-cadre') && a.matches('a.tf-voir')) return
    const u = new URL(a.href, location.href)
    if (u.pathname + u.search !== location.pathname + location.search) return
    const vise = document.getElementById(decodeURIComponent(u.hash.slice(1)))
    const note = estNote(a) || estNote(vise)
    if (u.href !== location.href) { sansJaune = note; return }
    const el = cibleDeLUrl()
    if (el) { event.preventDefault(); arriverSur(el, !note) }
  }, true)
  passe()
}
