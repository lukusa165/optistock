import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

export default function Modification() {
  const { etablissements, setEtablissements } = useOutletContext()
  const [demandes, setDemandes] = useState([])
  const [plansDisponibles, setPlansDisponibles] = useState([])
  const [edition, setEdition] = useState(null)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [succes, setSucces] = useState('')
  const [loading, setLoading] = useState(false)
  const [lienAcces, setLienAcces] = useState(null)
  const [urgence, setUrgence] = useState(null)
  const [motifUrgence, setMotifUrgence] = useState('')

  useEffect(() => {
    chargerDemandes()
    chargerPlans()
  }, [])

  const chargerDemandes = async () => {
    const { data } = await supabase
      .from('demandes_acces')
      .select('*, etablissements(nom), profiles!demandes_acces_gerant_id_fkey(nom_complet)')
      .eq('statut', 'en_attente')
      .order('created_at', { ascending: false })
    setDemandes(data || [])
  }

  const chargerPlans = async () => {
    const { data } = await supabase.from('plans').select('*').order('ordre', { ascending: true })
    setPlansDisponibles(data || [])
  }

  const ouvrirEdition = (etab) => {
    setEdition(etab)
    setForm({
      nom: etab.nom, type: etab.type, plan: etab.plan,
      date_fin_abonnement: etab.date_fin_abonnement?.slice(0, 10) || '',
    })
    setError(''); setSucces('')
  }

  // Change juste le champ plan dans le formulaire, sans toucher à la date pour l'instant
  const changerPlanSelectionne = (nouveauPlan) => {
    setForm({ ...form, plan: nouveauPlan })
  }

  // Bouton rapide : redémarre une période de 30 jours à partir d'aujourd'hui
  const redemarrerPeriode = () => {
    const nouvelleDate = new Date()
    nouvelleDate.setDate(nouvelleDate.getDate() + 30)
    setForm({ ...form, date_fin_abonnement: nouvelleDate.toISOString().slice(0, 10) })
  }

  const joursRestantsActuels = edition?.date_fin_abonnement
    ? Math.ceil((new Date(edition.date_fin_abonnement) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  const enregistrer = async (e) => {
    e.preventDefault()
    setError(''); setSucces('')
    setLoading(true)

    const planAChange = form.plan !== edition.plan

    const { error: updateError } = await supabase
      .from('etablissements')
      .update({
        nom: form.nom, type: form.type, plan: form.plan,
        date_fin_abonnement: form.date_fin_abonnement || null,
      })
      .eq('id', edition.id)

    if (updateError) {
      setError(`Erreur : ${updateError.message}`)
      setLoading(false)
      return
    }

    if (planAChange) {
      await supabase.from('historique').insert({
        etablissement_id: edition.id,
        user_nom: 'Super Admin',
        type: 'changement_plan',
        description: `Changement de formule : "${edition.plan}" → "${form.plan}". Nouvelle échéance : ${form.date_fin_abonnement ? new Date(form.date_fin_abonnement).toLocaleDateString('fr-FR') : 'non définie'}.`,
      })
    }

    setEtablissements((list) => list.map((e) => (e.id === edition.id ? { ...e, ...form } : e)))
    setSucces('✓ Établissement modifié avec succès.')
    setLoading(false)
    setTimeout(() => setEdition(null), 1200)
  }

  const accederViaDemande = async (demande) => {
    setLoading(true)
    setError('')
    const { data, error: fnError } = await supabase.functions.invoke('acceder-compte-gerant', {
      body: { demande_id: demande.id },
    })

    if (fnError || data?.error) {
      setError(`Erreur : ${data?.error || fnError.message}`)
      setLoading(false)
      return
    }

    setLienAcces(data.lien)
    setDemandes((list) => list.filter((d) => d.id !== demande.id))
    setLoading(false)
  }

  const confirmerUrgence = async () => {
    if (!motifUrgence.trim()) { setError('Le motif est obligatoire pour un accès d\'urgence.'); return }
    setLoading(true)
    setError('')

    const { data, error: fnError } = await supabase.functions.invoke('acceder-compte-gerant', {
      body: { gerant_id: urgence.gerant_id, motif_urgence: motifUrgence.trim() },
    })

    if (fnError || data?.error) {
      setError(`Erreur : ${data?.error || fnError.message}`)
      setLoading(false)
      return
    }

    setLienAcces(data.lien)
    setUrgence(null)
    setMotifUrgence('')
    setLoading(false)
  }

  return (
    <>
      {demandes.length > 0 && (
        <div className="panel" style={{ borderColor: 'var(--warning)' }}>
          <div className="panel-head"><h2>Demandes d'accès en attente ({demandes.length})</h2></div>
          {demandes.map((d) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 4px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  {d.profiles?.nom_complet} — {d.etablissements?.nom}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{d.motif}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {new Date(d.created_at).toLocaleString('fr-FR')}
                </div>
              </div>
              <button className="btn-primary" disabled={loading} onClick={() => accederViaDemande(d)}>
                <Icon.Key style={{ width: 14, height: 14 }} />
                Accéder au compte
              </button>
            </div>
          ))}
        </div>
      )}

      {lienAcces && (
        <div className="panel" style={{ borderColor: 'var(--success)' }}>
          <div className="alert-success" style={{ marginBottom: 10 }}>
            ✓ Lien de connexion généré. Ce lien est à usage unique et expire rapidement.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={lienAcces} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none' }}>
              Ouvrir le compte du gérant
            </a>
            <button className="btn-ghost" onClick={() => setLienAcces(null)}>Fermer</button>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-head"><h2>Modifier un établissement</h2></div>

        {etablissements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon.FileEdit /></div>
            <h3>Aucun établissement</h3>
            <p>Créez d'abord un établissement pour pouvoir le modifier.</p>
          </div>
        ) : (
          <table>
            <thead><tr><th>Établissement</th><th>Type</th><th>Plan</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              {etablissements.map((etab) => (
                <tr key={etab.id}>
                  <td className="name-cell">{etab.nom}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{etab.type}</td>
                  <td style={{ fontSize: 12.5 }}>{etab.plan}</td>
                  <td>
                    <span className="badge" style={{
                      color: etab.statut === 'Actif' ? 'var(--success)' : 'var(--danger)',
                      background: etab.statut === 'Actif' ? 'rgba(22,163,74,.08)' : 'rgba(220,38,38,.08)'
                    }}>{etab.statut}</span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => ouvrirEdition(etab)} title="Modifier"><Icon.Edit /></button>
                      <button
                        onClick={() => { setUrgence(etab); setError(''); setMotifUrgence('') }}
                        title="Accès d'urgence au compte gérant"
                        style={{ color: 'var(--warning)' }}
                      >
                        <Icon.Key />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {edition && (
        <div className="overlay" onClick={() => setEdition(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Modifier « {edition.nom} »</h3>
              <button className="modal-close" onClick={() => setEdition(null)}><Icon.X /></button>
            </div>

            {succes && <div className="alert-success">{succes}</div>}
            {error && <div className="alert-error">{error}</div>}

            <form onSubmit={enregistrer}>
              <div className="m-field">
                <label>Nom de l'établissement</label>
                <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
              </div>
              <div className="m-field">
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {['Boutique', 'Pharmacie', 'Alimentation', 'Mini-supermarché', 'Dépôt', 'Magasin', 'Entrepôt'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="m-field">
                <label>Formule d'abonnement</label>
                <select value={form.plan} onChange={(e) => changerPlanSelectionne(e.target.value)}>
                  {plansDisponibles.map((p) => (
                    <option key={p.id} value={p.nom}>
                      {p.nom} — {p.prix_label} ({p.limite_vendeurs ?? 'illimité'} vendeur{p.limite_vendeurs !== 1 ? 's' : ''})
                    </option>
                  ))}
                </select>
                {form.plan !== edition.plan && (
                  <div className="hint" style={{ color: 'var(--warning)' }}>
                    ⚠️ Changement de formule détecté : "{edition.plan}" → "{form.plan}". Pensez à vérifier l'échéance ci-dessous.
                  </div>
                )}
              </div>

              <div className="m-field">
                <label>Date de fin d'abonnement</label>
                <input type="date" value={form.date_fin_abonnement} onChange={(e) => setForm({ ...form, date_fin_abonnement: e.target.value })} />
                {joursRestantsActuels !== null && (
                  <div className="hint">
                    Échéance actuelle enregistrée : {joursRestantsActuels >= 0 ? `${joursRestantsActuels} jour(s) restant(s)` : `expirée depuis ${Math.abs(joursRestantsActuels)} jour(s)`}.
                  </div>
                )}
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ marginTop: 8, fontSize: 11.5, padding: '5px 10px' }}
                  onClick={redemarrerPeriode}
                >
                  Redémarrer 30 jours à partir d'aujourd'hui
                </button>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setEdition(null)}>Annuler</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {urgence && (
        <div className="overlay" onClick={() => setUrgence(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>⚠️ Accès d'urgence</h3>
              <button className="modal-close" onClick={() => setUrgence(null)}><Icon.X /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 12 }}>
              Vous allez accéder directement au compte du gérant de <strong>{urgence.nom}</strong>, sans demande préalable de sa part.
              Cette action sera <strong>enregistrée dans l'historique</strong> et visible par le gérant.
            </p>
            <div className="m-field">
              <label>Motif (obligatoire)</label>
              <textarea
                value={motifUrgence}
                onChange={(e) => setMotifUrgence(e.target.value)}
                placeholder="Ex : Le gérant ne peut plus se connecter suite à un problème technique urgent."
                required
              />
            </div>
            {error && <div className="alert-error">{error}</div>}
            <div className="modal-actions">
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setUrgence(null)}>Annuler</button>
              <button className="btn-danger" style={{ flex: 1 }} disabled={loading} onClick={confirmerUrgence}>
                {loading ? 'Génération...' : "Confirmer l'accès d'urgence"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}