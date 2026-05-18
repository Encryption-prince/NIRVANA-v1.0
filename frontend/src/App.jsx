import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import AppNav from './components/AppNav'
import SessionHistory from './pages/SessionHistory'
import StartSession from './pages/StartSession'

function App() {
  return (
    <BrowserRouter>
      <AppNav />
      <Routes>
        <Route path="/" element={<StartSession />} />
        <Route path="/history" element={<SessionHistory />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
