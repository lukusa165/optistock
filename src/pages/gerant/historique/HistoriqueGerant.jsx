import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

const TYPES_LABELS = {
  connexion: 'Connexion', deconnexion: 'Déconnexion',
  entree_stock: 'Entrée de stock', ajustement_stock: 'Ajustement de stock',
  vente: 'Vente',
}

export default function HistoriqueGerant() {
  const { etablissement, chargementTermine } = useOutletContext()
  const [entrees, setEntrees] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState('tous')

  useEffect(() => {
    if (chargementTermine && etablissement) charger()
  }, [chargementTermine, etablissement])

  const charger = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('historique')
      .select('*')
      .eq('etablissement_id', etablissement.id)
      .order('created_at', { ascending: false })
      .limit(100)
    setEntrees(data || [])
    setLoading(false)
  }

  const filtrees = filtre === 'tous' ? entrees : entrees.filter((e) => e.type === filtre)
  const typesDisponibles = [...new Set(entrees.map((e) => e.type))]

  if (loading) return <div className="panel"><div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div></div>

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Historique des actions</h2>
        <select
          value={filtre} onChange={(e) => setFiltre(e.target.value)}
          style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, background: 'var(--panel-2)', outline: 'none' }}
        >
          <option value="tous">Tous les événements</option>
          {typesDisponibles.map((t) => <option key={t} value={t}>{TYPES_LABELS[t] || t}</option>)}
        </select>
      </div>

      {filtrees.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon.Clock /></div>
          <h3>Aucun événement</h3>
          <p>L'historique des actions apparaîtra ici au fur et à mesure.</p>
        </div>
      ) : (
        filtrees.map((e) => (
          <div key={e.id} style={{ display: 'flex', gap: 12, padding: '11px 4px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginTop: 5, flexShrink: 0 }}></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, color: 'var(--text)' }}>{e.description}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                {new Date(e.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}