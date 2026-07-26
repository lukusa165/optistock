import { useOutletContext } from 'react-router-dom'
import { Icon } from '../../../components/Icons.jsx'

export default function Statuts() {
  const { etablissements } = useOutletContext()
  const actifs = etablissements.filter((e) => e.statut === 'Actif')
  const desactives = etablissements.filter((e) => e.statut !== 'Actif')

  return (
    <>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-label">Actifs</div><div className="stat-icon"><Icon.Power /></div></div>
          <div className="stat-value">{actifs.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-label">Désactivés</div><div className="stat-icon"><Icon.ToggleLeft /></div></div>
          <div className="stat-value" style={{ color: desactives.length > 0 ? 'var(--danger)' : 'var(--text)' }}>{desactives.length}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Établissements désactivés</h2></div>
        {desactives.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)', fontSize: 12.5 }}>✓ Tous les établissements sont actifs.</div>
        ) : (
          <table>
            <thead><tr><th>Établissement</th><th>Type</th><th>Plan</th></tr></thead>
            <tbody>
              {desactives.map((e) => (
                <tr key={e.id}>
                  <td className="name-cell">{e.nom}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{e.type}</td>
                  <td style={{ fontSize: 12.5 }}>{e.plan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="hint" style={{ marginTop: 12 }}>
          Pour réactiver un établissement, rendez-vous dans "Gestion d'établissement → Activation".
        </div>
      </div>
    </>
  )
}