module.exports = function override(config) {
  // Add fallback for Node.js modules that are not available in browser
  if (!config.resolve) {
    config.resolve = {};
  }
  
  if (!config.resolve.fallback) {
    config.resolve.fallback = {};
  }

  // Set fallbacks for Node.js specific modules
  Object.assign(config.resolve.fallback, {
    "fs": false,
    "path": false,
    "os": false,
    "crypto": false,
    "stream": false,
    "buffer": false,
    "util": false,
    "url": false,
    "zlib": false,
    "http": false,
    "https": false,
    "net": false,
    "tls": false,
    "dgram": false,
    "child_process": false,
    "cluster": false,
    "dns": false,
    "domain": false,
    "events": false,
    "http2": false,
    "module": false,
    "perf_hooks": false,
    "readline": false,
    "repl": false,
    "tty": false,
    "v8": false,
    "vm": false,
    "worker_threads": false
  });

  // Add plugin to define process.env.NODE_ENV
  if (!config.plugins) {
    config.plugins = [];
  }

  // Define process.browser for browser
  config.plugins.push(
    new (require('webpack').DefinePlugin)({
      'process.browser': JSON.stringify(true)
    })
  );

  return config;
};