// Cartulaires : comportements des pages. Chargé par dots-vue via "collectionCustomJs": "cartulaires". Les comportements
// communs (tableaux triables et filtrables, arrivée sur une ancre, bibliographie…) sont ceux du JS générique de l'ÉLEC,
// importé ci-dessous ; ce fichier n'ajoute que ce qui est propre à l'Inventaire général des chartes de Saint-Denis :
// l'export PDF d'une notice ou d'une période et l'export EAD d'une notice (boutons posés par cartulaires-inventaire.xsl
// dans les métadonnées de la notice ; porte-documents retiré le 2026-11-26). Repris le 2026-11-24 du JS du projet saint-denis, supprimé quand l'Inventaire et les pages du site
// sont passés dans la collection « Chartes médiévales de l'abbaye de Saint-Denis » des cartulaires. Sans bouton
// .elec-pdf dans la page, ces blocs ne font rien : les autres cartulaires gardent le seul comportement commun.

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
  racine.querySelectorAll('button.elec-pdf, button.elec-panier, button.elec-ead').forEach(b => b.remove())
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

// 2. Export EAD d'une notice (2026-11-26, Maxime : « Export EAD / Export PDF dans les métadonnées » ; le porte-documents
//    est retiré). La XSL pose dans les métadonnées <button class="elec-ead" data-ead-id="ISD-vol1_notice1"
//    data-ead-src="…/ISD-vol1.xml">. L'EAD est la reconstitution du 16/11 (chartes/saint-denis, ead/, servie par
//    raw.githubusercontent.com, CORS ouvert) : on y prend le composant <c id="ID">, placé dans un <ead> minimal (en-tête
//    et identification du tome repris de l'EAD) ; le fichier ID.xml est proposé au téléchargement. Un tome n'est lu
//    qu'une fois par page.
const EAD_NS = 'urn:isbn:1-931666-22-9'
const eadCache = new Map()
function lireEad (src) {
  if (!eadCache.has(src)) {
    eadCache.set(src, fetch(src).then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status)
      return r.text()
    }).then(t => new DOMParser().parseFromString(t, 'application/xml')))
  }
  return eadCache.get(src)
}
async function exporterEad (b) {
  const id = b.getAttribute('data-ead-id')
  const libelle = b.textContent
  b.disabled = true
  b.textContent = 'EAD…'
  try {
    const doc = await lireEad(b.getAttribute('data-ead-src'))
    const c = Array.from(doc.getElementsByTagNameNS(EAD_NS, 'c')).find(x => x.getAttribute('id') === id)
    if (!c) throw new Error("notice absente de l'EAD")
    const sortie = document.implementation.createDocument(EAD_NS, 'ead', null)
    const ead = sortie.documentElement
    for (const a of Array.from(doc.documentElement.attributes)) ead.setAttribute(a.name, a.value)
    const entete = doc.getElementsByTagNameNS(EAD_NS, 'eadheader')[0]
    if (entete) ead.append(sortie.importNode(entete, true))
    const archdesc = doc.getElementsByTagNameNS(EAD_NS, 'archdesc')[0]
    const ad = sortie.createElementNS(EAD_NS, 'archdesc')
    if (archdesc) for (const a of Array.from(archdesc.attributes)) ad.setAttribute(a.name, a.value)
    const did = archdesc && Array.from(archdesc.children).find(x => x.localName === 'did')
    if (did) ad.append(sortie.importNode(did, true))
    const dsc = sortie.createElementNS(EAD_NS, 'dsc')
    dsc.append(sortie.importNode(c, true))
    ad.append(dsc)
    ead.append(ad)
    const xml = '<?xml version="1.0" encoding="UTF-8"?>' + String.fromCharCode(10) + new XMLSerializer().serializeToString(sortie)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([xml], { type: 'application/xml' }))
    a.download = id + '.xml'
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 10000)
    b.textContent = libelle
  } catch (e) {
    b.textContent = libelle
    b.title = 'Export EAD impossible : ' + e.message
    console.warn('[cartulaires] export EAD', id, e)
  } finally {
    b.disabled = false
  }
}

if (!window.elecEad) {
  window.elecEad = true
  document.addEventListener('click', event => {
    const b = event.target.closest('button.elec-ead')
    if (b) { event.preventDefault(); exporterEad(b) }
  })
}
