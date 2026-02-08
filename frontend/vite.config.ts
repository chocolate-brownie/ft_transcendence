import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Proxy API requests to the backend container
    // Frontend calls /api/... → forwarded to https://backend:3000/api/...
    proxy: {
      "/api": {
        target: "https://backend:3000",
        changeOrigin: true,
        secure: false, // Allow self-signed certs
      },
      "/socket.io": {
        target: "https://backend:3000",
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
      },
    },
  },
});
