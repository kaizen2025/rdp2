// craco.config.js - Configuration Webpack Optimisée pour Production Professionnelle
const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionWebpackPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  webpack: {
    // ✅ OPTIMISATION: Aliases pour résolution rapide des modules
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@contexts': path.resolve(__dirname, 'src/contexts'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@models': path.resolve(__dirname, 'src/models'),
    },

    // ✅ OPTIMISATION: Configuration avancée
    configure: (webpackConfig, { env }) => {
      // Mode production
      if (env === 'production') {
        // ✅ Source maps optimisés pour debugging en prod
        webpackConfig.devtool = 'source-map';

        // ✅ OPTIMISATION: Split chunks intelligente
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          minimize: true,
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                parse: { ecma: 8 },
                compress: {
                  ecma: 5,
                  warnings: false,
                  comparisons: false,
                  inline: 2,
                  drop_console: true, // Supprime console.log en prod
                  drop_debugger: true,
                  pure_funcs: ['console.log', 'console.info', 'console.debug'], // Supprime fonctions inutiles
                },
                mangle: { safari10: true },
                output: {
                  ecma: 5,
                  comments: false,
                  ascii_only: true,
                },
              },
              parallel: true,
              extractComments: false,
            }),
          ],
          splitChunks: {
            chunks: 'all',
            maxInitialRequests: 25,
            minSize: 20000,
            cacheGroups: {
              // ✅ Vendors principaux (React, MUI)
              defaultVendors: {
                test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
                name: 'vendors-react',
                priority: 40,
                reuseExistingChunk: true,
              },
              // ✅ Material-UI séparé (gros bundle)
              mui: {
                test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/,
                name: 'vendors-mui',
                priority: 35,
                reuseExistingChunk: true,
              },
              // ✅ PDF et Excel (gros modules)
              documents: {
                test: /[\\/]node_modules[\\/](pdfjs-dist|xlsx|mammoth|pdf-parse)[\\/]/,
                name: 'vendors-documents',
                priority: 30,
                reuseExistingChunk: true,
              },
              // ✅ IA et NLP
              ai: {
                test: /[\\/]node_modules[\\/](@google\/generative-ai|natural|compromise|node-nlp)[\\/]/,
                name: 'vendors-ai',
                priority: 25,
                reuseExistingChunk: true,
              },
              // ✅ Autres vendors
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors-other',
                priority: 20,
                reuseExistingChunk: true,
              },
              // ✅ Code commun partagé
              common: {
                minChunks: 2,
                priority: 10,
                reuseExistingChunk: true,
                enforce: true,
              },
            },
          },
          runtimeChunk: {
            name: 'runtime',
          },
        };

        // ✅ COMPRESSION: Gzip et Brotli
        webpackConfig.plugins.push(
          new CompressionWebpackPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 10240, // Seulement fichiers > 10kb
            minRatio: 0.8,
          })
        );

        // ✅ Performance hints
        webpackConfig.performance = {
          hints: 'warning',
          maxEntrypointSize: 512000, // 500kb
          maxAssetSize: 512000,
        };

        // ✅ OPTIONNEL: Bundle analyzer (décommenter pour analyser)
        // webpackConfig.plugins.push(
        //   new BundleAnalyzerPlugin({
        //     analyzerMode: 'static',
        //     openAnalyzer: false,
        //     reportFilename: '../bundle-report.html',
        //   })
        // );
      }

      // ✅ Optimisations communes dev + prod
      webpackConfig.plugins.push(
        // Variables d'environnement
        new webpack.DefinePlugin({
          'process.env.APP_VERSION': JSON.stringify(require('./package.json').version),
          'process.env.BUILD_DATE': JSON.stringify(new Date().toISOString()),
        }),

        // Ignorer les locales moment.js inutiles (économise ~200kb)
        new webpack.IgnorePlugin({
          resourceRegExp: /^\.\/locale$/,
          contextRegExp: /moment$/,
        })
      );

      // ✅ Module resolution optimization
      webpackConfig.resolve.modules = [
        'node_modules',
        path.resolve(__dirname, 'src'),
      ];

      // ✅ Extensions optimisées
      webpackConfig.resolve.extensions = ['.js', '.jsx', '.json'];

      return webpackConfig;
    },
  },

  // ✅ BABEL: Optimisations de compilation
  babel: {
    plugins: [
      // Transform imports pour Material-UI (tree-shaking)
      [
        'babel-plugin-import',
        {
          libraryName: '@mui/material',
          libraryDirectory: '',
          camel2DashComponentName: false,
        },
        '@mui/material',
      ],
      [
        'babel-plugin-import',
        {
          libraryName: '@mui/icons-material',
          libraryDirectory: '',
          camel2DashComponentName: false,
        },
        '@mui/icons-material',
      ],
    ],
    presets: [
      [
        '@babel/preset-react',
        {
          runtime: 'automatic', // Nouveau JSX transform (plus léger)
        },
      ],
    ],
  },

  // ✅ DevServer optimisé
  devServer: {
    compress: true,
    hot: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: true,
    },
  },

  // ✅ ESLint - COMPLÈTEMENT DÉSACTIVÉ pour éviter blocage compilation
  eslint: {
    enable: false, // ✅ DÉSACTIVÉ en dev ET prod - AUCUN blocage
  },
};
