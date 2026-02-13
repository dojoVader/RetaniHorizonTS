import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite";
import { globSync } from 'glob';
import path from 'path';


// Find all the TS Components
const entries: any = {}
const files = globSync('retani-kit/ts-components/**/*.ts')   // or 'src/**/index.{js,ts}'

for (const file of files) {
    const name = file
        .replace('retani-kit/ts-components/', '')
        .replace('.ts', '')
        .replace('/', '-')
    entries[name] = path.resolve(file)
}

export default defineConfig({
  resolve: {
    alias: {
      '@theme/*': './assets/*',
      "@/decorators/*": "./retani-kit/decorators/*",
    }
  },
  build: {
    minify: false,
    outDir: 'assets/retani-kit/',
    emptyOutDir: false,
    lib: {
      entry: entries,
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
