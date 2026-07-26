import { NavLink, Outlet, useOutletContext } from 'react-router-dom'

export default function UtilisateursLayout() {
  const context = useOutletContext()

  return (
    <>
      <div className="sub-tabs">
        <NavLink to="liste" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Mes vendeurs</NavLink>
        <NavLink to="creer" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Créer un vendeur</NavLink>
      </div>
      <Outlet context={context} />
    </>
  )
}