import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Icon } from '../../../components/Icons.jsx'

export default function VentesStats() {
  const { etablissement, chargementTermine } = useOutletContext()
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (chargementTermine && etablissement) charger()
  }, [chargementTermine, etablissement])

  const charger = async () => {
    setLoading(true)
    const debut = new Date(); debut.setDate(debut.getDate() - 29); debut.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('ventes')
      .select('montant_total, created_at')
      .eq('etablissement_id', etablissement.id)
      .gte('created_at', debut.toISOString())
      .order('created_at')

    const parJour = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - (29 - i))
      const cle = d.toISOString().slice(0, 10)
      parJour[cle] = { date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), ca: 0 }
    }
    ;(data || []).forEach((v) => {
      const cle = v.created_at.slice(0, 10)
      if (parJour[cle]) parJour[cle].ca += v.montant_total
    })
    setChartData(Object.values(parJour))
    setLoading(false)
  }

  const f = (n) => parseInt(n).toLocaleString('fr-FR') + ' F'
  const total30j = chartData.reduce((s, d) => s + d.ca, 0)

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Évolution des ventes (30 derniers jours)</h2>
      </div>

      <div style={{ marginBottom: 16, fontSize: 12, color: 'var(--muted)' }}>
        Total sur la période : <strong style={{ color: 'var(--accent)' }}>{f(total30j)}</strong>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div>
      ) : total30j === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon.TrendingUp /></div>
          <h3>Aucune vente sur cette période</h3>
          <p>Le graphique apparaîtra dès les premières ventes.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted)' }} interval={4} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => [`${parseInt(v).toLocaleString('fr-FR')} F`, 'CA']} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
            <Line type="monotone" dataKey="ca" stroke="#1A7A50" strokeWidth={2.2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}