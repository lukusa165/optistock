import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

export default function Suppression() {
  const { etablissements, setEtablissements } = useOutletContext()
  const [recherche, setRecherche] = useState('')
  const [suppression, setSuppression] = useState(null)
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filtres = (etablissements || []).filter(Boolean).filter((e) =>
    e.nom.toLowerCase().includes(recherche.toLowerCase())
  )

  const ouvrirSuppression = (etab) => {
    setSuppression(etab)
    setConfirmation('')
    setError('')
  }

  const confirmer = async () => {
    // Garde-fou : ignore tout appel si la cible a déjà été effacée
    // (ex : double-clic avant que le bouton soit désactivé)
    if (!suppression) return

    if (confirmation.trim() !== suppression.nom) {
      setError('Le nom saisi ne correspond pas exactement.')
      return
    }
    setLoading(true)
    setError('')

    const cibleId = suppression.id
    const cibleNom = suppression.nom

    const { error: deleteError } = await supabase
      .from('etablissements')
      .delete()
      .eq('id', cibleId)

    if (deleteError) {
      setError(`Erreur : ${deleteError.message}`)
      setLoading(false)
      return
    }

    setEtablissements((list) => (list || []).filter(Boolean).filter((e) => e.id !== cibleId))
    setSuppression(null)
    setLoading(false)
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Supprimer un établissement</h2>
        <input
          type="text"
          placeholder="Rechercher..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '7px 12px', fontSize: 12.5, background: 'var(--panel-2)', outline: 'none', width: 220 }}
        />
      </div>

      <div className="alert-error" style={{ marginBottom: 16 }}>
        ⚠️ La suppression est <strong>définitive</strong> et efface aussi tous les articles, ventes, vendeurs et l'historique liés à cet établissement.
      </div>

      {filtres.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon.FileMinus /></div>
          <h3>Aucun établissement</h3>
          <p>{recherche ? 'Aucun résultat pour cette recherche.' : "Aucun établissement enregistré pour l'instant."}</p>
        </div>
      ) : (
        <table>
          <thead><tr><th>Établissement</th><th>Type</th><th>Plan</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {filtres.map((etab) => (
              <tr key={etab.id}>
                <td className="name-cell">{etab.nom}</td>
                <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{etab.type}</td>
                <td style={{ fontSize: 12.5 }}>{etab.plan}</td>
                <td>
                  <span className="badge" style={{
                    color: etab.statut === 'Actif' ? 'var(--success)' : 'var(--danger)',
                    background: etab.statut === 'Actif' ? 'rgba(22,163,74,.08)' : 'rgba(220,38,38,.08)'
                  }}>{etab.statut}</span>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="danger" onClick={() => ouvrirSuppression(etab)} title="Supprimer">
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
        <div className="overlay" onClick={() => !loading && setSuppression(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Supprimer « {suppression.nom} » ?</h3>
              <button className="modal-close" onClick={() => setSuppression(null)}><Icon.X /></button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 14 }}>
              Cette action supprimera <strong>définitivement</strong> l'établissement, son gérant, ses vendeurs,
              tous ses articles, ventes et son historique. <strong>Impossible à annuler.</strong>
            </p>

            <div className="m-field">
              <label>Pour confirmer, tapez exactement : <strong>{suppression.nom}</strong></label>
              <input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={suppression.nom}
                autoFocus
              />
            </div>

            {error && <div className="alert-error">{error}</div>}

            <div className="modal-actions">
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setSuppression(null)} disabled={loading}>Annuler</button>
              <button
                className="btn-danger" style={{ flex: 1 }}
                onClick={confirmer}
                disabled={loading || !suppression || confirmation.trim() !== suppression.nom}
              >
                {loading ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}