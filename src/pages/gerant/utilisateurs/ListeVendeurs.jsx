import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

export default function ListeVendeurs() {
  const { etablissement, chargementTermine } = useOutletContext()
  const [vendeurs, setVendeurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmation, setConfirmation] = useState(null)

  useEffect(() => {
    if (chargementTermine && etablissement) charger()
  }, [chargementTermine, etablissement])

  const charger = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nom_complet, telephone, actif, created_at')
      .eq('etablissement_id', etablissement.id)
      .eq('role', 'vendeur')
      .order('nom_complet', { ascending: true })
    if (!error) setVendeurs(data || [])
    setLoading(false)
  }

  const basculerStatut = async (vendeur) => {
    const { error } = await supabase
      .from('profiles')
      .update({ actif: !vendeur.actif })
      .eq('id', vendeur.id)

    if (!error) {
      setVendeurs((list) =>
        list.map((v) => (v.id === vendeur.id ? { ...v, actif: !v.actif } : v))
      )
    }
    setConfirmation(null)
  }

  if (loading) {
    return <div className="panel"><div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div></div>
  }

  return (
    <div className="panel">
      <div className="panel-head"><h2>Mes vendeurs ({vendeurs.length})</h2></div>

      {vendeurs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon.UserPlus /></div>
          <h3>Aucun vendeur</h3>
          <p>Créez votre premier vendeur depuis l'onglet "Créer un vendeur".</p>
        </div>
      ) : (
        <table>
          <thead><tr><th>Vendeur</th><th>Numéro</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {vendeurs.map((v) => (
              <tr key={v.id}>
                <td className="name-cell">{v.nom_complet}</td>
                <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5 }}>{v.telephone}</td>
                <td>
                  <span className="badge" style={{
                    color: v.actif ? 'var(--success)' : 'var(--danger)',
                    background: v.actif ? 'rgba(22,163,74,.08)' : 'rgba(220,38,38,.08)'
                  }}>
                    {v.actif ? 'Actif' : 'Bloqué'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className={v.actif ? 'danger' : ''}
                      onClick={() => setConfirmation(v)}
                      title={v.actif ? 'Bloquer' : 'Débloquer'}
                    >
                      <Icon.Power />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {confirmation && (
        <div className="overlay" onClick={() => setConfirmation(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{confirmation.actif ? 'Bloquer' : 'Débloquer'} ce vendeur ?</h3>
              <button className="modal-close" onClick={() => setConfirmation(null)}><Icon.X /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
              {confirmation.actif
                ? <>Une fois bloqué, <strong>{confirmation.nom_complet}</strong> ne pourra plus se connecter ni enregistrer de ventes.</>
                : <><strong>{confirmation.nom_complet}</strong> pourra de nouveau se connecter et vendre.</>
              }
            </p>
            <div className="modal-actions">
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmation(null)}>Annuler</button>
              <button
                className={confirmation.actif ? 'btn-danger' : 'btn-primary'}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => basculerStatut(confirmation)}
              >
                {confirmation.actif ? 'Bloquer' : 'Débloquer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}