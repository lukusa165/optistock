import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient.js'
import { Icon } from '../../../components/Icons.jsx'

export default function Maintenance() {
  const [actif, setActif] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { charger() }, [])

  const charger = async () => {
    const { data } = await supabase.from('parametres_globaux').select('valeur').eq('cle', 'maintenance').single()
    setActif(data?.valeur === 'true')
    setLoading(false)
  }

  const basculer = async () => {
    const nouvelleValeur = !actif
    setLoading(true)
    await supabase.from('parametres_globaux').update({ valeur: String(nouvelleValeur), updated_at: new Date().toISOString() }).eq('cle', 'maintenance')
    setActif(nouvelleValeur)
    setLoading(false)
  }

  return (
    <div className="panel" style={{ maxWidth: 460 }}>
      <div className="panel-head">
        <h2>Mode maintenance</h2>
        <div className="cap-icon"><Icon.Wrench /></div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 16 }}>
        Quand activé, tous les gérants et vendeurs sont empêchés d'accéder à l'application. Le super admin garde l'accès.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: actif ? 'rgba(220,38,38,.06)' : 'var(--panel-2)', borderRadius: 10, border: `1px solid ${actif ? 'var(--danger)' : 'var(--border)'}` }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{actif ? 'Maintenance activée' : 'Application en ligne'}</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{actif ? 'Les utilisateurs ne peuvent pas se connecter' : 'Tout fonctionne normalement'}</div>
        </div>
        <button className={actif ? 'btn-primary' : 'btn-danger'} disabled={loading} onClick={basculer}>
          {loading ? '...' : actif ? 'Désactiver' : 'Activer'}
        </button>
      </div>
    </div>
  )
}