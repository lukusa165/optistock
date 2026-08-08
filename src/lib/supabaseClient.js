import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export function telephoneVersEmail(telephone) {
  return `${telephone.replace(/\s+/g, '')}@stellarbrightsoftware.com`
}

export function genererNumeroGerant(prefixe) {
  const clean = prefixe.replace(/\D/g, '').slice(0, 3)
  const suffixe = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('')
  return `${clean}${suffixe}`
}

export function genererNumeroVendeur(numeroGerant, numeroSuperAdmin) {
  const partGerant = numeroGerant.replace(/\s+/g, '').slice(0, 6)
  const partSA = numeroSuperAdmin.replace(/\s+/g, '').slice(-2)
  const partSysteme = Array.from({ length: 2 }, () => Math.floor(Math.random() * 10)).join('')
  return `${partGerant}${partSA}${partSysteme}`
}

export function genererMotDePasse() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function appelerEdgeFunction(nomFonction, body) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Non connecté')

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${nomFonction}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    }
  )

  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error || 'Erreur inconnue')
  return data
}

export async function creerGerantEtEtablissement({
  email, password, nom_complet, telephone,
  nom_etablissement, type_etablissement, date_fin_abonnement,
}) {
  return appelerEdgeFunction('creer-utilisateur', {
    email, password, role: 'gerant', nom_complet, telephone,
    creer_etablissement: true,
    nom_etablissement, type_etablissement, date_fin_abonnement,
  })
}

export async function creerVendeur({
  email, password, nom_complet, telephone, etablissement_id,
}) {
  return appelerEdgeFunction('creer-utilisateur', {
    email, password, role: 'vendeur', nom_complet, telephone,
    creer_etablissement: false,
    etablissement_id,
  })
}

export async function modifierMotDePasse(userId, nouveauMotDePasse) {
  return appelerEdgeFunction('modifier-mot-de-passe', { userId, nouveauMotDePasse })
}