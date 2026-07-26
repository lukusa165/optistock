import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { supabase, telephoneVersEmail } from '../../lib/supabaseClient.js'

const MAX_TENTATIVES = 3
const DUREE_BLOCAGE_MS = 15 * 60 * 1000

export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ userId: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleCancel = () => {
    setForm({ userId: '', password: '' })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const blocageKey = `blocage_${form.userId}`
    const tentativesKey = `tentatives_${form.userId}`
    const blocageJusquA = localStorage.getItem(blocageKey)

    if (blocageJusquA && Date.now() < parseInt(blocageJusquA)) {
      const minutesRestantes = Math.ceil((parseInt(blocageJusquA) - Date.now()) / 60000)
      setError(`Compte temporairement bloqué. Réessayez dans ${minutesRestantes} minute(s).`)
      return
    }

    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: telephoneVersEmail(form.userId),
      password: form.password,
    })

    if (authError) {
      const tentatives = parseInt(localStorage.getItem(tentativesKey) || '0') + 1
      localStorage.setItem(tentativesKey, tentatives.toString())

      if (tentatives >= MAX_TENTATIVES) {
        const jusquA = Date.now() + DUREE_BLOCAGE_MS
        localStorage.setItem(blocageKey, jusquA.toString())
        localStorage.removeItem(tentativesKey)
        setError('Trop de tentatives échouées. Compte bloqué pendant 15 minutes.')
      } else {
        setError(`Identifiant ou mot de passe incorrect. Tentative ${tentatives}/${MAX_TENTATIVES}.`)
      }

      setLoading(false)
      return
    }

    localStorage.removeItem(`tentatives_${form.userId}`)
    localStorage.removeItem(`blocage_${form.userId}`)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, actif')
      .eq('id', data.user.id)
      .single()

    setLoading(false)

    if (profileError || !profile) {
      setError("Profil introuvable. Contactez l'administrateur.")
      return
    }

    if (profile.actif === false) {
      setError("Votre compte a été suspendu. Contactez votre gérant ou l'administrateur.")
      await supabase.auth.signOut()
      return
    }

    if (profile.role === 'super_admin') navigate('/super-admin')
    else if (profile.role === 'gerant') navigate('/gerant')
    else if (profile.role === 'vendeur') navigate('/vendeur')
  }

  return (
    <div className="login-page">
      <style>{`
        :root {
          --bg: #0B1F17; --bg-2: #0F2A20; --card: #12241C;
          --accent: #1E8F5E; --accent-light: #33B37A; --muted: #6B7A72;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .login-page {
          font-family: 'Inter', sans-serif;
          background: radial-gradient(circle at 20% -10%, var(--bg-2), var(--bg) 60%);
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          padding: 24px; position: relative; overflow: hidden;
        }
        .barcode-bg {
          position: absolute; inset: 0; opacity: 0.06; pointer-events: none;
          background-image: repeating-linear-gradient(90deg, #ffffff 0 2px, transparent 2px 6px, #ffffff 6px 9px, transparent 9px 18px, #ffffff 18px 21px, transparent 21px 30px);
          mask-image: radial-gradient(circle at 30% 30%, black, transparent 65%);
        }
        .scene { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 400px; }
        .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
        .brand-logo { width: 34px; height: 34px; object-fit: contain; }
        .brand-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 20px; color: #F4F7F5; letter-spacing: -0.02em; }
        .brand-name span { color: var(--accent-light); }
        .card { background: var(--card); width: 100%; border-radius: 18px; box-shadow: 0 30px 60px -20px rgba(0,0,0,0.55); overflow: hidden; }
        .scan-strip { height: 10px; width: 100%; background: repeating-linear-gradient(90deg, #F4F7F5 0 2px, transparent 2px 5px, #F4F7F5 5px 6px, transparent 6px 11px, #F4F7F5 11px 14px, transparent 14px 22px); position: relative; overflow: hidden; }
        .scan-strip::after { content: ""; position: absolute; top: 0; left: -30%; width: 30%; height: 100%; background: linear-gradient(90deg, transparent, rgba(30,143,94,0.9), transparent); animation: scan 2.8s ease-in-out infinite; }
        @keyframes scan { 0%{left:-30%} 50%{left:100%} 100%{left:100%} }
        @media (prefers-reduced-motion: reduce) { .scan-strip::after { display: none; } }
        .card-body { padding: 34px 32px 28px; }
        .tagline { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 600; color: #F4F7F5; margin-bottom: 4px; }
        .subtext { font-size: 13px; color: var(--muted); margin-bottom: 26px; }
        .field { margin-bottom: 16px; }
        .field label { display: block; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
        .input-wrap { display: flex; align-items: center; gap: 10px; border: 1.5px solid #24382E; border-radius: 10px; padding: 11px 13px; background: #0E1C15; transition: border-color .15s, box-shadow .15s; }
        .input-wrap:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(30,143,94,0.18); }
        .input-wrap svg { width: 17px; height: 17px; color: var(--muted); flex-shrink: 0; }
        .input-wrap:focus-within svg { color: var(--accent); }
        .input-wrap input { border: none; outline: none; background: transparent; font-family: 'Inter', sans-serif; font-size: 14px; width: 100%; color: #F4F7F5; }
        .input-wrap input::placeholder { color: #5C6E64; }
        .toggle-pass { cursor: pointer; color: var(--muted); display: flex; }
        .toggle-pass:hover { color: #F4F7F5; }
        .error-msg { background: rgba(194,75,63,.12); color: #E36A5C; font-size: 12.5px; padding: 10px 13px; border-radius: 9px; margin-bottom: 16px; border: 1px solid rgba(194,75,63,.2); line-height: 1.4; }
        .actions { display: flex; gap: 10px; margin-top: 22px; }
        .btn { flex: 1; padding: 12px 14px; border-radius: 10px; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 13.5px; cursor: pointer; border: none; transition: transform .12s, filter .12s; }
        .btn:active { transform: scale(0.97); }
        .btn:disabled { opacity: .6; cursor: not-allowed; }
        .btn-primary { background: var(--accent); color: #fff; }
        .btn-primary:hover:not(:disabled) { filter: brightness(1.08); }
        .btn-ghost { background: transparent; color: var(--muted); border: 1.5px solid #24382E; }
        .btn-ghost:hover:not(:disabled) { color: #F4F7F5; border-color: #3A5346; }
        .links { display: flex; justify-content: space-between; margin-top: 18px; }
        .links a { font-size: 12.5px; color: var(--muted); text-decoration: none; border-bottom: 1px solid transparent; }
        .links a:hover { color: var(--accent); border-bottom-color: var(--accent); }
        .footer { text-align: center; padding: 14px 0 6px; }
        .footer span { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.06em; color: rgba(244,247,245,0.45); }
        .footer span b { color: var(--accent-light); font-weight: 500; }
      `}</style>

      <div className="barcode-bg"></div>

      <div className="scene">
        <div className="brand">
          <img src={logo} alt="OptiStock" className="brand-logo" />
          <div className="brand-name">Opti<span>Stock</span></div>
        </div>

        <div className="card">
          <div className="scan-strip"></div>
          <div className="card-body">
            <div className="tagline">Votre business, numérisé.</div>
            <div className="subtext">Connectez-vous à votre espace de gestion.</div>

            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="userId">Numéro de téléphone</label>
                <div className="input-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92Z"/>
                  </svg>
                  <input
                    type="text"
                    id="userId"
                    name="userId"
                    placeholder="Ex : 0831511015"
                    autoComplete="username"
                    value={form.userId}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="password">Mot de passe</label>
                <div className="input-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="10.5" width="14" height="9.5" rx="2"/>
                    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <span className="toggle-pass" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                        <path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24"/>
                        <path d="M6.5 6.7C4.5 8 3 12 3 12s3.5 7 10 7c1.8 0 3.4-.5 4.7-1.2M17.5 17.3C19.4 16 21 12 21 12s-1.2-2.4-3.4-4.3"/>
                        <path d="M9.5 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </span>
                </div>
              </div>

              <div className="actions">
                <button type="button" className="btn btn-ghost" onClick={handleCancel} disabled={loading}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
              </div>
            </form>

            <div className="links">
              <a href="#">Mot de passe oublié ?</a>
              <a href="#">Besoin d'aide ?</a>
            </div>
          </div>
        </div>

        <div className="footer">
          <span>Propulsé par <b>StellarBrightSoftware</b></span>
        </div>
      </div>
    </div>
  )
}