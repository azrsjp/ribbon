import {defineConfig} from 'vite';

export default defineConfig({
  build: {
    /*
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
      },
      format: {
        comments: false,
      },
    },
    */
    assetsInlineLimit: 0,
  },
  resolve: {
    alias: {
      '@/': `${__dirname}/src/`,
      '~/': `${__dirname}/public/`,
    },
  },
});
