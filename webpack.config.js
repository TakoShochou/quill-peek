const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: {
    index: './src/index.js',
  },
  resolve: {
    alias: {
      parchment: path.resolve(__dirname, 'parchment/src/parchment'),
      'quill$': path.resolve(__dirname, 'quill/quill.js'),
    },
    extensions: ['.js', '.ts', '.svg']
  },
  module: {
    rules: [
      { // ts
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          compilerOptions: {
            declaration: false,
            module: 'es6',
            sourceMap: true,
            target: 'es6',
          },
          transpileOnly: true,
        },
      },
      { // js
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        include: /node_modules\/quill$/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      },
      { // svg
        test: /\.svg$/,
        loader: 'html-loader',
        options: {
          minimize: true
        }
      },
      { // scss
        test: /\.s[ac]ss$/i,
        exclude: /(node_modules|bower_components)/,
        include: path.resolve(__dirname, './assets'),
        loaders: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
      }
    ],
  }, // module
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
    new CopyPlugin([
      { from: path.resolve('quill/dist/quill.snow.css') }
    ])
  ], // plugins
}