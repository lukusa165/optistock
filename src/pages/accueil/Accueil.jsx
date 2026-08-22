import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'

export default function Accueil() {
  const navigate = useNavigate()

  const fonctionnalites = [
    {
      titre: 'Gestion de stock en temps réel',
      texte: 'Chaque vente décrémente automatiquement le stock. Impossible de vendre plus que ce qui est disponible, même à plusieurs vendeurs en même temps.',
    },
    {
      titre: 'Caisse simplifiée pour vos vendeurs',
      texte: 'Une interface façon supermarché : on recherche l\'article, on ajuste la quantité, on confirme. Le prix et l\'emplacement s\'affichent automatiquement.',
    },
    {
      titre: 'Bénéfices calculés automatiquement',
      texte: 'Le bénéfice de chaque vente est calculé et enregistré de façon fiable, avec des statistiques journalières, hebdomadaires, mensuelles et annuelles.',
    },
    {
      titre: 'Alertes de stock faible',
      texte: 'Recevez une alerte automatique dès qu\'un article passe sous son seuil, pour ne jamais être pris au dépourvu.',
    },
    {
      titre: 'Plusieurs vendeurs, un seul contrôle',
      texte: 'Créez des comptes vendeurs, bloquez ou débloquez-les à tout moment. Vous gardez la main sur qui peut vendre.',
    },
    {
      titre: 'Vos données protégées',
      texte: 'Chaque établissement voit uniquement ses propres données. Aucune fuite possible entre deux commerces différents.',
    },
  ]

  return (
    <div className="accueil-page">
      <style>{`
        :root {
          --bg: #F0F4F2; --card: #FFFFFF; --border: #E3EBE6;
          --accent: #1A7A50; --accent-light: #22A06B; --accent-pale: #E8F5EE;
          --text: #0D1F16; --muted: #6B7A72;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .accueil-page {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(180deg, var(--accent-pale) 0%, var(--bg) 320px, var(--bg) 100%);
          min-height: 100vh; color: var(--text);
        }
        .nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 6vw; }
        .brand { display: flex; align-items: center; gap: 10px; }
        .brand img { width: 32px; height: 32px; border-radius: 8px; object-fit: contain; }
        .brand-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 19px; color: var(--text); }
        .brand-name span { color: var(--accent); }
        .nav-btn {
          padding: 9px 18px; border-radius: 9px; font-size: 13px; font-weight: 600; cursor: pointer;
          background: #fff; border: 1.5px solid var(--border); color: var(--text); font-family: 'Inter', sans-serif;
          box-shadow: 0 1px 3px rgba(13,31,22,0.05);
        }
        .nav-btn:hover { border-color: var(--accent); color: var(--accent); }

        .hero { text-align: center; padding: 70px 6vw 50px; max-width: 780px; margin: 0 auto; }
        .hero h1 { font-family: 'Space Grotesk', sans-serif; font-size: clamp(28px, 5vw, 44px); font-weight: 700; line-height: 1.15; margin-bottom: 18px; color: var(--text); }
        .hero h1 span { color: var(--accent); }
        .hero p { font-size: 15.5px; color: var(--muted); line-height: 1.6; margin-bottom: 32px; max-width: 560px; margin-left: auto; margin-right: auto; }
        .cta-primary {
          display: inline-flex; align-items: center; gap: 8px; background: var(--accent); color: #fff;
          border: none; padding: 14px 30px; border-radius: 12px; font-size: 15px; font-weight: 700;
          cursor: pointer; font-family: 'Inter', sans-serif; box-shadow: 0 10px 30px -8px rgba(26,122,80,0.45);
          transition: filter .15s, transform .12s;
        }
        .cta-primary:hover { filter: brightness(1.06); transform: translateY(-1px); }
        .cta-sub { display: block; margin-top: 14px; font-size: 12.5px; color: var(--muted); }
        .cta-sub button { background: none; border: none; color: var(--accent); cursor: pointer; font-size: 12.5px; font-family: 'Inter', sans-serif; text-decoration: underline; padding: 0; }

        .features { max-width: 1080px; margin: 30px auto 0; padding: 0 6vw 80px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .feature-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; box-shadow: 0 2px 10px rgba(13,31,22,0.04); }
        .feature-card h3 { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700; margin-bottom: 10px; color: var(--text); }
        .feature-card p { font-size: 13px; color: var(--muted); line-height: 1.6; }

        .band { background: var(--accent-pale); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 50px 6vw; text-align: center; }
        .band h2 { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; margin-bottom: 12px; color: var(--text); }
        .band p { font-size: 14px; color: var(--muted); max-width: 520px; margin: 0 auto 26px; line-height: 1.6; }

        .footer { text-align: center; padding: 28px 6vw; }
        .footer span { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.06em; color: #9AA8A0; }
        .footer span b { color: var(--accent); font-weight: 600; }

        @media (max-width: 820px) {
          .features { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 560px) {
          .features { grid-template-columns: 1fr; }
        }
      `}</style>

      <nav className="nav">
        <div className="brand">
          <img src={logo} alt="OptiStock" />
          <div className="brand-name">Opti<span>Stock</span></div>
        </div>
        <button className="nav-btn" onClick={() => navigate('/connexion')}>Se connecter</button>
      </nav>

      <div className="hero">
        <h1>Votre commerce, <span>numérisé</span> et sous contrôle.</h1>
        <p>
          OptiStock gère votre stock, vos ventes et vos vendeurs en un seul endroit — sur mobile, en boutique, à
          tout moment. Conçu pour les commerces de toute taille, un seul établissement ou plusieurs.
        </p>
        <button className="cta-primary" onClick={() => navigate('/inscription')}>
          Commencez maintenant
        </button>
        <span className="cta-sub">
          Déjà un compte ? <button onClick={() => navigate('/connexion')}>Connectez-vous</button>
        </span>
      </div>

      <div className="features">
        {fonctionnalites.map((f) => (
          <div key={f.titre} className="feature-card">
            <h3>{f.titre}</h3>
            <p>{f.texte}</p>
          </div>
        ))}
      </div>

      <div className="band">
        <h2>Prêt à essayer ?</h2>
        <p>Créez votre établissement gratuitement et découvrez comment OptiStock simplifie votre gestion au quotidien.</p>
        <button className="cta-primary" onClick={() => navigate('/inscription')}>
          Créer mon établissement
        </button>
      </div>

      <div className="footer">
        <span>Propulsé par <b>StellarBrightSoftware</b></span>
      </div>
    </div>
  )
}