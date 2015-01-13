var async = require('async');
var httpProxy = require('http-proxy');
var config = require('./config.json');
var url = require('url');

var validateUrlPath = function(urlTarget, callback) {
  var target = url.parse(urlTarget);
  callback(null, { host: url.format({protocol: target.protocol, host: target.host}), path: target.pathname } );
}

var createProxy = function(urlPath, callback) {
  var proxy = httpProxy.createProxyServer({ target: urlPath.host });
  proxy.on('error', function(err) {
    console.log(err+' for proxy ' + urlPath.host + urlPath.path );
  });
  console.log('Proxying '+urlPath.path+' => ' + urlPath.host);
  callback(null, { urlPath: urlPath, proxy: proxy });
};

var proxies = [];

async.map( config.targets, validateUrlPath, function(err, urlPaths) {
  //TODO Check for error
  async.map( urlPaths, createProxy, function(err, results) {
    //TODO check for error
    proxies = results;
  });
});

module.exports.detectProxy = function( url, callback ) {
  validateUrlPath(url, function(err, reqUrlPath) {
    async.detect( proxies, function(proxy, callback) {
      callback( reqUrlPath.path.indexOf(proxy.urlPath.path) === 0 );
    }, function(result) {
      if( result ) {
        callback( null, result.proxy, result.urlPath.host );
      } else {
        callback( 'No proxy found for ' + reqUrlPath.path );
      }
    });
  });
}