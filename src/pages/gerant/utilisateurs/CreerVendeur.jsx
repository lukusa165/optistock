import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Icon } from '../../../components/Icons.jsx'
import { supabase, telephoneVersEmail, genererNumeroVendeur, genererMotDePasse } from '../../../lib/supabaseClient.js'

const NUMERO_SUPER_ADMIN = '0831511015'

export default function CreerVendeur() {
  const { etablissement, gerant } = useOutletContext()
  const [nbVendeurs, setNbVendeurs] = useState(0)
  const [limite, setLimite] = useState(1)
  const [form, setForm] = useState({ nomVendeur: '' })
  const [resultat, setResultat] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    if (etablissement) {
      compterVendeurs()
      chargerLimitePlan()
    }
  }, [etablissement])

  const chargerLimitePlan = async () => {
    const { data } = await supabase
      .from('plans')
      .select('limite_vendeurs')
      .eq('nom', etablissement.plan)
      .single()
    // limite_vendeurs null en base = illimité
    setLimite(data ? (data.limite_vendeurs ?? Infinity) : 1)
  }

  const compterVendeurs = async () => {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('etablissement_id', etablissement.id)
      .eq('role', 'vendeur')
    setNbVendeurs(count || 0)
  }

  const copier = (texte, label) => {
    navigator.clipboard.writeText(texte)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (limite !== Infinity && nbVendeurs >= limite) {
      setError(`Limite atteinte. Votre plan "${etablissement?.plan}" autorise maximum ${limite} vendeur(s). Contactez l'administrateur pour changer de plan.`)
      return
    }

    setLoading(true)

    const numeroVendeur = genererNumeroVendeur(gerant.telephone, NUMERO_SUPER_ADMIN)
    const motDePasse = genererMotDePasse()
    const emailVendeur = telephoneVersEmail(numeroVendeur)

    const { data, error: fnError } = await supabase.functions.invoke('creer-utilisateur', {
      body: {
        email: emailVendeur,
        password: motDePasse,
        role: 'vendeur',
        nom_complet: form.nomVendeur,
        telephone: numeroVendeur,
      },
    })

    if (fnError || data?.error) {
      setError(`Erreur : ${data?.error || fnError.message}`)
      setLoading(false)
      return
    }

    setNbVendeurs((n) => n + 1)
    setResultat({ nom: form.nomVendeur, numero: numeroVendeur, motDePasse })
    setForm({ nomVendeur: '' })
    setLoading(false)
  }

  const limiteAtteinte = limite !== Infinity && nbVendeurs >= limite

  return (
    <div className="panel" style={{ maxWidth: 460 }}>
      <div className="panel-head">
        <h2>Créer un vendeur</h2>
        <div className="cap-icon" style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--accent-pale)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon.UserPlus style={{ width: 15, height: 15 }} />
        </div>
      </div>

      <div className="plan-limit">
        <div className="plan-limit-text">
          Vendeurs : <strong>{nbVendeurs}</strong> / <strong>{limite === Infinity ? '∞' : limite}</strong>
          <span style={{ fontSize: 10.5, color: 'var(--muted)', marginLeft: 8 }}>Plan {etablissement?.plan}</span>
        </div>
        {limite !== Infinity && (
          <div className="plan-limit-bar">
            <div className="plan-limit-fill" style={{ width: `${Math.min((nbVendeurs / limite) * 100, 100)}%`, background: limiteAtteinte ? 'var(--danger)' : 'var(--accent)' }}></div>
          </div>
        )}
      </div>

      {limiteAtteinte && (
        <div className="alert-warning">
          ⚠️ Limite de vendeurs atteinte pour votre plan <strong>{etablissement?.plan}</strong>. Contactez l'administrateur pour passer à un plan supérieur.
        </div>
      )}

      {resultat && (
        <div className="credentials-box">
          <div className="cred-title"><Icon.Key style={{ width: 14, height: 14 }} />Vendeur créé — {resultat.nom}</div>
          <p className="cred-sub">Transmettez ces identifiants au vendeur. Il peut se connecter dès maintenant.</p>
          <div className="cred-row">
            <div><div className="cred-label">NUMÉRO (IDENTIFIANT)</div><div className="cred-value">{resultat.numero}</div></div>
            <button className="cred-copy" onClick={() => copier(resultat.numero, 'num')}>{copied === 'num' ? '✓ Copié' : 'Copier'}</button>
          </div>
          <div className="cred-row">
            <div><div className="cred-label">MOT DE PASSE</div><div className="cred-value">{resultat.motDePasse}</div></div>
            <button className="cred-copy" onClick={() => copier(resultat.motDePasse, 'mdp')}>{copied === 'mdp' ? '✓ Copié' : 'Copier'}</button>
          </div>
        </div>
      )}

      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={submit}>
        <div className="m-field">
          <label>Nom complet du vendeur</label>
          <input value={form.nomVendeur} onChange={(e) => setForm({ nomVendeur: e.target.value })} placeholder="Ex : Aminata Diallo" required disabled={limiteAtteinte} />
          <div className="hint">Le numéro de téléphone et le mot de passe seront générés automatiquement.</div>
        </div>
        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading || limiteAtteinte}>
          <Icon.UserPlus />
          {loading ? 'Création en cours...' : 'Créer le vendeur'}
        </button>
      </form>
    </div>
  )
}