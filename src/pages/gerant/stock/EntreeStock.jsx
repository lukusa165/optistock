import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { logAction } from '../../../lib/historique.js'
import { Icon } from '../../../components/Icons.jsx'

export default function EntreeStock() {
  const { etablissement, gerant, chargementTermine } = useOutletContext()
  const [articles, setArticles] = useState([])
  const [recherche, setRecherche] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selection, setSelection] = useState(null)
  const [quantite, setQuantite] = useState('')
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
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSucces('')

    if (!selection) { setError('Sélectionnez un article dans la liste.'); return }
    const qte = Number(quantite)
    if (!qte || qte <= 0) { setError('Saisissez une quantité valide.'); return }

    setLoading(true)

    const nouvelleQuantite = selection.quantite + qte

    const { error: updateError } = await supabase
      .from('articles')
      .update({ quantite: nouvelleQuantite, updated_at: new Date().toISOString() })
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
      type: 'entree_stock',
      description: `Entrée de stock — ${selection.nom} : +${qte} (nouveau total : ${nouvelleQuantite})`,
    })

    setSucces(`✓ Stock mis à jour : ${selection.nom} a maintenant ${nouvelleQuantite} unité(s).`)
    setArticles((list) => list.map((a) => (a.id === selection.id ? { ...a, quantite: nouvelleQuantite } : a)))
    setSelection(null)
    setRecherche('')
    setQuantite('')
    setLoading(false)
    setTimeout(() => setSucces(''), 3000)
  }

  return (
    <div className="panel" style={{ maxWidth: 480 }}>
      <div className="panel-head">
        <h2>Entrée de stock</h2>
        <div className="cap-icon"><Icon.Database /></div>
      </div>

      {succes && <div className="alert-success">{succes}</div>}
      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={submit}>
        <div className="m-field" style={{ position: 'relative' }}>
          <label>Article à réapprovisionner</label>
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
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.quantite} en stock actuellement · {a.emplacement || 'Sans emplacement'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selection && (
          <div className="plan-limit" style={{ marginBottom: 14 }}>
            <div className="plan-limit-text">
              Stock actuel : <strong>{selection.quantite}</strong> unité(s)
            </div>
          </div>
        )}

        <div className="m-field">
          <label>Quantité reçue</label>
          <input type="number" min="1" value={quantite} onChange={(e) => setQuantite(e.target.value)} placeholder="Ex : 20" required />
          {selection && quantite > 0 && (
            <div className="hint">Nouveau stock après entrée : <strong>{selection.quantite + Number(quantite)}</strong></div>
          )}
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          <Icon.Plus />
          {loading ? 'Enregistrement...' : 'Valider l\'entrée de stock'}
        </button>
      </form>
    </div>
  )
}