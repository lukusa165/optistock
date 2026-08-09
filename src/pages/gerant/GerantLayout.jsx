import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { Icon } from '../../components/Icons.jsx'
import { supabase } from '../../lib/supabaseClient.js'
import { logAction } from '../../lib/historique.js'

export default function GerantLayout() {
  const navigate = useNavigate()
  const [gerant, setGerant] = useState(null)
  const [etablissement, setEtablissement] = useState(null)
  const [alertesCount, setAlertesCount] = useState(0)
  const [chargementTermine, setChargementTermine] = useState(false)
  const [erreurProfil, setErreurProfil] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    chargerProfil()
  }, [])

  const chargerProfil = async () => {
    setErreurProfil('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setErreurProfil("Session expirée. Merci de vous reconnecter.")
        return
      }

      const { data: profil, error: erreurRequete } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (erreurRequete) {
        console.error('Erreur chargement profil gérant:', erreurRequete)
        setErreurProfil("Impossible de charger votre profil : " + erreurRequete.message)
        return
      }

      if (!profil) {
        setErreurProfil("Aucun profil trouvé pour ce compte.")
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

      setGerant(profil)
      setEtablissement(etab)

      // Tracer la connexion
      await logAction({
        etablissement_id: profil.etablissement_id,
        user_id: profil.id,
        user_nom: profil.nom_complet,
        type: 'connexion',
        description: `Connexion — ${profil.nom_complet} (${profil.role})`,
      })

      // Alertes non lues
      const { count } = await supabase
        .from('alertes')
        .select('*', { count: 'exact', head: true })
        .eq('etablissement_id', profil.etablissement_id)
        .eq('lu', false)
      setAlertesCount(count || 0)

      // Vérifier expiration abonnement
      if (etab?.date_fin_abonnement) {
        const jours = Math.ceil((new Date(etab.date_fin_abonnement) - new Date()) / (1000 * 60 * 60 * 24))
        if (jours <= 7 && jours >= 0) {
          await supabase.from('alertes').upsert({
            etablissement_id: profil.etablissement_id,
            type: 'abonnement',
            message: `Votre abonnement expire dans ${jours} jour(s) (${new Date(etab.date_fin_abonnement).toLocaleDateString('fr-FR')}).`,
          }, { onConflict: 'etablissement_id,type,message', ignoreDuplicates: true })
        }
      }
    } catch (e) {
      console.error('Erreur inattendue chargerProfil:', e)
      setErreurProfil("Erreur inattendue : " + e.message)
    } finally {
      setChargementTermine(true)
    }
  }

  const handleLogout = async () => {
    if (gerant) {
      await logAction({
        etablissement_id: gerant.etablissement_id,
        user_id: gerant.id,
        user_nom: gerant.nom_complet,
        type: 'deconnexion',
        description: `Déconnexion — ${gerant.nom_complet}`,
      })
    }
    await supabase.auth.signOut()
    navigate('/connexion')
  }

  const navItems = [
    { to: '/gerant/dashboard', label: 'Tableau de bord', icon: 'Grid' },
    { to: '/gerant/articles', label: 'Articles', icon: 'FilePlus' },
    { to: '/gerant/stock', label: 'Gestion des stocks', icon: 'Database' },
    { to: '/gerant/ventes', label: 'Ventes', icon: 'Card' },
    { to: '/gerant/benefices', label: 'Bénéfices', icon: 'TrendingUp' },
    { to: '/gerant/fournisseurs', label: 'Fournisseurs', icon: 'Users' },
    { to: '/gerant/utilisateurs', label: 'Vendeurs', icon: 'UserPlus' },
    { to: '/gerant/statistiques', label: 'Statistiques', icon: 'BarChart' },
    { to: '/gerant/alertes', label: 'Alertes', icon: 'Bell', badge: alertesCount },
    { to: '/gerant/historique', label: 'Historique', icon: 'Clock' },
    { to: '/gerant/parametres', label: 'Paramètres', icon: 'Settings' },
  ]

  const typeEtablissement = etablissement?.type || 'Boutique'

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

        .sidebar { width: 220px; flex-shrink: 0; background: var(--bg-2); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow-y: auto; }
        .sidebar-top { padding: 14px 12px 0; flex: 1; }
        .gr-brand { display: flex; align-items: center; gap: 8px; padding: 4px 6px 14px; }
        .gr-brand img { width: 26px; height: 26px; border-radius: 6px; }
        .gr-brand-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14px; color: var(--text); }
        .gr-brand-name span { color: var(--accent); }
        .gr-brand-sub { font-size: 9px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
        .etab-card { background: var(--accent-pale); border: 1px solid rgba(26,122,80,.15); border-radius: 8px; padding: 8px 10px; margin-bottom: 12px; }
        .etab-type { font-size: 9px; color: var(--accent); font-family: 'JetBrains Mono', monospace; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 2px; }
        .etab-nom { font-size: 12.5px; font-weight: 700; color: var(--text); }
        .etab-plan { font-size: 10px; color: var(--muted); margin-top: 1px; }
        .nav-divider { height: 1px; background: var(--border); margin: 0 6px 8px; }
        .nav-section-label { font-family: 'JetBrains Mono', monospace; font-size: 8px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); padding: 0 12px; margin-bottom: 3px; font-weight: 600; }
        .nav-item { display: flex; align-items: center; gap: 9px; padding: 8px 12px; border-radius: 8px; color: var(--muted); cursor: pointer; font-size: 12.5px; font-weight: 500; margin-bottom: 1px; text-decoration: none; transition: background .15s, color .15s; position: relative; }
        .nav-item svg { width: 15px; height: 15px; flex-shrink: 0; }
        .nav-item:hover { background: var(--accent-pale); color: var(--accent); }
        .nav-item.active { background: var(--accent-pale); color: var(--accent); font-weight: 600; }
        .nav-item.active::before { content: ""; position: absolute; left: 0; top: 6px; bottom: 6px; width: 3px; border-radius: 0 3px 3px 0; background: var(--accent); }
        .nav-badge { background: var(--danger); color: #fff; border-radius: 10px; font-size: 9.5px; font-weight: 700; padding: 1px 6px; margin-left: auto; }
        .sidebar-footer { padding: 10px 12px; border-top: 1px solid var(--border); }
        .gerant-card { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--accent-pale); border-radius: 8px; margin-bottom: 6px; border: 1px solid rgba(26,122,80,.15); }
        .gerant-avatar { width: 28px; height: 28px; border-radius: 7px; background: var(--accent); display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 10px; color: #fff; flex-shrink: 0; }
        .gerant-name { font-size: 11.5px; font-weight: 600; color: var(--text); }
        .gerant-role { font-size: 9px; color: var(--accent); font-family: 'JetBrains Mono', monospace; font-weight: 600; }
        .logout-btn { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 12px; background: transparent; border: none; cursor: pointer; padding: 7px 10px; width: 100%; border-radius: 8px; transition: all .15s; font-family: 'Inter', sans-serif; }
        .logout-btn:hover { color: var(--danger); background: rgba(220,38,38,.06); }
        .logout-btn svg { width: 14px; height: 14px; }

        .main { flex: 1; overflow-y: auto; padding: 16px 20px; }
        .topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; }
        .topbar-left { display: flex; align-items: center; gap: 10px; }
        .topbar-left h1 { font-family: 'Space Grotesk', sans-serif; font-size: 17px; font-weight: 700; color: var(--text); }
        .topbar-left p { font-size: 11px; color: var(--muted); margin-top: 2px; }
        .topbar-actions { display: flex; align-items: center; gap: 8px; }
        .search-box { display: flex; align-items: center; gap: 7px; background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 7px 11px; width: 180px; }
        .search-box svg { width: 13px; height: 13px; color: var(--muted); }
        .search-box input { background: transparent; border: none; outline: none; color: var(--text); font-size: 12px; width: 100%; font-family: 'Inter', sans-serif; }
        .icon-btn { width: 32px; height: 32px; border-radius: 8px; background: var(--panel); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--muted); cursor: pointer; position: relative; }
        .icon-btn svg { width: 14px; height: 14px; }
        .icon-btn:hover { color: var(--accent); border-color: var(--accent); background: var(--accent-pale); }
        .notif-dot { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px; border-radius: 50%; background: var(--danger); border: 1.5px solid var(--panel); }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
        .stat-card { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 12px; box-shadow: var(--shadow); }
        .stat-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 6px; }
        .stat-icon { width: 28px; height: 28px; border-radius: 7px; background: var(--accent-pale); color: var(--accent); display: flex; align-items: center; justify-content: center; }
        .stat-icon svg { width: 13px; height: 13px; }
        .stat-label { font-size: 10.5px; color: var(--muted); font-weight: 500; }
        .stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; color: var(--text); line-height: 1; }
        .stat-delta { font-size: 10.5px; color: var(--success); margin-top: 3px; font-weight: 500; }

        .panel { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 14px; margin-bottom: 12px; box-shadow: var(--shadow); }
        .panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .panel-head h2 { font-family: 'Space Grotesk', sans-serif; font-size: 13.5px; font-weight: 700; color: var(--text); }

        .btn-primary { display: flex; align-items: center; gap: 6px; background: var(--accent); color: #fff; border: none; padding: 7px 13px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: filter .15s; box-shadow: 0 2px 5px rgba(26,122,80,0.2); }
        .btn-primary:hover:not(:disabled) { filter: brightness(1.08); }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .btn-primary svg { width: 13px; height: 13px; }
        .btn-ghost { background: transparent; border: 1.5px solid var(--border); color: var(--muted); padding: 7px 13px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: all .15s; }
        .btn-ghost:hover:not(:disabled) { color: var(--text); border-color: var(--text); }
        .btn-danger { background: var(--danger); color: #fff; border: none; padding: 7px 13px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }

        .sub-tabs { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
        .sub-tab { padding: 5px 12px; border-radius: 20px; font-size: 11.5px; font-weight: 600; color: var(--muted); background: var(--panel); border: 1px solid var(--border); text-decoration: none; transition: all .15s; font-family: 'Inter', sans-serif; }
        .sub-tab:hover { color: var(--accent); border-color: var(--accent); background: var(--accent-pale); }
        .sub-tab.active { background: var(--accent); color: #fff; border-color: var(--accent); }

        table { width: 100%; border-collapse: collapse; }
        thead th { text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: .07em; color: var(--muted); font-weight: 600; padding: 0 10px 10px; font-family: 'JetBrains Mono', monospace; }
        tbody tr { border-top: 1px solid var(--border); transition: background .1s; }
        tbody tr:hover { background: var(--panel-2); }
        tbody td { padding: 10px; font-size: 12.5px; color: var(--text-2); }
        .name-cell { font-weight: 600; color: var(--text); }
        .sub-cell { color: var(--muted); font-size: 11px; margin-top: 1px; }
        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 20px; font-size: 10.5px; font-weight: 600; white-space: nowrap; }
        .badge::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
        .row-actions { display: flex; gap: 4px; justify-content: flex-end; }
        .row-actions button { width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--border); background: var(--panel); color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; }
        .row-actions button svg { width: 12px; height: 12px; }
        .row-actions button:hover { color: var(--accent); border-color: var(--accent); background: var(--accent-pale); }
        .row-actions .danger:hover { color: var(--danger); border-color: var(--danger); background: rgba(220,38,38,.06); }

        .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 36px 16px; }
        .empty-icon { width: 44px; height: 44px; border-radius: 11px; background: var(--accent-pale); display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
        .empty-icon svg { width: 20px; height: 20px; color: var(--accent); }
        .empty-state h3 { color: var(--text); font-family: 'Space Grotesk', sans-serif; font-size: 13.5px; font-weight: 600; margin-bottom: 4px; }
        .empty-state p { font-size: 11.5px; color: var(--muted); max-width: 240px; margin-bottom: 12px; line-height: 1.5; }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.2); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 14px; }
        .modal { width: 100%; max-width: 480px; background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.12); max-height: 90vh; overflow-y: auto; }
        .modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .modal-head h3 { font-family: 'Space Grotesk', sans-serif; font-size: 14.5px; font-weight: 700; color: var(--text); }
        .modal-close { width: 26px; height: 26px; border-radius: 7px; background: var(--panel-2); border: 1px solid var(--border); color: var(--muted); display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .modal-close:hover { color: var(--danger); border-color: var(--danger); }
        .modal-close svg { width: 13px; height: 13px; }
        .m-field { margin-bottom: 11px; }
        .m-field label { display: block; font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); margin-bottom: 5px; font-weight: 600; }
        .m-field input, .m-field select, .m-field textarea { width: 100%; background: var(--panel-2); border: 1.5px solid var(--border); border-radius: 8px; padding: 8px 10px; color: var(--text); font-size: 12.5px; outline: none; font-family: 'Inter', sans-serif; transition: border-color .15s; }
        .m-field textarea { resize: vertical; min-height: 60px; }
        .m-field input:focus, .m-field select:focus, .m-field textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(26,122,80,0.08); }
        .m-field .hint { font-size: 10px; color: var(--muted); margin-top: 3px; }
        .m-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .m-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .modal-actions { display: flex; gap: 8px; margin-top: 14px; }

        .alert-success { background: #F0FDF4; border: 1px solid #BBF7D0; color: #15803D; padding: 9px 12px; border-radius: 8px; font-size: 11.5px; margin-bottom: 12px; }
        .alert-error { background: #FEF2F2; border: 1px solid #FECACA; color: #DC2626; padding: 9px 12px; border-radius: 8px; font-size: 11.5px; margin-bottom: 12px; }
        .alert-warning { background: #FFFBEB; border: 1px solid #FDE68A; color: #92400E; padding: 9px 12px; border-radius: 8px; font-size: 11.5px; margin-bottom: 12px; }

        .emplacement-box { background: var(--accent-pale); border: 1px solid rgba(26,122,80,.2); border-radius: 8px; padding: 12px; margin-bottom: 11px; }
        .emplacement-title { font-size: 9.5px; color: var(--accent); font-family: 'JetBrains Mono', monospace; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; }

        .credentials-box { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 12px; margin-bottom: 14px; }
        .cred-title { display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: #15803D; margin-bottom: 4px; }
        .cred-sub { font-size: 11px; color: #166534; margin-bottom: 10px; line-height: 1.5; }
        .cred-row { display: flex; align-items: center; justify-content: space-between; background: #fff; border: 1px solid #BBF7D0; border-radius: 7px; padding: 8px 11px; margin-bottom: 6px; }
        .cred-label { font-size: 9px; color: #6B7280; font-family: 'JetBrains Mono', monospace; letter-spacing: .06em; margin-bottom: 2px; }
        .cred-value { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #0D1F16; font-weight: 600; }
        .cred-copy { padding: 3px 9px; border-radius: 6px; border: 1px solid #BBF7D0; background: transparent; color: #15803D; font-size: 11px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }
        .cred-copy:hover { background: #DCFCE7; }

        .plan-limit { display: flex; align-items: center; justify-content: space-between; background: var(--accent-pale); border: 1px solid rgba(26,122,80,.2); border-radius: 8px; padding: 10px 13px; margin-bottom: 12px; }
        .plan-limit-text { font-size: 12px; color: var(--text); }
        .plan-limit-bar { width: 100px; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; margin-left: 10px; }
        .plan-limit-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width .3s; }

        .chart-placeholder { background: var(--panel-2); border: 1px dashed var(--border); border-radius: 8px; height: 160px; display: flex; align-items: center; justify-content: center; color: var(--muted); font-size: 12px; }

        .hamburger-btn {
          display: none; width: 34px; height: 34px; border-radius: 8px;
          background: var(--panel); border: 1px solid var(--border); color: var(--text);
          align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
        }
        .hamburger-btn svg { width: 18px; height: 18px; }
        .sidebar-overlay { display: none; }

        @media (max-width: 1100px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) {
          .gr { display: block; height: auto; overflow: visible; }
          .hamburger-btn { display: flex; }
          .sidebar {
            position: fixed; top: 0; left: 0; height: 100vh; width: 220px; z-index: 110;
            transform: translateX(-100%);
            transition: transform .2s ease;
          }
          .sidebar.open { transform: translateX(0); }
          .sidebar-overlay.open {
            display: block; position: fixed; inset: 0;
            background: rgba(0,0,0,0.35); z-index: 100;
          }
          .main { padding: 12px; height: auto; overflow: visible; }
        }
      `}</style>

      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="gr-brand">
            <img src={logo} alt="OptiStock" />
            <div>
              <div className="gr-brand-name">Opti<span>Stock</span></div>
              <div className="gr-brand-sub">Espace Gérant</div>
            </div>
          </div>

          {etablissement && (
            <div className="etab-card">
              <div className="etab-type">{etablissement.type}</div>
              <div className="etab-nom">{etablissement.nom}</div>
              <div className="etab-plan">{etablissement.plan}</div>
            </div>
          )}

          <div className="nav-divider"></div>
          <div className="nav-section-label">Navigation</div>

          {navItems.map((item) => {
            const IconComp = Icon[item.icon]
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <IconComp />
                {item.label}
                {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
              </NavLink>
            )
          })}
        </div>

        <div className="sidebar-footer">
          <div className="gerant-card">
            <div className="gerant-avatar">
              {gerant?.nom_complet?.slice(0, 2).toUpperCase() || 'GR'}
            </div>
            <div>
              <div className="gerant-name">{gerant?.nom_complet || 'Gérant'}</div>
              <div className="gerant-role">Gérant</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <Icon.Logout />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div>
              <h1>{etablissement?.nom || 'Mon établissement'}</h1>
              <p>{etablissement?.type} · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="search-box">
              <Icon.Search />
              <input type="text" placeholder="Rechercher..." />
            </div>
            <div className="icon-btn" onClick={() => navigate('/gerant/alertes')}>
              <Icon.Bell />
              {alertesCount > 0 && <span className="notif-dot"></span>}
            </div>
          </div>
        </div>

        {erreurProfil && (
          <div className="alert-error">⚠️ {erreurProfil}</div>
        )}

        <Outlet context={{ gerant, etablissement, typeEtablissement, chargementTermine }} />
      </main>
    </div>
  )
}