import { Toaster } from '@/components/ui/toaster'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom'
import PageNotFound from './lib/PageNotFound'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import { ThemeProvider } from '@/lib/ThemeContext'
import { I18nProvider } from '@/lib/i18n/I18nContext'
import UserNotRegisteredError from '@/components/UserNotRegisteredError'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppShell from '@/components/layout/AppShell'

import { lazy, Suspense } from 'react'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import Mfa from '@/pages/Mfa'
import Spinner from '@/components/common/Spinner'

// Vistas pesadas (three.js, Leaflet, recharts, dnd) bajo demanda: la portada abre antes.
const TopStories = lazy(() => import('@/pages/TopStories'))
const Categories = lazy(() => import('@/pages/Categories'))
const World = lazy(() => import('@/pages/World'))
const Network = lazy(() => import('@/pages/Network'))
const StoryDetail = lazy(() => import('@/pages/StoryDetail'))
const SearchPage = lazy(() => import('@/pages/Search'))
const SavedStories = lazy(() => import('@/pages/SavedStories'))
const Profile = lazy(() => import('@/pages/Profile'))
const Settings = lazy(() => import('@/pages/Settings'))
const Analytics = lazy(() => import('@/pages/Analytics'))
const Brain = lazy(() => import('@/pages/Brain'))

const page = (el) => <Suspense fallback={<Spinner className="mt-10" />}>{el}</Suspense>

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth()
  const location = useLocation()
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname)
  const loginUrl = `/login?returnTo=${encodeURIComponent(location.pathname + location.search + location.hash)}`

  if (!isAuthPage && (isLoadingPublicSettings || isLoadingAuth)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
      </div>
    )
  }

  if (!isAuthPage && authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />
    } else if (authError.type === 'auth_required') {
      return <Navigate to={loginUrl} replace />
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/mfa" element={<Mfa />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to={loginUrl} replace />} />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/top-stories" element={page(<TopStories />)} />
          <Route path="/categories" element={page(<Categories />)} />
          <Route path="/world" element={page(<World />)} />
          <Route path="/network" element={page(<Network />)} />
          <Route path="/story/:id" element={page(<StoryDetail />)} />
          <Route path="/search" element={page(<SearchPage />)} />
          <Route path="/saved" element={page(<SavedStories />)} />
          <Route path="/profile" element={page(<Profile />)} />
          <Route path="/settings" element={page(<Settings />)} />
          <Route path="/analytics" element={page(<Analytics />)} />
          <Route path="/brain" element={page(<Brain />)} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <ScrollToTop />
              <AuthenticatedApp />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}

export default App
