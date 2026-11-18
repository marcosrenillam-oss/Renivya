import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { client } from '@/api/client'

/**
 * Sin cuentas ni contraseñas: cada dispositivo tiene un "lector" local que es el
 * propietario de sus preferencias y guardadas. Se crea solo la primera vez.
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      let me = null
      try {
        me = await client.auth.me()
      } catch {
        await client.auth.loginAsLocalGuest()
        me = await client.auth.me()
      }
      if (alive) {
        setUser(me)
        setIsLoadingAuth(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const updateMe = useCallback(async (data) => {
    const next = await client.auth.updateMe(data)
    setUser(next)
    return next
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError: null,
      updateMe,
    }),
    [user, isLoadingAuth, updateMe]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
