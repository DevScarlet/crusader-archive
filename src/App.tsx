import { Route, Routes } from 'react-router-dom'
import ArmyPlanner from './pages/ArmyPlanner'
import Navbar from './components/Navbar'
import Toast from './components/Toast'
import Compare from './pages/Compare'
import FactionDetail from './pages/FactionDetail'
import Factions from './pages/Factions'
import Favorites from './pages/Favorites'
import Home from './pages/Home'
import UnitDetail from './pages/UnitDetail'
import Units from './pages/Units'

function App() {
  return (
    <>
      <Navbar />
      <main className="page-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/factions" element={<Factions />} />
          <Route path="/factions/:factionName" element={<FactionDetail />} />
          <Route path="/units" element={<Units />} />
          <Route path="/units/:unitIdentifier" element={<UnitDetail />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/army-planner" element={<ArmyPlanner />} />
        </Routes>
      </main>
      <Toast />
    </>
  )
}

export default App
