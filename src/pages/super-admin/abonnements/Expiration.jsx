import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

export default function Expiration() {
  const { etablissements, setEtablissements } = useOutletContext()
  const [renouvellement, setRenouvellement] = useState(null)
  const [jours, setJours] = useState(30)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  const maintenant = new Date()
  const avecEcheance = (etablissements || [])
    .filter(Boolean)
    .filter((e) => e.date_fin_abonnement)
    .map((e) => ({ ...e, joursRestants: Math.ceil((new Date(e.date_fin_abonnement) - maintenant) / 86400000) }))
    .sort((a, b) => a.joursRestants - b.joursRestants)

  const expires = avecEcheance.filter((e) => e.joursRestants < 0)
  const bientot = avecEcheance.filter((e) => e.joursRestants >= 0 && e.joursRestants <= 7)

  const renouveler = async () => {
    // Garde-fou : ignore tout appel si la cible n'existe plus (double-clic, état déjà réinitialisé)
    if (!renouvellement) return

    setLoading(true)
    setErreur('')

    const cibleId = renouvellement.id
    const nouvelleDate = new Date()
    nouvelleDate.setDate(nouvelleDate.getDate() + Number(jours))
    const iso = nouvelleDate.toISOString().slice(0, 10)

    try {
      const { error } = await supabase
        .from('etablissements')
        .update({ date_fin_abonnement: iso, statut: 'Actif' })
        .eq('id', cibleId)

      if (error) {
        setErreur("Erreur lors du renouvellement : " + error.message)
        return
      }

      setEtablissements((list) =>
        (list || []).filter(Boolean).map((e) => (e.id === cibleId ? { ...e, date_fin_abonnement: iso, statut: 'Actif' } : e))
      )
      setRenouvellement(null)
    } catch (e) {
      setErreur("Connexion interrompue. Réessayez dans un instant.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {expires.length > 0 && (
        <div className="panel" style={{ borderColor: 'var(--danger)' }}>
          <div className="panel-head"><h2>Abonnements expirés ({expires.length})</h2></div>
          {expires.map((e) => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="name-cell">{e.nom}</div>
                <div style={{ fontSize: 11.5, color: 'var(--danger)' }}>Expiré depuis {Math.abs(e.joursRestants)} jour(s)</div>
              </div>
              <button className="btn-primary" onClick={() => { setRenouvellement(e); setJours(30) }}>Renouveler</button>
            </div>
          ))}
        </div>
      )}

      <div className="panel">
        <div className="panel-head"><h2>Expirent bientôt (7 jours)</h2></div>
        {bientot.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)', fontSize: 12.5 }}>Aucune échéance proche.</div>
        ) : (
          bientot.map((e) => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="name-cell">{e.nom}</div>
                <div style={{ fontSize: 11.5, color: 'var(--warning)' }}>Expire dans {e.joursRestants} jour(s)</div>
              </div>
              <button className="btn-ghost" onClick={() => { setRenouvellement(e); setJours(30) }}>Renouveler</button>
            </div>
          ))
        )}
      </div>

      {renouvellement && (
        <div className="overlay" onClick={() => !loading && setRenouvellement(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Renouveler « {renouvellement.nom} »</h3>
              <button className="modal-close" onClick={() => setRenouvellement(null)}><Icon.X /></button>
            </div>
            <div className="m-field">
              <label>Prolonger de combien de jours ?</label>
              <input type="number" min="1" value={jours} onChange={(e) => setJours(e.target.value)} />
            </div>

            {erreur && <div className="alert-error">{erreur}</div>}

            <div className="modal-actions">
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setRenouvellement(null)} disabled={loading}>Annuler</button>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading || !renouvellement} onClick={renouveler}>
                {loading ? 'Traitement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}