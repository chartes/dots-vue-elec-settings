// Édits de pacification : comportements des pages de l'édition (2026-10-13). La XSL ne produit
// que des classes et des data-* (index des lieux et des personnes : transform/edits/
// tableau-filtrable.xsl) ; les écouteurs sont posés une seule fois sur document (délégation),
// donc valables pour tout document chargé ensuite. Chargé par dots-vue via
// "collectionCustomJs": "edits".

// --- Tableaux triables et filtrables (index des lieux, index des personnes) ---

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
  // dots-target : surlignage du socle ; tf-vise reste posé jusqu'au renvoi suivant ;
  // tf-par-voir sur la table : la CSS peut garder l'en-tête collant après un renvoi
  document.querySelectorAll('.tf-cadre .dots-target, .tf-cadre .tf-vise').forEach(x => x.classList.remove('dots-target', 'tf-vise'))
  void cible.offsetWidth
  cible.classList.add('dots-target', 'tf-vise')
  const t = cible.closest('table')
  if (t) t.classList.add('tf-par-voir')
  // Hauteur de ce qui reste collé en haut : l'en-tête du tableau, et la barre si elle est collante
  const barre = cadre.querySelector('.tf-barre')
  const h = (t && t.tHead ? t.tHead.getBoundingClientRect().height : 0) +
    (barre && getComputedStyle(barre).position === 'sticky' ? barre.offsetHeight : 0)
  window.scrollTo({ top: cible.getBoundingClientRect().top + window.scrollY - 80 - h - 10, behavior: 'instant' })
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
