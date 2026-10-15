// Bellelay : comportements des pages de l'édition. Chargé par dots-vue via
// "collectionCustomJs": "bellelay". Les comportements communs (tableaux triables et filtrables,
// arrivée sur une ancre) sont ceux du JS générique de l'ÉLEC, importé ci-dessous ; ce fichier
// n'ajoute que ce qui est propre à Bellelay : la présélection d'une fête dans l'index.

import '../../../elec/assets/js/elec.customJs.js'

// Appeler fn sur chaque élément qui correspond à selecteur dès qu'il entre dans la page
// (documents chargés après coup par dots-vue) : pour ce qui doit se faire à l'affichage.
function aLAffichage (selecteur, fn) {
  const vus = new WeakSet()
  const passe = () => document.querySelectorAll(selecteur).forEach(el => {
    if (vus.has(el)) return
    vus.add(el)
    fn(el)
  })
  new MutationObserver(passe).observe(document.documentElement, { childList: true, subtree: true })
  passe()
}

// --- Index du manuscrit : présélection d'une fête depuis l'adresse (#fete=…) ---
// Lien « Fête » d'une pièce : ?refId=legacy-indexmanuscrit#fete=… ouvre l'index filtré sur cette
// fête. Reprend le gestionnaire de l'ancienne image-sonde : le hash est décodé jusqu'à stabilité
// (le routeur de dots-vue le réencode : %20 devient %2520), puis la fête est choisie dans le
// menu « Fête » (colonne 4) et le filtre est appliqué par un événement input.
function preselectionFete (cadre) {
  const h = location.hash
  const k = h.indexOf('fete=')
  if (k === -1) return
  let v = h.slice(k + 5)
  for (let n = 0; n < 3 && v.indexOf('%') !== -1; n++) {
    try { v = decodeURIComponent(v) } catch (e) { break }
  }
  const s = cadre.querySelector('tr.bl-filtres select[data-col="4"]')
  if (!s) return
  const o = Array.prototype.filter.call(s.options, x => x.textContent.trim() === v.trim())[0]
  if (!o) return
  s.value = o.value
  s.dispatchEvent(new Event('input', { bubbles: true }))
}

// Une fois par cadre d'index, à son apparition (dots-vue insère la page après le chargement du script)
aLAffichage('.bl-tableau-cadre', cadre => {
  if (cadre.querySelector('table.bl-index')) preselectionFete(cadre)
})
