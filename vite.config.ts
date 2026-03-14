import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              supabase: ['@supabase/supabase-js'],
              'date-utils': ['date-fns'],
              sentry: ['@sentry/react'],
              router: ['react-router-dom'],
            }
          }
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
