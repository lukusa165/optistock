import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient.js'

export default function MesVentes() {
  const { vendeur, chargementTermine } = useOutletContext()
  const [ventes, setVentes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (chargementTermine && vendeur) charger()
  }, [chargementTermine, vendeur])

  const charger = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ventes')
      .select('id, montant_total, created_at, lignes_vente(nom_article, quantite, sous_total)')
      .eq('vendeur_id', vendeur.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setVentes(data || [])
    setLoading(false)
  }

  const f = (n) => parseInt(n).toLocaleString('fr-FR') + ' F'

  if (loading) return <div className="panel"><div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div></div>

  const totalJour = ventes
    .filter((v) => new Date(v.created_at).toDateString() === new Date().toDateString())
    .reduce((s, v) => s + v.montant_total, 0)

  return (
    <>
      <div className="panel">
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Total encaissé aujourd'hui</div>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 700, color: 'var(--accent)' }}>{f(totalJour)}</div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Mes dernières ventes</h2></div>
        {ventes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)', fontSize: 12.5 }}>Aucune vente enregistrée.</div>
        ) : (
          ventes.map((v) => (
            <div key={v.id} style={{ padding: '12px 4px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {new Date(v.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{f(v.montant_total)}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                {v.lignes_vente.map((l) => `${l.nom_article} ×${l.quantite}`).join(', ')}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}