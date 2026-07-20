import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    host: '0.0.0.0',
    port: 3000,

    allowedHosts: [
      'alanaehenderson.com.br',
      'www.alanaehenderson.com.br',
      'ec2-3-84-182-52.compute-1.amazonaws.com',
    ],
  },

  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
});
