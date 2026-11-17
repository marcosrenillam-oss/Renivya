import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { base44, isLocalMode } from '@/api/base44Client'

const AuthContext = createContext(null)

function errorStatus(error) {
  return error?.status ?? error?.response?.status ?? null
}

function errorReason(error) {
  const data = error?.data ?? error?.response?.data
  return data?.extra_data?.reason ?? data?.reason ?? error?.code ?? null
}

/**
 * Estado de autenticación de la app.
 * - isLoadingPublicSettings: comprobación inicial de la app (acceso, registro).
 * - isLoadingAuth: carga del usuario actual.
 * - authError: solo errores a nivel de app ('user_not_registered', 'auth_required').
 *   La simple ausencia de sesión NO es un error: la gestiona ProtectedRoute.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true)
  const [authError, setAuthError] = useState(null)

  const loadUser = useCallback(async () => {
    setIsLoadingAuth(true)
    try {
      const hasSession = await base44.auth.isAuthenticated()
      if (!hasSession) {
        setUser(null)
        setAuthError(null)
        return null
      }
      const me = await base44.auth.me()
      setUser(me)
      setAuthError(null)
      return me
    } catch (error) {
      const status = errorStatus(error)
      const reason = errorReason(error)
      setUser(null)
      if (reason === 'user_not_registered') setAuthError({ type: 'user_not_registered', message: error.message })
      else if (status === 403 && reason === 'auth_required') setAuthError({ type: 'auth_required', message: error.message })
      else setAuthError(null)
      return null
    } finally {
      setIsLoadingAuth(false)
      setIsLoadingPublicSettings(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = useCallback(
    async (email, password) => {
      await base44.auth.loginViaEmailPassword(email, password)
      return loadUser()
    },
    [loadUser]
  )

  const loginAsLocalGuest = useCallback(async () => {
    if (!isLocalMode) return null
    await base44.auth.loginAsLocalGuest()
    return loadUser()
  }, [loadUser])

  const logout = useCallback(() => {
    setUser(null)
    base44.auth.logout(isLocalMode ? undefined : `${window.location.origin}/login`)
  }, [])

  const updateMe = useCallback(async (data) => {
    const next = await base44.auth.updateMe(data)
    setUser(next)
    return next
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      isLocalMode,
      refreshUser: loadUser,
      login,
      loginAsLocalGuest,
      logout,
      updateMe,
    }),
    [user, isLoadingAuth, isLoadingPublicSettings, authError, loadUser, login, loginAsLocalGuest, logout, updateMe]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
