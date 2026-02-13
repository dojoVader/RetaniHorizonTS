import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite";


export default defineConfig({
  resolve: {
    alias: {
      '@theme/*': './assets/*',
    }
  },
  build: {
    outDir: 'assets/retani-kit/',
    emptyOutDir: false,
    lib: {
      entry: 'retani-kit/sample-component.ts',
      fileName: (_, fileName) => `${fileName}.js`,
      formats: ['es']
    },
    rollupOptions: {
      external: ['@theme/utilities','@theme/component'],
    },
  },
  plugins: [
    tailwindcss()
  ],

})
