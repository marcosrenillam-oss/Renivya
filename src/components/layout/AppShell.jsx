import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import StatusBar from '@/components/layout/StatusBar'
import { BottomNav, RailNav, SidebarNav } from '@/components/layout/NavMenu'
import StageAtmosphere from '@/components/common/StageAtmosphere'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/lib/AppContext'

/**
 * Esqueleto de la app autenticada.
 * - Móvil (<768): barra inferior + menú desde el símbolo.
 * - Tablet (768–1279): rail lateral.
 * - Escritorio (≥1280): sidebar completo.
 */
export default function AppShell() {
  const location = useLocation()
  return (
    <AppProvider>
      <TooltipProvider>
        <div className="relative min-h-screen">
          <StageAtmosphere />
          <SidebarNav footer={<StatusBar variant="stacked" />} />
          <RailNav />

          <div className="md:pl-[76px] xl:pl-64">
            <Header />
            <AnimatePresence mode="wait" initial={false}>
              <motion.main
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-6 md:pb-16 lg:px-10 lg:pt-12"
              >
                <Outlet />
              </motion.main>
            </AnimatePresence>
            <footer className="mx-auto max-w-6xl px-4 pb-28 sm:px-6 md:pb-8 lg:px-10 xl:hidden">
              <div className="border-t pt-4">
                <StatusBar />
              </div>
            </footer>
          </div>

          <BottomNav />
        </div>
      </TooltipProvider>
    </AppProvider>
  )
}
