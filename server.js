var https = require('https');
var Cookies = require( "cookies" );
var config = require('./config.json');
var url = require('url');
var proxy = require('./proxy.js');
var oauth = require('./oauth.js');
var fs = require('fs');
var Keygrip = require('keygrip');
var keys = Keygrip(config.cookie.keys);

var options = {
  key: fs.readFileSync(config.server.ssl.keyFile),
  cert: fs.readFileSync(config.server.ssl.crtFile)
};

var server = https.createServer(options);

server.on('request', function(req, res) {
  
  var cookies = new Cookies(req,res,keys);
  
  var badRequest = function(err) {
    console.log(err);
    res.writeHead(403, {'Content-Type': 'text/plain'});
    res.write('Bad request');
    res.end();
  };
  
  var redirect = function(loc) {
    console.log('Redirecting to '+loc);
    res.writeHead(302, {'Location': loc});
    res.end();
  };
  
  var notFound = function(err) {
    console.log( err );
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.write('The page you are looking for is not found');
    res.end();
  };
  
  var forbidden = function(err) {
    console.log( err );
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.write('You are not authorised to access this page');
    res.end();
  }
  
  var reqUrl = url.parse(req.url, true);
  if( !reqUrl ) {
    badRequest('Failed to parse request URL');
    return;
  }
  console.log( 'Requested ' + reqUrl.pathname );
  
  if( reqUrl.pathname == config.oauth.callbackPath ) {
    console.log( 'Handling oauth callback' );
    oauth.action(reqUrl.query.code, reqUrl.query.state, function( err, email, path ) {
      if( err ) {
        badRequest(err);
        return;
      }
      cookies.set(config.cookie.name, email, { signed: true, secureProxy: false });
      redirect(path);
    });
    return;
  } 
  
  // normal path processing
    
  var email = cookies.get(config.cookie.name, { signed: true } );
  // 1. If no cookie or invalid, redirect for auth
  if( !email ) {
    redirect(oauth.authUrl(reqUrl.path));
    return;
  } 
  console.log('email retreived from secure cookie: ' + email);
  // 2. if not authorised, give forbidden message
  if( config.oauth.validUsers.indexOf( email ) == -1 ) {
    forbidden('User not authorised: '+email);
    return;
  }
  proxy.detectProxy( req.url, function( err, proxyServer, host ) {
    if( err ) {
      notFound(err);
      return;
    } 
    console.log( 'Proxying request ' + req.url + ' => ' + host );
    // res.writeHead(200, { "Content-Type": "text/plain"});
    // res.write('Proxy found: ' + host);
    // res.end();
    proxyServer.web(req,res);
    
  });
    
});

server.on('upgrade', function (req, socket, head) {
  console.log('Upgrade requested');
  proxy.detectProxy( req.url, function( err, proxyServer, host ) {
    if( err ) {
      console.log( err );
      socket.end();
      return;
    } 
    console.log( 'Proxying request upgrade ' + req.url + ' => ' + host );
    proxyServer.ws(req, socket, head);
    
  });
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Google auth proxy server listening at", addr.address + ":" + addr.port);
});
