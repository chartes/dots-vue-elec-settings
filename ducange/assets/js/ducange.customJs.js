// Du Cange : comportements propres au glossaire. Chargé par dots-vue via "collectionCustomJs": "ducange".
// Les comportements communs (tableaux, arrivée sur une ancre, visionneuse) sont ceux du JS générique de
// l'ÉLEC, importé ci-dessous ; ce fichier n'ajoute que le formulaire « Consulter un article » (2026-11-18).
//
// Le formulaire de l'ancien site (ducange.enc.sorbonne.fr), posé dans l'emplacement .dc-consulter-place que produit
// ducange.xsl pour la partie « Consulter un article » de la Présentation (data/presentation.xml, div type="search").
// Six boutons, dans l'ordre de l'ancien site, à activer ou désactiver :
//  - cinq modes, un seul actif à la fois (désactiver le mode actif ramène à « Consulter un article ») :
//    Consulter un article · Recherche plein texte · Citations latines · Citations françaises · Citations grecques ;
//  - une option : Formes exactes.
// Consulter un article (suggest.php de l'ancien site) :
//  - à chaque frappe, les vedettes qui commencent par la saisie, dans l'ordre du glossaire ; les homographes
//    gardent leur numéro (« 1. ABACUS », « 2. ABACUS ») ; peu de vedettes : la suite de l'ordre du glossaire ;
//    aucune : la fenêtre alphabétique autour de l'endroit où le mot serait rangé ;
//  - graphies voisines (sauf « Formes exactes ») : J = I, U = V, Y = I, K = C, PH = F, TH = T, CH = C, Æ/AE = E,
//    Œ/OE = E, H muet, lettres doublées simples (« filosof » → PHILOSOPHIA, « ubi » → UBI rangé sous V) ;
//  - en dernier, toujours, « chercher dans le texte » ;
//  - clavier : ↑ ↓ pour choisir, Entrée pour ouvrir (sans choix : la vedette, sinon le plein texte), Échap pour
//    fermer ; Alt+Q (accesskey de l'ancien site) pour aller au champ.
// Recherche plein texte et citations : la page /search de dots-vue, en plein texte ; « Formes exactes » = saisie
// entre guillemets. La limitation aux citations d'une langue (quote/@xml:lang) attend l'indexeur : en attendant,
// la recherche porte sur tout le texte, et le formulaire le dit.
// Les vedettes viennent de l'API DTS (navigation de la lettre, chargée à la première frappe de cette lettre,
// gardée en mémoire) : aucune liste précalculée à tenir à jour.

import '../../../elec/assets/js/elec.customJs.js'

if (!window.ducangeConsulter) {
  window.ducangeConsulter = true

  const API = String(import.meta.env.VITE_APP_DTS_ENDPOINT_URL || '').replace(/\/$/, '')
  const AVEC_PROJET = String(import.meta.env.VITE_APP_DOCUMENT_ROUTE_INCLUDE_PROJECT_ID).toLowerCase() === 'true'
  const COLLECTION = 'ducange'
  const PAR_PAGE = 10

  // Modes du formulaire : libellé du bouton, texte d'aide du champ, libellé du bouton d'envoi
  const MODES = {
    article: { bouton: 'Consulter un article', aide: 'Vedette latine : aagiatus, filosofia, ubi…', envoi: 'Consulter' },
    texte: { bouton: 'Recherche plein texte', aide: 'Mot ou expression dans le texte du glossaire', envoi: 'Rechercher' },
    lat: { bouton: 'Citations latines', aide: 'Mot dans les citations latines', envoi: 'Rechercher', langue: 'latines' },
    fro: { bouton: 'Citations françaises', aide: 'Mot dans les citations en ancien français', envoi: 'Rechercher', langue: 'françaises' },
    grc: { bouton: 'Citations grecques', aide: 'Mot dans les citations grecques', envoi: 'Rechercher', langue: 'grecques' }
  }
  // Ordre des boutons de l'ancien site : au-dessus du champ les deux premiers modes et l'option,
  // sous le champ les citations (2026-11-19)
  const HAUT = ['article', 'texte', 'exact']
  const BAS = ['lat', 'fro', 'grc']

  // Dernier mode et option choisis, retenus dans ce navigateur (confort, sans conséquence si indisponible)
  const memoire = {
    lire () { try { return JSON.parse(localStorage.getItem('ducange-consulter') || '{}') } catch { return {} } },
    ecrire (v) { try { localStorage.setItem('ducange-consulter', JSON.stringify(v)) } catch {} }
  }

  // ---- Style du formulaire ----
  // Ici et pas dans ducange.customCss.css : dots-vue confine la CSS du corpus au texte
  // (@scope (:root) to (.dots-ui, …)) ; le formulaire, posé par ce script, garde ainsi son style partout.
  const style = document.createElement('style')
  style.id = 'dc-consulter-style'
  style.textContent = `
    .dc-consulter { position: relative; max-width: 44rem; margin: 1.5rem 0 2rem; font-size: 1rem; line-height: 1.4; font-family: inherit; }
    .dc-modes { display: flex; flex-wrap: wrap; gap: .45rem; margin: 0 0 .8rem; }
    .dc-modes.dc-modes-bas { margin: .8rem 0 0; }
    .dc-modes button { padding: .35rem .85rem; border: 1px solid #5f004d; border-radius: 999px; background: #fff; color: #5f004d;
      font: inherit; font-size: .9rem; line-height: 1.3; cursor: pointer; transition: background .15s, color .15s; }
    .dc-modes button:hover { background: #f4eef2; }
    .dc-modes button[aria-pressed="true"] { background: #5f004d; color: #fff; }
    .dc-modes button:focus-visible { outline: 2px solid #5f004d; outline-offset: 2px; }
    .dc-modes .dc-option { border-style: dashed; }
    .dc-modes .dc-option[aria-pressed="true"] { border-style: solid; }
    .dc-consulter-champ { position: relative; display: flex; gap: .4rem; }
    .dc-consulter input { flex: 1; min-width: 0; padding: .5rem .75rem; border: 1px solid #c9bfb3; border-radius: 4px; font: inherit; background: #fff; }
    .dc-consulter input:focus { outline: 2px solid #5f004d33; border-color: #5f004d; }
    .dc-consulter-ok { padding: .5rem 1rem; border: 1px solid #5f004d; border-radius: 4px; background: #5f004d; color: #fff; font: inherit; cursor: pointer; }
    .dc-consulter-charge input { background: #fff linear-gradient(90deg, #5f004d22, #5f004d22) no-repeat left bottom / 30% 2px; }
    .dc-consulter-note { margin: .5rem 0 0; color: #7a6f63; font-size: .85rem; text-indent: 0; text-align: left; }
    .dc-consulter-liste { position: absolute; z-index: 40; top: calc(100% + 2px); left: 0; right: 0; max-height: min(60vh, 26rem); overflow-y: auto;
      margin: 0; padding: .25rem 0; list-style: none; background: #fff; border: 1px solid #c9bfb3; border-radius: 4px; box-shadow: 0 6px 18px #0002; text-align: left; }
    .dc-consulter-liste [role="option"] { display: flex; justify-content: space-between; gap: 1rem; padding: .3rem .8rem; cursor: pointer; }
    .dc-consulter-liste [role="option"][aria-selected="true"], .dc-consulter-liste [role="option"]:hover { background: #f4eef2; }
    .dc-consulter-liste .dc-vedette { font-weight: 600; letter-spacing: .01em; }
    .dc-consulter-liste .dc-lettre { color: #8a8a8a; font-size: .8em; }
    .dc-consulter-titre { padding: .45rem .8rem .15rem; color: #7a6f63; font-size: .8em; font-variant: small-caps; letter-spacing: .03em; }
    .dc-consulter-plus { color: #315ba7; font-size: .9em; }
    .dc-consulter-texte { margin-top: .25rem; border-top: 1px solid #ece7e1; color: #315ba7; font-size: .9em; }`
  document.head.append(style)

  // ---- Clés de comparaison ----
  // cle : majuscules sans accents, Æ/Œ dédoublés, numéro d'homographe retiré, J = I, U = V, lettres seules
  const cle = s => String(s).toUpperCase().replace(/Æ/g, 'AE').replace(/Œ/g, 'OE')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/^\s*\d+\s*\.\s*/, '').replace(/J/g, 'I').replace(/U/g, 'V').replace(/[^A-Z]/g, '')
  // graphie : la clé, puis les équivalences du latin médiéval
  const graphie = s => cle(s).replace(/Y/g, 'I').replace(/K/g, 'C').replace(/PH/g, 'F').replace(/TH/g, 'T')
    .replace(/CH/g, 'C').replace(/AE|OE/g, 'E').replace(/H/g, '').replace(/(.)\1+/g, '$1')
  // Lettres où une graphie voisine peut être rangée : la sienne, P pour F (PH), A et O pour E (Æ, Œ),
  // Y pour I, K pour C, et H partout (H muet)
  const lettresVoisines = g => {
    const l = g[0]
    const autres = { F: ['P'], E: ['A', 'O'], I: ['Y'], C: ['K'] }[l] || []
    return [...new Set([l, ...autres, 'H'])]
  }

  // ---- Vedettes, par lettre ----
  let ressources = null // lettre → identifiant de la ressource DTS (ducange_A…)
  const lireRessources = () => (ressources ??= fetch(`${API}/collection?id=lettres`)
    .then(r => r.json())
    .then(j => Object.fromEntries((j.member || []).map(m => [String(m['@id']).replace(/^ducange_/, ''), m['@id']])))
    .catch(() => ({})))
  const lettres = new Map() // lettre → promesse de [{ id, titre, cle, graphie, rid, lettre }]
  const lireLettre = async l => {
    if (!lettres.has(l)) {
      lettres.set(l, (async () => {
        const rid = (await lireRessources())[l]
        if (!rid) return []
        const j = await fetch(`${API}/navigation?resource=${encodeURIComponent(rid)}&down=1`).then(r => r.json())
        return (j.member || []).filter(m => m.citeType === 'entry').map(m => {
          const titre = m.dublinCore?.title || m.identifier
          return { id: m.identifier, titre, cle: cle(titre), graphie: graphie(titre), rid, lettre: l }
        })
      })().catch(e => { lettres.delete(l); throw e }))
    }
    return lettres.get(l)
  }

  // ---- Suggestions (mode « Consulter un article ») ----
  // { exactes, voisines, autour, suite } ; exactes = toutes (affichées par pages de PAR_PAGE)
  const suggerer = async (saisie, exact) => {
    const c = cle(saisie)
    if (!c) return null
    const g = graphie(saisie)
    const entrees = await lireLettre(c[0]).catch(() => [])
    const exactes = entrees.filter(e => e.cle.startsWith(c))
    let voisines = []
    if (!exact && g.length >= 3) {
      const vues = new Set(exactes.map(e => e.rid + '#' + e.id))
      for (const l of lettresVoisines(g)) {
        for (const e of await lireLettre(l).catch(() => [])) {
          if (voisines.length >= 8) break
          if (e.graphie.startsWith(g) && !vues.has(e.rid + '#' + e.id)) { voisines.push(e); vues.add(e.rid + '#' + e.id) }
        }
      }
    }
    // Fenêtre alphabétique, comme l'ancien site : rien en « saisie » = autour de l'endroit où elle serait rangée ;
    // peu de vedettes = la suite de l'ordre du glossaire après la dernière
    let autour = []
    let suite = []
    if (!exactes.length && entrees.length) {
      let i = entrees.findIndex(e => e.cle > c)
      if (i === -1) i = entrees.length
      autour = entrees.slice(Math.max(0, i - 3), i + 7)
    } else if (exactes.length < PAR_PAGE) {
      const i = entrees.indexOf(exactes[exactes.length - 1])
      suite = entrees.slice(i + 1, i + 1 + Math.max(4, PAR_PAGE - exactes.length))
    }
    return { saisie, exact, exactes, voisines, autour, suite }
  }

  // ---- Aller à une entrée, à la recherche ----
  const routeur = () => document.querySelector('#app')?.__vue_app__?.config?.globalProperties?.$router
  const aller = chemin => { const r = routeur(); if (r) r.push(chemin); else location.assign(chemin) }
  const cheminEntree = e => `${AVEC_PROJET ? '/' + COLLECTION : ''}/document/${encodeURIComponent(e.rid)}?refId=${encodeURIComponent(e.id)}`
  // Formes exactes : la saisie entre guillemets (expression exacte pour le moteur), sauf si elle en a déjà
  const cheminTexte = (q, exact) => {
    const terme = exact && !/^".*"$/.test(q) ? `"${q.replace(/"/g, '')}"` : q
    return `/${COLLECTION}/search?mode=fulltext&q=${encodeURIComponent(terme)}`
  }

  // ---- Le formulaire ----
  let numero = 0
  const creerFormulaire = () => {
    const n = ++numero
    const prefs = memoire.lire()
    let mode = MODES[prefs.mode] ? prefs.mode : 'article'
    let exact = prefs.exact === true
    const form = document.createElement('form')
    form.className = 'dc-consulter'
    form.setAttribute('role', 'search')
    form.setAttribute('aria-label', 'Consulter le Glossarium')
    const boutons = ordre => ordre.map(k => k === 'exact'
      ? '<button type="button" class="dc-option" data-option="exact">Formes exactes</button>'
      : `<button type="button" class="dc-mode" data-mode="${k}">${MODES[k].bouton}</button>`).join('')
    form.innerHTML = `
      <div class="dc-modes" role="group" aria-label="Type de recherche">${boutons(HAUT)}</div>
      <div class="dc-consulter-champ">
        <input id="dc-q-${n}" type="search" autocomplete="off" spellcheck="false" accesskey="q"
          role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="dc-l-${n}">
        <button type="submit" class="dc-consulter-ok"></button>
        <ul id="dc-l-${n}" class="dc-consulter-liste" role="listbox" hidden></ul>
      </div>
      <div class="dc-modes dc-modes-bas" role="group" aria-label="Recherche dans les citations">${boutons(BAS)}</div>
      <p class="dc-consulter-note" hidden></p>`
    const input = form.querySelector('input')
    const liste = form.querySelector('ul')
    const envoi = form.querySelector('.dc-consulter-ok')
    const note = form.querySelector('.dc-consulter-note')
    let dernier = null // dernières suggestions affichées
    let affichees = PAR_PAGE
    let tour = 0
    let minuteur = null

    const fermer = () => { liste.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant') }
    // État des boutons, texte d'aide du champ et mention des citations, selon le mode et l'option
    const appliquer = () => {
      form.querySelectorAll('.dc-mode').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)))
      form.querySelector('.dc-option').setAttribute('aria-pressed', String(exact))
      input.placeholder = MODES[mode].aide
      input.setAttribute('aria-label', MODES[mode].bouton)
      envoi.textContent = MODES[mode].envoi
      const langue = MODES[mode].langue
      note.hidden = !langue
      note.textContent = langue
        ? `La recherche limitée aux citations ${langue} est à venir (indexation de la langue des citations) ; pour l'instant, elle porte sur tout le texte du glossaire.`
        : ''
      form.dataset.mode = mode
      memoire.ecrire({ mode, exact })
      dernier = null
      if (mode === 'article' && input.value.trim()) actualiser()
      else fermer()
    }
    form.addEventListener('click', ev => {
      const b = ev.target.closest('.dc-modes button')
      if (!b) return
      if (b.dataset.option) exact = !exact
      else mode = (b.dataset.mode === mode && mode !== 'article') ? 'article' : b.dataset.mode
      appliquer()
      input.focus()
    })

    const options = () => [...liste.querySelectorAll('[role="option"]')]
    const choisir = i => {
      const o = options()
      o.forEach(x => x.setAttribute('aria-selected', 'false'))
      if (!o.length) return
      const k = (i + o.length) % o.length
      o[k].setAttribute('aria-selected', 'true')
      input.setAttribute('aria-activedescendant', o[k].id)
      o[k].scrollIntoView({ block: 'nearest' })
    }
    const choisie = () => options().findIndex(x => x.getAttribute('aria-selected') === 'true')

    const ligne = (e, avecLettre) => {
      const li = document.createElement('li')
      li.setAttribute('role', 'option')
      li.id = `dc-o-${n}-${liste.children.length}`
      li.dataset.chemin = cheminEntree(e)
      li.innerHTML = '<span class="dc-vedette"></span>' + (avecLettre ? `<span class="dc-lettre">${e.lettre}</span>` : '')
      li.firstChild.textContent = e.titre
      return li
    }
    const titre = t => { const li = document.createElement('li'); li.className = 'dc-consulter-titre'; li.setAttribute('role', 'presentation'); li.textContent = t; return li }

    const afficher = s => {
      liste.textContent = ''
      if (!s || mode !== 'article') { fermer(); return }
      const lettreSaisie = cle(s.saisie)[0]
      if (s.exactes.length) {
        s.exactes.slice(0, affichees).forEach(e => liste.append(ligne(e, false)))
        if (s.exactes.length > affichees) {
          const plus = document.createElement('li')
          plus.className = 'dc-consulter-plus'
          plus.setAttribute('role', 'option')
          plus.id = `dc-o-${n}-plus`
          plus.dataset.plus = '1'
          plus.textContent = `${s.exactes.length - affichees} autres vedettes en « ${s.saisie} »… afficher la suite`
          liste.append(plus)
        }
      } else if (s.autour.length) {
        liste.append(titre(`Aucune vedette en « ${s.saisie} » ; à proximité :`))
        s.autour.forEach(e => liste.append(ligne(e, false)))
      }
      if (s.suite.length) {
        liste.append(titre('Ensuite dans le glossaire'))
        s.suite.forEach(e => liste.append(ligne(e, false)))
      }
      if (s.voisines.length) {
        liste.append(titre('Graphies voisines'))
        s.voisines.forEach(e => liste.append(ligne(e, e.lettre !== lettreSaisie)))
      }
      const texte = document.createElement('li')
      texte.className = 'dc-consulter-texte'
      texte.setAttribute('role', 'option')
      texte.id = `dc-o-${n}-texte`
      texte.dataset.chemin = cheminTexte(s.saisie, exact)
      texte.textContent = `Chercher « ${s.saisie} » dans le texte du glossaire`
      liste.append(texte)
      liste.hidden = false
      input.setAttribute('aria-expanded', 'true')
    }

    const actualiser = () => {
      const q = input.value.trim()
      const t = ++tour
      affichees = PAR_PAGE
      if (mode !== 'article' || !cle(q)) { dernier = null; afficher(null); return }
      form.classList.add('dc-consulter-charge')
      suggerer(q, exact).then(s => {
        if (t !== tour) return // réponse périmée : on a tapé depuis
        form.classList.remove('dc-consulter-charge')
        dernier = s
        afficher(s)
        form.dataset.pret = q // saisie dont les suggestions sont affichées
      })
    }

    const ouvrir = li => {
      if (!li) return
      if (li.dataset.plus) { affichees += PAR_PAGE; afficher(dernier); choisir(affichees - PAR_PAGE); return }
      fermer()
      input.blur()
      aller(li.dataset.chemin)
    }

    input.addEventListener('input', () => { clearTimeout(minuteur); minuteur = setTimeout(actualiser, 150) })
    input.addEventListener('focus', () => { if (dernier && input.value.trim()) afficher(dernier) })
    input.addEventListener('keydown', ev => {
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        if (mode !== 'article') return
        ev.preventDefault()
        if (liste.hidden && dernier) afficher(dernier)
        const i = choisie()
        choisir(i === -1 ? (ev.key === 'ArrowDown' ? 0 : -1) : i + (ev.key === 'ArrowDown' ? 1 : -1))
      } else if (ev.key === 'Escape') {
        fermer()
      }
    })
    form.addEventListener('submit', async ev => {
      ev.preventDefault()
      const q = input.value.trim()
      if (!q) return
      if (mode !== 'article') { fermer(); input.blur(); aller(cheminTexte(q, exact)); return }
      if (!cle(q)) return
      const i = choisie()
      if (i !== -1) { ouvrir(options()[i]); return }
      // Entrée sans choix : la vedette exacte ; sinon (hors « Formes exactes ») la première qui commence par la
      // saisie ou l'unique graphie voisine ; sinon le plein texte
      const s = (dernier && dernier.saisie === q && dernier.exact === exact) ? dernier : await suggerer(q, exact)
      const vedette = s.exactes.find(e => e.cle === cle(q)) ||
        (exact ? null : (s.exactes[0] || (s.voisines.length === 1 ? s.voisines[0] : null)))
      fermer()
      input.blur()
      aller(vedette ? cheminEntree(vedette) : cheminTexte(q, exact))
    })
    // mousedown plutôt que click : passe avant la perte du focus
    liste.addEventListener('mousedown', ev => {
      const li = ev.target.closest('[role="option"]')
      if (!li) return
      ev.preventDefault()
      ouvrir(li)
    })
    input.addEventListener('blur', () => setTimeout(() => { if (!form.contains(document.activeElement)) fermer() }, 150))
    appliquer()
    return form
  }

  // ---- Pose du formulaire dans la page « Consulter un article » ----
  const dansDucange = () => {
    const r = routeur()?.currentRoute?.value
    const coll = r?.params?.collId
    if (coll) return String(coll).toLowerCase() === COLLECTION
    const id = r?.params?.id
    return !!id && String(id).startsWith(COLLECTION + '_')
  }
  const poser = () => {
    const ici = dansDucange()
    document.querySelectorAll('.dc-consulter').forEach(f => {
      if (!ici || !f.isConnected) f.remove()
    })
    if (!ici) return
    document.querySelectorAll('.dc-consulter-place').forEach(place => {
      if (!place.querySelector('.dc-consulter')) place.append(creerFormulaire())
    })
  }
  let prevu = false
  new MutationObserver(() => {
    if (prevu) return
    prevu = true
    requestAnimationFrame(() => { prevu = false; poser() })
  }).observe(document.documentElement, { childList: true, subtree: true })
  poser()
}

// 2026-11-26 (Maxime) : bouton « Citer » retiré avec « Pour citer cette entrée ».

// --- Bande des colonnes : colonne par colonne (2026-11-27, Maxime : « quand on change de page ça change l'image » ;
// choix : colonne par colonne). Dans la bande (bloc 8 du JS commun), ◀ ▶ parcourent les colonnes de l'article ; au bord,
// on passe à la colonne voisine du volume (ordre des vues du manifeste de la lettre, figure[data-manifeste]) et la page
// affiche le premier article qui commence dans cette colonne ; si aucun n'y commence (article long), l'article qui la
// traverse, sa bande ouverte sur cette colonne. Les articles voisins sont lus par l'API DTS : ordre = navigation de la
// lettre, colonnes = entry/@facs et cb/@facs, par lots de 30 articles (document?start=…&end=…). ---
if (!window.ducangeColonnes) {
  window.ducangeColonnes = true
  const API = String(import.meta.env.VITE_APP_DTS_ENDPOINT_URL || '').replace(/\/$/, '')
  const TEI = 'http://www.tei-c.org/ns/1.0'
  const XML = 'http://www.w3.org/XML/1998/namespace'
  const LOT = 30
  const empreinte = u => (String(u || '').match(/\/([0-9a-f]{40})(?:[/?]|$)/) || [])[1]
  const manifestes = {}
  const rangs = url => (manifestes[url] ??= fetch(url).then(r => r.json()).then(m => {
    const vues = m.sequences ? m.sequences[0].canvases : (m.items || [])
    // seules les vues de colonne comptent (« p. 254, col. c ») : le manifeste intercale la page entière (« p. 255 »)
    const idx = new Map()
    let rang = 0
    vues.forEach(c => {
      const libelle = typeof c.label === 'string' ? c.label : JSON.stringify(c.label || '')
      if (!/col\./.test(libelle)) return
      const im = c.images ? c.images[0].resource : c.items?.[0]?.items?.[0]?.body
      const srv = im && (Array.isArray(im.service) ? im.service[0] : im.service)
      const e = empreinte((srv && (srv['@id'] || srv.id)) || (im && (im['@id'] || im.id)))
      if (e) idx.set(e, rang++)
    })
    return idx
  }))
  const ordres = {}
  const ordre = rid => (ordres[rid] ??= fetch(`${API}/navigation?resource=${encodeURIComponent(rid)}&down=1`)
    .then(r => r.json()).then(j => j.member.map(m => m.identifier)))
  const lot = async (rid, a, b) => {
    const t = await fetch(`${API}/document?resource=${encodeURIComponent(rid)}&start=${encodeURIComponent(a)}&end=${encodeURIComponent(b)}`).then(r => r.text())
    const doc = new DOMParser().parseFromString(t, 'application/xml')
    return Array.from(doc.getElementsByTagNameNS(TEI, 'entry')).filter(e => e.parentNode?.localName !== 'entry').map(e => ({
      id: e.getAttributeNS(XML, 'id'),
      debut: empreinte(e.getAttribute('facs')),
      cb: Array.from(e.getElementsByTagNameNS(TEI, 'cb')).map(c => ({ n: c.getAttribute('n'), e: empreinte(c.getAttribute('facs')) }))
    }))
  }
  // la page de l'article, par le routeur de dots-vue (sans recharger) ; la bande de la nouvelle page s'ouvre sur la
  // colonne visée (window.elecBandeDepart, bloc 8 du JS commun)
  let colonneVisee = null
  const aller = id => {
    window.elecBandeDepart = colonneVisee
    const routeur = document.querySelector('#app')?.__vue_app__?.config.globalProperties.$router
    if (routeur) routeur.push({ path: location.pathname, query: { refId: id } })
    else location.href = location.pathname + '?refId=' + encodeURIComponent(id)
  }
  const ressource = () => location.pathname.split('/').filter(Boolean).pop()
  // préchargement dès qu'une bande apparaît : ordre des articles de la lettre et vues du manifeste
  new MutationObserver(() => {
    const f = document.querySelector('figure.elec-bande[data-manifeste]:not([data-precharge])')
    if (!f) return
    f.dataset.precharge = '1'
    rangs(f.dataset.manifeste)
    ordre(ressource())
  }).observe(document.documentElement, { childList: true, subtree: true })
  let enCours = false
  document.addEventListener('elec-bande-bord', async ev => {
    const fig = ev.target
    if (enCours || !fig.matches?.('figure.elec-bande[data-manifeste]')) return
    enCours = true
    fig.setAttribute('aria-busy', 'true')
    try {
      const sens = ev.detail
      const rid = ressource()
      const ici = new URLSearchParams(location.search).get('refId')
      const idx = await rangs(fig.dataset.manifeste)
      const bande = Array.from(fig.querySelectorAll('img')).map(i => idx.get(empreinte(i.src))).filter(n => n !== undefined)
      if (!bande.length || !ici) return
      const cible = sens > 0 ? Math.max(...bande) + 1 : Math.min(...bande) - 1
      colonneVisee = ([...idx].find(([, i]) => i === cible) || [])[0] || null
      const ids = await ordre(rid)
      let k = ids.indexOf(ici)
      if (k === -1) return
            let avant = null                         // ▶ : dernier article commencé avant la colonne visée
      let trouve = null                        // ◀ : premier article (en remontant, le plus ancien) qui y commence
      for (let tour = 0; tour < 20; tour++) {
        const a = sens > 0 ? k + 1 : Math.max(0, k - LOT)
        const b = sens > 0 ? Math.min(ids.length - 1, k + LOT) : k - 1
        if (a > b) break
        let entrees = await lot(rid, ids[a], ids[b])
        if (sens < 0) entrees = entrees.reverse()
        for (const e of entrees) {
          const c = idx.get(e.debut)
          if (c === undefined) continue
          if (sens > 0) {
            if (c === cible) return aller(e.id)
            if (c > cible) return aller(avant ? avant.id : e.id)
            avant = e
          } else {
            if (c === cible) { trouve = e; continue }
            if (c < cible) return aller(trouve ? trouve.id : e.id)
          }
        }
        k = sens > 0 ? b : a
      }
      if (trouve) aller(trouve.id)
    } finally {
      enCours = false
      fig.removeAttribute('aria-busy')
    }
  })
}
