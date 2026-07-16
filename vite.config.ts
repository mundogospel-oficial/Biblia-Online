import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "node:fs";
import { componentTagger } from "lovable-tagger";

// Simple version bumper plugin
const versionBumper = () => {
  return {
    name: 'version-bumper',
    buildStart() {
      try {
        const versionFile = path.resolve(__dirname, 'public/version.json');
        if (fs.existsSync(versionFile)) {
          const data = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
          const parts = data.version.split('.');
          const minor = parseInt(parts[parts.length - 1] || '0') + 1;
          parts[parts.length - 1] = minor.toString();
          data.version = parts.join('.');
          fs.writeFileSync(versionFile, JSON.stringify(data, null, 2) + '\n');
          console.log(`[version-bumper] Version bumped to ${data.version}`);
        }
      } catch (err) {
        console.warn('[version-bumper] Failed to bump version:', err);
      }
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      host: "0.0.0.0",
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    plugins: [
      react(), 
      versionBumper(),
      mode === "development" && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || null),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 2000,
      reportCompressedSize: true,
    }
  };
});
