import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Dependencias estables en fragmentos propios: se cachean entre despliegues.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'vendor-react'
          if (id.includes('@base44/sdk') || id.includes('axios') || id.includes('socket.io') || id.includes('engine.io')) return 'vendor-base44'
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'vendor-motion'
          if (id.includes('@radix-ui') || id.includes('@floating-ui')) return 'vendor-radix'
          if (id.includes('moment')) return 'vendor-moment'
          return undefined
        },
      },
    },
  },
})
