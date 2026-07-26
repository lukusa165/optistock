import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

export default function Inventaire() {
  const { etablissement, chargementTermine } = useOutletContext()
  const [articles, setArticles] = useState([])
  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState('tous') // tous | bas | epuise
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (chargementTermine && etablissement) charger()
  }, [chargementTermine, etablissement])

  const charger = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('articles')
      .select('id, nom, quantite, seuil_alerte, prix_achat, prix_vente, emplacement')
      .eq('etablissement_id', etablissement.id)
      .order('nom', { ascending: true })
    setArticles(data || [])
    setLoading(false)
  }

  const f = (n) => parseInt(n).toLocaleString('fr-FR') + ' F'

  const filtres = articles
    .filter((a) => a.nom.toLowerCase().includes(recherche.toLowerCase()))
    .filter((a) => {
      if (filtre === 'bas') return a.quantite > 0 && a.quantite <= a.seuil_alerte
      if (filtre === 'epuise') return a.quantite === 0
      return true
    })

  const valeurTotaleStock = articles.reduce((s, a) => s + a.quantite * a.prix_achat, 0)
  const nbStockBas = articles.filter((a) => a.quantite > 0 && a.quantite <= a.seuil_alerte).length
  const nbEpuises = articles.filter((a) => a.quantite === 0).length

  if (loading) return <div className="panel"><div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div></div>

  return (
    <>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-label">Valeur du stock</div><div className="stat-icon"><Icon.Database /></div></div>
          <div className="stat-value">{f(valeurTotaleStock)}</div>
          <div className="stat-delta">Au prix d'achat</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-label">Stock faible</div><div className="stat-icon"><Icon.Bell /></div></div>
          <div className="stat-value" style={{ color: nbStockBas > 0 ? 'var(--warning)' : 'var(--text)' }}>{nbStockBas}</div>
          <div className="stat-delta">Article(s) sous le seuil</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-label">Épuisés</div><div className="stat-icon"><Icon.ToggleLeft /></div></div>
          <div className="stat-value" style={{ color: nbEpuises > 0 ? 'var(--danger)' : 'var(--text)' }}>{nbEpuises}</div>
          <div className="stat-delta">Rupture de stock</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Inventaire ({filtres.length})</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text" placeholder="Rechercher..." value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '7px 12px', fontSize: 12.5, background: 'var(--panel-2)', outline: 'none', width: 180 }}
            />
            <select
              value={filtre} onChange={(e) => setFiltre(e.target.value)}
              style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, background: 'var(--panel-2)', outline: 'none' }}
            >
              <option value="tous">Tous les articles</option>
              <option value="bas">Stock faible</option>
              <option value="epuise">Épuisés</option>
            </select>
          </div>
        </div>

        {filtres.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon.Database /></div>
            <h3>Aucun résultat</h3>
            <p>Modifiez votre recherche ou votre filtre.</p>
          </div>
        ) : (
          <table>
            <thead><tr><th>Article</th><th>Emplacement</th><th>Stock</th><th>Prix achat</th><th>Prix vente</th><th>Valeur</th></tr></thead>
            <tbody>
              {filtres.map((a) => (
                <tr key={a.id}>
                  <td className="name-cell">{a.nom}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{a.emplacement || '—'}</td>
                  <td>
                    <span className="badge" style={{
                      color: a.quantite === 0 ? 'var(--danger)' : a.quantite <= a.seuil_alerte ? 'var(--warning)' : 'var(--success)',
                      background: a.quantite === 0 ? 'rgba(220,38,38,.08)' : a.quantite <= a.seuil_alerte ? 'rgba(217,119,6,.08)' : 'rgba(22,163,74,.08)'
                    }}>
                      {a.quantite}
                    </span>
                  </td>
                  <td style={{ fontSize: 12.5 }}>{f(a.prix_achat)}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{f(a.prix_vente)}</td>
                  <td style={{ fontSize: 12.5 }}>{f(a.quantite * a.prix_achat)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}