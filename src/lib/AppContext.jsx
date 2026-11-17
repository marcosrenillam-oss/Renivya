import { createContext, useContext, useMemo, useState } from 'react'

/**
 * Estado de interfaz compartido por el AppShell (no de datos).
 * - navOpen: menú desplegable desde el símbolo.
 * - worldMode: vista de importancia global sin personalización.
 */
const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [navOpen, setNavOpen] = useState(false)
  const [worldMode, setWorldMode] = useState(true)

  const value = useMemo(() => ({ navOpen, setNavOpen, worldMode, setWorldMode }), [navOpen, worldMode])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>')
  return ctx
}
