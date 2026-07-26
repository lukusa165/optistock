import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

export default function ModifierArticle() {
  const location = useLocation()
  const navigate = useNavigate()
  const articleInitial = location.state?.article

  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    if (!articleInitial) {
      navigate('/gerant/articles/liste', { replace: true })
      return
    }
    setForm({
      nom: articleInitial.nom || '',
      reference: articleInitial.reference || '',
      prix_achat: articleInitial.prix_achat ?? '',
      prix_vente: articleInitial.prix_vente ?? '',
      quantite: articleInitial.quantite ?? '',
      seuil_alerte: articleInitial.seuil_alerte ?? '5',
      emplacement: articleInitial.emplacement || '',
      categorie: articleInitial.categorie || '',
    })
  }, [articleInitial])

  if (!form) return null

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.nom.trim()) { setError("Le nom de l'article est requis."); return }
    if (Number(form.prix_vente) <= 0) { setError('Le prix de vente doit être supérieur à 0.'); return }
    if (Number(form.quantite) < 0) { setError('La quantité ne peut pas être négative.'); return }

    setLoading(true)

    const { error: updateError } = await supabase
      .from('articles')
      .update({
        nom: form.nom.trim(),
        reference: form.reference.trim() || null,
        prix_achat: Number(form.prix_achat) || 0,
        prix_vente: Number(form.prix_vente),
        quantite: Number(form.quantite) || 0,
        seuil_alerte: Number(form.seuil_alerte) || 5,
        emplacement: form.emplacement.trim() || null,
        categorie: form.categorie.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', articleInitial.id)

    if (updateError) {
      setError(`Erreur : ${updateError.message}`)
      setLoading(false)
      return
    }

    setSucces(true)
    setLoading(false)
    setTimeout(() => navigate('/gerant/articles/liste'), 1200)
  }

  return (
    <div className="panel" style={{ maxWidth: 520 }}>
      <div className="panel-head">
        <h2>Modifier « {articleInitial.nom} »</h2>
        <div className="cap-icon"><Icon.FileEdit /></div>
      </div>

      {succes && <div className="alert-success">✓ Article modifié avec succès.</div>}
      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={submit}>
        <div className="m-field">
          <label>Nom de l'article</label>
          <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
        </div>

        <div className="m-field">
          <label>Référence (optionnel)</label>
          <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
        </div>

        <div className="m-row">
          <div className="m-field">
            <label>Prix d'achat (F)</label>
            <input type="number" min="0" value={form.prix_achat} onChange={(e) => setForm({ ...form, prix_achat: e.target.value })} />
          </div>
          <div className="m-field">
            <label>Prix de vente (F)</label>
            <input type="number" min="0" value={form.prix_vente} onChange={(e) => setForm({ ...form, prix_vente: e.target.value })} required />
          </div>
        </div>

        <div className="m-row">
          <div className="m-field">
            <label>Quantité en stock</label>
            <input type="number" min="0" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} required />
          </div>
          <div className="m-field">
            <label>Seuil d'alerte</label>
            <input type="number" min="0" value={form.seuil_alerte} onChange={(e) => setForm({ ...form, seuil_alerte: e.target.value })} />
          </div>
        </div>

        <div className="m-row">
          <div className="m-field">
            <label>Emplacement</label>
            <input value={form.emplacement} onChange={(e) => setForm({ ...form, emplacement: e.target.value })} />
          </div>
          <div className="m-field">
            <label>Catégorie</label>
            <input value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => navigate('/gerant/articles/liste')}>Annuler</button>
          <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}