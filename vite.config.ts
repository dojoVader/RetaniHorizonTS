import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  build: {
    outDir: 'ts-assets',
    lib: {
        entry: 'retani-kit/index.ts',
      fileName: 'retani-kit',
      formats: ['es', 'cjs'],
    }
  },
  plugins: [
      tailwindcss()
  ]
})
