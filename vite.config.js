import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    outDir: '../../dist/apps/web',   // Important for monorepo
    emptyOutDir: true,
  },

  base: '/medwise/',   // ← Change this to your repo name
})