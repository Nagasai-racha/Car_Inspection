import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // listen on all addresses, equivalent to 0.0.0.0
    port: 3000,  // optional, specify the port if you want
  }
})
