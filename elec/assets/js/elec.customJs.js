// ÉLEC : comportements communs des pages de l'édition, pour tous les corpus (JS générique, chargé
// par dots-vue via "collectionCustomJs": "elec" dans la conf du corpus). La XSL ne produit que des
// classes et des data-* ; aucun JavaScript dans le HTML. Les écouteurs sont posés une seule fois
// sur document (délégation), donc valables pour tout document chargé ensuite.
//   1. Tableaux triables et filtrables (module commun transform/commun/tableau-filtrable.xsl,
//      classes tf-*) : tri, filtres, « Effacer », export CSV, renvoi « Voir » vers une ligne.
//   2. Arrivée sur une ancre : la cible visée par l'URL est placée sous ce qui reste collé en haut
//      et surlignée d'un jaune qui fond (bloc CSS « Arrivée sur une ancre » de chaque corpus).
//   3. Bibliographie (module commun transform/commun/bibliographie.xsl, li.bibl) : un clic sur une
//      référence la copie dans le presse-papiers, en texte brut ; « Copié » s'affiche un instant.
// Un corpus qui a un comportement propre (Bellelay : présélection par fête) garde son
// <corpus>.customJs.js, qui importe celui-ci puis ajoute le sien.

const plat = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
let collator

function trier (bouton) {
  const th = bouton.closest('th')
  const tr = th.parentNode
  const b = th.closest('table').tBodies[0]
  const i = Array.prototype.indexOf.call(tr.cells, th)
  const num = th.getAttribute('data-type') === 'n'
  const d = th.getAttribute('aria-sort') === 'ascending' ? -1 : 1
  const c = collator || (collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true }))
  const k = Array.from(b.rows).map(r => {
    const s = r.cells[i].getAttribute('data-sort') || ''
    return { r, s, v: num ? Number(s) : s, o: Number(r.getAttribute('data-o')) }
  })
  k.sort((x, y) => {
    if ((x.s === '') !== (y.s === '')) return x.s === '' ? 1 : -1
    return d * (num ? x.v - y.v : c.compare(x.v, y.v)) || x.o - y.o
  })
  const f = document.createDocumentFragment()
  k.forEach(e => f.appendChild(e.r))
  b.appendChild(f)
  b.querySelectorAll('.dots-target').forEach(x => x.classList.remove('dots-target'))
  Array.from(tr.cells).forEach(h => h.setAttribute('aria-sort', 'none'))
  th.setAttribute('aria-sort', d === 1 ? 'ascending' : 'descending')
}

// Une cellule satisfait-elle un critère ? k : t (contient), eq (un des mots), min/max
// (bornes sur data-sort), num (un des numéros de data-f dans « 12 », « 12-15 », « de 12 à 15 »)
function satisfait (r, c) {
  const f = r.cells[c.i].getAttribute('data-f') || ''
  if (c.k === 't') return f.indexOf(c.v) !== -1
  if (c.k === 'eq') return (' ' + f + ' ').indexOf(' ' + c.v + ' ') !== -1
  if (c.k === 'num') {
    const m = /^(?:de )?(\d+)(?:\s*[-–a]\s*(\d+))?$/.exec(c.v)
    if (!m) return true
    let lo = Number(m[1])
    let hi = m[2] === undefined ? lo : Number(m[2])
    if (lo > hi) [lo, hi] = [hi, lo]
    return f.split(' ').some(s => s !== '' && Number(s) >= lo && Number(s) <= hi)
  }
  const x = Number(r.cells[c.i].getAttribute('data-sort') || 0)
  const y = Number(c.v)
  if (isNaN(y)) return true
  return c.k === 'min' ? Math.sign(x - y) !== -1 : Math.sign(y - x) !== -1
}

function filtrer (cadre) {
  const t = cadre.querySelector('table')
  const cr = []
  cadre.querySelectorAll('.tf-filtres input, .tf-filtres select').forEach(e => {
    const v = plat(e.value)
    if (v !== '') cr.push({ i: Number(e.getAttribute('data-col')), k: e.getAttribute('data-k'), v })
  })
  let nb = 0
  let tot = 0
  Array.from(t.tBodies[0].rows).forEach(r => {
    tot++
    const ok = cr.every(c => satisfait(r, c))
    r.hidden = !ok
    if (ok) nb++
  })
  // Suggestions : n'offrir que les valeurs encore présentes avec les autres filtres ; une
  // option retenue au prix des accents prend sa forme aplatie pour libellé (sinon Chrome la masque)
  cadre.querySelectorAll('.tf-filtres input[list]').forEach(e => {
    const d = document.getElementById(e.getAttribute('list'))
    if (!d) return
    const col = Number(e.getAttribute('data-col'))
    const aut = cr.filter(c => c.i !== col)
    let txt = ''
    if (aut.length) {
      Array.from(t.tBodies[0].rows).forEach(r => {
        if (aut.every(c => satisfait(r, c))) txt += '|' + (r.cells[col].getAttribute('data-f') || '')
      })
    }
    const q = plat(e.value)
    const qb = e.value.toLowerCase().replace(/\s+/g, '')
    Array.from(d.options).forEach(o => {
      const v = o.getAttribute('data-n') || plat(o.value)
      let ok = v.indexOf(q) !== -1
      if (ok && aut.length) ok = txt.indexOf(v) !== -1
      o.disabled = !ok
      if (ok && o.value.toLowerCase().replace(/\s+/g, '').indexOf(qb) === -1) {
        o.label = v
        return
      }
      o.removeAttribute('label')
    })
  })
  const cp = cadre.querySelector('.tf-compteur')
  if (cp) cp.textContent = (cr.length ? nb + ' sur ' + tot : tot) + ' ' + cp.getAttribute('data-unite')
  const ef = cadre.querySelector('.tf-effacer')
  if (ef) ef.hidden = !cr.length
}

function effacer (cadre) {
  cadre.querySelectorAll('.tf-filtres input, .tf-filtres select').forEach(e => { e.value = '' })
  filtrer(cadre)
}

function exporter (cadre) {
  const t = cadre.querySelector('table')
  const q = '"'
  const ent = (t.getAttribute('data-csv-entetes') || '').split('|')
  const val = td => {
    let v = td.getAttribute('data-csv')
    if (v === null) v = td.querySelector('.tf-vide') ? '' : td.innerText
    return v.replace(/\s+/g, ' ').trim()
  }
  const champ = s => q + String(s).split(q).join(q + q) + q
  const lignes = [ent.map(champ).join(';')]
  Array.from(t.tBodies[0].rows).forEach(r => {
    if (r.hidden) return
    const l = []
    Array.from(r.cells).forEach(td => {
      l.push(val(td))
      const p = td.getAttribute('data-csv-plus')
      if (p !== null) l.push(p)
    })
    lignes.push(l.map(champ).join(';'))
  })
  // BOM et « ; » pour qu'Excel lise les accents et les colonnes
  const b = new Blob(['﻿' + lignes.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(b)
  a.download = (t.getAttribute('data-csv-nom') || 'export') + '-' + new Date().toISOString().slice(0, 10) + '.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

// Renvoi vers une ligne d'un tableau de la page : la rendre visible (filtres effacés si elle
// était cachée), la surligner et la placer sous l'en-tête collant. Ligne absente de la page :
// le lien suit son cours (autre fragment).
function voir (lien, event) {
  const cible = document.getElementById(decodeURIComponent((lien.getAttribute('href') || '').split('#')[1] || ''))
  const cadre = cible && cible.closest('.tf-cadre')
  if (!cadre) return
  event.preventDefault()
  event.stopPropagation()
  if (cible.hidden) effacer(cadre)
  // tf-vise reste posé jusqu'au renvoi suivant ;
  // tf-par-voir sur la table : la CSS peut garder l'en-tête collant après un renvoi
  document.querySelectorAll('.tf-cadre .tf-vise').forEach(x => x.classList.remove('tf-vise'))
  cible.classList.add('tf-vise')
  const t = cible.closest('table')
  if (t) t.classList.add('tf-par-voir')
  // placement sous l'en-tête collant et jaune qui fond : bloc commun « Arrivée sur une ancre »
  arriverSur(cible)
}

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

// Nom de la colonne (data-label, lu dans l'en-tête) sur chaque cellule du corps et des
// filtres : sur petit écran, la CSS fait de chaque ligne une fiche et l'affiche devant la valeur
function etiqueter (cadre) {
  const t = cadre.querySelector('table')
  if (!t || !t.tHead) return
  const noms = Array.from(t.tHead.rows[0].cells).map(th => th.textContent.trim())
  t.querySelectorAll('tr.tf-filtres, tbody tr').forEach(tr => {
    Array.from(tr.cells).forEach((td, i) => { if (noms[i]) td.setAttribute('data-label', noms[i]) })
  })
}

if (!window.tfComportements) {
  window.tfComportements = true

  aLAffichage('.tf-cadre', etiqueter)

  document.addEventListener('click', event => {
    const el = event.target.closest('button.tf-tri, button.tf-effacer, button.tf-csv, a.tf-voir')
    if (!el) return
    if (el.matches('.tf-tri')) trier(el)
    else if (el.matches('.tf-effacer')) effacer(el.closest('.tf-cadre'))
    else if (el.matches('.tf-csv')) exporter(el.closest('.tf-cadre'))
    else voir(el, event)
  })

  const saisie = event => {
    const el = event.target
    if (el instanceof Element && el.matches('.tf-filtres input, .tf-filtres select')) filtrer(el.closest('.tf-cadre'))
  }
  document.addEventListener('input', saisie)
  document.addEventListener('change', saisie)
}

// --- Arrivée sur une ancre : bloc commun à tous les corpus (2026-10-15, revu le 2026-10-29) ---
// Quand l'URL vise un élément de la page (#note1, ?refId=…#Daugerant, renvoi d'un tableau…) :
// on ouvre les details repliés qui le contiennent, on le place juste sous ce qui reste collé en
// haut (barre de navigation de dots-vue, en-tête et barre de filtres d'un tableau) et, si l'on
// vient d'un lien du texte, on le surligne d'un jaune qui fond en 3 s (classe cible-arrivee,
// bloc CSS « Arrivée sur une ancre »).
// Pas de jaune (la cible est seulement placée) :
// - sur un titre (h1-h6, ou bloc qui commence par un titre) ;
// - quand le sommaire est ouvert (latéral : .toc-aside-is-opened ; du haut : .breadcrumb-panel) ;
// - quand on vient d'un clic hors du texte : sommaire (latéral, du haut, liste des sous-parties
//   .bottom-toc), fil d'Ariane, barre de navigation ;
// - pour un clic sur un numéro de note dans la même page (appel → note, note → appel).
// Le jaune reste pour un lien du texte (note, renvoi, index…) vers une autre page ou un autre
// endroit de la page, et pour une URL ouverte telle quelle.
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

const TITRES = 'h1, h2, h3, h4, h5, h6'
const estTitre = el => el.matches(TITRES) || !!(el.firstElementChild && el.firstElementChild.matches(TITRES))
const sommaireOuvert = () => !!document.querySelector('.document-area.toc-aside-is-opened, .breadcrumb-panel.is-opened')
const HORS_TEXTE = '#toc-tree, .toc-content, .bottom-toc, .breadcrumb-panel, nav.navigation-row'

function arriverSur (cible, jaune = true) {
  for (let d = cible.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) d.open = true
  document.querySelectorAll('.cible-arrivee').forEach(x => x.classList.remove('cible-arrivee'))
  if (jaune && !estTitre(cible) && !sommaireOuvert()) {
    void cible.offsetWidth
    cible.classList.add('cible-arrivee')
  }
  placerSous(cible)
  // le front peut encore faire défiler la page ou décaler la mise en page (images) : on recale
  setTimeout(() => placerSous(cible), 300)
  setTimeout(() => placerSous(cible), 1000)
}

// Ancre vide (span ou a sans texte posé en tête d'un paragraphe : renvois des Monuments historiques) : le
// jaune va au bloc qui la contient, sinon rien ne se verrait. Les Monuments historiques rendent leur texte
// dans article.mh-edition, sans #article.
const ancreVide = el => !el.textContent.replace(/[\s\u200b-\u200d\u00a0]/g, '') && !el.querySelector('img')
function cibleDeLUrl () {
  const id = decodeURIComponent(location.hash.slice(1))
  let el = id && document.getElementById(id)
  if (!el || !el.closest('#article, .mh-edition') || el.closest('.bottom-toc')) return null
  if (ancreVide(el) && el.parentElement) el = el.parentElement
  return el
}

// Lien ou cible qui relève d'une note (appel, retour, corps de note)
const estNote = x => !!x && (x.matches('[class*="note"]') || !!x.closest('[class*="note"], .footnotes'))

if (!window.arriveeAncre) {
  window.arriveeAncre = true
  let faite = ''
  // Dernier clic sur un lien : { t: heure, sansJaune } ; vaut pour l'arrivée qui suit (10 s au plus,
  // le temps que dots-vue charge l'autre page). Gardé aussi en sessionStorage : un lien du texte
  // vers une autre page recharge toute l'application (et referme le sommaire).
  let clic = null
  const noterClic = c => {
    clic = c
    try { c ? sessionStorage.setItem('elec-clic', JSON.stringify(c)) : sessionStorage.removeItem('elec-clic') } catch (e) {}
  }
  const dernierClic = () => {
    if (clic) return clic
    try { return JSON.parse(sessionStorage.getItem('elec-clic')) } catch (e) { return null }
  }
  const passe = () => {
    if (location.href === faite) return
    const el = cibleDeLUrl()
    if (!el) return
    faite = location.href
    const c = dernierClic()
    const jaune = !(c && c.sansJaune && Date.now() - c.t < 10000)
    noterClic(null)
    setTimeout(() => arriverSur(el, jaune), 150)
  }
  new MutationObserver(passe).observe(document.documentElement, { childList: true, subtree: true })
  window.addEventListener('hashchange', passe)
  window.addEventListener('popstate', passe)
  document.addEventListener('click', event => {
    const a = event.target instanceof Element && event.target.closest('a, .toc-title')
    if (!a) return
    // sommaire, fil d'Ariane, barre de navigation (ou sommaire ouvert) → pas de jaune à l'arrivée
    const c = { t: Date.now(), sansJaune: !!a.closest(HORS_TEXTE) || sommaireOuvert() }
    noterClic(c)
    if (c.sansJaune || !a.matches('a[href*="#"]') || a.closest('.tf-cadre') && a.matches('a.tf-voir')) return
    const u = new URL(a.href, location.href)
    if (u.pathname + u.search !== location.pathname + location.search) return
    // même page : numéro de note → pas de jaune ; lien vers l'ancre déjà dans l'URL → pas de
    // hashchange, on rejoue l'arrivée
    const vise = document.getElementById(decodeURIComponent(u.hash.slice(1)))
    c.sansJaune = estNote(a) || estNote(vise)
    noterClic(c)
    if (u.href !== location.href) return
    const el = cibleDeLUrl()
    if (el) { event.preventDefault(); arriverSur(el, !c.sansJaune); noterClic(null) }
  }, true)
  passe()
}

// --- Bibliographie : copier une référence au clic (2026-10-19) ---
// Le texte copié est celui de la référence (span.bibl-texte), sans l'année de tri ; un clic sur un
// lien de la référence garde son comportement. Retour visuel : span.bibl-copie « Copié » ajouté
// après le texte puis retiré (style dans le bloc CSS de chaque corpus, lisible sans lui).
if (!window.biblCopie) {
  window.biblCopie = true

  aLAffichage('li.bibl > .bibl-texte', el => {
    el.setAttribute('title', 'Cliquer pour copier la référence')
  })

  document.addEventListener('click', event => {
    if (event.target.closest('a')) return
    const texte = event.target.closest('li.bibl > .bibl-texte')
    if (!texte || !navigator.clipboard) return
    const ref = texte.innerText.replace(/\s+/g, ' ').trim()
    navigator.clipboard.writeText(ref).then(() => {
      const li = texte.parentNode
      li.querySelectorAll('.bibl-copie').forEach(x => x.remove())
      const ok = document.createElement('span')
      ok.className = 'bibl-copie'
      ok.textContent = ' Copié'
      texte.after(ok)
      setTimeout(() => ok.remove(), 1500)
    })
  })
}

// 4. Attribut collid sur <html> : les feuilles de corpus écrivent leurs règles sous la forme
//    [collid="cjc"] #main #article …, mais rien dans dots-vue ne pose cet attribut. On le déduit
//    de la feuille injectée (<style id="customCss">), sans toucher au composant Vue : c'est la
//    valeur la plus fréquente dans ses sélecteurs, ou celle du premier segment de l'URL si la
//    feuille en cite plusieurs (testaments-poilus reprend des règles de edits).
function poserCollid () {
  const el = document.getElementById('customCss')
  const html = document.documentElement
  if (!el) { html.removeAttribute('collid'); return }
  const n = {}
  for (const m of el.textContent.matchAll(/\[collid="([^"]+)"\]/g)) n[m[1]] = (n[m[1]] || 0) + 1
  const ids = Object.keys(n).sort((a, b) => n[b] - n[a])
  const seg = location.pathname.split('/').filter(Boolean).find(s => ids.includes(s))
  const id = seg || ids[0]
  if (id && html.getAttribute('collid') !== id) html.setAttribute('collid', id)
}
poserCollid()
new MutationObserver(poserCollid).observe(document.head, { childList: true, subtree: true, characterData: true })

// 5. Export PDF (2026-11-16, d'abord pour l'Inventaire de Saint-Denis, à la manière de l'ancien site : « obtenir cette
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
  w.document.write('<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><base href="' + echapHtml(document.baseURI) + '">' +
    '<title>' + echapHtml(titre) + '</title>' + styles +
    '<style>body{background:#fff;margin:1.5cm;} .elec-pdf-titre{font-size:1.3rem;margin:0 0 1rem}' +
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

// 6. Porte-documents (2026-11-16, comme sur l'ancien site : « ajouter au porte-documents »). La XSL pose dans une unité un
//    <button class="elec-panier" data-panier-id="ID" data-panier-titre="…">. Le porte-documents est gardé dans ce
//    navigateur (localStorage : rien n'est envoyé ni partagé) et montré par un bouton fixe en bas à droite de l'écran :
//    liste des unités retenues (lien vers chacune, retrait), « Tout en PDF » (chaque unité est demandée à l'API DoTS,
//    comme au bloc 5) et « Vider ». Commun à tous les corpus : chaque entrée garde son adresse et sa ressource.
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
