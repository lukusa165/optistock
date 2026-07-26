import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

export default function Alertes() {
  const { etablissement, chargementTermine } = useOutletContext()
  const [alertes, setAlertes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (chargementTermine && etablissement) charger()
  }, [chargementTermine, etablissement])

  const charger = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('alertes')
      .select('*')
      .eq('etablissement_id', etablissement.id)
      .order('lu', { ascending: true })
      .order('created_at', { ascending: false })
    setAlertes(data || [])
    setLoading(false)
  }

  const marquerLu = async (id) => {
    await supabase.from('alertes').update({ lu: true }).eq('id', id)
    setAlertes((list) => list.map((a) => (a.id === id ? { ...a, lu: true } : a)))
  }

  if (loading) return <div className="panel"><div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div></div>

  return (
    <div className="panel">
      <div className="panel-head"><h2>Alertes ({alertes.filter((a) => !a.lu).length} non lue(s))</h2></div>

      {alertes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon.Bell /></div>
          <h3>Aucune alerte</h3>
          <p>Vous serez averti ici en cas de stock faible ou d'abonnement proche de l'expiration.</p>
        </div>
      ) : (
        alertes.map((a) => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '13px 4px',
            borderBottom: '1px solid var(--border)', opacity: a.lu ? 0.55 : 1,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: a.type === 'stock_bas' ? 'rgba(217,119,6,.1)' : 'rgba(220,38,38,.08)',
              color: a.type === 'stock_bas' ? 'var(--warning)' : 'var(--danger)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon.Bell style={{ width: 15, height: 15 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text)' }}>{a.message}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                {new Date(a.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {!a.lu && (
              <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11.5 }} onClick={() => marquerLu(a.id)}>
                Marquer comme lu
              </button>
            )}
          </div>
        ))
      )}
    </div>
  )
}