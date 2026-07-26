import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Icon } from '../../../components/Icons.jsx'

function debutSemaine(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  d.setHours(0, 0, 0, 0)
  return d
}

export default function Hebdomadaire() {
  const { etablissement, chargementTermine } = useOutletContext()
  const [offset, setOffset] = useState(0) // 0 = semaine en cours, -1 = précédente...
  const [ventes, setVentes] = useState([])
  const [loading, setLoading] = useState(true)

  const lundi = debutSemaine(new Date())
  lundi.setDate(lundi.getDate() + offset * 7)
  const dimanche = new Date(lundi); dimanche.setDate(lundi.getDate() + 6); dimanche.setHours(23, 59, 59, 999)

  useEffect(() => {
    if (chargementTermine && etablissement) charger()
  }, [chargementTermine, etablissement, offset])

  const charger = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ventes')
      .select('montant_total, benefice_total, created_at')
      .eq('etablissement_id', etablissement.id)
      .gte('created_at', lundi.toISOString())
      .lte('created_at', dimanche.toISOString())
      .order('created_at')
    setVentes(data || [])
    setLoading(false)
  }

  const f = (n) => parseInt(n).toLocaleString('fr-FR') + ' F'
  const totalCA = ventes.reduce((s, v) => s + v.montant_total, 0)
  const totalBenefice = ventes.reduce((s, v) => s + v.benefice_total, 0)

  const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const parJour = jours.map((label, i) => {
    const jourDate = new Date(lundi); jourDate.setDate(lundi.getDate() + i)
    const cle = jourDate.toDateString()
    const ventesJour = ventes.filter((v) => new Date(v.created_at).toDateString() === cle)
    return {
      jour: label,
      ca: ventesJour.reduce((s, v) => s + v.montant_total, 0),
      benefice: ventesJour.reduce((s, v) => s + v.benefice_total, 0),
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
          <h2>Semaine du {lundi.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} au {dimanche.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-ghost" onClick={() => setOffset((o) => o - 1)}>← Précédente</button>
            <button className="btn-ghost" onClick={() => setOffset(0)} disabled={offset === 0}>Cette semaine</button>
            <button className="btn-ghost" onClick={() => setOffset((o) => Math.min(o + 1, 0))} disabled={offset === 0}>Suivante →</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div>
        ) : totalCA === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon.Card /></div>
            <h3>Aucune vente cette semaine</h3>
            <p>Changez de semaine pour consulter d'autres données.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={parJour} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="jour" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
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