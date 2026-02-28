import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Bu satırı ekle

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Bu satırı ekle
  ],
})