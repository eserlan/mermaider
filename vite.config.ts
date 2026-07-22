import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 4000,
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
