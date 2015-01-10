var http = require('http'),
    httpProxy = require('http-proxy');

var config = require('./config.json');
var url = require('url');

//
// Create a proxy server with custom application logic
//
var proxy = httpProxy.createProxyServer({ target: 'http://host'});

//
// Create your custom server and just call `proxy.web()` to proxy
// a web request to the target passed in the options
// also you can use `proxy.ws()` to proxy a websockets request
//
var i = 0;
var server = http.createServer(function(req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  console.log('Proxying request' + i++);
  proxy.web(req, res);
});

server.on('upgrade', function (req, socket, head) {
  proxy.ws(req, socket, head);
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Garage server listening at", addr.address + ":" + addr.port);
});
