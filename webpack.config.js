var path = require("path");

module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "www/js"),
    filename: "index.bundle.js",
  },
  devtool: "inline-source-map",
  resolve: {
    fallback: {
      buffer: require.resolve("buffer/"),
      events: require.resolve("events/"),
      stream: require.resolve("stream-browserify"),
    },
  },
};
