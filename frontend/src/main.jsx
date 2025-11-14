import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import App from './App.jsx'
const router = createRouter({ routeTree })

createRoot(document.getElementById('root')).render(
  <StrictMode>

    <RouterProvider router={router} />
      
    

  </StrictMode>,
)
