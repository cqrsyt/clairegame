import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    react(),
    {
      name: 'spa-404',
      closeBundle() {
        const index = path.resolve(rootDir, 'dist/index.html')
        const four = path.resolve(rootDir, 'dist/404.html')
        if (fs.existsSync(index)) fs.copyFileSync(index, four)
      },
    },
  ],
  resolve: {
    alias: {
      '@aether/shared': path.resolve(rootDir, '../shared/src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/auth': 'http://localhost:3001',
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
})
