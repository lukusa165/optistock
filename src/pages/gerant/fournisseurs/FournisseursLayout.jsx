import { NavLink, Outlet, useOutletContext } from 'react-router-dom'

export default function FournisseursLayout() {
  const context = useOutletContext()
  return (
    <>
      <div className="sub-tabs">
        <NavLink to="liste" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Mes fournisseurs</NavLink>
        <NavLink to="ajouter" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Ajouter un fournisseur</NavLink>
      </div>
      <Outlet context={context} />
    </>
  )
}