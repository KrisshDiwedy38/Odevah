import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Spotify's OAuth redirect URIs must use the loopback IP literal
  // (127.0.0.1), not "localhost" - bind there so the dev origin matches.
  server: {
    host: '127.0.0.1',
  },
})
