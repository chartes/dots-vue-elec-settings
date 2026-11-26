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
//   5. Visionneuse IIIF : une image marquée img.iiif-visionneuse s'ouvre au clic dans TIFY, à sa place (bloc en fin de fichier).
// Un corpus qui a un comportement propre (Bellelay : présélection par fête ; Saint-Denis : export PDF et
// porte-documents de l'Inventaire) garde son <corpus>.customJs.js, qui importe celui-ci puis ajoute le sien.

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
  // option retenue au prix des accents prend sa forme sans accents pour valeur (sinon Chrome la masque ;
  // en libellé, Chrome l'afficherait en 2e ligne sous la forme accentuée), la forme d'origine est gardée dans data-v
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
      if (!o.hasAttribute('data-v')) o.setAttribute('data-v', o.value)
      const orig = o.getAttribute('data-v')
      const v = o.getAttribute('data-n') || plat(orig)
      let ok = v.indexOf(q) !== -1
      if (ok && aut.length) ok = txt.indexOf(v) !== -1
      o.disabled = !ok
      o.value = ok && orig.toLowerCase().replace(/\s+/g, '').indexOf(qb) === -1
        ? orig.normalize('NFD').replace(/[̀-ͯ]/g, '')
        : orig
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
  // 2026-11-13 : galerie d'images de Saint-Denis : arriver sur un chapitre affiche son image (vignette de dots-vue,
  // qui ouvre la visionneuse au bon folio), sinon l'image resterait masquée derrière la vignette.
  if (cible.matches('section.sd-subpart')) {
    // la vignette n'existe qu'une fois le manifeste chargé, et la visionneuse peut n'être pas encore prête à la
    // recevoir : on clique, puis on revérifie toutes les 1,5 s (18 s au plus)
    let n = 0
    // la vignette est un interrupteur (un 2e clic referme la visionneuse) : on ne clique que si la visionneuse
    // n'affiche pas déjà l'image du chapitre (repérée par le n° de vue du fichier : « 0231R »)
    const ouvrir = () => {
      if (++n > 12) return
      const sec = document.getElementById(cible.id)
      const v = sec && sec.querySelector('button.pb-thumbnail')
      const lien = sec && sec.querySelector('aside.pb-component a[href]')
      const vue = lien && (lien.getAttribute('href').match(/_(\d+[RV])_L\.jpg$/) || [])[1]
      const vu = (document.querySelector('.mirador-viewer') || {}).innerText || ''
      if (v && vue && vu.includes(vue)) return
      if (v) v.click()
      setTimeout(ouvrir, 1500)
    }
    setTimeout(ouvrir, 300)
  }
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

// 5. Visionneuse IIIF (TIFY, 2026-11-17) : une image marquée par la XSL (img.iiif-visionneuse, servie par
//    un serveur d'images IIIF : …/iiif/<doi>/<sha1>/full/max/0/default.jpg, Saint-Germain-des-Prés et CID
//    sur Nakala) est remplacée par TIFY, dans le corps du texte, à sa place.
//    2026-11-18 (Maxime) : visionneuse affichée d'emblée, sans clic ; montée quand l'image approche de
//    l'écran, une par image ; si TIFY ne se charge pas, l'image reste. Exception : les images d'un tableau
//    (seings des notaires, CID 1986 : 286 vignettes de 60 px) gardent l'ouverture au clic (Fermer ou Échap
//    la rend ; on y feuillette les images du tableau).
//    Manifeste : celui que la XSL pose sur l'image (data-manifest = graphic/@corresp du TEI, manifestes publiés
//    sur GitLab, chartes-iiif/manifests ; 2026-11-18, CID et SGP), ouvert sur la vue de cette image (sha1 Nakala) ;
//    sans data-manifest, on en construit un (IIIF Presentation 3) à la volée, Nakala ne fournissant que le
//    service d'image : libellé de chaque vue = description du fichier Nakala, sinon alt de l'image. TIFY (module ES,
//    AGPL) est chargé du CDN à la première visionneuse ; son cadre est stylé ici (rien à ajouter aux CSS de corpus).
if (!window.elecTify) {
  window.elecTify = true
  const TIFY = 'https://cdn.jsdelivr.net/npm/tify@0.36.2/dist/'
  const IIIF = /^(https:\/\/.+\/iiif\/.+)\/full\/[^/]+\/0\/default\.(?:jpg|png)$/
  let tify = null
  const montees = new Map()   // cadre → instance TIFY montée d'emblée

  const style = document.createElement('style')
  style.id = 'elec-tify-style'
  style.textContent = `
    table img.iiif-visionneuse { cursor: zoom-in; }
    .elec-tify { display: flex; flex-direction: column; width: 100%; height: min(75vh, 720px);
      margin: .5rem 0 1rem; border: 1px solid #ccc; text-indent: 0; text-align: left; }
    .elec-tify-fermer { align-self: flex-end; font: inherit; font-size: .9rem; color: #333; background: #f3f3f3;
      border: none; border-bottom: 1px solid #ccc; border-left: 1px solid #ccc; padding: .15rem .6rem; cursor: pointer; }
    .elec-tify-cadre { flex: 1; min-height: 0; background: #fff; }`
  document.head.append(style)

  const auClic = img => !!img.closest('table')
  const aMonter = new IntersectionObserver(entrees => entrees.forEach(e => {
    if (!e.isIntersecting) return
    aMonter.unobserve(e.target)
    monter(e.target)
  }), { rootMargin: '600px 0px' })

  aLAffichage('img.iiif-visionneuse', el => {
    if (!IIIF.test(el.getAttribute('src') || '')) return
    if (auClic(el)) { if (!el.title) el.title = 'Ouvrir dans la visionneuse'; return }
    aMonter.observe(el)
  })
  // Texte remplacé par dots-vue (navigation) : libérer les visionneuses sorties de la page
  new MutationObserver(() => montees.forEach((t, cadre) => {
    if (cadre.isConnected) return
    try { t.destroy() } catch (e) { /* déjà détruite */ }
    montees.delete(cadre)
  })).observe(document.documentElement, { childList: true, subtree: true })

  const chargerTify = () => {
    if (!document.getElementById('elec-tify-css')) {
      const css = document.createElement('link')
      css.id = 'elec-tify-css'; css.rel = 'stylesheet'; css.href = TIFY + 'tify.css'
      document.head.append(css)
    }
    return import(/* @vite-ignore */ TIFY + 'tify.js')
  }
  // L'image, ou le lien qui ne contient qu'elle (CID : <a href="#id"><img/></a>)
  const aMasquer = img => img.parentElement?.tagName === 'A' && img.parentElement.children.length === 1 ? img.parentElement : img

  // Dimensions d'une image : celles du fichier déjà chargé dans la page, sinon son info.json
  const dimensions = async (img, service) => {
    if (img.complete && img.naturalWidth) return [img.naturalWidth, img.naturalHeight]
    try {
      const info = await (await fetch(service + '/info.json')).json()
      return [info.width, info.height]
    } catch (e) { return [1000, 1000] }
  }

  // Données Nakala des images (…/iiif/<doi>/<sha1>) : description de chaque fichier (libellé de la vue),
  // licence ; une requête par donnée, l'API publique de Nakala autorise les appels d'autres origines
  const NAKALA = /^https:\/\/api\.nakala\.fr\/iiif\/(10\.\d+\/[^/]+)\/([0-9a-f]{40})$/
  const donneesNakala = async services => {
    const dois = [...new Set(services.map(s => (s.match(NAKALA) || [])[1]).filter(Boolean))]
    const res = { fichiers: {}, licences: new Set(), dois }
    await Promise.all(dois.map(async doi => {
      try {
        const d = await (await fetch('https://api.nakala.fr/datas/' + doi)).json()
        for (const f of d.files || []) res.fichiers[f.sha1] = f.description
        for (const m of d.metas || []) if (m.propertyUri.endsWith('#license')) res.licences.add(m.value)
      } catch (e) { /* libellés de repli */ }
    }))
    return res
  }

  const manifeste = async (imgs, titre) => {
    const base = location.origin + '/elec-tify/' + Date.now()
    const services = imgs.map(img => img.getAttribute('src').match(IIIF)[1])
    const nk = await donneesNakala(services)
    const items = await Promise.all(imgs.map(async (img, i) => {
      const src = img.getAttribute('src')
      const service = services[i]
      const [w, h] = await dimensions(img, service)
      const c = `${base}/canvas/${i + 1}`
      const sha1 = (service.match(NAKALA) || [])[2]
      return {
        id: c, type: 'Canvas', width: w, height: h,
        label: { none: [nk.fichiers[sha1] || img.getAttribute('alt') || 'Image ' + (i + 1)] },
        items: [{ id: c + '/page', type: 'AnnotationPage', items: [{
          id: c + '/image', type: 'Annotation', motivation: 'painting', target: c,
          body: { id: src, type: 'Image', format: 'image/jpeg', width: w, height: h,
            service: [{ id: service, type: 'ImageService3', profile: 'level2' }] } }] }]
      }
    }))
    const m = { '@context': 'http://iiif.io/api/presentation/3/context.json', id: base + '/manifest',
      type: 'Manifest', label: { none: [titre] }, items }
    if (nk.dois.length) {
      const liens = nk.dois.map(d => `<a href="https://doi.org/${d}" target="_blank" rel="noopener">${d}</a>`).join(', ')
      m.metadata = [{ label: { fr: ['Images'] }, value: { none: ['Nakala : ' + liens] } }]
      if (nk.licences.size === 1) {
        const l = [...nk.licences][0]
        m.requiredStatement = { label: { fr: ['Licence'] }, value: { none: [l] } }
        const cc = l.match(/^CC-(BY(?:-[A-Z]{2})*)-(\d\.\d)$/)
        if (cc) m.rights = `http://creativecommons.org/licenses/${cc[1].toLowerCase()}/${cc[2]}/`
      }
    }
    return URL.createObjectURL(new Blob([JSON.stringify(m)], { type: 'application/ld+json' }))
  }

  // Manifeste publié (data-manifest) : lu une fois par page ; vue = celle dont l'image a le même sha1 que l'image du texte
  const publies = new Map()
  const vueDe = async (url, img) => {
    if (!publies.has(url)) publies.set(url, fetch(url).then(r => r.json()))
    const sha1 = ((img.getAttribute('src') || '').match(/\/([0-9a-f]{40})\//) || [])[1]
    const items = (await publies.get(url)).items || []
    const n = items.findIndex(c => JSON.stringify(c.items).includes(sha1))
    return sha1 && n >= 0 ? n + 1 : 1
  }

  // Visionneuse d'emblée : une image, un manifeste (le publié s'il existe, ouvert sur sa vue) ; hauteur à la proportion de l'image (barre de TIFY comprise),
  // entre 320 px et min(75vh, 720px)
  const monter = async img => {
    if (!img.isConnected) return
    const titre = (img.getAttribute('alt') || (document.querySelector('#article h1, #article h2, h1') || {}).innerText || document.title).trim()
    const cible = aMasquer(img)
    const panneau = document.createElement('div')
    panneau.className = 'elec-tify elec-tify-direct'
    panneau.innerHTML = '<div class="elec-tify-cadre"></div>'
    cible.after(panneau)
    try {
      const service = img.getAttribute('src').match(IIIF)[1]
      const [w, h] = await dimensions(img, service)
      const largeur = panneau.clientWidth || 600
      panneau.style.height = `clamp(320px, ${Math.round(largeur * h / w) + 56}px, min(75vh, 720px))`
      const publie = img.dataset.manifest
      const [{ default: Tify }, url, page] = await Promise.all([chargerTify(),
        publie || manifeste([img], titre), publie ? vueDe(publie, img) : 1])
      if (!panneau.isConnected) return
      cible.style.display = 'none'
      const cadre = panneau.querySelector('.elec-tify-cadre')
      montees.set(cadre, new Tify({ container: cadre, manifestUrl: url, pages: [page],
        language: 'fr', translationsDirUrl: TIFY + 'translations', views: ['info'] }))
    } catch (e) {
      console.warn('elec.customJs : visionneuse non montée, image laissée', e)
      panneau.remove()
      cible.style.display = ''
    }
  }

  // Ouverture au clic (images des tableaux) : l'image (ou le lien qui l'entoure) est masquée, puis rendue
  let masquee = null
  const fermer = () => {
    if (tify) { tify.destroy(); tify = null }
    document.querySelector('.elec-tify:not(.elec-tify-direct)')?.remove()
    if (masquee) { masquee.style.display = ''; masquee = null }
    document.removeEventListener('keydown', echap)
  }
  const echap = event => { if (event.key === 'Escape') fermer() }

  const ouvrir = async img => {
    const zone = img.closest('#article, article, main') || document.body
    const imgs = [...zone.querySelectorAll('img.iiif-visionneuse')].filter(x => auClic(x) && IIIF.test(x.getAttribute('src') || ''))
    const n = imgs.indexOf(img) + 1
    if (!n) return
    const titre = (document.querySelector('#article h1, #article h2, h1') || {}).innerText || document.title
    fermer()
    const panneau = document.createElement('div')
    panneau.className = 'elec-tify'
    panneau.innerHTML = '<button type="button" class="elec-tify-fermer">Fermer ✕</button><div class="elec-tify-cadre"></div>'
    masquee = aMasquer(img)
    masquee.after(panneau)
    masquee.style.display = 'none'
    panneau.scrollIntoView({ block: 'nearest' })
    panneau.querySelector('.elec-tify-fermer').addEventListener('click', fermer)
    document.addEventListener('keydown', echap)
    const publie = img.dataset.manifest
    const [{ default: Tify }, url, page] = await Promise.all([chargerTify(),
      publie || manifeste(imgs, titre.trim()), publie ? vueDe(publie, img) : n])
    if (!panneau.isConnected) return
    tify = new Tify({ container: panneau.querySelector('.elec-tify-cadre'), manifestUrl: url, pages: [page],
      language: 'fr', translationsDirUrl: TIFY + 'translations', views: ['thumbnails', 'info'] })
  }

  document.addEventListener('click', event => {
    const img = event.target instanceof Element && event.target.closest('img.iiif-visionneuse')
    if (!img || !auClic(img)) return
    event.preventDefault()
    event.stopPropagation()
    ouvrir(img)
  }, true)
}

// 6. Règles hors de portée des CSS de corpus (2026-11-26). Depuis le 04/11 (dots-vue fa2f363), la CSS d'un corpus est
//    confinée sous « @scope (:root) to (.dots-ui, .mirador-view) » : elle n'atteint plus l'interface de dots-vue, dont
//    le sommaire du bas (div.dots-ui.bottom-toc). Une page dont le texte porte la classe sans-sommaire-bas (posée
//    par la XSL : testament des Poilus, déjà affiché dans la page de son jour) n'a pas de sommaire du bas.
if (!document.getElementById('elec-hors-scope')) {
  const style = document.createElement('style')
  style.id = 'elec-hors-scope'
  style.textContent = '.document.wrapper:has(.sans-sommaire-bas) > .bottom-toc { display: none; }'
  document.head.append(style)
}

// 7. Zones d'une image (<map>/<area>, Bellelay) (2026-11-26) : leurs coordonnées sont en pixels de l'image d'origine ; quand la
//    CSS affiche l'image plus petite (feuillets côte à côte), les zones ne tombaient plus sur leur détail. On les recale sur la
//    largeur affichée, au chargement et à chaque changement de taille (coordonnées d'origine gardées dans data-coords).
aLAffichage('img[usemap]', img => {
  const nom = (img.getAttribute('usemap') || '').replace(/^#/, '')
  const carte = (img.parentElement && img.parentElement.querySelector(`map[name="${nom}"]`)) || document.querySelector(`map[name="${nom}"]`)
  if (!carte) return
  const caler = () => {
    if (!img.naturalWidth || !img.clientWidth) return
    const r = img.clientWidth / img.naturalWidth
    carte.querySelectorAll('area[coords]').forEach(a => {
      if (!a.dataset.coords) a.dataset.coords = a.getAttribute('coords')
      a.setAttribute('coords', a.dataset.coords.split(',').map(n => Math.round(parseFloat(n) * r)).join(','))
    })
  }
  if (img.complete) caler(); else img.addEventListener('load', caler)
  new ResizeObserver(caler).observe(img)
})
