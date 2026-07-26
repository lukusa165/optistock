import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

export default function Activation() {
  const [etablissements, setEtablissements] = useState([])
  const [recherche, setRecherche] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [chargement, setChargement] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { charger() }, [])

  const charger = async () => {
    setChargement(true)
    const { data, error } = await supabase
      .from('etablissements')
      .select('id, nom, type, statut, plan, date_fin_abonnement')
      .order('nom')
    if (!error) setEtablissements(data || [])
    setChargement(false)
  }

  const filtres = (etablissements || []).filter((e) =>
    e.nom?.toLowerCase().includes(recherche.toLowerCase())
  )

  const basculer = async () => {
    if (!confirmation) return
    setLoading(true)
    setError('')

    const nouveauStatut = confirmation.statut === 'Actif' ? 'Désactivé' : 'Actif'

    const { error: updateError } = await supabase
      .from('etablissements')
      .update({ statut: nouveauStatut })
      .eq('id', confirmation.id)

    if (updateError) {
      setError(`Erreur : ${updateError.message}`)
      setLoading(false)
      return
    }

    setEtablissements((list) =>
      list.map((e) => (e.id === confirmation.id ? { ...e, statut: nouveauStatut } : e))
    )

    setSuccess(
      nouveauStatut === 'Désactivé'
        ? `"${confirmation.nom}" désactivé.`
        : `"${confirmation.nom}" réactivé.`
    )
    setConfirmation(null)
    setLoading(false)
    setTimeout(() => setSuccess(''), 4000)
  }

  return (
    <>
      {success && <div className="alert-success">✓ {success}</div>}

      <div className="panel">
        <div className="panel-head">
          <h2>Activation / Désactivation</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Rechercher..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '7px 12px', fontSize: 12.5, background: 'var(--panel-2)', outline: 'none', width: 200, fontFamily: 'Inter, sans-serif', color: 'var(--text)' }}
            />
            <button className="btn-primary" onClick={charger}>
              <Icon.Search />Actualiser
            </button>
          </div>
        </div>

        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '9px 12px', marginBottom: 14, fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
          ⚠️ Désactiver un établissement bloque immédiatement le gérant et <strong>tous ses vendeurs</strong>, même si l'abonnement est encore valide.
        </div>

        {chargement ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)', fontSize: 13 }}>Chargement...</div>
        ) : filtres.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon.Power /></div>
            <h3>Aucun établissement</h3>
            <p>{recherche ? 'Aucun résultat pour cette recherche.' : "Aucun établissement enregistré pour l'instant."}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Établissement</th>
                <th>Type</th>
                <th>Plan</th>
                <th>Échéance</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map((etab) => {
                const expire = etab.date_fin_abonnement && new Date(etab.date_fin_abonnement) < new Date()
                return (
                  <tr key={etab.id}>
                    <td className="name-cell">{etab.nom}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{etab.type}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{etab.plan}</td>
                    <td style={{ fontSize: 12, color: expire ? 'var(--danger)' : 'var(--muted)' }}>
                      {etab.date_fin_abonnement
                        ? `${expire ? '⚠️ Expiré le ' : ""}${new Date(etab.date_fin_abonnement).toLocaleDateString('fr-FR')}`
                        : '—'}
                    </td>
                    <td>
                      <span className="badge" style={{
                        color: etab.statut === 'Actif' ? '#16A34A' : '#DC2626',
                        background: etab.statut === 'Actif' ? '#F0FDF4' : '#FEF2F2'
                      }}>
                        {etab.statut}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          onClick={() => { setConfirmation(etab); setError('') }}
                          title={etab.statut === 'Actif' ? 'Désactiver' : 'Activer'}
                          style={{
                            color: etab.statut === 'Actif' ? 'var(--danger)' : 'var(--success)',
                            borderColor: etab.statut === 'Actif' ? 'var(--danger)' : 'var(--success)',
                          }}
                        >
                          <Icon.Power />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {confirmation && (
        <div className="overlay" onClick={() => !loading && setConfirmation(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                {confirmation.statut === 'Actif' ? '🔴 Désactiver' : '🟢 Activer'} « {confirmation.nom} » ?
              </h3>
              <button className="modal-close" onClick={() => !loading && setConfirmation(null)}>
                <Icon.X />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 14 }}>
              {confirmation.statut === 'Actif'
                ? <>Le gérant et <strong>tous ses vendeurs</strong> seront immédiatement bloqués, même avec un abonnement valide.</>
                : <>Le gérant et ses vendeurs pourront de nouveau se connecter normalement.</>
              }
            </p>

            {error && <div className="alert-error">{error}</div>}

            <div className="modal-actions">
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmation(null)} disabled={loading}>
                Annuler
              </button>
              <button
                onClick={basculer}
                disabled={loading}
                style={{
                  flex: 1, border: 'none', padding: '10px', borderRadius: 9,
                  fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  background: confirmation.statut === 'Actif' ? 'var(--danger)' : 'var(--accent)',
                  color: '#fff', opacity: loading ? 0.7 : 1, fontFamily: 'Inter, sans-serif',
                }}
              >
                {loading ? 'Traitement...' : confirmation.statut === 'Actif' ? 'Désactiver' : 'Activer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}