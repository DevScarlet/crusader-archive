import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import FactionDetail from './pages/FactionDetail'
import Factions from './pages/Factions'
import Favorites from './pages/Favorites'
import Home from './pages/Home'
import UnitDetail from './pages/UnitDetail'

function App() {
  return (
    <>
      <Navbar />
      <main className="page-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/factions" element={<Factions />} />
          <Route path="/factions/:factionName" element={<FactionDetail />} />
          <Route path="/units/:unitId" element={<UnitDetail />} />
          <Route path="/favorites" element={<Favorites />} />
        </Routes>
      </main>
    </>
  )
}

export default App
