import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { client } from '@/api/client'

/**
 * Cuenta del lector: nombre, correo y contraseña (sin códigos de verificación), país de su
 * edición e idioma. Todo se guarda en el dispositivo; la contraseña, solo como hash.
 * El antiguo "lector local" anónimo cuenta como sin cuenta (sus guardadas pasan a la nueva).
 */
const AuthContext = createContext(null)

const isAccount = (u) => Boolean(u && u.id !== 'local-reader' && u.email)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  useEffect(() => {
    let alive = true
    client.auth
      .me()
      .then((me) => alive && setUser(isAccount(me) ? me : null))
      .catch(() => {})
      .finally(() => alive && setIsLoadingAuth(false))
    return () => {
      alive = false
    }
  }, [])

  const register = useCallback(async (data) => {
    const { user: next } = await client.auth.register(data)
    setUser(next)
    return next
  }, [])

  const login = useCallback(async (email, password) => {
    const { user: next } = await client.auth.loginViaEmailPassword(email, password)
    setUser(next)
    return next
  }, [])

  const logout = useCallback(() => {
    client.auth.logout()
    setUser(null)
  }, [])

  const updateMe = useCallback(async (data) => {
    const next = await client.auth.updateMe(data)
    setUser(next)
    return next
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), isLoadingAuth, register, login, logout, updateMe }),
    [user, isLoadingAuth, register, login, logout, updateMe]
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
