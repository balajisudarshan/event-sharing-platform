import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import NavBar from '../components/NavBar'
import { AuthProvider } from '../context/AuthContext'

const RootLayout = () => (
  <AuthProvider>
    <NavBar />
    <Outlet />
    <TanStackRouterDevtools />
  </AuthProvider>
)

export const Route = createRootRoute({ component: RootLayout })