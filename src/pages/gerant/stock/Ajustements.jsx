import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { logAction } from '../../../lib/historique.js'
import { Icon } from '../../../components/Icons.jsx'

const MOTIFS = ['Casse / produit endommagé', 'Erreur de comptage', 'Produit périmé', 'Vol / perte', 'Correction manuelle', 'Autre']

export default function Ajustements() {
  const { etablissement, gerant, chargementTermine } = useOutletContext()
  const [articles, setArticles] = useState([])
  const [recherche, setRecherche] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selection, setSelection] = useState(null)
  const [nouvelleQuantite, setNouvelleQuantite] = useState('')
  const [motif, setMotif] = useState(MOTIFS[0])
  const [error, setError] = useState('')
  const [succes, setSucces] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (chargementTermine && etablissement) charger()
  }, [chargementTermine, etablissement])

  const charger = async () => {
    const { data } = await supabase
      .from('articles')
      .select('id, nom, quantite, emplacement')
      .eq('etablissement_id', etablissement.id)
      .order('nom', { ascending: true })
    setArticles(data || [])
  }

  const onRecherche = (val) => {
    setRecherche(val)
    setSelection(null)
    if (val.trim().length < 1) { setSuggestions([]); return }
    setSuggestions(articles.filter((a) => a.nom.toLowerCase().includes(val.toLowerCase())).slice(0, 6))
  }

  const choisir = (a) => {
    setSelection(a)
    setRecherche(a.nom)
    setSuggestions([])
    setNouvelleQuantite(String(a.quantite))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSucces('')

    if (!selection) { setError('Sélectionnez un article dans la liste.'); return }
    const nouvelle = Number(nouvelleQuantite)
    if (nouvelle < 0 || nouvelleQuantite === '') { setError('Saisissez une quantité valide (0 ou plus).'); return }
    if (nouvelle === selection.quantite) { setError('La quantité saisie est identique au stock actuel.'); return }

    setLoading(true)

    const ecart = nouvelle - selection.quantite

    const { error: updateError } = await supabase
      .from('articles')
      .update({ quantite: nouvelle, updated_at: new Date().toISOString() })
      .eq('id', selection.id)

    if (updateError) {
      setError(`Erreur : ${updateError.message}`)
      setLoading(false)
      return
    }

    await logAction({
      etablissement_id: etablissement.id,
      user_id: gerant.id,
      user_nom: gerant.nom_complet,
      type: 'ajustement_stock',
      description: `Ajustement — ${selection.nom} : ${selection.quantite} → ${nouvelle} (${ecart > 0 ? '+' : ''}${ecart}). Motif : ${motif}`,
    })

    setSucces(`✓ Stock ajusté : ${selection.nom} est maintenant à ${nouvelle} unité(s).`)
    setArticles((list) => list.map((a) => (a.id === selection.id ? { ...a, quantite: nouvelle } : a)))
    setSelection(null)
    setRecherche('')
    setNouvelleQuantite('')
    setLoading(false)
    setTimeout(() => setSucces(''), 3000)
  }

  return (
    <div className="panel" style={{ maxWidth: 480 }}>
      <div className="panel-head">
        <h2>Ajustement de stock</h2>
        <div className="cap-icon"><Icon.Wrench /></div>
      </div>

      <div className="hint" style={{ marginBottom: 16 }}>
        À utiliser pour corriger le stock suite à une casse, une perte, une péremption ou une erreur de comptage — pas pour une vente normale.
      </div>

      {succes && <div className="alert-success">{succes}</div>}
      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={submit}>
        <div className="m-field" style={{ position: 'relative' }}>
          <label>Article concerné</label>
          <input
            value={recherche}
            onChange={(e) => onRecherche(e.target.value)}
            placeholder="Tapez le nom de l'article..."
            required
          />
          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
              background: '#fff', border: '1px solid var(--border)', borderRadius: 9,
              boxShadow: '0 8px 20px rgba(0,0,0,0.1)', zIndex: 10, overflow: 'hidden',
            }}>
              {suggestions.map((a) => (
                <div
                  key={a.id}
                  onMouseDown={(e) => { e.preventDefault(); choisir(a) }}
                  style={{ padding: '10px 13px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 12.5 }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{a.nom}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.quantite} en stock actuellement</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selection && (
          <div className="plan-limit" style={{ marginBottom: 14 }}>
            <div className="plan-limit-text">Stock actuel : <strong>{selection.quantite}</strong> unité(s)</div>
          </div>
        )}

        <div className="m-field">
          <label>Nouvelle quantité réelle</label>
          <input type="number" min="0" value={nouvelleQuantite} onChange={(e) => setNouvelleQuantite(e.target.value)} placeholder="Ex : 12" required />
          {selection && nouvelleQuantite !== '' && (
            <div className="hint">
              Écart : <strong style={{ color: Number(nouvelleQuantite) - selection.quantite < 0 ? 'var(--danger)' : 'var(--success)' }}>
                {Number(nouvelleQuantite) - selection.quantite > 0 ? '+' : ''}{Number(nouvelleQuantite) - selection.quantite}
              </strong>
            </div>
          )}
        </div>

        <div className="m-field">
          <label>Motif de l'ajustement</label>
          <select value={motif} onChange={(e) => setMotif(e.target.value)}>
            {MOTIFS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          <Icon.Wrench />
          {loading ? 'Enregistrement...' : "Valider l'ajustement"}
        </button>
      </form>
    </div>
  )
}