import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gatewayTarget = env.VITE_GATEWAY_URL ?? 'http://localhost:8080';

  return {
    plugins: [react()],
    define: {
      // sockjs-client references Node's `global`, which is undefined in the browser
      global: 'globalThis',
    },
    server: {
      host: true,
      port: 5174,
      allowedHosts: true,
      proxy: {
        // All /api/* requests → API Gateway (8080)
        // Includes vendor-service: /api/vendors/** → vendor-service :8081
        '/api': {
          target: gatewayTarget,
          changeOrigin: true,
        },
        '/ws': {
          target: gatewayTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
