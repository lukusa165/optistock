import { supabase } from './supabaseClient.js'

export async function logAction({ etablissement_id, user_id, user_nom, type, description, meta = {} }) {
  try {
    await supabase.from('historique_gerant').insert({
      etablissement_id,
      user_id,
      user_nom,
      type,
      description,
      meta,
    })
  } catch (e) {
    console.error('Erreur historique:', e)
  }
}