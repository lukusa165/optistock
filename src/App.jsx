import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient.js'

import Accueil from './pages/accueil/Accueil.jsx'
import Login from './pages/login/Login.jsx'
import InscriptionGerant from './pages/login/InscriptionGerant.jsx'
import MotDePasseOublie from './pages/login/MotDePasseOublie.jsx'
import ReinitialiserMotDePasse from './pages/login/ReinitialiserMotDePasse.jsx'
import BesoinAide from './pages/login/BesoinAide.jsx'
import SuperAdminLayout from './pages/super-admin/SuperAdminLayout.jsx'
import EtablissementsLayout from './pages/super-admin/etablissements/EtablissementsLayout.jsx'
import Inscriptions from './pages/super-admin/etablissements/Inscriptions.jsx'
import Creation from './pages/super-admin/etablissements/Creation.jsx'
import Modification from './pages/super-admin/etablissements/Modification.jsx'
import Suppression from './pages/super-admin/etablissements/Suppression.jsx'
import Activation from './pages/super-admin/etablissements/Activation.jsx'
import AbonnementsLayout from './pages/super-admin/abonnements/AbonnementsLayout.jsx'
import Formules from './pages/super-admin/abonnements/Formules.jsx'
import Statuts from './pages/super-admin/abonnements/Statuts.jsx'
import Expiration from './pages/super-admin/abonnements/Expiration.jsx'
import ParametresLayout from './pages/super-admin/parametres/ParametresLayout.jsx'
import MotsDePasse from './pages/super-admin/parametres/MotsDePasse.jsx'
import Comptes from './pages/super-admin/parametres/Comptes.jsx'
import HistoriqueAdmin from './pages/super-admin/parametres/Historique.jsx'
import Assistance from './pages/super-admin/parametres/Assistance.jsx'
import Journaux from './pages/super-admin/parametres/Journaux.jsx'
import Sauvegarde from './pages/super-admin/parametres/Sauvegarde.jsx'
import Maintenance from './pages/super-admin/parametres/Maintenance.jsx'
import GerantLayout from './pages/gerant/GerantLayout.jsx'
import Dashboard from './pages/gerant/dashboard/Dashboard.jsx'
import UtilisateursLayout from './pages/gerant/utilisateurs/UtilisateursLayout.jsx'
import ListeVendeurs from './pages/gerant/utilisateurs/ListeVendeurs.jsx'
import CreerVendeur from './pages/gerant/utilisateurs/CreerVendeur.jsx'
import ArticlesLayout from './pages/gerant/articles/ArticlesLayout.jsx'
import ListeArticles from './pages/gerant/articles/ListeArticles.jsx'
import AjouterArticle from './pages/gerant/articles/AjouterArticle.jsx'
import ModifierArticle from './pages/gerant/articles/ModifierArticle.jsx'
import Categories from './pages/gerant/articles/Categories.jsx'
import StockLayout from './pages/gerant/stock/StockLayout.jsx'
import EntreeStock from './pages/gerant/stock/EntreeStock.jsx'
import Inventaire from './pages/gerant/stock/Inventaire.jsx'
import Ajustements from './pages/gerant/stock/Ajustements.jsx'
import VentesLayout from './pages/gerant/ventes/VentesLayout.jsx'
import NouvelleVente from './pages/gerant/ventes/NouvelleVente.jsx'
import HistoriqueVentes from './pages/gerant/ventes/HistoriqueVentes.jsx'
import BeneficesLayout from './pages/gerant/benefices/BeneficesLayout.jsx'
import Journalier from './pages/gerant/benefices/Journalier.jsx'
import Hebdomadaire from './pages/gerant/benefices/Hebdomadaire.jsx'
import Mensuel from './pages/gerant/benefices/Mensuel.jsx'
import Annuel from './pages/gerant/benefices/Annuel.jsx'
import FournisseursLayout from './pages/gerant/fournisseurs/FournisseursLayout.jsx'
import ListeFournisseurs from './pages/gerant/fournisseurs/ListeFournisseurs.jsx'
import AjouterFournisseur from './pages/gerant/fournisseurs/AjouterFournisseur.jsx'
import StatistiquesLayout from './pages/gerant/statistiques/StatistiquesLayout.jsx'
import StatsVendeurs from './pages/gerant/statistiques/StatsVendeurs.jsx'
import VentesStats from './pages/gerant/statistiques/VentesStats.jsx'
import BeneficesStats from './pages/gerant/statistiques/BeneficesStats.jsx'
import Alertes from './pages/gerant/alertes/Alertes.jsx'
import HistoriqueGerant from './pages/gerant/historique/HistoriqueGerant.jsx'
import ParametresGerant from './pages/gerant/parametres/ParametresGerant.jsx'
import VendeurLayout from './pages/vendeur/VendeurLayout.jsx'
import Caisse from './pages/vendeur/Caisse.jsx'
import RechercheArticle from './pages/vendeur/RechercheArticle.jsx'
import MesVentes from './pages/vendeur/MesVentes.jsx'

function BanniereHorsLigne() {
  const [horsLigne, setHorsLigne] = useState(!navigator.onLine)
  useEffect(() => {
    const on = () => setHorsLigne(false)
    const off = () => setHorsLigne(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  if (!horsLigne) return null
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: '#DC2626', color: '#fff', textAlign: 'center', padding: '10px', fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
      ⚠️ Connexion Internet perdue — Reconnectez-vous pour continuer
    </div>
  )
}

function RouteProtegee({ role, children }) {
  const [statut, setStatut] = useState('chargement')
  const [erreur, setErreur] = useState('')
  const [motifRefus, setMotifRefus] = useState('')

  useEffect(() => {
    const verifier = async () => {
      try {
        if (!navigator.onLine) { setErreur('Pas de connexion Internet'); setStatut('erreur'); return }
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { setStatut('refuse'); return }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, actif, etablissement_id')
          .eq('id', session.user.id)
          .single()
        if (error) throw error

        let etab = null
        if (profile?.role !== 'super_admin' && profile?.etablissement_id) {
          const { data: etabData } = await supabase
            .from('etablissements')
            .select('statut, date_fin_abonnement')
            .eq('id', profile.etablissement_id)
            .single()
          etab = etabData
        }

        if (profile?.role !== 'super_admin') {
          const { data: maintenance } = await supabase
            .from('parametres_globaux')
            .select('valeur')
            .eq('cle', 'maintenance')
            .single()
          if (maintenance?.valeur === 'true') {
            setMotifRefus("L'application est actuellement en maintenance. Merci de réessayer plus tard.")
            setStatut('refuse')
            return
          }
        }

        if (profile?.actif === false) {
          setMotifRefus('Votre compte a été suspendu.')
          setStatut('refuse')
          return
        }

        if (profile?.role !== 'super_admin') {
          const abonnementExpire = etab?.date_fin_abonnement && new Date(etab.date_fin_abonnement) < new Date()

          if (!etab || etab.statut !== 'Actif' || abonnementExpire) {
            setMotifRefus(
              abonnementExpire
                ? "L'abonnement de votre établissement a expiré. Contactez votre gérant ou l'administrateur."
                : "Votre établissement a été désactivé. Contactez l'administrateur."
            )
            setStatut('refuse')
            return
          }
        }

        if (Array.isArray(role) ? role.includes(profile?.role) : profile?.role === role) setStatut('autorise')
        else setStatut('refuse')
      } catch (e) {
        if (e.message?.includes('fetch') || e.message?.includes('network')) {
          setErreur('Connexion au serveur impossible. Vérifiez votre Internet.')
          setStatut('erreur')
        } else {
          setStatut('refuse')
        }
      }
    }
    verifier()
  }, [role])

  if (statut === 'chargement') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4F2', flexDirection: 'column', gap: 12, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #1A7A50', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ color: '#1A7A50', fontSize: 13 }}>Chargement...</span>
    </div>
  )
  if (statut === 'erreur') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4F2', flexDirection: 'column', gap: 14, fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: 20 }}>
      <div style={{ fontSize: 40 }}>📡</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0D1F16' }}>Connexion impossible</div>
      <div style={{ fontSize: 13, color: '#6B7A72', maxWidth: 300 }}>{erreur}</div>
      <button onClick={() => window.location.reload()} style={{ background: '#1A7A50', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        Réessayer
      </button>
    </div>
  )
  if (statut === 'refuse') {
    if (motifRefus) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4F2', flexDirection: 'column', gap: 14, fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 40 }}>🔒</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0D1F16' }}>Accès suspendu</div>
          <div style={{ fontSize: 13, color: '#6B7A72', maxWidth: 320 }}>{motifRefus}</div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} style={{ background: '#1A7A50', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Retour à l'accueil
          </button>
        </div>
      )
    }
    return <Navigate to="/" replace />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      <BanniereHorsLigne />
      <Routes>
        {/* La page d'accueil est toujours la toute première chose vue, jamais contournée */}
        <Route path="/" element={<Accueil />} />

        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<InscriptionGerant />} />
        <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
        <Route path="/reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse />} />
        <Route path="/aide" element={<BesoinAide />} />

        <Route path="/super-admin" element={<RouteProtegee role="super_admin"><SuperAdminLayout /></RouteProtegee>}>
          <Route index element={<Navigate to="etablissements" replace />} />
          <Route path="etablissements" element={<EtablissementsLayout />}>
            <Route index element={<Navigate to="inscriptions" replace />} />
            <Route path="inscriptions" element={<Inscriptions />} />
            <Route path="creation" element={<Creation />} />
            <Route path="modification" element={<Modification />} />
            <Route path="suppression" element={<Suppression />} />
            <Route path="activation" element={<Activation />} />
          </Route>
          <Route path="abonnements" element={<AbonnementsLayout />}>
            <Route index element={<Navigate to="formules" replace />} />
            <Route path="formules" element={<Formules />} />
            <Route path="statuts" element={<Statuts />} />
            <Route path="expiration" element={<Expiration />} />
          </Route>
          <Route path="parametres" element={<ParametresLayout />}>
            <Route index element={<Navigate to="mots-de-passe" replace />} />
            <Route path="mots-de-passe" element={<MotsDePasse />} />
            <Route path="comptes" element={<Comptes />} />
            <Route path="historique" element={<HistoriqueAdmin />} />
            <Route path="assistance" element={<Assistance />} />
            <Route path="journaux" element={<Journaux />} />
            <Route path="sauvegarde" element={<Sauvegarde />} />
            <Route path="maintenance" element={<Maintenance />} />
          </Route>
        </Route>

        <Route path="/gerant" element={<RouteProtegee role={['gerant', 'super_admin']}><GerantLayout /></RouteProtegee>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="utilisateurs" element={<UtilisateursLayout />}>
            <Route index element={<Navigate to="liste" replace />} />
            <Route path="liste" element={<ListeVendeurs />} />
            <Route path="creer" element={<CreerVendeur />} />
          </Route>
          <Route path="articles" element={<ArticlesLayout />}>
            <Route index element={<Navigate to="liste" replace />} />
            <Route path="liste" element={<ListeArticles />} />
            <Route path="ajouter" element={<AjouterArticle />} />
            <Route path="modifier" element={<ModifierArticle />} />
            <Route path="categories" element={<Categories />} />
          </Route>
          <Route path="stock" element={<StockLayout />}>
            <Route index element={<Navigate to="entree" replace />} />
            <Route path="entree" element={<EntreeStock />} />
            <Route path="inventaire" element={<Inventaire />} />
            <Route path="ajustements" element={<Ajustements />} />
          </Route>
          <Route path="ventes" element={<VentesLayout />}>
            <Route index element={<Navigate to="nouvelle" replace />} />
            <Route path="nouvelle" element={<NouvelleVente />} />
            <Route path="historique" element={<HistoriqueVentes />} />
          </Route>
          <Route path="benefices" element={<BeneficesLayout />}>
            <Route index element={<Navigate to="journalier" replace />} />
            <Route path="journalier" element={<Journalier />} />
            <Route path="hebdomadaire" element={<Hebdomadaire />} />
            <Route path="mensuel" element={<Mensuel />} />
            <Route path="annuel" element={<Annuel />} />
          </Route>
          <Route path="fournisseurs" element={<FournisseursLayout />}>
            <Route index element={<Navigate to="liste" replace />} />
            <Route path="liste" element={<ListeFournisseurs />} />
            <Route path="ajouter" element={<AjouterFournisseur />} />
          </Route>
          <Route path="statistiques" element={<StatistiquesLayout />}>
            <Route index element={<Navigate to="vendeurs" replace />} />
            <Route path="vendeurs" element={<StatsVendeurs />} />
            <Route path="ventes" element={<VentesStats />} />
            <Route path="benefices" element={<BeneficesStats />} />
          </Route>
          <Route path="alertes" element={<Alertes />} />
          <Route path="historique" element={<HistoriqueGerant />} />
          <Route path="parametres" element={<ParametresGerant />} />
        </Route>

        <Route path="/vendeur" element={<RouteProtegee role={['vendeur', 'gerant', 'super_admin']}><VendeurLayout /></RouteProtegee>}>
          <Route index element={<Navigate to="caisse" replace />} />
          <Route path="caisse" element={<Caisse />} />
          <Route path="articles" element={<RechercheArticle />} />
          <Route path="historique" element={<MesVentes />} />
        </Route>

        {/* Toute route inconnue ramène à l'accueil, jamais un écran blanc */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App