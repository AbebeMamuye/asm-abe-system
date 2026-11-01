// vite.config.mjs
import { defineConfig } from "file:///G:/F2/Asset%20Management%20System/node_modules/vite/dist/node/index.js";
import react from "file:///G:/F2/Asset%20Management%20System/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///G:/F2/Asset%20Management%20System/node_modules/@tailwindcss/vite/dist/index.mjs";
import { join } from "path";
var __vite_injected_original_dirname = "G:\\F2\\Asset Management System";
var vite_config_default = defineConfig({
  root: join(__vite_injected_original_dirname, "src/renderer"),
  resolve: {
    alias: {
      "@renderer": join(__vite_injected_original_dirname, "src/renderer/src")
    }
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "../../dist",
    emptyOutDir: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRzpcXFxcRjJcXFxcQXNzZXQgTWFuYWdlbWVudCBTeXN0ZW1cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkc6XFxcXEYyXFxcXEFzc2V0IE1hbmFnZW1lbnQgU3lzdGVtXFxcXHZpdGUuY29uZmlnLm1qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRzovRjIvQXNzZXQlMjBNYW5hZ2VtZW50JTIwU3lzdGVtL3ZpdGUuY29uZmlnLm1qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcm9vdDogam9pbihfX2Rpcm5hbWUsICdzcmMvcmVuZGVyZXInKSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQHJlbmRlcmVyJzogam9pbihfX2Rpcm5hbWUsICdzcmMvcmVuZGVyZXIvc3JjJylcbiAgICB9XG4gIH0sXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCB0YWlsd2luZGNzcygpXSxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNTE3MyxcbiAgICBvcGVuOiB0cnVlLFxuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovLzEyNy4wLjAuMTo1MDAxJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBidWlsZDoge1xuICAgIG91dERpcjogJy4uLy4uL2Rpc3QnLFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlXG4gIH1cbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXFSLFNBQVMsb0JBQW9CO0FBQ2xULE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUN4QixTQUFTLFlBQVk7QUFIckIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsTUFBTSxLQUFLLGtDQUFXLGNBQWM7QUFBQSxFQUNwQyxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxhQUFhLEtBQUssa0NBQVcsa0JBQWtCO0FBQUEsSUFDakQ7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQztBQUFBLEVBQ2hDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixhQUFhO0FBQUEsRUFDZjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
