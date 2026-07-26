import { useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

const emptyForm = { nom: '', telephone: '', adresse: '', produits_fournis: '' }

export default function AjouterFournisseur() {
  const { etablissement } = useOutletContext()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.nom.trim()) { setError('Le nom du fournisseur est requis.'); return }
    setLoading(true)

    const { error: insertError } = await supabase.from('fournisseurs').insert({
      etablissement_id: etablissement.id,
      nom: form.nom.trim(),
      telephone: form.telephone.trim() || null,
      adresse: form.adresse.trim() || null,
      produits_fournis: form.produits_fournis.trim() || null,
    })

    if (insertError) {
      setError(`Erreur : ${insertError.message}`)
      setLoading(false)
      return
    }

    navigate('/gerant/fournisseurs/liste')
  }

  return (
    <div className="panel" style={{ maxWidth: 480 }}>
      <div className="panel-head">
        <h2>Ajouter un fournisseur</h2>
        <div className="cap-icon"><Icon.Headset /></div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={submit}>
        <div className="m-field">
          <label>Nom du fournisseur</label>
          <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex : Grossiste Diallo & Fils" required />
        </div>
        <div className="m-field">
          <label>Téléphone</label>
          <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="Ex : 0812345678" />
        </div>
        <div className="m-field">
          <label>Adresse</label>
          <input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Ex : Marché central, Kinshasa" />
        </div>
        <div className="m-field">
          <label>Produits fournis</label>
          <textarea value={form.produits_fournis} onChange={(e) => setForm({ ...form, produits_fournis: e.target.value })} placeholder="Ex : Conserves, boissons, produits d'hygiène" />
        </div>
        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          <Icon.Plus />
          {loading ? 'Ajout en cours...' : 'Ajouter le fournisseur'}
        </button>
      </form>
    </div>
  )
}