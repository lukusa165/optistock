import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient.js'

const FORM_VIDE = { nom: '', email: '', telephone: '', message: '' }

export default function BesoinAide() {
  const [form, setForm] = useState(FORM_VIDE)
  const [loading, setLoading] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.email.trim() || !form.message.trim()) {
      setError("L'email et le message sont requis.")
      return
    }

    setLoading(true)
    const { error: insertError } = await supabase.from('demandes_publiques').insert({
      type: 'aide',
      nom: form.nom.trim() || null,
      email: form.email.trim(),
      telephone: form.telephone.trim() || null,
      message: form.message.trim(),
    })

    if (insertError) {
      setError("Une erreur est survenue. Merci de réessayer.")
      setLoading(false)
      return
    }

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
        .scene { width: 100%; max-width: 400px; }
        .card { background: var(--card); width: 100%; border-radius: 18px; box-shadow: 0 20px 50px -20px rgba(13,31,22,0.18); overflow: hidden; border: 1px solid var(--border); }
        .card-body { padding: 34px 32px 28px; }
        .tagline { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
        .subtext { font-size: 13px; color: var(--muted); margin-bottom: 26px; line-height: 1.5; }
        .field { margin-bottom: 16px; }
        .field label { display: block; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
        .field input, .field textarea {
          width: 100%; border: 1.5px solid var(--border); border-radius: 10px; padding: 11px 13px;
          background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; font-size: 14px; outline: none;
        }
        .field textarea { resize: vertical; min-height: 90px; }
        .field input:focus, .field textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(26,122,80,0.14); }
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
            <div className="tagline">Besoin d'aide ?</div>
            <div className="subtext">
              Décrivez votre problème, un administrateur vous recontactera par email.
            </div>

            {envoye ? (
              <div className="success-msg">
                ✓ Votre message a été envoyé. L'équipe support vous recontactera bientôt.
              </div>
            ) : (
              <form onSubmit={submit} autoComplete="off">
                {error && <div className="error-msg">{error}</div>}
                <div className="field">
                  <label>Nom (optionnel)</label>
                  <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Votre nom" autoComplete="off" />
                </div>
                <div className="field">
                  <label>Adresse email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vous@exemple.com" autoComplete="off" required />
                </div>
                <div className="field">
                  <label>Numéro de téléphone (optionnel)</label>
                  <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="Ex : 0831511015" autoComplete="off" />
                </div>
                <div className="field">
                  <label>Votre message</label>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Décrivez votre problème ou votre question" required />
                </div>
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? 'Envoi...' : 'Envoyer le message'}
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