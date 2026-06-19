import { NavLink } from 'react-router-dom'

function Navbar() {
  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <NavLink className="brand" to="/">
          Crusader Archive
        </NavLink>
        <div className="nav-links">
          <NavLink to="/factions">Factions</NavLink>
          <NavLink to="/units">Units</NavLink>
          <NavLink to="/favorites">Favorites</NavLink>
          <NavLink to="/compare">Compare</NavLink>
          <NavLink to="/army-planner">Army Planner</NavLink>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
