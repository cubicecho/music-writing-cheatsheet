import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative, so the build works wherever it is served from: the repo's own
  // GitHub Pages subpath, a user site at the root, or `vite preview` locally.
  // There is no router, so there is no path for a relative base to get wrong.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { host: '0.0.0.0', port: 3000 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
