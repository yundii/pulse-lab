import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/pulse-lab/' : '/',
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [vinext()],
  server: { host: '0.0.0.0' },
});
