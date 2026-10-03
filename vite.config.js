import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        aurora: resolve(__dirname, 'aurora.html'),
        scroll_reveal: resolve(__dirname, 'scroll_reveal.html'),
      },
    },
  },
});
