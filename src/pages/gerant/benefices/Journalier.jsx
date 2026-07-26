import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Icon } from '../../../components/Icons.jsx'
export default function Journalier() {
  const { etablissement } = useOutletContext()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [ventes, setVentes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (etablissement) charger()
  }, [etablissement, date])

  const charger = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ventes')
      .select('montant_total, benefice_total, created_at, profiles(nom_complet)')
      .eq('etablissement_id', etablissement.id)
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`)
      .order('created_at')
    setVentes(data || [])
    setLoading(false)
  }

  const totalCA = ventes.reduce((s, v) => s + v.montant_total, 0)
  const totalBenefice = ventes.reduce((s, v) => s + v.benefice_total, 0)
  const f = (n) => parseInt(n).toLocaleString('fr-FR') + ' F'

  // Données pour graphique par heure
  const parHeure = {}
  ventes.forEach(v => {
    const h = new Date(v.created_at).getHours()
    const label = `${String(h).padStart(2, '0')}h`
    if (!parHeure[label]) parHeure[label] = { heure: label, ca: 0, benefice: 0, ventes: 0 }
    parHeure[label].ca += v.montant_total
    parHeure[label].benefice += v.benefice_total
    parHeure[label].ventes++
  })
  const chartData = Object.values(parHeure).sort((a, b) => a.heure.localeCompare(b.heure))

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Chiffre d\'affaires', value: f(totalCA), color: 'var(--accent)' },
          { label: 'Bénéfice net', value: f(totalBenefice), color: '#16A34A' },
          { label: 'Nombre de ventes', value: ventes.length, color: 'var(--text)' },
        ].map((s) => (
          <div key={s.label} className="panel" style={{ marginBottom: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Bénéfices journaliers</h2>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'var(--text)', background: 'var(--panel-2)', outline: 'none', fontFamily: 'Inter, sans-serif' }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div>
        ) : chartData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon.Card /></div>
            <h3>Aucune vente ce jour</h3>
            <p>Modifiez la date pour voir d'autres données.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="heure" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`${parseInt(v).toLocaleString('fr-FR')} F`]} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="ca" name="CA" fill="#1A7A50" radius={[4, 4, 0, 0]} />
              <Bar dataKey="benefice" name="Bénéfice" fill="#22A06B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tableau des ventes du jour */}
      {ventes.length > 0 && (
        <div className="panel">
          <div className="panel-head"><h2>Détail des ventes</h2></div>
          <table>
            <thead><tr><th>Heure</th><th>Vendeur</th><th>CA</th><th>Bénéfice</th></tr></thead>
            <tbody>
              {ventes.map((v, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                    {new Date(v.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ fontSize: 12.5 }}>{v.profiles?.nom_complet || '-'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{f(v.montant_total)}</td>
                  <td style={{ color: '#16A34A' }}>{f(v.benefice_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}