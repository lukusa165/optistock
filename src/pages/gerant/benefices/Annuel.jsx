import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Icon } from '../../../components/Icons.jsx'

const MOIS_COURTS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

export default function Annuel() {
  const { etablissement, chargementTermine } = useOutletContext()
  const [offset, setOffset] = useState(0)
  const [ventes, setVentes] = useState([])
  const [loading, setLoading] = useState(true)

  const annee = new Date().getFullYear() + offset
  const debutAnnee = new Date(annee, 0, 1)
  const finAnnee = new Date(annee, 11, 31, 23, 59, 59, 999)

  useEffect(() => {
    if (chargementTermine && etablissement) charger()
  }, [chargementTermine, etablissement, offset])

  const charger = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ventes')
      .select('montant_total, benefice_total, created_at')
      .eq('etablissement_id', etablissement.id)
      .gte('created_at', debutAnnee.toISOString())
      .lte('created_at', finAnnee.toISOString())
      .order('created_at')
    setVentes(data || [])
    setLoading(false)
  }

  const f = (n) => parseInt(n).toLocaleString('fr-FR') + ' F'
  const totalCA = ventes.reduce((s, v) => s + v.montant_total, 0)
  const totalBenefice = ventes.reduce((s, v) => s + v.benefice_total, 0)

  const chartData = MOIS_COURTS.map((label, i) => {
    const ventesMois = ventes.filter((v) => new Date(v.created_at).getMonth() === i)
    return {
      mois: label,
      ca: ventesMois.reduce((s, v) => s + v.montant_total, 0),
      benefice: ventesMois.reduce((s, v) => s + v.benefice_total, 0),
    }
  })

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { label: "Chiffre d'affaires", value: f(totalCA), color: 'var(--accent)' },
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
          <h2>Année {annee}</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-ghost" onClick={() => setOffset((o) => o - 1)}>← Précédente</button>
            <button className="btn-ghost" onClick={() => setOffset(0)} disabled={offset === 0}>Cette année</button>
            <button className="btn-ghost" onClick={() => setOffset((o) => Math.min(o + 1, 0))} disabled={offset === 0}>Suivante →</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div>
        ) : totalCA === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon.Card /></div>
            <h3>Aucune vente cette année</h3>
            <p>Changez d'année pour consulter d'autres données.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`${parseInt(v).toLocaleString('fr-FR')} F`]} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="ca" name="CA" fill="#1A7A50" radius={[4, 4, 0, 0]} />
              <Bar dataKey="benefice" name="Bénéfice" fill="#22A06B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  )
}