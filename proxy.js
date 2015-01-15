var async = require('async');
var httpProxy = require('http-proxy');
var config = require('./config.json');
var url = require('url');

var createProxy = function(options, callback) {
  var proxy = httpProxy.createProxyServer(options);
  proxy.on('error', function(err) {
    console.log(err+' for proxy ' + options.target );
  });
  if( options.stripPath ) {
    proxy.on('proxyReq', function(proxyReq, req, res, options) {
      // TODO: too simple?
      proxyReq.path = proxyReq.path.substr(options.path.length-1);
    });
  }
  if( options.protocolRewrite ) {
    proxy.on('proxyRes', function (proxyRes, req, res) {
      var redirectRegex = /^30(1|2|3|7|8)$/;
      if (proxyRes.headers['location'] && redirectRegex.test(proxyRes.statusCode)) {
        var u = url.parse(proxyRes.headers['location']);
        u.protocol = options.protocolRewrite;
        proxyRes.headers['location'] = u.format();
      }
    });
  }
  console.log('Proxying '+options.path+' => ' + options.target);
  callback(null, { path: options.path, target: options.target, proxy: proxy });
};

var proxies = [];

async.map( config.proxies, createProxy, function(err, results) {
  //TODO check for error
  proxies = results;
});

module.exports.detectProxy = function( reqUrl, callback ) {
  var reqPath = url.parse(reqUrl).path;
  //TODO: error if not in format "/.+/"
  async.detect( proxies, function(proxy, callback) {
    callback( reqPath.indexOf(proxy.path) === 0 );
  }, function(result) {
    if( result ) {
      callback( null, result.proxy, result.target );
    } else {
      callback( 'No proxy found for ' + reqPath.path );
    }
  });
}