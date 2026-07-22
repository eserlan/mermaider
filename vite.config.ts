import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['elkjs/lib/elk.bundled.js', '@mermaid-js/layout-elk']
  },
  build: {
    chunkSizeWarningLimit: 4000,
    commonjsOptions: {
      include: [/elkjs/, /node_modules/]
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@mermaid-js/layout-elk') || id.includes('elkjs')) {
            return 'vendor-elk';
          }
          if (id.includes('node_modules/mermaid') || id.includes('cytoscape') || id.includes('katex')) {
            return 'vendor-mermaid';
          }
        }
      }
    }
  }
});
