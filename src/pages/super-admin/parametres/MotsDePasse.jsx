import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

export default function MotsDePasse() {
  const [recherche, setRecherche] = useState('')
  const [comptes, setComptes] = useState([])
  const [resultat, setResultat] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { charger() }, [])

  const charger = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, nom_complet, telephone, role, etablissements(nom)')
      .in('role', ['gerant', 'vendeur'])
      .order('nom_complet')
    setComptes(data || [])
  }

  const filtres = comptes.filter((c) =>
    c.nom_complet?.toLowerCase().includes(recherche.toLowerCase()) || c.telephone?.includes(recherche)
  )

  const reinitialiser = async (compte) => {
    setLoading(true)
    setResultat(null)
    const { data, error } = await supabase.functions.invoke('reinitialiser-mot-de-passe', { body: { user_id: compte.id } })
    if (error || data?.error) {
      alert(`Erreur : ${data?.error || error.message}`)
    } else {
      setResultat({ nom: compte.nom_complet, mdp: data.mot_de_passe })
    }
    setLoading(false)
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Réinitialiser un mot de passe</h2>
        <input
          type="text" placeholder="Rechercher un nom ou numéro..." value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '7px 12px', fontSize: 12.5, background: 'var(--panel-2)', outline: 'none', width: 240 }}
        />
      </div>

      {resultat && (
        <div className="credentials-box">
          <div className="cred-title"><Icon.Key style={{ width: 14, height: 14 }} />Nouveau mot de passe — {resultat.nom}</div>
          <div className="cred-row">
            <div><div className="cred-label">MOT DE PASSE</div><div className="cred-value">{resultat.mdp}</div></div>
            <button className="cred-copy" onClick={() => navigator.clipboard.writeText(resultat.mdp)}>Copier</button>
          </div>
        </div>
      )}

      <table>
        <thead><tr><th>Nom</th><th>Numéro</th><th>Rôle</th><th>Établissement</th><th></th></tr></thead>
        <tbody>
          {filtres.map((c) => (
            <tr key={c.id}>
              <td className="name-cell">{c.nom_complet}</td>
              <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5 }}>{c.telephone}</td>
              <td><span className="badge" style={{ color: 'var(--accent)', background: 'var(--accent-pale)' }}>{c.role}</span></td>
              <td style={{ fontSize: 12.5, color: 'var(--muted)' }}>{c.etablissements?.nom || '—'}</td>
              <td>
                <button className="btn-ghost" disabled={loading} onClick={() => reinitialiser(c)}>Réinitialiser</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}