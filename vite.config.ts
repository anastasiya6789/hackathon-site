import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 🔥 Добавь base для GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/hackathon-site/', // 🔥 Замени на имя своего репо!
})