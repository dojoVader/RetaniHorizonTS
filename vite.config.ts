import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  build: {
    outDir: 'assets/retani-kit',
    emptyOutDir: true,
    lib: {
        entry: 'retani-kit/sample-component.ts',
      fileName: (_, fileName) => `${fileName}.js`,
      formats: ['es']
    }

  },
  plugins: [
      tailwindcss()
  ],

})
