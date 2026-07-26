import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

export default function Dashboard() {
  const { etablissement, chargementTermine } = useOutletContext()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [alertes, setAlertes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (chargementTermine && etablissement) charger()
  }, [chargementTermine, etablissement])

  const charger = async () => {
    setLoading(true)
    const debutJour = new Date(); debutJour.setHours(0, 0, 0, 0)
    const finJour = new Date(); finJour.setHours(23, 59, 59, 999)

    const [{ data: ventesJour }, { count: nbArticles }, { data: alertesActives }, { data: topVendeurs }] = await Promise.all([
      supabase.from('ventes').select('montant_total, benefice_total, vendeur_id, profiles(nom_complet)')
        .eq('etablissement_id', etablissement.id)
        .gte('created_at', debutJour.toISOString())
        .lte('created_at', finJour.toISOString()),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('etablissement_id', etablissement.id),
      supabase.from('alertes').select('*').eq('etablissement_id', etablissement.id).eq('type', 'stock_bas').eq('lu', false).order('created_at', { ascending: false }).limit(5),
      supabase.from('ventes').select('montant_total, vendeur_id, profiles(nom_complet)')
        .eq('etablissement_id', etablissement.id)
        .gte('created_at', debutJour.toISOString()),
    ])

    const totalCA = (ventesJour || []).reduce((s, v) => s + v.montant_total, 0)
    const totalBenefice = (ventesJour || []).reduce((s, v) => s + v.benefice_total, 0)

    const parVendeur = {}
    ;(topVendeurs || []).forEach((v) => {
      const nom = v.profiles?.nom_complet || 'Inconnu'
      parVendeur[nom] = (parVendeur[nom] || 0) + v.montant_total
    })
    const classement = Object.entries(parVendeur).sort((a, b) => b[1] - a[1])

    setStats({
      totalCA, totalBenefice, nbVentes: (ventesJour || []).length,
      nbArticles: nbArticles || 0, meilleurVendeur: classement[0] || null,
    })
    setAlertes(alertesActives || [])
    setLoading(false)
  }

  const f = (n) => parseInt(n).toLocaleString('fr-FR') + ' F'

  if (loading) return <div className="panel"><div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div></div>

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header"><div className="stat-label">Ventes aujourd'hui</div><div className="stat-icon"><Icon.Card /></div></div>
          <div className="stat-value">{f(stats.totalCA)}</div>
          <div className="stat-delta">{stats.nbVentes} vente(s)</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-label">Bénéfice aujourd'hui</div><div className="stat-icon"><Icon.TrendingUp /></div></div>
          <div className="stat-value">{f(stats.totalBenefice)}</div>
          <div className="stat-delta">Net</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-label">Articles</div><div className="stat-icon"><Icon.Database /></div></div>
          <div className="stat-value">{stats.nbArticles}</div>
          <div className="stat-delta">En catalogue</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-label">Meilleur vendeur</div><div className="stat-icon"><Icon.Users /></div></div>
          <div className="stat-value" style={{ fontSize: 16 }}>{stats.meilleurVendeur?.[0] || '—'}</div>
          <div className="stat-delta">{stats.meilleurVendeur ? f(stats.meilleurVendeur[1]) : "Aujourd'hui"}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Alertes de stock</h2>
          {alertes.length > 0 && <button className="btn-ghost" onClick={() => navigate('/gerant/alertes')}>Voir tout</button>}
        </div>
        {alertes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)', fontSize: 12.5 }}>
            ✓ Aucun article en rupture de stock.
          </div>
        ) : (
          alertes.map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(217,119,6,.1)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon.Bell style={{ width: 14, height: 14 }} />
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{a.message}</div>
            </div>
          ))
        )}
      </div>
    </>
  )
}