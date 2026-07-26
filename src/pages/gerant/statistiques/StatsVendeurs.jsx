import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

const PERIODES = [
  { id: 'jour', label: "Aujourd'hui" },
  { id: 'semaine', label: 'Cette semaine' },
  { id: 'mois', label: 'Ce mois' },
]

function bornesPeriode(periode) {
  const debut = new Date()
  if (periode === 'jour') debut.setHours(0, 0, 0, 0)
  if (periode === 'semaine') { debut.setDate(debut.getDate() - debut.getDay() + 1); debut.setHours(0, 0, 0, 0) }
  if (periode === 'mois') { debut.setDate(1); debut.setHours(0, 0, 0, 0) }
  return debut.toISOString()
}

export default function StatsVendeurs() {
  const { etablissement, chargementTermine } = useOutletContext()
  const [periode, setPeriode] = useState('semaine')
  const [donnees, setDonnees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (chargementTermine && etablissement) charger()
  }, [chargementTermine, etablissement, periode])

  const charger = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ventes')
      .select('montant_total, benefice_total, vendeur_id, profiles(nom_complet)')
      .eq('etablissement_id', etablissement.id)
      .gte('created_at', bornesPeriode(periode))

    const parVendeur = {}
    ;(data || []).forEach((v) => {
      const id = v.vendeur_id
      const nom = v.profiles?.nom_complet || 'Vendeur supprimé'
      if (!parVendeur[id]) parVendeur[id] = { nom, ca: 0, benefice: 0, nbVentes: 0 }
      parVendeur[id].ca += v.montant_total
      parVendeur[id].benefice += v.benefice_total
      parVendeur[id].nbVentes++
    })
    setDonnees(Object.values(parVendeur).sort((a, b) => b.ca - a.ca))
    setLoading(false)
  }

  const f = (n) => parseInt(n).toLocaleString('fr-FR') + ' F'
  const totalCA = donnees.reduce((s, d) => s + d.ca, 0)

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Performance des vendeurs</h2>
        <div className="sub-tabs" style={{ marginBottom: 0 }}>
          {PERIODES.map((p) => (
            <button
              key={p.id}
              className={`sub-tab ${periode === p.id ? 'active' : ''}`}
              style={{ border: 'none', cursor: 'pointer' }}
              onClick={() => setPeriode(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div>
      ) : donnees.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon.Users /></div>
          <h3>Aucune vente sur cette période</h3>
          <p>Les statistiques apparaîtront dès que vos vendeurs auront enregistré des ventes.</p>
        </div>
      ) : (
        <table>
          <thead><tr><th>Vendeur</th><th>Ventes</th><th>Chiffre d'affaires</th><th>Bénéfice</th><th>Part</th></tr></thead>
          <tbody>
            {donnees.map((d) => (
              <tr key={d.nom}>
                <td className="name-cell">{d.nom}</td>
                <td>{d.nbVentes}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{f(d.ca)}</td>
                <td style={{ color: '#16A34A' }}>{f(d.benefice)}</td>
                <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {totalCA > 0 ? Math.round((d.ca / totalCA) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}