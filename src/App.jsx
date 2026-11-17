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

import Home from '@/pages/Home'
import TopStories from '@/pages/TopStories'
import Categories from '@/pages/Categories'
import World from '@/pages/World'
import Network from '@/pages/Network'
import StoryDetail from '@/pages/StoryDetail'
import SearchPage from '@/pages/Search'
import SavedStories from '@/pages/SavedStories'
import Profile from '@/pages/Profile'
import Settings from '@/pages/Settings'
import Analytics from '@/pages/Analytics'
import Brain from '@/pages/Brain'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import Mfa from '@/pages/Mfa'

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
          <Route path="/top-stories" element={<TopStories />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/world" element={<World />} />
          <Route path="/network" element={<Network />} />
          <Route path="/story/:id" element={<StoryDetail />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/saved" element={<SavedStories />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/brain" element={<Brain />} />
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
