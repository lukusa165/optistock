import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

export default function ListeArticles() {
  const { etablissement, chargementTermine } = useOutletContext()
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [suppression, setSuppression] = useState(null)

  useEffect(() => {
    if (chargementTermine && etablissement) charger()
  }, [chargementTermine, etablissement])

  const charger = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('etablissement_id', etablissement.id)
      .order('nom', { ascending: true })
    if (!error) setArticles(data || [])
    setLoading(false)
  }

  const supprimer = async (id) => {
    const { error } = await supabase.from('articles').delete().eq('id', id)
    if (!error) setArticles((list) => list.filter((a) => a.id !== id))
    setSuppression(null)
  }

  const f = (n) => parseInt(n).toLocaleString('fr-FR') + ' F'

  const articlesFiltres = articles.filter((a) =>
    a.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    a.reference?.toLowerCase().includes(recherche.toLowerCase())
  )

  if (loading) {
    return <div className="panel"><div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div></div>
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Liste des articles ({articles.length})</h2>
        <input
          type="text"
          placeholder="Rechercher un article..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '7px 12px', fontSize: 12.5, color: 'var(--text)', background: 'var(--panel-2)', outline: 'none', fontFamily: 'Inter, sans-serif', width: 220 }}
        />
      </div>

      {articlesFiltres.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon.FilePlus /></div>
          <h3>Aucun article</h3>
          <p>Commencez par ajouter votre premier article depuis l'onglet "Ajouter un article".</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr><th>Article</th><th>Emplacement</th><th>Prix vente</th><th>Stock</th><th></th></tr>
          </thead>
          <tbody>
            {articlesFiltres.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className="name-cell">{a.nom}</div>
                  {a.reference && <div className="sub-cell">Réf. {a.reference}</div>}
                </td>
                <td style={{ fontSize: 12.5, color: 'var(--muted)' }}>{a.emplacement || '—'}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{f(a.prix_vente)}</td>
                <td>
                  <span className="badge" style={{
                    color: a.quantite <= a.seuil_alerte ? 'var(--danger)' : 'var(--success)',
                    background: a.quantite <= a.seuil_alerte ? 'rgba(220,38,38,.08)' : 'rgba(22,163,74,.08)'
                  }}>
                    {a.quantite} en stock
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button onClick={() => navigate('/gerant/articles/modifier', { state: { article: a } })} title="Modifier">
                      <Icon.Edit />
                    </button>
                    <button className="danger" onClick={() => setSuppression(a)} title="Supprimer">
                      <Icon.Trash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {suppression && (
        <div className="overlay" onClick={() => setSuppression(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Supprimer l'article ?</h3>
              <button className="modal-close" onClick={() => setSuppression(null)}><Icon.X /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
              Voulez-vous vraiment supprimer <strong>{suppression.nom}</strong> ? Cette action est irréversible.
            </p>
            <div className="modal-actions">
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setSuppression(null)}>Annuler</button>
              <button className="btn-danger" style={{ flex: 1 }} onClick={() => supprimer(suppression.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}