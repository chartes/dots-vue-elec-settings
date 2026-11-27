// Bellelay : comportements des pages de l'édition. Chargé par dots-vue via
// "collectionCustomJs": "bellelay". Les comportements communs (tableaux triables et filtrables,
// arrivée sur une ancre) sont ceux du JS générique de l'ÉLEC, importé ci-dessous ; ce fichier
// n'ajoute que ce qui est propre à Bellelay : la présélection d'une fête dans l'index et l'ouverture de l'image
// sur les pages du manuscrit.

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

// --- Le manuscrit : image ouverte dès l'arrivée (2026-11-27, Maxime : « aller dans le manuscrit et tout feuilleter » ;
// l'ancien site montrait l'image en grand sur chaque page de feuillet). Sur une page du manuscrit (vignette e-codices
// .bl-ec, posée par bellelay.xsl), la vignette de dots-vue est ouverte une fois par page : la visionneuse vient à côté du
// texte, sur ce feuillet ; on feuillette dans la visionneuse ou page par page avec les flèches. Si le lecteur referme
// l'image, elle ne se rouvre pas tant qu'il reste sur la page. ---
if (!window.bellelayImageOuverte) {
  window.bellelayImageOuverte = true
  let derniere = ''
  aLAffichage('.bl-ec button.pb-thumbnail', b => {
    const page = location.pathname + location.search
    if (page === derniere) return
    derniere = page
    // arrivée depuis la visionneuse (synchro ci-dessous) : elle montre déjà ce feuillet, un clic la refermerait
    if (window.bellelayDepuisImage && new URLSearchParams(location.search).get('refId') === window.bellelayDepuisImage) return
    setTimeout(() => { if (b.isConnected) b.click() }, 400)
  })
}

// --- Le manuscrit : la page suit l'image (2026-11-27, Maxime : « naviguer dans les images et quand on change de page ça
// change l'image » ; choix : Mirador synchronisé). Page → image : la vignette ouvre la visionneuse sur le feuillet (bloc
// ci-dessus). Image → page : quand le lecteur change de vue dans la visionneuse, dots-vue passe à la page de ce feuillet.
// La vue courante est lue dans l'information affichée par Mirador sous l'image (« 15 of 386 • 5 ») ; son libellé dans le
// manifeste e-codices donne la page : N = feuillet N = legacy-feuillet(N+5) ; D-H = gardes I-V = legacy-feuillet1-5 ;
// I-N = feuillets zI-zVI = legacy-feuillet368-373 ; les autres vues (reliure, A-C) ne changent pas la page. ---
if (!window.bellelaySynchro) {
  window.bellelaySynchro = true
  const pageDeLibelle = l => {
    if (/^\d+$/.test(l)) return +l >= 1 && +l <= 362 ? 'legacy-feuillet' + (+l + 5) : null
    const k = 'DEFGHIJKLMN'.indexOf(l)
    return l.length === 1 && k !== -1 ? 'legacy-feuillet' + (k < 5 ? k + 1 : 368 + k - 5) : null
  }
  let vu = null          // dernière vue lue
  let attente = null
  const suivre = () => {
    const info = document.querySelector('.mirador-osd-info')
    const cadre = document.querySelector('#article .bl-ec')
    if (!info || !cadre) { vu = null; return }
    const texte = info.textContent.trim()
    if (!texte || texte === vu) return
    const premier = vu === null                 // première lecture après l'ouverture : la vue du feuillet de la page
    vu = texte
    if (premier) return
    clearTimeout(attente)
    attente = setTimeout(() => {                // le lecteur feuillette vite : on attend qu'il s'arrête
      const page = pageDeLibelle((vu.split('•')[1] || '').trim())
      const ici = new URLSearchParams(location.search).get('refId')
      if (!page || page === ici || !cadre.isConnected) return
      // changement de page par le routeur de dots-vue (sans recharger : la visionneuse reste ouverte sur la vue)
      window.bellelayDepuisImage = page
      const routeur = document.querySelector('#app')?.__vue_app__?.config.globalProperties.$router
      if (routeur) routeur.push({ path: location.pathname, query: { refId: page } })
      else location.search = '?refId=' + page
    }, 700)
  }
  new MutationObserver(suivre).observe(document.documentElement, { childList: true, subtree: true, characterData: true })
}
