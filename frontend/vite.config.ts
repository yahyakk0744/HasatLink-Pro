import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'
import { visualizer } from 'rollup-plugin-visualizer'

// Read version from package.json for Sentry release tagging
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Opt-in bundle size report: `ANALYZE=1 npm run build` writes dist/bundle-report.html
    process.env.ANALYZE ? visualizer({
      filename: 'dist/bundle-report.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }) : null,
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    cssCodeSplit: true,
    minify: 'terser',
    // Warn when chunks exceed 500KB
    chunkSizeWarningLimit: 500,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        // Remove dead code more aggressively
        passes: 2,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — always needed, load first
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Firebase — auth/db, needed early
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // i18n — needed early for UI text
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          // Socket/HTTP — needed after auth
          'vendor-io': ['socket.io-client', 'axios'],
          // Charts — intentionally NOT in manualChunks
          // Recharts is only used in lazy admin pages → auto code-split per page
          // Icons — heavy, but used in layout so must be eager
          'vendor-icons': ['lucide-react'],
          // Map + Leaflet — lazy (MapPage is lazy), auto code-split
          'vendor-map': ['leaflet', 'react-leaflet'],
          // Sentry — loaded dynamically after app renders, NOT on critical path
          'vendor-sentry': ['@sentry/react'],
        },
      },
    },
  },
})
