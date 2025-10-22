import { Route, Routes } from 'react-router-dom'
import './App.css'
import ChatPage from './pages/ChatPage'
import DashboardPage from './pages/DashboardPage'
import HomePage from './pages/HomePage'


function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  )
}

export default App
