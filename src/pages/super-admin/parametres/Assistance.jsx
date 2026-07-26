import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

export default function Assistance() {
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { charger() }, [])

  const charger = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('demandes_acces')
      .select('*, etablissements(nom), profiles!demandes_acces_gerant_id_fkey(nom_complet)')
      .order('created_at', { ascending: false })
      .limit(50)
    setDemandes(data || [])
    setLoading(false)
  }

  if (loading) return <div className="panel"><div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div></div>

  return (
    <div className="panel">
      <div className="panel-head"><h2>Demandes d'assistance (historique)</h2></div>
      {demandes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon.Headset /></div>
          <h3>Aucune demande</h3>
          <p>Les demandes d'accès des gérants apparaîtront ici.</p>
        </div>
      ) : (
        <table>
          <thead><tr><th>Gérant</th><th>Établissement</th><th>Motif</th><th>Statut</th><th>Date</th></tr></thead>
          <tbody>
            {demandes.map((d) => (
              <tr key={d.id}>
                <td className="name-cell">{d.profiles?.nom_complet}</td>
                <td style={{ fontSize: 12.5 }}>{d.etablissements?.nom}</td>
                <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{d.motif}</td>
                <td>
                  <span className="badge" style={{
                    color: d.statut === 'en_attente' ? 'var(--warning)' : 'var(--success)',
                    background: d.statut === 'en_attente' ? 'rgba(217,119,6,.08)' : 'rgba(22,163,74,.08)'
                  }}>{d.statut === 'en_attente' ? 'En attente' : 'Traitée'}</span>
                </td>
                <td style={{ fontSize: 11.5, color: 'var(--muted)' }}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}