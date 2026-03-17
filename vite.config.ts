import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    {
      name: 'rename-index-html',
      closeBundle() {
        const from = path.resolve(__dirname, 'build/forge/index.html')
        const to = path.resolve(__dirname, 'build/forge/index_forge.html')
        if (fs.existsSync(from)) {
          fs.renameSync(from, to)
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: command === 'serve' ? '/' : '/static/forge/',
  build: {
    outDir: 'build/forge',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query', '@tanstack/react-table'],
          'vendor-xyflow': ['@xyflow/react'],
          'vendor-rrule': ['rrule'],
          'vendor-charts': ['recharts'],
          'vendor-xterm': ['@xterm/xterm', '@xterm/addon-fit', '@xterm/addon-search'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8013',
        changeOrigin: true,
        secure: false,
      },
      '/sso': {
        target: 'http://localhost:8013',
        changeOrigin: true,
        secure: false,
      },
      '/websocket': {
        target: 'ws://localhost:8013',
        ws: true,
      },
    },
  },
}))
