import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import Reveal from './pages/Reveal'
import Voting from './pages/Voting'
import Results from './pages/Results'

function PageTransition({ children }) {
  const location = useLocation()
  
  useEffect(() => {
    // Trigger page transition animation
    document.body.style.opacity = '0'
    setTimeout(() => {
      document.body.style.transition = 'opacity 0.3s ease-out'
      document.body.style.opacity = '1'
    }, 10)
  }, [location.pathname])
  
  return children
}

function App() {
  return (
    <Router>
      <PageTransition>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/reveal" element={<Reveal />} />
          <Route path="/voting" element={<Voting />} />
          <Route path="/results" element={<Results />} />
          <Route path="/join/:roomCode" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </Router>
  )
}

export default App

