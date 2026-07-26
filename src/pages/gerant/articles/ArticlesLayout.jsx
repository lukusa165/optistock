import { NavLink, Outlet, useOutletContext } from 'react-router-dom'

export default function ArticlesLayout() {
  const context = useOutletContext()

  return (
    <>
      <div className="sub-tabs">
        <NavLink to="liste" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Liste des articles</NavLink>
        <NavLink to="ajouter" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Ajouter un article</NavLink>
        <NavLink to="categories" className={({ isActive }) => `sub-tab ${isActive ? 'active' : ''}`}>Catégories</NavLink>
      </div>
      <Outlet context={context} />
    </>
  )
}