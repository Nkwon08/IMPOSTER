import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import Reveal from './pages/Reveal'
import Voting from './pages/Voting'
import Results from './pages/Results'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/reveal" element={<Reveal />} />
        <Route path="/voting" element={<Voting />} />
        <Route path="/results" element={<Results />} />
        <Route path="/join/:roomCode" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

