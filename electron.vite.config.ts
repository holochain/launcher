import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { resolve } from 'path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['@holochain/client'] })],
  },
  preload: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ['electron-trpc'],
      }),
    ],
    build: {
      rollupOptions: {
        input: {
          admin: resolve(__dirname, 'src/preload/admin.ts'),
          happs: resolve(__dirname, 'src/preload/happs.ts'),
        },
      },
    },
  },
});
