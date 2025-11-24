import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import NavBar from './components/NavBar'
import Login from './pages/Login'
import Register from './components/Register'
import AllEvents from './pages/AllEvents'
import ViewRegistrations from './components/ViewRegistrations'
import AllUsers from './pages/AllUsers'
import ProtectedRoute from './utils/ProtectedRoute'
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavBar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/allevents" element={<AllEvents />} />
          <Route path="/allUsers" element={<AllUsers/>}/>
          <Route path="/getregistration/:id" element={<ViewRegistrations />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
