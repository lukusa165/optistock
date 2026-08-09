import { NavLink, Outlet, useOutletContext } from 'react-router-dom'

export default function EtablissementsLayout() {
  const context = useOutletContext()

  return (
    <>
      <div className="sub-tabs">
        <NavLink to="inscriptions" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Inscriptions</NavLink>
        <NavLink to="creation" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Création</NavLink>
        <NavLink to="modification" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Modification</NavLink>
        <NavLink to="suppression" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Suppression</NavLink>
        <NavLink to="activation" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Activation</NavLink>
      </div>
      <Outlet context={context} />
    </>
  )
}