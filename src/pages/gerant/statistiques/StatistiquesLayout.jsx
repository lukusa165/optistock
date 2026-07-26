import { NavLink, Outlet, useOutletContext } from 'react-router-dom'

export default function StatistiquesLayout() {
  const context = useOutletContext()
  return (
    <>
      <div className="sub-tabs">
        <NavLink to="vendeurs" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Par vendeur</NavLink>
        <NavLink to="ventes" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Ventes</NavLink>
        <NavLink to="benefices" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Bénéfices</NavLink>
      </div>
      <Outlet context={context} />
    </>
  )
}