import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient.js'

export default function Journaux() {
  const [entrees, setEntrees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { charger() }, [])

  const charger = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('historique')
      .select('*, etablissements(nom)')
      .in('type', ['connexion', 'deconnexion', 'acces_support', 'acces_urgence'])
      .order('created_at', { ascending: false })
      .limit(150)
    setEntrees(data || [])
    setLoading(false)
  }

  if (loading) return <div className="panel"><div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div></div>

  return (
    <div className="panel">
      <div className="panel-head"><h2>Journaux de connexion et d'accès</h2></div>
      {entrees.map((e) => (
        <div key={e.id} style={{ display: 'flex', gap: 12, padding: '11px 4px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
            background: e.type.includes('urgence') ? 'var(--danger)' : e.type.includes('support') ? 'var(--warning)' : 'var(--accent)',
          }}></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text)' }}>
              <strong>{e.etablissements?.nom || '—'}</strong> — {e.description}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {new Date(e.created_at).toLocaleString('fr-FR')}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}