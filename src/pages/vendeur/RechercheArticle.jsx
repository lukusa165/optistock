import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient.js'
import { Icon } from '../../components/Icons.jsx'

export default function RechercheArticle() {
  const { etablissement, chargementTermine } = useOutletContext()
  const [articles, setArticles] = useState([])
  const [recherche, setRecherche] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (chargementTermine && etablissement) charger()
  }, [chargementTermine, etablissement])

  const charger = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('articles')
      .select('id, nom, prix_vente, quantite, emplacement')
      .eq('etablissement_id', etablissement.id)
      .order('nom', { ascending: true })
    setArticles(data || [])
    setLoading(false)
  }

  const f = (n) => parseInt(n).toLocaleString('fr-FR') + ' F'
  const filtres = articles.filter((a) => a.nom.toLowerCase().includes(recherche.toLowerCase()))

  if (loading) return <div className="panel"><div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div></div>

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Articles disponibles ({articles.length})</h2>
        <input
          type="text" placeholder="Rechercher..." value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '7px 12px', fontSize: 12.5, background: 'var(--panel-2)', outline: 'none', width: 200 }}
        />
      </div>

      <table>
        <thead><tr><th>Article</th><th>Emplacement</th><th>Prix</th><th>Stock</th></tr></thead>
        <tbody>
          {filtres.map((a) => (
            <tr key={a.id}>
              <td className="name-cell">{a.nom}</td>
              <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{a.emplacement || '—'}</td>
              <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{f(a.prix_vente)}</td>
              <td>
                <span className="badge" style={{
                  color: a.quantite === 0 ? 'var(--danger)' : 'var(--success)',
                  background: a.quantite === 0 ? 'rgba(220,38,38,.08)' : 'rgba(22,163,74,.08)'
                }}>
                  {a.quantite === 0 ? 'Épuisé' : `${a.quantite} en stock`}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}