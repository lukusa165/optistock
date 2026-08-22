import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient.js'

export default function ReinitialiserMotDePasse() {
  const navigate = useNavigate()
  const [pretPourReset, setPretPourReset] = useState(false)
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [succes, setSucces] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPretPourReset(true)
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (motDePasse.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return }
    if (motDePasse !== confirmation) { setError('Les deux mots de passe ne correspondent pas.'); return }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: motDePasse })

    if (updateError) {
      setError(`Erreur : ${updateError.message}`)
      setLoading(false)
      return
    }

    setMotDePasse('')
    setConfirmation('')
    setSucces(true)
    setLoading(false)
    await supabase.auth.signOut()
    setTimeout(() => navigate('/connexion'), 2500)
  }

  return (
    <div className="login-page">
      <style>{`
        :root {
          --bg: #F0F4F2; --card: #FFFFFF; --border: #E3EBE6;
          --accent: #1A7A50; --accent-light: #22A06B; --accent-pale: #E8F5EE;
          --text: #0D1F16; --muted: #6B7A72;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .login-page {
          font-family: 'Inter', sans-serif;
          background: radial-gradient(circle at 20% -10%, var(--accent-pale), var(--bg) 60%);
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        .scene { width: 100%; max-width: 400px; }
        .card { background: var(--card); width: 100%; border-radius: 18px; box-shadow: 0 20px 50px -20px rgba(13,31,22,0.18); overflow: hidden; border: 1px solid var(--border); }
        .card-body { padding: 34px 32px 28px; }
        .tagline { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
        .subtext { font-size: 13px; color: var(--muted); margin-bottom: 26px; line-height: 1.5; }
        .field { margin-bottom: 16px; }
        .field label { display: block; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
        .field input {
          width: 100%; border: 1.5px solid var(--border); border-radius: 10px; padding: 11px 13px;
          background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; font-size: 14px; outline: none;
        }
        .field input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(26,122,80,0.14); }
        .error-msg { background: #FEF2F2; color: #DC2626; font-size: 12.5px; padding: 10px 13px; border-radius: 9px; margin-bottom: 16px; border: 1px solid #FECACA; }
        .success-msg { background: var(--accent-pale); color: #15803D; font-size: 13px; padding: 14px; border-radius: 10px; margin-bottom: 16px; line-height: 1.6; border: 1px solid rgba(26,122,80,.2); }
        .btn { width: 100%; padding: 12px 14px; border-radius: 10px; font-weight: 600; font-size: 13.5px; cursor: pointer; border: none; background: var(--accent); color: #fff; box-shadow: 0 4px 14px rgba(26,122,80,0.28); }
        .btn:hover:not(:disabled) { filter: brightness(1.08); }
        .btn:disabled { opacity: .6; cursor: not-allowed; }
      `}</style>

      <div className="scene">
        <div className="card">
          <div className="card-body">
            <div className="tagline">Nouveau mot de passe</div>

            {succes ? (
              <div className="success-msg">✓ Mot de passe modifié avec succès. Redirection vers la connexion...</div>
            ) : !pretPourReset ? (
              <div className="subtext">Vérification du lien en cours... Si rien ne se passe, le lien a peut-être expiré — demandez un nouveau lien depuis la page de connexion.</div>
            ) : (
              <form onSubmit={submit} autoComplete="off">
                <div className="subtext">Choisissez votre nouveau mot de passe.</div>
                {error && <div className="error-msg">{error}</div>}
                <div className="field">
                  <label>Nouveau mot de passe</label>
                  <input type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="6 caractères min." autoComplete="new-password" required />
                </div>
                <div className="field">
                  <label>Confirmer</label>
                  <input type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" required />
                </div>
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Valider le nouveau mot de passe'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}