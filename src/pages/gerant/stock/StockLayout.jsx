import { NavLink, Outlet, useOutletContext } from 'react-router-dom'

export default function StockLayout() {
  const context = useOutletContext()
  return (
    <>
      <div className="sub-tabs">
        <NavLink to="entree" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Entrée de stock</NavLink>
        <NavLink to="inventaire" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Inventaire</NavLink>
        <NavLink to="ajustements" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Ajustements</NavLink>
      </div>
      <Outlet context={context} />
    </>
  )
}