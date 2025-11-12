import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Increase size limits for large base64 images
        proxyTimeout: 120000,
      }
    },
    // Increase header size limits
    hmr: {
      clientPort: 5173,
    }
  }
})
