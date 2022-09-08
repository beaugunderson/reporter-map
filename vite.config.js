import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

import rollupNodePolyFill from 'rollup-plugin-node-polyfills';

export default {
  resolve: {
    alias: {
      events: 'rollup-plugin-node-polyfills/polyfills/events',
    },
  },

  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },

      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
        }),

        NodeModulesPolyfillPlugin(),
      ],
    },
  },

  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
    },

    sourcemap: true,
  },
};
