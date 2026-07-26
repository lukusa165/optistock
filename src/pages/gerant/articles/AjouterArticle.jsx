import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

const emptyForm = { nom: '', reference: '', prix_achat: '', prix_vente: '', quantite: '', seuil_alerte: '5', emplacement: '', categorie: '' }

export default function AjouterArticle() {
  const { etablissement } = useOutletContext()
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [succes, setSucces] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.nom.trim()) { setError("Le nom de l'article est requis."); return }
    if (Number(form.prix_vente) <= 0) { setError('Le prix de vente doit être supérieur à 0.'); return }
    if (Number(form.quantite) < 0) { setError('La quantité ne peut pas être négative.'); return }

    setLoading(true)

    const { error: insertError } = await supabase.from('articles').insert({
      etablissement_id: etablissement.id,
      nom: form.nom.trim(),
      reference: form.reference.trim() || null,
      prix_achat: Number(form.prix_achat) || 0,
      prix_vente: Number(form.prix_vente),
      quantite: Number(form.quantite) || 0,
      seuil_alerte: Number(form.seuil_alerte) || 5,
      emplacement: form.emplacement.trim() || null,
      categorie: form.categorie.trim() || null,
    })

    if (insertError) {
      setError(`Erreur : ${insertError.message}`)
      setLoading(false)
      return
    }

    setSucces(true)
    setForm(emptyForm)
    setLoading(false)
    setTimeout(() => setSucces(false), 2500)
  }

  return (
    <div className="panel" style={{ maxWidth: 520 }}>
      <div className="panel-head">
        <h2>Ajouter un article</h2>
        <div className="cap-icon"><Icon.FilePlus /></div>
      </div>

      {succes && <div className="alert-success">✓ Article ajouté avec succès.</div>}
      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={submit}>
        <div className="m-field">
          <label>Nom de l'article</label>
          <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex : Sardines Titus" required />
        </div>

        <div className="m-field">
          <label>Référence (optionnel)</label>
          <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Ex : SAR-001" />
        </div>

        <div className="m-row">
          <div className="m-field">
            <label>Prix d'achat (F)</label>
            <input type="number" min="0" value={form.prix_achat} onChange={(e) => setForm({ ...form, prix_achat: e.target.value })} placeholder="0" />
          </div>
          <div className="m-field">
            <label>Prix de vente (F)</label>
            <input type="number" min="0" value={form.prix_vente} onChange={(e) => setForm({ ...form, prix_vente: e.target.value })} placeholder="0" required />
          </div>
        </div>

        <div className="m-row">
          <div className="m-field">
            <label>Quantité en stock</label>
            <input type="number" min="0" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} placeholder="0" required />
          </div>
          <div className="m-field">
            <label>Seuil d'alerte</label>
            <input type="number" min="0" value={form.seuil_alerte} onChange={(e) => setForm({ ...form, seuil_alerte: e.target.value })} placeholder="5" />
            <div className="hint">Alerte envoyée quand le stock atteint ce niveau.</div>
          </div>
        </div>

        <div className="m-row">
          <div className="m-field">
            <label>Emplacement</label>
            <input value={form.emplacement} onChange={(e) => setForm({ ...form, emplacement: e.target.value })} placeholder="Ex : Rayon 2, étagère B" />
          </div>
          <div className="m-field">
            <label>Catégorie</label>
            <input value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} placeholder="Ex : Conserves" />
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
          <Icon.Plus />
          {loading ? 'Ajout en cours...' : "Ajouter l'article"}
        </button>
      </form>
    </div>
  )
}