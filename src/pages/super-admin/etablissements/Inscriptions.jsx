import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'
import Pagination from '../../../components/Pagination.jsx'

const PAGE_SIZE = 20

export default function Inscriptions() {
  const { rafraichirStats } = useOutletContext()
  const [demandes, setDemandes] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [traitement, setTraitement] = useState(null)
  const [rejet, setRejet] = useState(null)
  const [motifRejet, setMotifRejet] = useState('')
  const [resultat, setResultat] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { charger() }, [page])

  const charger = async () => {
    setLoading(true)
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, count, error: err } = await supabase
      .from('demandes_inscription')
      .select('*', { count: 'exact' })
      .eq('statut', 'en_attente')
      .order('created_at', { ascending: true })
      .range(from, to)
    if (!err) { setDemandes(data || []); setTotalCount(count || 0) }
    setLoading(false)
  }

  const approuver = async (demande) => {
    setTraitement(demande.id)
    setError('')
    const { data, error: fnError } = await supabase.functions.invoke('approuver-inscription', {
      body: { demande_id: demande.id, action: 'approuver' },
    })

    if (fnError || data?.error) {
      setError(`Erreur : ${data?.error || fnError.message}`)
      setTraitement(null)
      return
    }

    setResultat(data)
    setTraitement(null)
    charger()
    rafraichirStats()
  }

  const confirmerRejet = async () => {
    setTraitement(rejet.id)
    const { error: fnError } = await supabase.functions.invoke('approuver-inscription', {
      body: { demande_id: rejet.id, action: 'rejeter', motif_rejet: motifRejet.trim() || null },
    })
    setTraitement(null)
    if (!fnError) {
      setRejet(null)
      setMotifRejet('')
      charger()
    }
  }

  const copier = (texte) => navigator.clipboard.writeText(texte)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <>
    {resultat && (
  <div className="panel" style={{ borderColor: 'var(--success)' }}>
    <div className="alert-success">
      ✓ Compte approuvé pour « {resultat.nomEtablissement} ». {resultat.nomGerant} peut maintenant se connecter avec son email <strong>{resultat.email}</strong> et le mot de passe qu'il a choisi à l'inscription.
    </div>
    <button className="btn-ghost" onClick={() => setResultat(null)}>Fermer</button>
  </div>
)}

      {error && <div className="alert-error">{error}</div>}

      <div className="panel">
        <div className="panel-head"><h2>Demandes d'inscription en attente ({totalCount})</h2></div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>Chargement...</div>
        ) : demandes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon.Inbox /></div>
            <h3>Aucune demande en attente</h3>
            <p>Les nouvelles demandes d'inscription apparaîtront ici.</p>
          </div>
        ) : (
          <>
            <table>
              <thead><tr><th>Gérant</th><th>Établissement</th><th>Type</th><th>Formule</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {demandes.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div className="name-cell">{d.nom_gerant}</div>
                      <div className="sub-cell">{d.telephone}</div>
                    </td>
                    <td style={{ fontSize: 12.5 }}>{d.nom_etablissement}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--muted)' }}>{d.type_etablissement}</td>
                    <td style={{ fontSize: 12.5 }}>{d.plan_souhaite}</td>
                    <td style={{ fontSize: 11.5, color: 'var(--muted)' }}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          onClick={() => approuver(d)}
                          disabled={traitement === d.id}
                          title="Approuver"
                          style={{ color: 'var(--success)' }}
                        >
                          <Icon.Power />
                        </button>
                        <button
                          className="danger"
                          onClick={() => { setRejet(d); setMotifRejet('') }}
                          disabled={traitement === d.id}
                          title="Rejeter"
                        >
                          <Icon.X />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} setPage={setPage} totalPages={totalPages} totalCount={totalCount} pageSize={PAGE_SIZE} />
          </>
        )}
      </div>

      {rejet && (
        <div className="overlay" onClick={() => setRejet(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Rejeter la demande de {rejet.nom_gerant} ?</h3>
              <button className="modal-close" onClick={() => setRejet(null)}><Icon.X /></button>
            </div>
            <div className="m-field">
              <label>Motif (optionnel)</label>
              <input value={motifRejet} onChange={(e) => setMotifRejet(e.target.value)} placeholder="Ex : Informations incomplètes" />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setRejet(null)}>Annuler</button>
              <button className="btn-danger" style={{ flex: 1 }} onClick={confirmerRejet} disabled={traitement === rejet.id}>
                {traitement === rejet.id ? 'Rejet...' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}