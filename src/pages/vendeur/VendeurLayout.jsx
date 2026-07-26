import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { Icon } from '../../components/Icons.jsx'
import { supabase } from '../../lib/supabaseClient.js'

export default function VendeurLayout() {
  const navigate = useNavigate()
  const [vendeur, setVendeur] = useState(null)
  const [etablissement, setEtablissement] = useState(null)
  const [chargementTermine, setChargementTermine] = useState(false)
  const [erreurProfil, setErreurProfil] = useState('')

  useEffect(() => {
    chargerProfil()
  }, [])

  const chargerProfil = async () => {
    setErreurProfil('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setErreurProfil('Session expirée. Merci de vous reconnecter.'); return }

      const { data: profil, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error || !profil) {
        setErreurProfil('Impossible de charger votre profil.')
        return
      }

      if (profil.actif === false) {
        setErreurProfil('Votre compte a été suspendu par votre gérant.')
        await supabase.auth.signOut()
        setTimeout(() => navigate('/'), 2000)
        return
      }

      let etab = null
      if (profil.etablissement_id) {
        const { data: etabData } = await supabase
          .from('etablissements')
          .select('*')
          .eq('id', profil.etablissement_id)
          .single()
        etab = etabData
      }

      setVendeur(profil)
      setEtablissement(etab)
    } catch (e) {
      setErreurProfil('Erreur inattendue : ' + e.message)
    } finally {
      setChargementTermine(true)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const navItems = [
    { to: '/vendeur/caisse', label: 'Caisse', icon: 'Card' },
    { to: '/vendeur/articles', label: 'Articles', icon: 'Database' },
    { to: '/vendeur/historique', label: 'Mes ventes', icon: 'Clock' },
  ]

  return (
    <div className="gr">
      <style>{`
        :root {
          --bg: #F0F4F2; --bg-2: #FFFFFF; --panel: #FFFFFF; --panel-2: #F6F9F7;
          --accent: #1A7A50; --accent-light: #22A06B; --accent-pale: #E8F5EE;
          --text: #0D1F16; --text-2: #374151; --muted: #6B7A72;
          --border: #E3EBE6; --danger: #DC2626; --warning: #D97706; --success: #16A34A;
          --shadow: 0 1px 3px rgba(0,0,0,0.07); --shadow-md: 0 4px 12px rgba(26,122,80,0.10);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); margin: 0; }
        .gr { display: flex; height: 100vh; overflow: hidden; background: var(--bg); font-family: 'Inter', sans-serif; color: var(--text); }
        .sidebar { width: 200px; flex-shrink: 0; background: var(--bg-2); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow-y: auto; }
        .sidebar-top { padding: 14px 12px 0; flex: 1; }
        .gr-brand { display: flex; align-items: center; gap: 8px; padding: 4px 6px 14px; }
        .gr-brand img { width: 26px; height: 26px; border-radius: 6px; }
        .gr-brand-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14px; color: var(--text); }
        .gr-brand-name span { color: var(--accent); }
        .gr-brand-sub { font-size: 9px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
        .nav-divider { height: 1px; background: var(--border); margin: 0 6px 8px; }
        .nav-item { display: flex; align-items: center; gap: 9px; padding: 9px 12px; border-radius: 8px; color: var(--muted); cursor: pointer; font-size: 13px; font-weight: 500; margin-bottom: 1px; text-decoration: none; }
        .nav-item svg { width: 16px; height: 16px; flex-shrink: 0; }
        .nav-item:hover { background: var(--accent-pale); color: var(--accent); }
        .nav-item.active { background: var(--accent-pale); color: var(--accent); font-weight: 600; }
        .sidebar-footer { padding: 10px 12px; border-top: 1px solid var(--border); }
        .gerant-card { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--accent-pale); border-radius: 8px; margin-bottom: 6px; border: 1px solid rgba(26,122,80,.15); }
        .gerant-avatar { width: 28px; height: 28px; border-radius: 7px; background: var(--accent); display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 10px; color: #fff; flex-shrink: 0; }
        .gerant-name { font-size: 11.5px; font-weight: 600; color: var(--text); }
        .gerant-role { font-size: 9px; color: var(--accent); font-family: 'JetBrains Mono', monospace; font-weight: 600; }
        .logout-btn { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 12px; background: transparent; border: none; cursor: pointer; padding: 7px 10px; width: 100%; border-radius: 8px; font-family: 'Inter', sans-serif; }
        .logout-btn:hover { color: var(--danger); background: rgba(220,38,38,.06); }
        .logout-btn svg { width: 14px; height: 14px; }
        .main { flex: 1; overflow-y: auto; padding: 16px 20px; }
        .panel { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 14px; margin-bottom: 12px; box-shadow: var(--shadow); }
        .panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .panel-head h2 { font-family: 'Space Grotesk', sans-serif; font-size: 13.5px; font-weight: 700; color: var(--text); }
        .btn-primary { display: flex; align-items: center; gap: 6px; background: var(--accent); color: #fff; border: none; padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }
        .btn-primary:hover:not(:disabled) { filter: brightness(1.08); }
        .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
        .btn-ghost { background: transparent; border: 1.5px solid var(--border); color: var(--muted); padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }
        .btn-danger { background: var(--danger); color: #fff; border: none; padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }
        table { width: 100%; border-collapse: collapse; }
        thead th { text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: .07em; color: var(--muted); font-weight: 600; padding: 0 10px 10px; font-family: 'JetBrains Mono', monospace; }
        tbody tr { border-top: 1px solid var(--border); }
        tbody td { padding: 10px; font-size: 12.5px; color: var(--text-2); }
        .name-cell { font-weight: 600; color: var(--text); }
        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 20px; font-size: 10.5px; font-weight: 600; }
        .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 36px 16px; }
        .empty-icon { width: 44px; height: 44px; border-radius: 11px; background: var(--accent-pale); display: flex; align-items: center; justify-content: center; margin-bottom: 10px; color: var(--accent); }
        .empty-icon svg { width: 20px; height: 20px; }
        .empty-state h3 { font-family: 'Space Grotesk', sans-serif; font-size: 13.5px; font-weight: 600; margin-bottom: 4px; }
        .empty-state p { font-size: 11.5px; color: var(--muted); max-width: 240px; line-height: 1.5; }
        .alert-error { background: #FEF2F2; border: 1px solid #FECACA; color: #DC2626; padding: 9px 12px; border-radius: 8px; font-size: 11.5px; margin-bottom: 12px; }
        .alert-success { background: #F0FDF4; border: 1px solid #BBF7D0; color: #15803D; padding: 9px 12px; border-radius: 8px; font-size: 11.5px; margin-bottom: 12px; }
      `}</style>

      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="gr-brand">
            <img src={logo} alt="OptiStock" />
            <div>
              <div className="gr-brand-name">Opti<span>Stock</span></div>
              <div className="gr-brand-sub">Espace Vendeur</div>
            </div>
          </div>
          <div className="nav-divider"></div>
          {navItems.map((item) => {
            const IconComp = Icon[item.icon]
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <IconComp />
                {item.label}
              </NavLink>
            )
          })}
        </div>
        <div className="sidebar-footer">
          <div className="gerant-card">
            <div className="gerant-avatar">{vendeur?.nom_complet?.slice(0, 2).toUpperCase() || 'VD'}</div>
            <div>
              <div className="gerant-name">{vendeur?.nom_complet || 'Vendeur'}</div>
              <div className="gerant-role">{etablissement?.nom}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <Icon.Logout />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="main">
        {erreurProfil && <div className="alert-error">⚠️ {erreurProfil}</div>}
        <Outlet context={{ vendeur, etablissement, chargementTermine }} />
      </main>
    </div>
  )
}