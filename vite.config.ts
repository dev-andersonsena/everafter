import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Permite acesso externo
      host: '0.0.0.0',

      // Porta utilizada pelo Vite
      port: 3000,

      // Permite acesso pelo DNS público da EC2 e pelo IP
      allowedHosts: [
        'ec2-100-31-210-13.compute-1.amazonaws.com',
        '100.31.210.13',
        'localhost',
      ],

      // HMR
      hmr: process.env.DISABLE_HMR !== 'true',

      // Watch
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
