import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // New clean backend (port 8001)
      '/api/macro':    { target: 'http://localhost:8001', changeOrigin: true },
      '/api/market':   { target: 'http://localhost:8001', changeOrigin: true },
      '/api/adani':    { target: 'http://localhost:8001', changeOrigin: true },
      '/api/signals':  { target: 'http://localhost:8001', changeOrigin: true },
      '/api/alerts':   { target: 'http://localhost:8001', changeOrigin: true },
      // Legacy backend fallback (port 8080) for anything not matched above
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
})
