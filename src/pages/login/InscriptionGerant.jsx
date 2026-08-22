import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient.js'

const TYPES = ['Boutique', 'Pharmacie', 'Alimentation', 'Mini-supermarché', 'Dépôt', 'Magasin', 'Entrepôt']
const FORM_VIDE = { nomGerant: '', email: '', password: '', confirmPassword: '', nomEtablissement: '', type: 'Boutique' }

export default function InscriptionGerant() {
  const [form, setForm] = useState(FORM_VIDE)
  const [loading, setLoading] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.nomGerant.trim() || !form.email.trim() || !form.nomEtablissement.trim()) {
      setError('Tous les champs obligatoires doivent être remplis.')
      return
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
    })

    if (authError) {
      setError(`Erreur : ${authError.message}`)
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('demandes_inscription').insert({
      nom_gerant: form.nomGerant.trim(),
      email: form.email.trim(),
      user_id: authData.user.id,
      nom_etablissement: form.nomEtablissement.trim(),
      type_etablissement: form.type,
      plan_souhaite: 'Essai gratuit',
    })

    if (insertError) {
      setError("Une erreur est survenue lors de l'envoi de votre demande. Merci de réessayer.")
      setLoading(false)
      return
    }

    await supabase.auth.signOut()

    setForm(FORM_VIDE)
    setEnvoye(true)
    setLoading(false)
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
        .scene { width: 100%; max-width: 440px; }
        .card { background: var(--card); width: 100%; border-radius: 18px; box-shadow: 0 20px 50px -20px rgba(13,31,22,0.18); overflow: hidden; border: 1px solid var(--border); }
        .card-body { padding: 34px 32px 28px; }
        .tagline { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
        .subtext { font-size: 13px; color: var(--muted); margin-bottom: 26px; line-height: 1.5; }
        .field { margin-bottom: 16px; }
        .field label { display: block; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
        .field input, .field select {
          width: 100%; border: 1.5px solid var(--border); border-radius: 10px; padding: 11px 13px;
          background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; font-size: 14px; outline: none;
        }
        .field input:focus, .field select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(26,122,80,0.14); }
        .field .static-value {
          background: var(--accent-pale); border: 1.5px solid rgba(26,122,80,.25); border-radius: 10px; padding: 11px 13px;
          font-size: 14px; color: var(--accent); font-weight: 600; display: flex; align-items: center; gap: 8px;
        }
        .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .error-msg { background: #FEF2F2; color: #DC2626; font-size: 12.5px; padding: 10px 13px; border-radius: 9px; margin-bottom: 16px; border: 1px solid #FECACA; }
        .success-msg { background: var(--accent-pale); color: #15803D; font-size: 13px; padding: 14px; border-radius: 10px; margin-bottom: 16px; line-height: 1.6; border: 1px solid rgba(26,122,80,.2); }
        .btn { width: 100%; padding: 12px 14px; border-radius: 10px; font-weight: 600; font-size: 13.5px; cursor: pointer; border: none; background: var(--accent); color: #fff; box-shadow: 0 4px 14px rgba(26,122,80,0.28); }
        .btn:hover:not(:disabled) { filter: brightness(1.08); }
        .btn:disabled { opacity: .6; cursor: not-allowed; }
        .back-link { display: block; text-align: center; margin-top: 18px; font-size: 12.5px; color: var(--muted); text-decoration: none; }
        .back-link:hover { color: var(--accent); }
      `}</style>

      <div className="scene">
        <div className="card">
          <div className="card-body">
            <div className="tagline">Créer votre établissement</div>
            <div className="subtext">
              Choisissez votre email et votre mot de passe. Un administrateur validera votre demande, puis vous pourrez vous connecter directement avec ces identifiants.
            </div>

            {envoye ? (
              <div className="success-msg">
                ✓ Votre demande a été envoyée. Vous pourrez vous connecter avec votre email et votre mot de passe dès que votre demande sera approuvée.
              </div>
            ) : (
              <form onSubmit={submit} autoComplete="off">
                {error && <div className="error-msg">{error}</div>}

                <div className="field">
                  <label>Votre nom complet</label>
                  <input
                    value={form.nomGerant}
                    onChange={(e) => setForm({ ...form, nomGerant: e.target.value })}
                    placeholder="Ex : Moussa Diallo"
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="field">
                  <label>Adresse email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="vous@exemple.com"
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="row-2">
                  <div className="field">
                    <label>Mot de passe</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="6 caractères min."
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Confirmer</label>
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Nom de l'établissement</label>
                  <input
                    value={form.nomEtablissement}
                    onChange={(e) => setForm({ ...form, nomEtablissement: e.target.value })}
                    placeholder="Ex : Pharmacie Al Amane"
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="field">
                  <label>Type d'établissement</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="field">
                  <label>Formule</label>
                  <div className="static-value">🎁 Essai gratuit — 30 jours</div>
                  <div className="hint" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>
                    Toute demande de changement de formule se fait après approbation, auprès de l'administrateur.
                  </div>
                </div>

                <button type="submit" className="btn" disabled={loading}>
                  {loading ? 'Envoi...' : 'Envoyer ma demande'}
                </button>
              </form>
            )}

            <Link to="/connexion" className="back-link">← Retour à la connexion</Link>
          </div>
        </div>
      </div>
    </div>
  )
}