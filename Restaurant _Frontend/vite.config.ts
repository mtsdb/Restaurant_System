import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy all /api calls to Django on port 8000 to avoid CORS during dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
