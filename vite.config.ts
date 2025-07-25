import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart(options) {
          if (options.startup) {
            options.startup();
          }
        },
        vite: {
          build: {
            sourcemap: false,
            minify: 'terser',
            outDir: 'dist-electron',
            target: 'node16',
            terserOptions: {
              compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug'],
                passes: 3,
                unsafe: true,
                unsafe_comps: true,
                unsafe_math: true,
                unsafe_proto: true,
                conditionals: true,
                dead_code: true,
                evaluate: true,
                loops: true,
                reduce_vars: true,
                unused: true,
                toplevel: true,
                keep_infinity: true,
                collapse_vars: true,
                reduce_funcs: true,
                typeofs: false
              },
              mangle: {
                toplevel: true,
                safari10: true
              },
              format: {
                comments: false
              }
            },
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs',
                compact: true
              }
            },
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          if (options.reload) {
            options.reload();
          }
        },
        vite: {
          build: {
            sourcemap: false,
            minify: 'terser',
            outDir: 'dist-electron',
            target: 'node16',
            terserOptions: {
              compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug'],
                passes: 3,
                unsafe: true,
                unsafe_comps: true,
                unsafe_math: true,
                conditionals: true,
                dead_code: true,
                evaluate: true,
                loops: true,
                reduce_vars: true,
                unused: true,
                toplevel: true,
                collapse_vars: true,
                reduce_funcs: true
              },
              mangle: {
                toplevel: true,
                safari10: true
              },
              format: {
                comments: false
              }
            },
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs',
                compact: true
              }
            },
          },
        },
      },
    ]),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    sourcemap: false,
    minify: 'terser',
    target: 'esnext',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 3,
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_proto: true,
        conditionals: true,
        dead_code: true,
        evaluate: true,
        loops: true,
        reduce_vars: true,
        unused: true,
        toplevel: true,
        keep_infinity: true,
        collapse_vars: true,
        reduce_funcs: true,
        sequences: true,
        properties: true,
        join_vars: true,
        typeofs: false
      },
      mangle: {
        toplevel: true,
        safari10: true,
        properties: {
          regex: /^_/
        }
      },
      format: {
        comments: false,
        ascii_only: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Aggressive chunking for better compression
          if (id.includes('node_modules')) {
            if (id.includes('react')) {
              return 'react-vendor';
            }
            if (id.includes('lodash') || id.includes('ramda')) {
              return 'utils-vendor';
            }
            return 'vendor';
          }
        },
        compact: true,
        generatedCode: {
          constBindings: true,
          arrowFunctions: true,
          objectShorthand: true
        }
      },
      treeshake: {
        preset: 'smallest',
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false
      }
    },
    chunkSizeWarningLimit: 500,
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    // Additional optimization
    reportCompressedSize: true,
    emptyOutDir: true
  },
  server: {
    port: 5173,
  },
  // Additional optimizations
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['electron']
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    '__DEV__': false,
    'process.env.DEBUG': false
  },
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
    treeShaking: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true
  }
});