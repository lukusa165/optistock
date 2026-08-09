import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { Icon } from '../../components/Icons.jsx'
import { supabase } from '../../lib/supabaseClient.js'

export default function SuperAdminLayout() {
  const navigate = useNavigate()
  const [etablissements, setEtablissementsRaw] = useState([])
  const [loadingEtablissements, setLoadingEtablissements] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [plans] = useState([
    { id: 1, nom: 'Essai gratuit', prix: 'Gratuit / 30 jours', vendeurs: 1, essaiGratuit: true },
    { id: 2, nom: 'Essentiel', prix: '9 000 F / mois', vendeurs: 2, essaiGratuit: false },
    { id: 3, nom: 'Pro', prix: '19 000 F / mois', vendeurs: 6, essaiGratuit: false },
    { id: 4, nom: 'Entreprise', prix: '39 000 F / mois', vendeurs: null, essaiGratuit: false },
  ])

  const setEtablissements = (updater) => {
    setEtablissementsRaw((list) => {
      const next = typeof updater === 'function' ? updater(list) : updater
      return (next || []).filter(Boolean)
    })
  }

  const chargerEtablissements = async () => {
    setLoadingEtablissements(true)
    setLoadError('')

    const { data, error } = await supabase
      .from('etablissements')
      .select('*')
      .order('nom', { ascending: true })

    if (error) {
      console.error('Erreur chargement établissements:', error)
      setLoadError("Impossible de charger les établissements : " + error.message)
      setLoadingEtablissements(false)
      return
    }

    setEtablissementsRaw((data || []).filter(Boolean))
    setLoadingEtablissements(false)
  }

  useEffect(() => {
    chargerEtablissements()
  }, [])

  const navItems = [
    { to: '/super-admin/etablissements', label: "Gestion d'établissement", icon: 'Building' },
    { to: '/super-admin/abonnements', label: "Gestion d'abonnement", icon: 'Card' },
    { to: '/super-admin/parametres', label: 'Paramètres', icon: 'Settings' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/connexion')
  }

  return (
    <div className="sa">
      <style>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          min-height: 100vh;
        }
        #root {
          margin: 0 !important;
          padding: 0 !important;
          max-width: none !important;
          width: 100% !important;
        }

        :root {
          --bg: #F6F8F7;
          --bg-2: #FFFFFF;
          --panel: #FFFFFF;
          --panel-2: #F6F8F7;
          --accent: #1A7A50;
          --accent-light: #22A06B;
          --accent-pale: #E8F5EE;
          --accent-sidebar: #15623F;
          --text: #0D1F16;
          --text-2: #374151;
          --muted: #6B7A72;
          --border: #E3EBE6;
          --danger: #DC2626;
          --warning: #D97706;
          --success: #16A34A;
          --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
          --shadow: 0 1px 4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 16px rgba(26,122,80,0.10);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); }
        .sa { display: flex; min-height: 100vh; width: 100%; background: var(--bg); font-family: 'Inter', sans-serif; color: var(--text); }

        .sidebar {
          width: 256px; flex-shrink: 0;
          background: var(--bg-2);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          padding: 0; margin: 0; position: sticky; top: 0; left: 0; height: 100vh;
          box-shadow: var(--shadow);
        }
        .sidebar-top { padding: 18px 14px 0; }
        .sa-brand { display: flex; align-items: center; gap: 10px; padding: 4px 8px 14px; }
        .sa-brand img { width: 30px; height: 30px; border-radius: 8px; }
        .sa-brand-text { display: flex; flex-direction: column; }
        .sa-brand-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 16px; color: var(--text); line-height: 1.2; }
        .sa-brand-name span { color: var(--accent); }
        .sa-brand-sub { font-size: 10px; color: var(--muted); font-family: 'JetBrains Mono', monospace; letter-spacing: .04em; }

        .nav-divider { height: 1px; background: var(--border); margin: 0 8px 10px; }
        .nav-section-label {
          font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: .1em;
          text-transform: uppercase; color: var(--muted); padding: 0 16px; margin-bottom: 6px; font-weight: 600;
        }
        .nav-item {
          display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 10px;
          color: var(--muted); cursor: pointer; font-size: 13.5px; font-weight: 500; margin-bottom: 2px;
          text-decoration: none; transition: background .15s, color .15s; position: relative;
        }
        .nav-item svg { width: 17px; height: 17px; flex-shrink: 0; }
        .nav-item:hover { background: var(--accent-pale); color: var(--accent); }
        .nav-item.active {
          background: var(--accent-pale); color: var(--accent); font-weight: 600;
        }
        .nav-item.active::before {
          content: ""; position: absolute; left: 0; top: 6px; bottom: 6px;
          width: 3px; border-radius: 0 3px 3px 0; background: var(--accent);
        }

        .sidebar-footer {
          margin-top: auto; padding: 16px;
          border-top: 1px solid var(--border);
        }
        .admin-card {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          background: var(--accent-pale); border-radius: 10px; margin-bottom: 8px;
          border: 1px solid rgba(26,122,80,0.15);
        }
        .admin-avatar {
          width: 34px; height: 34px; border-radius: 9px; background: var(--accent);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 12px;
          color: #fff; flex-shrink: 0;
        }
        .admin-info { flex: 1; min-width: 0; }
        .admin-name { font-size: 12.5px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .admin-role { font-size: 10px; color: var(--accent); font-family: 'JetBrains Mono', monospace; font-weight: 600; letter-spacing: .04em; }
        .logout-btn {
          display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 13px;
          background: transparent; border: none; cursor: pointer; padding: 9px 12px;
          width: 100%; border-radius: 10px; transition: all .15s; font-family: 'Inter', sans-serif;
        }
        .logout-btn:hover { color: var(--danger); background: rgba(220,38,38,.06); }
        .logout-btn svg { width: 16px; height: 16px; }

        .main { flex: 1; padding: 28px 32px; overflow-x: hidden; }

        .topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 14px; }
        .topbar-left { display: flex; align-items: center; gap: 12px; }
        .topbar-left h1 { font-family: 'Space Grotesk', sans-serif; font-size: 21px; font-weight: 700; color: var(--text); }
        .topbar-left p { font-size: 12.5px; color: var(--muted); margin-top: 3px; }
        .topbar-actions { display: flex; align-items: center; gap: 10px; }
        .search-box {
          display: flex; align-items: center; gap: 8px; background: var(--panel);
          border: 1px solid var(--border); border-radius: 10px; padding: 9px 13px; width: 220px;
          box-shadow: var(--shadow-sm);
        }
        .search-box svg { width: 15px; height: 15px; color: var(--muted); }
        .search-box input { background: transparent; border: none; outline: none; color: var(--text); font-size: 13px; width: 100%; font-family: 'Inter', sans-serif; }
        .search-box input::placeholder { color: var(--muted); }
        .icon-btn {
          width: 38px; height: 38px; border-radius: 10px; background: var(--panel);
          border: 1px solid var(--border); display: flex; align-items: center; justify-content: center;
          color: var(--muted); cursor: pointer; position: relative; box-shadow: var(--shadow-sm);
          transition: all .15s;
        }
        .icon-btn svg { width: 17px; height: 17px; }
        .icon-btn:hover { color: var(--accent); border-color: var(--accent); background: var(--accent-pale); }
        .notif-dot { position: absolute; top: 8px; right: 8px; width: 7px; height: 7px; border-radius: 50%; background: var(--danger); border: 1.5px solid var(--panel); }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 26px; }
        .stat-card {
          background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 20px;
          box-shadow: var(--shadow); transition: box-shadow .15s, transform .15s;
        }
        .stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
        .stat-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
        .stat-icon { width: 38px; height: 38px; border-radius: 10px; background: var(--accent-pale); color: var(--accent); display: flex; align-items: center; justify-content: center; }
        .stat-icon svg { width: 18px; height: 18px; }
        .stat-label { font-size: 12px; color: var(--muted); font-weight: 500; }
        .stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 30px; font-weight: 700; color: var(--text); line-height: 1; }
        .stat-delta { font-size: 11.5px; color: var(--success); margin-top: 6px; font-weight: 500; }

        .panel { background: var(--panel); border: 1px solid var(--border); border-radius: 16px; padding: 22px; margin-bottom: 22px; box-shadow: var(--shadow); }
        .panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .panel-head h2 { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700; color: var(--text); }

        .btn-primary {
          display: flex; align-items: center; gap: 7px; background: var(--accent); color: #fff; border: none;
          padding: 9px 16px; border-radius: 9px; font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: filter .15s, box-shadow .15s;
          box-shadow: 0 2px 8px rgba(26,122,80,0.25);
        }
        .btn-primary:hover:not(:disabled) { filter: brightness(1.08); }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .btn-primary svg { width: 15px; height: 15px; }
        .btn-ghost {
          background: transparent; border: 1.5px solid var(--border); color: var(--muted);
          padding: 9px 14px; border-radius: 9px; font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: all .15s;
        }
        .btn-ghost:hover:not(:disabled) { color: var(--text); border-color: var(--text); }
        .btn-danger { background: var(--danger); color: #fff; border: none; padding: 9px 14px; border-radius: 9px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }
        .btn-danger:hover { filter: brightness(1.08); }

        .sub-tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .sub-tab {
          padding: 7px 14px; border-radius: 20px; font-size: 12.5px; font-weight: 600;
          color: var(--muted); background: var(--panel); border: 1px solid var(--border);
          text-decoration: none; transition: all .15s; font-family: 'Inter', sans-serif;
        }
        .sub-tab:hover { color: var(--accent); border-color: var(--accent); background: var(--accent-pale); }
        .sub-tab.active { background: var(--accent); color: #fff; border-color: var(--accent); box-shadow: 0 2px 8px rgba(26,122,80,0.2); }

        .cap-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .cap-card {
          display: flex; flex-direction: column; gap: 12px; background: var(--panel-2);
          border: 1px solid var(--border); border-radius: 14px; padding: 16px; cursor: pointer;
          transition: border-color .15s, transform .12s, box-shadow .15s; text-align: left;
          font-family: 'Inter', sans-serif;
        }
        .cap-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .cap-icon { width: 38px; height: 38px; border-radius: 10px; background: var(--accent-pale); color: var(--accent); display: flex; align-items: center; justify-content: center; }
        .cap-icon svg { width: 18px; height: 18px; }
        .cap-card h4 { font-size: 12.5px; font-weight: 600; color: var(--text); }
        .cap-card p { font-size: 11.5px; color: var(--muted); line-height: 1.4; }

        table { width: 100%; border-collapse: collapse; }
        thead th {
          text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: .07em;
          color: var(--muted); font-weight: 600; padding: 0 12px 12px; font-family: 'JetBrains Mono', monospace;
        }
        tbody tr { border-top: 1px solid var(--border); transition: background .1s; }
        tbody tr:hover { background: var(--panel-2); }
        tbody td { padding: 14px 12px; font-size: 13.5px; color: var(--text-2); }
        .name-cell { font-weight: 600; color: var(--text); }
        .type-cell { color: var(--muted); font-size: 12px; margin-top: 2px; }
        .badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 600; white-space: nowrap; }
        .badge::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .row-actions { display: flex; gap: 6px; justify-content: flex-end; }
        .row-actions button {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border);
          background: var(--panel); color: var(--muted); cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all .15s;
        }
        .row-actions button svg { width: 14px; height: 14px; }
        .row-actions button:hover { color: var(--accent); border-color: var(--accent); background: var(--accent-pale); }
        .row-actions .danger:hover { color: var(--danger); border-color: var(--danger); background: rgba(220,38,38,.06); }

        .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 54px 20px; }
        .empty-icon { width: 56px; height: 56px; border-radius: 14px; background: var(--accent-pale); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .empty-icon svg { width: 24px; height: 24px; color: var(--accent); }
        .empty-state h3 { color: var(--text); font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 600; margin-bottom: 6px; }
        .empty-state p { font-size: 12.5px; color: var(--muted); max-width: 280px; margin-bottom: 18px; line-height: 1.5; }

        .plans-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 22px; }
        .plan-card { background: var(--panel-2); border: 1px solid var(--border); border-radius: 14px; padding: 18px; transition: box-shadow .15s, border-color .15s; }
        .plan-card:hover { box-shadow: var(--shadow-md); border-color: var(--accent); }
        .plan-dot { width: 10px; height: 10px; border-radius: 50%; margin-bottom: 12px; background: var(--accent); }
        .plan-card h3 { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .plan-card .price { font-size: 12px; color: var(--muted); margin-bottom: 12px; }
        .plan-card .meta { font-size: 11.5px; color: var(--muted); display: flex; justify-content: space-between; margin-top: 6px; }
        .plan-card .meta b { color: var(--text); }
        .plan-card .trial { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--accent); margin-top: 10px; font-weight: 600; }
        .plan-card .trial svg { width: 13px; height: 13px; }

        .settings-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .setting-card { display: flex; gap: 14px; background: var(--panel-2); border: 1px solid var(--border); border-radius: 14px; padding: 18px; cursor: pointer; transition: border-color .15s, box-shadow .15s; }
        .setting-card:hover { border-color: var(--accent); box-shadow: var(--shadow-md); }
        .setting-icon { width: 42px; height: 42px; border-radius: 11px; background: var(--accent-pale); color: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .setting-icon svg { width: 20px; height: 20px; }
        .setting-card h4 { font-size: 13.5px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
        .setting-card p { font-size: 12px; color: var(--muted); line-height: 1.4; }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.25); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 20px; }
        .modal { width: 100%; max-width: 440px; background: var(--panel); border: 1px solid var(--border); border-radius: 18px; padding: 26px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); }
        .modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .modal-head h3 { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: var(--text); }
        .modal-close { width: 30px; height: 30px; border-radius: 8px; background: var(--panel-2); border: 1px solid var(--border); color: var(--muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .15s; }
        .modal-close:hover { color: var(--danger); border-color: var(--danger); }
        .modal-close svg { width: 15px; height: 15px; }
        .m-field { margin-bottom: 14px; }
        .m-field label { display: block; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; font-weight: 600; }
        .m-field input, .m-field select {
          width: 100%; background: var(--panel-2); border: 1.5px solid var(--border);
          border-radius: 9px; padding: 10px 12px; color: var(--text); font-size: 13.5px; outline: none;
          font-family: 'Inter', sans-serif; transition: border-color .15s, box-shadow .15s;
        }
        .m-field input:focus, .m-field select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(26,122,80,0.1); }
        .m-field .hint { font-size: 11px; color: var(--muted); margin-top: 5px; }
        .modal-actions { display: flex; gap: 10px; margin-top: 20px; }

        .alert-success { background: #F0FDF4; border: 1px solid #BBF7D0; color: #15803D; padding: 12px 14px; border-radius: 10px; font-size: 12.5px; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 8px; }
        .alert-error { background: #FEF2F2; border: 1px solid #FECACA; color: #DC2626; padding: 12px 14px; border-radius: 10px; font-size: 12.5px; margin-bottom: 16px; }

        .credentials-box { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 18px; margin-bottom: 22px; }
        .credentials-box .cred-title { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 600; color: #15803D; margin-bottom: 6px; }
        .credentials-box .cred-sub { font-size: 12px; color: #166534; margin-bottom: 14px; line-height: 1.5; }
        .cred-row { display: flex; align-items: center; justify-content: space-between; background: #fff; border: 1px solid #BBF7D0; border-radius: 9px; padding: 10px 14px; margin-bottom: 8px; }
        .cred-label { font-size: 9.5px; color: #6B7280; font-family: 'JetBrains Mono', monospace; letter-spacing: .06em; margin-bottom: 3px; }
        .cred-value { font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #0D1F16; font-weight: 600; }
        .cred-copy { padding: 5px 12px; border-radius: 7px; border: 1px solid #BBF7D0; background: transparent; color: #15803D; font-size: 11.5px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }
        .cred-copy:hover { background: #DCFCE7; }

        .hamburger-btn {
          display: none; width: 38px; height: 38px; border-radius: 10px;
          background: var(--panel); border: 1px solid var(--border); color: var(--text);
          align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
        }
        .hamburger-btn svg { width: 20px; height: 20px; }

        .sidebar-overlay { display: none; }

        @media (max-width: 1100px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .plans-grid { grid-template-columns: repeat(2, 1fr); }
          .cap-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .hamburger-btn { display: flex; }
          .sidebar {
            position: fixed; top: 0; left: 0; z-index: 110;
            transform: translateX(-100%);
            transition: transform .2s ease;
          }
          .sidebar.open { transform: translateX(0); }
          .sidebar-overlay.open {
            display: block; position: fixed; inset: 0;
            background: rgba(0,0,0,0.35); z-index: 100;
          }
          .main { padding: 20px 16px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .settings-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="sa-brand">
            <img src={logo} alt="OptiStock" />
            <div className="sa-brand-text">
              <div className="sa-brand-name">Opti<span>Stock</span></div>
              <div className="sa-brand-sub">StellarBrightSoftware</div>
            </div>
          </div>

          <div className="nav-divider"></div>
          <div className="nav-section-label">Menu principal</div>

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
              </NavLink>
            )
          })}
        </div>

        <div className="sidebar-footer">
          <div className="admin-card">
            <div className="admin-avatar">SA</div>
            <div className="admin-info">
              <div className="admin-name">OptiStock</div>
              <div className="admin-role">Super Admin</div>
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
              <h1>Espace Super Administrateur</h1>
              <p>Plateforme de gestion · OptiStock</p>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="search-box">
              <Icon.Search />
              <input type="text" placeholder="Rechercher..." />
            </div>
            <div className="icon-btn">
              <Icon.Bell />
              <span className="notif-dot"></span>
            </div>
          </div>
        </div>

        {loadError && <div className="alert-error">⚠️ {loadError}</div>}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-label">Établissements</div>
              <div className="stat-icon"><Icon.Building /></div>
            </div>
            <div className="stat-value">{loadingEtablissements ? '…' : etablissements.length}</div>
            <div className="stat-delta">Total enregistré</div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-label">Actifs</div>
              <div className="stat-icon"><Icon.Power /></div>
            </div>
            <div className="stat-value">{loadingEtablissements ? '…' : etablissements.filter(e => e?.statut === 'Actif').length}</div>
            <div className="stat-delta">Comptes en service</div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-label">Désactivés</div>
              <div className="stat-icon"><Icon.ToggleLeft /></div>
            </div>
            <div className="stat-value">{loadingEtablissements ? '…' : etablissements.filter(e => e?.statut === 'Désactivé').length}</div>
            <div className="stat-delta" style={{ color: 'var(--warning)' }}>À surveiller</div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-label">Plans</div>
              <div className="stat-icon"><Icon.Card /></div>
            </div>
            <div className="stat-value">{plans.length}</div>
            <div className="stat-delta">Formules disponibles</div>
          </div>
        </div>

        <Outlet context={{ etablissements, setEtablissements, plans }} />
      </main>
    </div>
  )
}