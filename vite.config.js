import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Needed for dev server SPA routing
    historyApiFallback: true,
  },
  build: {
    rollupOptions: {
      input: '/index.html',
      output: {
        manualChunks: {
          // Every page needs Firebase (auth/session check in Layout.jsx even
          // on public pages) but it rarely changes - splitting it out lets
          // browsers cache it across deploys instead of invalidating it
          // every time app code changes.
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics', 'firebase/app-check'],
        },
      },
    },
  },
  test: {
    // Vitest's default "threads" pool hits a Node 22 + Windows ESM loader
    // bug (readSync ENOTKNOWN on module load) that doesn't reproduce on
    // macOS/Linux CI. "forks" sidesteps it everywhere at a small startup
    // cost that doesn't matter for this test suite's size.
    pool: 'forks',
  },
});
