const path = require("path");
module.exports = {
  entry: "./scripts/renderer.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    port: 8080,
    static: path.resolve(__dirname, "dist"),
    hot: true,
  },
  devtool: "cheap-module-source-map",
  mode: "development",
};
