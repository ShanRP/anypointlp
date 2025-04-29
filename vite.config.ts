
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// Remove the component tagger import since it's causing issues
// import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["3768d6f5-9c45-4e22-9426-d39c532dd7d4-00-3jvbdbypdo7ym.sisko.replit.dev"],
  },
  plugins: [
    react(),
    // Remove the component tagger for now as it may be causing issues
    // mode === 'development' &&
    // componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: ['react-native-web'],
    }
  }
}));
