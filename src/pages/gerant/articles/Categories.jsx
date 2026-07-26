import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

export default function Categories() {
  const { etablissement, chargementTermine } = useOutletContext()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (chargementTermine && etablissement) charger()
  }, [chargementTermine, etablissement])

  const charger = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('articles')
      .select('categorie, quantite, prix_vente')
      .eq('etablissement_id', etablissement.id)
    setArticles(data || [])
    setLoading(false)
  }

  const f = (n) => parseInt(n).toLocaleString('fr-FR') + ' F'

  const parCategorie = {}
  articles.forEach((a) => {
    const cat = a.categorie?.trim() || 'Sans catégorie'
    if (!parCategorie[cat]) parCategorie[cat] = { nom: cat, nbArticles: 0, stockTotal: 0, valeurStock: 0 }
    parCategorie[cat].nbArticles++
    parCategorie[cat].stockTotal += a.quantite
    parCategorie[cat].valeurStock += a.quantite * a.prix_vente
  })
  const categories = Object.values(parCategorie).sort((a, b) => b.nbArticles - a.nbArticles)

  if (loading) {
    return <div className="panel"><div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div></div>
  }

  return (
    <div className="panel">
      <div className="panel-head"><h2>Catégories ({categories.length})</h2></div>

      {categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon.Database /></div>
          <h3>Aucune catégorie</h3>
          <p>Les catégories apparaissent automatiquement quand vous en renseignez une sur vos articles.</p>
        </div>
      ) : (
        <table>
          <thead><tr><th>Catégorie</th><th>Articles</th><th>Stock total</th><th>Valeur du stock</th></tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.nom}>
                <td className="name-cell">{c.nom}</td>
                <td>{c.nbArticles}</td>
                <td>{c.stockTotal}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{f(c.valeurStock)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="hint" style={{ marginTop: 14 }}>
        Astuce : pour créer une nouvelle catégorie, saisissez simplement son nom dans le champ "Catégorie" en ajoutant ou modifiant un article.
      </div>
    </div>
  )
}