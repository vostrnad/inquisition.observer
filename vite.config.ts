import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['**/+*.ts', '**/*.d.ts', 'src/hooks.server.ts'],
    },
    setupFiles: './tests/setup.ts',
  },
})
