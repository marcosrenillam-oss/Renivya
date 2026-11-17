import { Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

/** Renderiza las rutas hijas solo con sesión; si no, `unauthenticatedElement`. */
export default function ProtectedRoute({ unauthenticatedElement = null }) {
  const { isAuthenticated, isLoadingAuth } = useAuth()
  if (isLoadingAuth) return null
  return isAuthenticated ? <Outlet /> : unauthenticatedElement
}
