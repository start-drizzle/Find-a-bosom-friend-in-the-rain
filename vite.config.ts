import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import electron from 'vite-plugin-electron/simple';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', ''); // Load all env vars without prefix filter
  return {
    plugins: [
      vue(), 
      tailwindcss(),
      electron({
        main: {
          // Shortcut of `build.lib.entry`.
          entry: 'electron/main.ts',
          vite: {
            build: {
              rollupOptions: {
                external: ['uiohook-napi', '@jitsi/robotjs', 'koffi'],
              },
            },
          },
        },
        preload: {
          // Shortcut of `build.rollupOptions.input`.
          // Preload scripts may contain Web assets, so use an absolute path.
          input: path.join(__dirname, 'electron/preload.ts'),
        },
        // Ployfill the Electron and Node.js built-in modules for Renderer process.
        // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
        renderer: {},
      }),
    ],
    base: './',
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.YOUDAO_APP_KEY': JSON.stringify(env.VITE_YOUDAO_APP_KEY),
      'process.env.YOUDAO_APP_SECRET': JSON.stringify(env.VITE_YOUDAO_APP_SECRET),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
