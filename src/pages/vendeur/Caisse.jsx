import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient.js'
import { Icon } from '../../components/Icons.jsx'

export default function Caisse() {
  const { vendeur, etablissement, chargementTermine } = useOutletContext()
  const [articles, setArticles] = useState([])
  const [recherche, setRecherche] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [panier, setPanier] = useState([])
  const [nomClient, setNomClient] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recu, setRecu] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (chargementTermine && etablissement) chargerArticles()
  }, [chargementTermine, etablissement])

  const chargerArticles = async () => {
    const { data } = await supabase
      .from('articles')
      .select('id, nom, prix_vente, quantite, emplacement')
      .eq('etablissement_id', etablissement.id)
      .eq('archive', false)
      .gt('quantite', 0)
      .order('nom', { ascending: true })
    setArticles(data || [])
  }

  const f = (n) => parseInt(n).toLocaleString('fr-FR') + ' F'

  const onRecherche = (val) => {
    setRecherche(val)
    if (val.trim().length < 1) { setSuggestions([]); return }
    const dejaAuPanier = new Set(panier.map((l) => l.article.id))
    const resultats = articles
      .filter((a) => !dejaAuPanier.has(a.id) && a.nom.toLowerCase().includes(val.toLowerCase()))
      .slice(0, 6)
    setSuggestions(resultats)
  }

  const ajouterAuPanier = (article) => {
    setPanier((p) => [...p, { article, quantite: 1 }])
    setRecherche('')
    setSuggestions([])
    inputRef.current?.focus()
  }

  const modifierQuantite = (articleId, delta) => {
    setPanier((p) =>
      p.map((l) => {
        if (l.article.id !== articleId) return l
        const nouvelle = l.quantite + delta
        const max = l.article.quantite
        return { ...l, quantite: Math.max(1, Math.min(nouvelle, max)) }
      })
    )
  }

  const retirerDuPanier = (articleId) => {
    setPanier((p) => p.filter((l) => l.article.id !== articleId))
  }

  const total = panier.reduce((s, l) => s + l.article.prix_vente * l.quantite, 0)

  const annulerTout = () => {
    setPanier([])
    setNomClient('')
    setError('')
  }

  const valider = async () => {
    if (panier.length === 0) return
    setError('')
    setLoading(true)

    const lignes = panier.map((l) => ({ article_id: l.article.id, quantite: l.quantite }))

    const { data, error: rpcError } = await supabase.rpc('creer_vente', {
      p_etablissement_id: etablissement.id,
      p_vendeur_id: vendeur.id,
      p_lignes: lignes,
      p_nom_client: nomClient.trim() || null,
    })

    if (rpcError) {
      setError(rpcError.message.includes('Stock insuffisant')
        ? rpcError.message.replace(/^.*?:\s*/, '')
        : `Erreur : ${rpcError.message}`)
      setLoading(false)
      chargerArticles()
      return
    }

    setRecu({
      numeroVente: data,
      date: new Date(),
      nomClient: nomClient.trim() || null,
      nomVendeur: vendeur.nom_complet,
      nomEtablissement: etablissement.nom,
      lignes: panier.map((l) => ({
        nom: l.article.nom,
        quantite: l.quantite,
        prixUnitaire: l.article.prix_vente,
        sousTotal: l.article.prix_vente * l.quantite,
      })),
      total,
    })

    setPanier([])
    setNomClient('')
    setLoading(false)
    chargerArticles()
  }

  const imprimer = () => {
    window.print()
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, alignItems: 'start' }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #zone-impression, #zone-impression * { visibility: visible; }
          #zone-impression {
            position: absolute; top: 0; left: 0; width: 80mm; padding: 8px;
            font-family: 'Courier New', monospace; font-size: 12px; color: #000;
          }
        }
        .recu-ligne { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .recu-sep { border-top: 1px dashed #999; margin: 8px 0; }
      `}</style>

      {/* Colonne recherche */}
      <div className="panel">
        <div className="panel-head"><h2>Nouvel achat</h2></div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
          background: 'var(--accent-pale)', border: '1px solid rgba(26,122,80,.18)',
          borderRadius: 10, padding: '10px 13px',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: '#fff', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
          }}>
            <Icon.Users style={{ width: 15, height: 15 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 3 }}>
              Client (optionnel)
            </div>
            <input
              value={nomClient}
              onChange={(e) => setNomClient(e.target.value)}
              placeholder="Nom du client pour la facture"
              style={{
                width: '100%', border: 'none', background: 'transparent', outline: 'none',
                fontSize: 13.5, fontWeight: 600, color: 'var(--text)', fontFamily: 'Inter, sans-serif', padding: 0,
              }}
            />
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={recherche}
            onChange={(e) => onRecherche(e.target.value)}
            placeholder="Tapez le nom d'un article (ex : savons, biscuits...)"
            style={{
              width: '100%', border: '1.5px solid var(--border)', borderRadius: 10,
              padding: '12px 14px', fontSize: 14, color: 'var(--text)', background: 'var(--panel-2)',
              outline: 'none', fontFamily: 'Inter, sans-serif',
            }}
          />

          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6,
              background: '#fff', border: '1px solid var(--border)', borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 10, overflow: 'hidden',
            }}>
              {suggestions.map((a) => (
                <div
                  key={a.id}
                  onClick={() => ajouterAuPanier(a)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '11px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.nom}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {a.emplacement || 'Emplacement non précisé'} · {a.quantite} en stock
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 13 }}>{f(a.prix_vente)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {recherche.trim() && suggestions.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>Aucun article trouvé.</div>
        )}

        {panier.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon.Card /></div>
            <h3>Panier vide</h3>
            <p>Recherchez un article ci-dessus pour commencer un achat.</p>
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            {panier.map((l) => (
              <div key={l.article.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 4px', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{l.article.nom}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {l.article.emplacement || 'Emplacement non précisé'} · {f(l.article.prix_vente)} / unité
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => modifierQuantite(l.article.id, -1)} style={qtyBtnStyle}>−</button>
                  <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 700, fontSize: 13 }}>{l.quantite}</span>
                  <button onClick={() => modifierQuantite(l.article.id, 1)} style={qtyBtnStyle}>+</button>
                </div>
                <div style={{ width: 90, textAlign: 'right', fontWeight: 700, color: 'var(--accent)', fontSize: 13.5 }}>
                  {f(l.article.prix_vente * l.quantite)}
                </div>
                <button onClick={() => retirerDuPanier(l.article.id)} style={{ marginLeft: 10, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                  <Icon.X style={{ width: 15, height: 15 }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Colonne récapitulatif / ticket */}
      <div className="panel" style={{ position: 'sticky', top: 0 }}>
        <div className="panel-head"><h2>Ticket</h2></div>

        {error && <div className="alert-error">{error}</div>}

        {recu ? (
          <>
            <div className="alert-success">✓ Vente enregistrée — {recu.lignes.length} article(s), {f(recu.total)}</div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }} onClick={imprimer}>
              <Icon.FilePlus style={{ width: 15, height: 15 }} />
              Imprimer la facture
            </button>
            <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setRecu(null)}>
              Nouvelle vente
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
              {panier.length} article{panier.length > 1 ? 's' : ''}
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              padding: '14px 0', borderTop: '1px dashed var(--border)', borderBottom: '1px dashed var(--border)', marginBottom: 16,
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>Total</span>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{f(total)}</span>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}
              disabled={panier.length === 0 || loading}
              onClick={valider}
            >
              {loading ? 'Enregistrement...' : 'OK — Confirmer la vente'}
            </button>
            <button
              className="btn-ghost"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={panier.length === 0 || loading}
              onClick={annulerTout}
            >
              Annuler
            </button>
          </>
        )}
      </div>

      {/* Zone imprimable, invisible à l'écran normal, visible uniquement lors de l'impression */}
      {recu && (
        <div id="zone-impression" style={{ display: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{recu.nomEtablissement}</div>
            <div style={{ fontSize: 10, marginTop: 2 }}>Facture de vente</div>
          </div>

          <div className="recu-sep"></div>

          <div className="recu-ligne"><span>Date</span><span>{recu.date.toLocaleString('fr-FR')}</span></div>
          <div className="recu-ligne"><span>N° facture</span><span>{recu.numeroVente.slice(0, 8).toUpperCase()}</span></div>
          <div className="recu-ligne"><span>Vendeur</span><span>{recu.nomVendeur}</span></div>
          <div className="recu-ligne"><span>Client</span><span>{recu.nomClient || 'Non renseigné'}</span></div>

          <div className="recu-sep"></div>

          {recu.lignes.map((l, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ fontWeight: 600 }}>{l.nom}</div>
              <div className="recu-ligne">
                <span>{l.quantite} x {parseInt(l.prixUnitaire).toLocaleString('fr-FR')} F</span>
                <span>{parseInt(l.sousTotal).toLocaleString('fr-FR')} F</span>
              </div>
            </div>
          ))}

          <div className="recu-sep"></div>

          <div className="recu-ligne" style={{ fontWeight: 700, fontSize: 15 }}>
            <span>TOTAL</span><span>{parseInt(recu.total).toLocaleString('fr-FR')} F</span>
          </div>

          <div className="recu-sep"></div>

          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600 }}>✓ Vente validée</div>
            <div style={{ fontSize: 9, color: '#555', marginTop: 8 }}>Propulsé par StellarBrightSoftware</div>
          </div>
        </div>
      )}
    </div>
  )
}

const qtyBtnStyle = {
  width: 26, height: 26, borderRadius: 7, border: '1px solid var(--border)',
  background: 'var(--panel-2)', color: 'var(--text)', fontSize: 15, fontWeight: 700,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
}