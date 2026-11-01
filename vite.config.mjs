import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { join } from 'path'

export default defineConfig({
  root: join(__dirname, 'src/renderer'),
  resolve: {
    alias: {
      '@renderer': join(__dirname, 'src/renderer/src')
    }
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: true
  }
})
