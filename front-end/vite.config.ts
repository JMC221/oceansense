// Public copy: optional allowed tunnel host via environment, 2026-09-19.
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    return {
    plugins: [react()],
    server: {
        // Allow ngrok custom link
        allowedHosts: env.NGROK_DOMAIN ? [env.NGROK_DOMAIN] : [],
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            }
        }
    }
    };
})