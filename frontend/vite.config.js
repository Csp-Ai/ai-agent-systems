import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, writeFileSync } from 'fs'
import path, { resolve } from 'path'

const indexHtml = (() => {
  const index = resolve(__dirname, 'index.html')
  if (existsSync(index)) {
    return index
  }
  const fallback = resolve(__dirname, 'fallback.html')
  if (!existsSync(fallback)) {
    writeFileSync(
      fallback,
      `<!doctype html>\n<html>\n  <head>\n    <meta charset="UTF-8" />\n    <title>AI Agent Systems</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.js"></script>\n  </body>\n</html>`
    )
  }
  return fallback
})()

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '~components': resolve(__dirname, 'components'),
      '~firebase': resolve(__dirname, 'src/firebase.js'),
    },
  },
  ssr: {
    noExternal: ['firebase'],
  },
  css: {
    postcss: path.resolve(__dirname, '../postcss.config.js'),
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
    rollupOptions: {
      input: indexHtml,
    },
  },
})
