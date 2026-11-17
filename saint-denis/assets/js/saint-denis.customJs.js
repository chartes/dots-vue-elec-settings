// Saint-Denis : comportements des pages de l'édition. Chargé par dots-vue via
// "collectionCustomJs": "saint-denis". Les comportements communs (tableaux triables et filtrables,
// arrivée sur une ancre, bibliographie…) sont ceux du JS générique de l'ÉLEC, importé ci-dessous ;
// ce fichier n'ajoute que ce qui est propre à l'Inventaire général : l'export PDF d'une notice ou
// d'une période et le porte-documents (boutons posés par saint-denis.xsl dans div.elec-outils).
// Déplacés du JS générique le 2026-11-17 : aucun autre corpus ne s'en sert.

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

// 1. Export PDF (2026-11-16, à la manière de l'ancien site : « obtenir cette
//    unité de description en format PDF », seule ou « avec ses sous-unités »). Aucun appel réseau dans la XSL : elle pose
//    des <button class="elec-pdf"> ; un clic ouvre une fenêtre qui ne contient que ce qu'il faut imprimer, avec les
//    feuilles de style de la page, un titre, l'adresse et la date, puis lance l'impression (le navigateur y propose
//    « Enregistrer en PDF »). Les vignettes d'images restent repliées (libellé de la page, pas l'image).
//      button.elec-pdf                       → l'unité qui le contient ([data-pdf], sinon article ou section) ;
//      button.elec-pdf[data-pdf-ref="ID"]    → l'unité ID du même document, demandée à l'API DoTS ; data-pdf-titre ;
//      button.elec-pdf[data-pdf-parent="ID"] → l'unité qui CONTIENT l'unité ID (une période et toutes ses notices) :
//                                              DoTS sert chaque notice seule, la XSL ne voit pas sa section ; le parent
//                                              et son titre sont demandés à l'API de navigation.
//    L'adresse de l'API n'est pas connue du JS : on la lit dans les requêtes que la page a déjà faites vers /api/dts/.
const RE_DTS = /\/api\/dts\/(document|navigation|collection)\b/
const baseDts = u => u.replace(/(\/api\/dts)\/.*$/, '$1')
function apiDts () {
  if (window.elecApiDts) return window.elecApiDts
  const r = performance.getEntriesByType('resource').map(e => e.name).reverse().find(u => RE_DTS.test(u))
  return r ? (window.elecApiDts = baseDts(r)) : null
}
if (window.PerformanceObserver && !window.elecObsDts) { // retient l'adresse dès la 1re requête de la page vers l'API
  window.elecObsDts = new PerformanceObserver(l => l.getEntries().forEach(e => { if (RE_DTS.test(e.name)) window.elecApiDts = baseDts(e.name) }))
  try { window.elecObsDts.observe({ type: 'resource', buffered: true }) } catch (e) {}
}
function ressourceCourante () {
  const m = location.pathname.match(/\/document\/([^/?#]+)/)
  return m ? decodeURIComponent(m[1]) : null
}
async function uniteDepuisApi (api, ressource, ref) {
  if (!api || !ressource) throw new Error('adresse de l’API DoTS introuvable')
  const r = await fetch(api + '/document?resource=' + encodeURIComponent(ressource) + '&ref=' + encodeURIComponent(ref) + '&mediaType=html')
  if (!r.ok) throw new Error('API DoTS : ' + r.status)
  const d = new DOMParser().parseFromString(await r.text(), 'text/html')
  return d.getElementById('article') || d.body
}
const echapHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
// plusieurs unités dans une même page : identifiants (note1, notea…) rendus uniques, liens internes suivis
function prefixerIds (racine) {
  racine.querySelectorAll('article[id]').forEach(u => {
    const p = u.id + '--'
    u.querySelectorAll('[id]').forEach(x => { x.id = p + x.id })
    u.querySelectorAll('a[href^="#"]').forEach(a => a.setAttribute('href', '#' + p + a.getAttribute('href').slice(1)))
  })
}
function nettoyerPourImpression (racine) {
  racine.querySelectorAll('button.elec-pdf, button.elec-panier').forEach(b => b.remove())
  racine.querySelectorAll('details[open]').forEach(d => d.removeAttribute('open'))
}
function fenetreImpression (titre) {
  const w = window.open('', '_blank')
  if (!w) return null
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(n => n.outerHTML).join('\n')
  // police de l'édition (posée par dots-vue sur l'article, pas sur body) ; la marge négative de .document-area
  // (mise en page de dots-vue) ferait sortir le haut de la page
  const police = getComputedStyle(document.querySelector('.document-area #article') || document.body).fontFamily
  w.document.write('<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><base href="' + echapHtml(document.baseURI) + '">' +
    '<title>' + echapHtml(titre) + '</title>' + styles +
    '<style>body{background:#fff;margin:1.5cm;font-family:' + police.replace(/[<>]/g, '') + '} .document-area{margin:0 !important;top:0 !important}' +
    ' .elec-pdf-titre{font-size:1.3rem;margin:0 0 1rem}' +
    ' .elec-pdf-pied{margin-top:2rem;font-size:.85em;color:#555;border-top:1px solid #ccc;padding-top:.5rem}' +
    ' .elec-pdf-attente{color:#555} details > summary{list-style:none} details > summary::-webkit-details-marker{display:none}' +
    ' .document-area article + article{margin-top:1.5rem} @page{margin:1.5cm} @media print{body{margin:0}}</style></head>' +
    '<body><div class="document-area"><div id="article"><p class="elec-pdf-attente">Préparation du document…</p></div></div></body></html>')
  w.document.close()
  return w
}
function remplirEtImprimer (w, titre, noeuds, adresse) {
  const zone = w.document.getElementById('article')
  zone.innerHTML = ''
  if (titre) {
    const h = w.document.createElement('h1')
    h.className = 'elec-pdf-titre'
    h.textContent = titre
    zone.append(h)
  }
  noeuds.forEach(n => zone.append(w.document.importNode(n, true)))
  const pied = w.document.createElement('p')
  pied.className = 'elec-pdf-pied'
  pied.textContent = adresse + ' — consulté le ' + new Date().toLocaleDateString('fr-FR')
  w.document.body.append(pied)
  setTimeout(() => { w.focus(); w.print() }, 400)
}
async function parentDe (api, ressource, ref) {
  const nav = r => fetch(api + '/navigation?resource=' + encodeURIComponent(ressource) + '&ref=' + encodeURIComponent(r)).then(x => x.json())
  const parent = ((await nav(ref)).ref || {}).parent
  if (!parent) throw new Error('unité parente introuvable')
  const titre = (((await nav(parent)).ref || {}).dublinCore || {}).title
  return { ref: parent, titre: titre || parent }
}
async function exporterPdf (bouton) {
  if (bouton.hasAttribute('data-pdf-parent')) {
    const w = fenetreImpression('Préparation…')
    if (!w) return
    try {
      const api = apiDts()
      if (!api) throw new Error('adresse de l’API DoTS introuvable')
      const p = await parentDe(api, ressourceCourante(), bouton.getAttribute('data-pdf-parent'))
      const art = await uniteDepuisApi(api, ressourceCourante(), p.ref)
      nettoyerPourImpression(art)
      prefixerIds(art)
      w.document.title = p.titre
      remplirEtImprimer(w, p.titre, Array.from(art.childNodes), location.origin + location.pathname + '?refId=' + encodeURIComponent(p.ref))
    } catch (e) {
      w.document.getElementById('article').textContent = 'Export impossible : ' + e.message
    }
    return
  }
  const ref = bouton.getAttribute('data-pdf-ref')
  if (!ref) {
    const unite = bouton.closest('[data-pdf]') || bouton.closest('article, section')
    if (!unite) return
    const copie = unite.cloneNode(true)
    nettoyerPourImpression(copie)
    const titre = (unite.getAttribute('data-pdf-titre') || (unite.querySelector('h1, h2, h3') || {}).textContent || document.title).trim()
    const w = fenetreImpression(titre)
    if (w) remplirEtImprimer(w, '', [copie], location.href)
    return
  }
  const titre = bouton.getAttribute('data-pdf-titre') || ref
  const w = fenetreImpression(titre)
  if (!w) return
  try {
    const art = await uniteDepuisApi(apiDts(), ressourceCourante(), ref)
    nettoyerPourImpression(art)
    prefixerIds(art)
    remplirEtImprimer(w, titre, Array.from(art.childNodes), location.origin + location.pathname + '?refId=' + encodeURIComponent(ref))
  } catch (e) {
    w.document.getElementById('article').textContent = 'Export impossible : ' + e.message
  }
}

if (!window.elecPdf) {
  window.elecPdf = true
  document.addEventListener('click', event => {
    const b = event.target.closest('button.elec-pdf')
    if (b) { event.preventDefault(); exporterPdf(b) }
  })
}

// 2. Porte-documents (2026-11-16, comme sur l'ancien site : « ajouter au porte-documents »). La XSL pose dans une unité un
//    <button class="elec-panier" data-panier-id="ID" data-panier-titre="…">. Le porte-documents est gardé dans ce
//    navigateur (localStorage : rien n'est envoyé ni partagé) et montré par un bouton fixe en bas à droite de l'écran :
//    liste des unités retenues (lien vers chacune, retrait), « Tout en PDF » (chaque unité est demandée à l'API DoTS,
//    comme au bloc 1) et « Vider ». Chaque entrée garde son adresse et sa ressource.
const PANIER = 'elec-porte-documents'
function lirePanier () {
  try { return JSON.parse(localStorage.getItem(PANIER)) || [] } catch (e) { return [] }
}
function ecrirePanier (l) {
  try { localStorage.setItem(PANIER, JSON.stringify(l)) } catch (e) {}
  majPanier()
}
const memeEntree = (x, id, ressource) => x.id === id && x.ressource === ressource
function majBoutonPanier (b) {
  const dedans = lirePanier().some(x => memeEntree(x, b.getAttribute('data-panier-id'), ressourceCourante()))
  b.setAttribute('aria-pressed', dedans ? 'true' : 'false')
  b.textContent = dedans ? 'Retirer du porte-documents' : 'Ajouter au porte-documents'
}
function basculerPanier (b) {
  const id = b.getAttribute('data-panier-id')
  const ressource = ressourceCourante()
  let l = lirePanier()
  if (l.some(x => memeEntree(x, id, ressource))) l = l.filter(x => !memeEntree(x, id, ressource))
  else {
    l.push({
      id,
      ressource,
      titre: (b.getAttribute('data-panier-titre') || id).trim(),
      adresse: location.origin + location.pathname + '?refId=' + encodeURIComponent(id),
      api: apiDts()
    })
  }
  ecrirePanier(l)
}
function panneauPanier () {
  let p = document.getElementById('elec-panier')
  if (p) return p
  const st = document.createElement('style')
  st.id = 'elec-panier-style'
  st.textContent = '#elec-panier{position:fixed;right:1rem;bottom:1rem;z-index:1000;font-size:.9rem}' +
    '#elec-panier>button.elec-panier-ouvrir{padding:.4rem .8rem;border:1px solid #5f004d;border-radius:4px;background:#5f004d;color:#fff;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.25)}' +
    '#elec-panier .elec-panier-liste{position:absolute;right:0;bottom:2.6rem;width:min(26rem,90vw);max-height:60vh;overflow:auto;background:#fff;border:1px solid #c9bfc6;border-radius:4px;box-shadow:0 2px 10px rgba(0,0,0,.2);padding:.6rem .8rem}' +
    '#elec-panier ol{margin:.3rem 0 .6rem 1.2rem;padding:0} #elec-panier li{margin:.25rem 0}' +
    '#elec-panier li button{margin-left:.4rem;border:0;background:none;color:#8a1c1c;cursor:pointer}' +
    '#elec-panier .elec-panier-actions button{margin-right:.5rem;padding:.15rem .5rem;border:1px solid #c9bfc6;border-radius:3px;background:#fff;color:#5f004d;cursor:pointer}' +
    '@media print{#elec-panier{display:none}}'
  document.head.append(st)
  p = document.createElement('div')
  p.id = 'elec-panier'
  p.style.fontFamily = getComputedStyle(document.querySelector('#app') || document.body).fontFamily // hors de #app : sinon police par défaut
  p.innerHTML = '<button type="button" class="elec-panier-ouvrir" aria-expanded="false"></button>' +
    '<div class="elec-panier-liste" hidden><strong>Porte-documents</strong><ol></ol>' +
    '<div class="elec-panier-actions"><button type="button" class="elec-panier-pdf">Tout en PDF</button>' +
    '<button type="button" class="elec-panier-vider">Vider</button></div></div>'
  document.body.append(p)
  return p
}
function majPanier () {
  const l = lirePanier()
  document.querySelectorAll('button.elec-panier').forEach(majBoutonPanier)
  const p = document.getElementById('elec-panier') || (l.length ? panneauPanier() : null)
  if (!p) return
  p.hidden = l.length === 0
  p.querySelector('.elec-panier-ouvrir').textContent = 'Porte-documents (' + l.length + ')'
  const ol = p.querySelector('ol')
  ol.innerHTML = ''
  l.forEach((x, i) => {
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.href = x.adresse
    a.textContent = x.titre
    const r = document.createElement('button')
    r.type = 'button'
    r.title = 'Retirer du porte-documents'
    r.textContent = '✕'
    r.setAttribute('data-i', i)
    li.append(a, r)
    ol.append(li)
  })
}
async function panierEnPdf () {
  const l = lirePanier()
  if (!l.length) return
  const w = fenetreImpression('Porte-documents')
  if (!w) return
  const noeuds = []
  for (const x of l) {
    try {
      const art = await uniteDepuisApi(apiDts() || x.api, x.ressource, x.id)
      nettoyerPourImpression(art)
      prefixerIds(art)
      noeuds.push(...Array.from(art.childNodes))
    } catch (e) {
      const err = document.createElement('p')
      err.textContent = x.titre + ' : export impossible (' + e.message + ')'
      noeuds.push(err)
    }
  }
  remplirEtImprimer(w, 'Porte-documents', noeuds, l.length + ' unité(s) — ' + location.origin)
}

if (!window.elecPanier) {
  window.elecPanier = true
  aLAffichage('button.elec-panier', majBoutonPanier)
  document.addEventListener('click', event => {
    const b = event.target.closest('button.elec-panier, #elec-panier button')
    if (!b) return
    if (b.matches('.elec-panier')) basculerPanier(b)
    else if (b.matches('.elec-panier-ouvrir')) {
      const liste = b.nextElementSibling
      liste.hidden = !liste.hidden
      b.setAttribute('aria-expanded', String(!liste.hidden))
    } else if (b.matches('.elec-panier-pdf')) panierEnPdf()
    else if (b.matches('.elec-panier-vider')) ecrirePanier([])
    else if (b.hasAttribute('data-i')) {
      const l = lirePanier()
      l.splice(Number(b.getAttribute('data-i')), 1)
      ecrirePanier(l)
    }
  })
  window.addEventListener('storage', e => { if (e.key === PANIER) majPanier() })
  majPanier()
}
