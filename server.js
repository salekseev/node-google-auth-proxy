var http = require('http');
var httpProxy = require('http-proxy');

var config = require('./config.json');
var url = require('url');
var async = require('async');

var validateUrlPath = function(urlTarget, callback) {
  var target = url.parse(urlTarget);
  //TODO validate it meets requirements
  callback(null, { host: target.host, path: target.path} );
}

var createProxy = function(urlPath, callback) {
  var proxy = httpProxy.createProxyServer({ target: urlPath.host });
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

function detectProxy( url, callback ) {
  validateUrlPath(url, function(err, reqUrlPath) {
    async.detect( proxies, function(proxy, callback) {
      callback( reqUrlPath.path.indexOf(proxy.urlPath.path) === 0 );
    }, function(result) {
      if( result ) {
        callback( null, result );
      } else {
        callback( 'No proxy found for ' + reqUrlPath.path );
      }
    });
  });
}

//
// Create your custom server and just call `proxy.web()` to proxy
// a web request to the target passed in the options
// also you can use `proxy.ws()` to proxy a websockets request
//
var server = http.createServer(function(req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  detectProxy( req.url, function( err, proxy ) {
    if( err ) {
      console.log( err );
      res.statusCode = 404;
      res.write('The page you are looking for is not found');
      res.setHeader("Content-Type", "text/plain");
      res.end();
    } else {
      console.log( 'Proxying request ' + req.url + ' => ' + proxy.urlPath.host );
      proxy.proxy.web(req,res);
    }
  });

});

server.on('upgrade', function (req, socket, head) {
  console.log('Upgrade requested');
  detectProxy( req.url, function( err, proxy ) {
    if( err ) {
      console.log( err );
      socket.end();
    } else {
      console.log( 'Proxying request upgrade ' + req.url + ' => ' + proxy.urlPath.host );
      proxy.ws(req, socket, head);
    }
  });
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Google auth proxy server listening at", addr.address + ":" + addr.port);
});
