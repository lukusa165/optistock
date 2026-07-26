import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Icon } from '../../../components/Icons.jsx'
import {
  supabase,
  telephoneVersEmail,
  genererNumeroGerant,
  genererMotDePasse,
} from '../../../lib/supabaseClient.js'

const emptyForm = { prefixeGerant: '', nomGerant: '', nomEtablissement: '', type: 'Boutique', dateFin: '' }
const TYPES = ['Boutique', 'Pharmacie', 'Alimentation', 'Mini-supermarché', 'Dépôt', 'Magasin', 'Entrepôt']

export default function Creation() {
  const { setEtablissements } = useOutletContext()
  const [form, setForm] = useState(emptyForm)
  const [resultat, setResultat] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  const copier = (texte, label) => {
    navigator.clipboard.writeText(texte)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (form.prefixeGerant.length !== 3) {
      setError("Saisis exactement 3 chiffres pour le préfixe.")
      return
    }
    setError('')
    setLoading(true)

    const numeroGerant = genererNumeroGerant(form.prefixeGerant)
    const motDePasse = genererMotDePasse()
    const emailGerant = telephoneVersEmail(numeroGerant)

    // Date de fin automatique : 30 jours
    const dateFinDefaut = new Date()
    dateFinDefaut.setDate(dateFinDefaut.getDate() + 30)
    const dateFin = form.dateFin || dateFinDefaut.toISOString().slice(0, 10)

    // 1. Créer le compte Auth du gérant
   const { data: authData, error: authError } = await supabase.auth.signUp({
  email: emailGerant,
  password: motDePasse,
})
    if (authError) {
      setError(`Erreur création du compte : ${authError.message}`)
      setLoading(false)
      return
    }

    const gerantId = authData.user.id

    // 2. Créer le profil gérant
    const { error: profileError } = await supabase.from('profiles').insert({
      id: gerantId,
      role: 'gerant',
      nom_complet: form.nomGerant,
      telephone: numeroGerant,
    })

    if (profileError) {
      setError(`Erreur création du profil : ${profileError.message}`)
      setLoading(false)
      return
    }

    // 3. Créer l'établissement
    const { data: etab, error: etabError } = await supabase
      .from('etablissements')
      .insert({
        nom: form.nomEtablissement,
        type: form.type,
        gerant_id: gerantId,
        email_gerant: emailGerant,
        statut: 'Actif',
        plan: 'Essai gratuit',
        date_fin_abonnement: dateFin,
      })
      .select()
      .single()

    if (etabError) {
      setError(`Erreur création établissement : ${etabError.message}`)
      setLoading(false)
      return
    }

    // 4. Lier le gérant à l'établissement
    await supabase.from('profiles')
      .update({ etablissement_id: etab.id })
      .eq('id', gerantId)

    setEtablissements((list) => [...list, etab])

    setResultat({
      nomEtablissement: form.nomEtablissement,
      nomGerant: form.nomGerant,
      numeroGerant,
      motDePasse,
      dateFin,
    })

    setForm(emptyForm)
    setLoading(false)
  }

  return (
    <div className="panel" style={{ maxWidth: 520 }}>
      <div className="panel-head">
        <h2>Créer un établissement</h2>
        <div className="cap-icon"><Icon.FilePlus /></div>
      </div>

      {/* Résultat après création */}
      {resultat && (
        <div className="credentials-box">
          <div className="cred-title">
            <Icon.Key style={{ width: 16, height: 16 }} />
            Compte créé — « {resultat.nomEtablissement} »
          </div>
          <p className="cred-sub">
            Transmets ces identifiants au gérant <strong>{resultat.nomGerant}</strong>.
            Il peut se connecter dès maintenant avec son numéro de téléphone.
          </p>

          <div className="cred-row">
            <div>
              <div className="cred-label">NUMÉRO (IDENTIFIANT)</div>
              <div className="cred-value">{resultat.numeroGerant}</div>
            </div>
            <button className="cred-copy" onClick={() => copier(resultat.numeroGerant, 'num')}>
              {copied === 'num' ? '✓ Copié' : 'Copier'}
            </button>
          </div>

          <div className="cred-row">
            <div>
              <div className="cred-label">MOT DE PASSE</div>
              <div className="cred-value">{resultat.motDePasse}</div>
            </div>
            <button className="cred-copy" onClick={() => copier(resultat.motDePasse, 'mdp')}>
              {copied === 'mdp' ? '✓ Copié' : 'Copier'}
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon.Clock style={{ width: 13, height: 13 }} />
            Abonnement actif jusqu'au : <strong>{new Date(resultat.dateFin).toLocaleDateString('fr-FR')}</strong>
          </div>
        </div>
      )}

      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={submit}>
        <div className="m-field">
          <label>Préfixe du numéro gérant (3 chiffres)</label>
          <input
            type="text"
            maxLength={3}
            value={form.prefixeGerant}
            onChange={(e) => setForm({ ...form, prefixeGerant: e.target.value.replace(/\D/g, '') })}
            placeholder="Ex : 077"
            required
          />
          <div className="hint">Le système complétera les 7 chiffres restants automatiquement.</div>
        </div>

        <div className="m-field">
          <label>Nom du gérant</label>
          <input
            value={form.nomGerant}
            onChange={(e) => setForm({ ...form, nomGerant: e.target.value })}
            placeholder="Ex : Moussa Diallo"
            required
          />
        </div>

        <div className="m-field">
          <label>Nom de l'établissement</label>
          <input
            value={form.nomEtablissement}
            onChange={(e) => setForm({ ...form, nomEtablissement: e.target.value })}
            placeholder="Ex : Pharmacie Al Amane"
            required
          />
        </div>

        <div className="m-field">
          <label>Type d'établissement</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="m-field">
          <label>Date de fin d'abonnement (optionnel)</label>
          <input
            type="date"
            value={form.dateFin}
            onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
          />
          <div className="hint">Si vide, essai gratuit de 30 jours appliqué automatiquement.</div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          disabled={loading}
        >
          <Icon.Plus />
          {loading ? 'Création en cours...' : "Créer l'établissement"}
        </button>
      </form>
    </div>
  )
}