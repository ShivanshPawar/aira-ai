import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-markdown/') || id.includes('node_modules/remark-') || id.includes('node_modules/unified/') || id.includes('node_modules/micromark') || id.includes('node_modules/mdast-') || id.includes('node_modules/hast-') || id.includes('node_modules/vfile/')) {
            return 'markdown-rendering'
          }
        },
      },
    },
  },
})
