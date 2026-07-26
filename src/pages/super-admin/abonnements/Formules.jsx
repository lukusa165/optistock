import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

export default function Formules() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [edition, setEdition] = useState(null)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { charger() }, [])

  const charger = async () => {
    setLoading(true)
    const { data } = await supabase.from('plans').select('*').order('ordre', { ascending: true })
    setPlans(data || [])
    setLoading(false)
  }

  const ouvrir = (plan) => {
    setEdition(plan)
    setForm({ prix_label: plan.prix_label, limite_vendeurs: plan.limite_vendeurs ?? '', essai_gratuit: plan.essai_gratuit })
    setError('')
  }

  const enregistrer = async (e) => {
    e.preventDefault()
    setError('')
    const { error: updateError } = await supabase
      .from('plans')
      .update({
        prix_label: form.prix_label,
        limite_vendeurs: form.limite_vendeurs === '' ? null : Number(form.limite_vendeurs),
        essai_gratuit: form.essai_gratuit,
      })
      .eq('id', edition.id)

    if (updateError) { setError(`Erreur : ${updateError.message}`); return }
    await charger()
    setEdition(null)
  }

  if (loading) return <div className="panel"><div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div></div>

  return (
    <>
      <div className="plans-grid">
        {plans.map((p) => (
          <div key={p.id} className="plan-card">
            <div className="plan-dot"></div>
            <h3>{p.nom}</h3>
            <div className="price">{p.prix_label}</div>
            <div className="meta"><span>Vendeurs max</span><b>{p.limite_vendeurs ?? 'Illimité'}</b></div>
            {p.essai_gratuit && <div className="trial"><Icon.Gift />Essai gratuit</div>}
            <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={() => ouvrir(p)}>
              Modifier
            </button>
          </div>
        ))}
      </div>

      {edition && (
        <div className="overlay" onClick={() => setEdition(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Modifier « {edition.nom} »</h3>
              <button className="modal-close" onClick={() => setEdition(null)}><Icon.X /></button>
            </div>
            {error && <div className="alert-error">{error}</div>}
            <form onSubmit={enregistrer}>
              <div className="m-field">
                <label>Prix affiché</label>
                <input value={form.prix_label} onChange={(e) => setForm({ ...form, prix_label: e.target.value })} required />
              </div>
              <div className="m-field">
                <label>Limite de vendeurs (vide = illimité)</label>
                <input type="number" min="0" value={form.limite_vendeurs} onChange={(e) => setForm({ ...form, limite_vendeurs: e.target.value })} />
              </div>
              <div className="m-field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={form.essai_gratuit} onChange={(e) => setForm({ ...form, essai_gratuit: e.target.checked })} style={{ width: 'auto' }} />
                <label style={{ margin: 0 }}>Essai gratuit</label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setEdition(null)}>Annuler</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}