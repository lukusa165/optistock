import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient.js'

export default function Comptes() {
  const [gerants, setGerants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { charger() }, [])

  const charger = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, nom_complet, telephone, actif, etablissements(nom, statut)')
      .eq('role', 'gerant')
      .order('nom_complet')
    setGerants(data || [])
    setLoading(false)
  }

  if (loading) return <div className="panel"><div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div></div>

  return (
    <div className="panel">
      <div className="panel-head"><h2>Comptes gérants ({gerants.length})</h2></div>
      <table>
        <thead><tr><th>Gérant</th><th>Numéro</th><th>Établissement</th><th>Statut établissement</th></tr></thead>
        <tbody>
          {gerants.map((g) => (
            <tr key={g.id}>
              <td className="name-cell">{g.nom_complet}</td>
              <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5 }}>{g.telephone}</td>
              <td style={{ fontSize: 12.5 }}>{g.etablissements?.nom || '—'}</td>
              <td>
                <span className="badge" style={{
                  color: g.etablissements?.statut === 'Actif' ? 'var(--success)' : 'var(--danger)',
                  background: g.etablissements?.statut === 'Actif' ? 'rgba(22,163,74,.08)' : 'rgba(220,38,38,.08)'
                }}>{g.etablissements?.statut || '—'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}