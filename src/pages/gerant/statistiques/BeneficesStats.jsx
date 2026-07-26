import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Icon } from '../../../components/Icons.jsx'

export default function BeneficesStats() {
  const { etablissement, chargementTermine } = useOutletContext()
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (chargementTermine && etablissement) charger()
  }, [chargementTermine, etablissement])

  const charger = async () => {
    setLoading(true)
    const debut = new Date(); debut.setDate(debut.getDate() - 11); debut.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('ventes')
      .select('benefice_total, created_at')
      .eq('etablissement_id', etablissement.id)
      .gte('created_at', debut.toISOString())
      .order('created_at')

    const parSemaine = {}
    ;(data || []).forEach((v) => {
      const d = new Date(v.created_at)
      const lundi = new Date(d); lundi.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      const cle = lundi.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      if (!parSemaine[cle]) parSemaine[cle] = { semaine: cle, benefice: 0 }
      parSemaine[cle].benefice += v.benefice_total
    })
    setChartData(Object.values(parSemaine))
    setLoading(false)
  }

  const f = (n) => parseInt(n).toLocaleString('fr-FR') + ' F'
  const total = chartData.reduce((s, d) => s + d.benefice, 0)

  return (
    <div className="panel">
      <div className="panel-head"><h2>Bénéfices par semaine (12 dernières semaines)</h2></div>
      <div style={{ marginBottom: 16, fontSize: 12, color: 'var(--muted)' }}>
        Bénéfice total : <strong style={{ color: '#16A34A' }}>{f(total)}</strong>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div>
      ) : total === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon.TrendingUp /></div>
          <h3>Aucun bénéfice enregistré</h3>
          <p>Les données apparaîtront après les premières ventes.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="semaine" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => [`${parseInt(v).toLocaleString('fr-FR')} F`, 'Bénéfice']} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
            <Bar dataKey="benefice" fill="#22A06B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}