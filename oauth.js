var config = require('./config.json');
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var userinfo = google.oauth2('v2').userinfo;
var oauth2Client = new OAuth2(config.oauth.clientId, config.oauth.clientSecret, config.server.url + config.oauth.callbackPath);
google.options({ auth: oauth2Client });

module.exports.action = function( code, state, callback ) {
  if( !code ) {
    callback('No code supplied');
    return;
  } 
  if( !state ) {
    callback('No state supplied');
    return;
  }
  oauth2Client.getToken(code, function(err, tokens) {
    if( err ) {
      callback( 'Failed to get exchange code for tokens: ' + err );
      return;
    }
    oauth2Client.setCredentials(tokens);
    userinfo.get({auth: oauth2Client}, function(err, user) {
      if( err ) {
        callback( 'Failed to perform UserInfo API call: '+err );
        return;
      }
      callback(null, user.email, state);
    });
  });
  
} 

module.exports.authUrl = function(path) {
    return oauth2Client.generateAuthUrl({access_type: 'offline', scope: 'email', state:path })
}