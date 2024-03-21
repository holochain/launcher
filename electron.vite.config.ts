import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import path, { resolve } from 'path';

export default defineConfig({
  main: {
    resolve: {
      alias: {
        $shared: path.resolve(__dirname, './src/shared'),
      },
    },
    plugins: [externalizeDepsPlugin({ exclude: ['@holochain/client', 'nanoid'] })],
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
