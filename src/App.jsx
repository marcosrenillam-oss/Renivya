import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { queryClientInstance } from '@/lib/query-client'
import PageNotFound from './lib/PageNotFound'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import { ThemeProvider } from '@/lib/ThemeContext'
import { I18nProvider } from '@/lib/i18n/I18nContext'
import ScrollToTop from './components/ScrollToTop'
import AppShell from '@/components/layout/AppShell'
import SplashScreen from '@/components/shell/SplashScreen'
import Spinner from '@/components/common/Spinner'
import Home from '@/pages/Home'
import Welcome from '@/pages/Welcome'

// Vistas pesadas (three.js, Leaflet, recharts) bajo demanda: la portada abre antes.
const TopStories = lazy(() => import('@/pages/TopStories'))
const World = lazy(() => import('@/pages/World'))
const StoryDetail = lazy(() => import('@/pages/StoryDetail'))
const SearchPage = lazy(() => import('@/pages/Search'))
const SavedStories = lazy(() => import('@/pages/SavedStories'))
const Profile = lazy(() => import('@/pages/Profile'))
const Analytics = lazy(() => import('@/pages/Analytics'))
const Status = lazy(() => import('@/pages/Status'))

/** Redirección que conserva la consulta (?c=...). */
function KeepQuery({ to }) {
  const { search } = useLocation()
  return <Navigate to={{ pathname: to, search }} replace />
}

const page = (el, padded = false) => (
  <Suspense fallback={<Spinner className="mt-10" />}>{padded ? <div className="safe-x pt-3">{el}</div> : el}</Suspense>
)

const AppRoutes = () => {
  const { user, isLoadingAuth } = useAuth()
  // La página de noticia se precarga para que abrirla (y su transición de foto) sea instantáneo.
  useEffect(() => {
    const id = setTimeout(() => import('@/pages/StoryDetail'), 1200)
    return () => clearTimeout(id)
  }, [])
  if (isLoadingAuth) return null
  if (!user) return <Welcome />
  return (
    <Routes>
      {['/login', '/register', '/forgot-password', '/reset-password', '/mfa', '/network', '/brain'].map((p) => (
        <Route key={p} path={p} element={<Navigate to="/" replace />} />
      ))}
      <Route path="/settings" element={<Navigate to="/profile" replace />} />
      <Route path="/categories" element={<KeepQuery to="/top-stories" />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/top-stories" element={page(<TopStories />)} />
        <Route path="/world" element={page(<World />)} />
        <Route path="/story/:id" element={page(<StoryDetail />)} />
        <Route path="/search" element={page(<SearchPage />, true)} />
        <Route path="/saved" element={page(<SavedStories />, true)} />
        <Route path="/profile" element={page(<Profile />)} />
        <Route path="/analytics" element={page(<Analytics />, true)} />
        <Route path="/status" element={page(<Status />, true)} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  )
}

function shouldShowSplash() {
  try {
    if (sessionStorage.getItem('renivya:splash')) return false
    sessionStorage.setItem('renivya:splash', '1')
  } catch {
    /* sin almacenamiento: se muestra */
  }
  return true
}

function App() {
  const [splash, setSplash] = useState(shouldShowSplash)
  const done = useCallback(() => setSplash(false), [])
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <ScrollToTop />
              <AppRoutes />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
      </I18nProvider>
      {splash && <SplashScreen onDone={done} />}
    </ThemeProvider>
  )
}

export default App
