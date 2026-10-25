import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    proxy: {
      '/api/msg91/whatsapp': {
        target: 'https://api.msg91.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/msg91\/whatsapp/, '/api/v5/whatsapp/whatsapp-outbound-message/bulk/'),
      },
      '/api/msg91/email': {
        target: 'https://control.msg91.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/msg91\/email/, '/api/v5/email'),
      },
      '/api/msg91': {
        target: 'https://control.msg91.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/msg91/, '/api/v5'),
      },
    },
  },
})
