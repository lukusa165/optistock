import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

export default function ListeFournisseurs() {
  const { etablissement, chargementTermine } = useOutletContext()
  const [fournisseurs, setFournisseurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [suppression, setSuppression] = useState(null)

  useEffect(() => {
    if (chargementTermine && etablissement) charger()
  }, [chargementTermine, etablissement])

  const charger = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('fournisseurs')
      .select('*')
      .eq('etablissement_id', etablissement.id)
      .order('nom', { ascending: true })
    setFournisseurs(data || [])
    setLoading(false)
  }

  const supprimer = async (id) => {
    const { error } = await supabase.from('fournisseurs').delete().eq('id', id)
    if (!error) setFournisseurs((list) => list.filter((f) => f.id !== id))
    setSuppression(null)
  }

  if (loading) return <div className="panel"><div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div></div>

  return (
    <div className="panel">
      <div className="panel-head"><h2>Fournisseurs ({fournisseurs.length})</h2></div>

      {fournisseurs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon.Headset /></div>
          <h3>Aucun fournisseur</h3>
          <p>Ajoutez vos fournisseurs pour garder leurs coordonnées à portée de main.</p>
        </div>
      ) : (
        <table>
          <thead><tr><th>Nom</th><th>Téléphone</th><th>Produits fournis</th><th></th></tr></thead>
          <tbody>
            {fournisseurs.map((f) => (
              <tr key={f.id}>
                <td>
                  <div className="name-cell">{f.nom}</div>
                  {f.adresse && <div className="sub-cell">{f.adresse}</div>}
                </td>
                <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5 }}>{f.telephone || '—'}</td>
                <td style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{f.produits_fournis || '—'}</td>
                <td>
                  <div className="row-actions">
                    <button className="danger" onClick={() => setSuppression(f)} title="Supprimer">
                      <Icon.Trash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {suppression && (
        <div className="overlay" onClick={() => setSuppression(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Supprimer ce fournisseur ?</h3>
              <button className="modal-close" onClick={() => setSuppression(null)}><Icon.X /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
              Voulez-vous vraiment supprimer <strong>{suppression.nom}</strong> ?
            </p>
            <div className="modal-actions">
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setSuppression(null)}>Annuler</button>
              <button className="btn-danger" style={{ flex: 1 }} onClick={() => supprimer(suppression.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}