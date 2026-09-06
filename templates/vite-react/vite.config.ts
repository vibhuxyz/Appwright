import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // `@/` matches the alias the Next template already uses, so a component
    // written against one template's import paths compiles in the other.
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
