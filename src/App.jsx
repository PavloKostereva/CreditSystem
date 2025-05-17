import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import MainPage from './components/MainPage'
import AboutPage from './components/AboutPage'
import Home from './components/Home'
import InstructionsPage from './components/InstructionsPage'
import Calculator from './components/Calculator'
import Portfolio from './components/Portfolio'
import Exit from './components/Exit'

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Navigate to="/mainpage" replace />} />
        <Route path="/mainpage" element={<MainPage />} />
        <Route path="/aboutpage" element={<AboutPage />} />
        <Route path="/instructionspage" element={<InstructionsPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/exit" element={<Exit />} />
      </Routes>
    </Router>
  )
}

export default App