import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Bind to all network interfaces
    port: 5173,      // Default port (can be changed if needed)
  },
  optimizeDeps: {
    include: ['sweetalert2'],  // Force Vite to pre-bundle SweetAlert2
  },
  build: {
    rollupOptions: {
      external: [],  // Prevent Rollup from externalizing sweetalert2
    },
  },
})