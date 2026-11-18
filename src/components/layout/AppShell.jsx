import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { isViewTransitionActive } from '@/lib/storyTransition'
import TopBar from '@/components/shell/TopBar'
import Aurora from '@/components/premium/Aurora'
import MenuDrawer from '@/components/shell/MenuDrawer'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/lib/AppContext'
import { useSnapshotSync } from '@/hooks/useSnapshotSync'
import { useAutoUpdate } from '@/hooks/useAutoUpdate'
import UpdatePill from '@/components/shell/UpdatePill'
import { useEdgeSwipeBack } from '@/hooks/useEdgeSwipeBack'

/** Pantalla limpia: barra superior mínima + menú lateral. Sin barra inferior ni barra de estado. */
export default function AppShell() {
  const location = useLocation()
  const [menu, setMenu] = useState(false)
  const close = useCallback(() => setMenu(false), [])
  const sync = useSnapshotSync()
  const updatingApp = useAutoUpdate()
  useEffect(() => setMenu(false), [location.pathname])
  const pageRef = useRef(null)
  useEdgeSwipeBack(pageRef, location.pathname !== '/' && !menu)

  return (
    <AppProvider>
      <TooltipProvider>
        <div className="min-h-screen-dvh relative isolate">
          <Aurora />
          <TopBar onMenu={() => setMenu(true)} />
          <div ref={pageRef}>
          <motion.main
              key={location.pathname}
              initial={isViewTransitionActive() ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-3xl pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-2"
            >
              <Outlet />
            </motion.main>
          </div>
          <MenuDrawer open={menu} onClose={close} />
          <UpdatePill state={updatingApp ? 'app' : sync} />
        </div>
      </TooltipProvider>
    </AppProvider>
  )
}
