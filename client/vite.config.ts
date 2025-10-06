import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  base: '/Truco-Lan/', // caminho base para GitHub Pages
  plugins: [react()],
})
