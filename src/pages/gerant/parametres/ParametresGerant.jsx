import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

export default function ParametresGerant() {
  const { gerant, etablissement } = useOutletContext()
  const [nouveauMdp, setNouveauMdp] = useState('')
  const [confirmMdp, setConfirmMdp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [succes, setSucces] = useState('')

  const changerMotDePasse = async (e) => {
    e.preventDefault()
    setError('')
    setSucces('')

    if (nouveauMdp.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return }
    if (nouveauMdp !== confirmMdp) { setError('Les deux mots de passe ne correspondent pas.'); return }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: nouveauMdp })
    if (updateError) {
      setError(`Erreur : ${updateError.message}`)
      setLoading(false)
      return
    }
    setSucces('✓ Mot de passe modifié avec succès.')
    setNouveauMdp('')
    setConfirmMdp('')
    setLoading(false)
  }

  const f = (n) => parseInt(n).toLocaleString('fr-FR') + ' F'
  const joursRestants = etablissement?.date_fin_abonnement
    ? Math.ceil((new Date(etablissement.date_fin_abonnement) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div className="panel"
      >
        <div className="panel-head">
          <h2>Mon établissement</h2>
          <div className="cap-icon"><Icon.Building /></div>
          <div className="m-field" style={{ marginTop: 6 }}>
          <label>Besoin d'aide ?</label>
          <button
            type="button"
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={async () => {
              const motif = prompt("Décrivez brièvement pourquoi vous avez besoin que le support accède à votre compte :")
              if (!motif) return
              const { error } = await supabase.from('demandes_acces').insert({
                etablissement_id: etablissement.id,
                gerant_id: gerant.id,
                motif,
              })
              alert(error ? `Erreur : ${error.message}` : "Demande envoyée à l'administrateur.")
            }}
          >
            Demander l'accès du support à mon compte
          </button>
        </div>
        </div>
        <div className="m-field"><label>Nom</label><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{etablissement?.nom}</div></div>
        <div className="m-field"><label>Type</label><div style={{ fontSize: 13.5, color: 'var(--text-2)' }}>{etablissement?.type}</div></div>
        <div className="m-field"><label>Plan actuel</label><div style={{ fontSize: 13.5, color: 'var(--text-2)' }}>{etablissement?.plan}</div></div>
        <div className="m-field">
          <label>Statut</label>
          <span className="badge" style={{
            color: etablissement?.statut === 'Actif' ? 'var(--success)' : 'var(--danger)',
            background: etablissement?.statut === 'Actif' ? 'rgba(22,163,74,.08)' : 'rgba(220,38,38,.08)'
          }}>
            {etablissement?.statut}
          </span>
        </div>
        {joursRestants !== null && (
          <div className="m-field">
            <label>Abonnement</label>
            <div style={{ fontSize: 13, color: joursRestants <= 7 ? 'var(--warning)' : 'var(--text-2)' }}>
              {joursRestants > 0 ? `Expire dans ${joursRestants} jour(s)` : 'Expiré'}
              {' — '}{new Date(etablissement.date_fin_abonnement).toLocaleDateString('fr-FR')}
            </div>
          </div>
        )}
        <div className="hint">Pour changer de plan ou renouveler votre abonnement, contactez l'administrateur.</div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Sécurité</h2>
          <div className="cap-icon"><Icon.Key /></div>
        </div>
        <div className="m-field">
          <label>Nom complet</label>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{gerant?.nom_complet}</div>
        </div>
        <div className="m-field">
          <label>Numéro (identifiant)</label>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13.5, color: 'var(--text-2)' }}>{gerant?.telephone}</div>
        </div>

        {succes && <div className="alert-success">{succes}</div>}
        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={changerMotDePasse}>
          <div className="m-field">
            <label>Nouveau mot de passe</label>
            <input type="password" value={nouveauMdp} onChange={(e) => setNouveauMdp(e.target.value)} placeholder="6 caractères minimum" required />
          </div>
          <div className="m-field">
            <label>Confirmer le mot de passe</label>
            <input type="password" value={confirmMdp} onChange={(e) => setConfirmMdp(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}