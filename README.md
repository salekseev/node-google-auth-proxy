# Node Google Auth Proxy

A reverse proxy that authenticates users with Google OAuth2 (i.e. your google account).  Authorisation is performed by the proxy via user email addresses in the config.json file.

It is a port of this [GO implementation](https://github.com/drweaver/google_auth_proxy) 
(originally forked from [bitly/google_auth_proxy](https://github.com/bitly/google_auth_proxy)).

### Installation

Assumes you have a domain setup (sustitute it for `mydomainname.com` below and SSL certificate (e.g. Free SSL certificate can be created from [startSSL](http://www.startssl.com/))

1. Install nodejs and npm (google is your friend, for RPi see below).
2. Clone the project: `git clone https://github.com/drweaver/node-google-auth-proxy.git`
3. Install dependencies from the newly created folder: `cd node-google-auth-proxy; npm install`
4. Get your Google OAuth client ID and client Secret from google developers console (see below) 
5. Create a config.json file (see below).
6. Run: `node ./google-auth-proxy.js`

#### Google OAuth Setup

1. Login to google developers console: https://console.developers.google.com navigate to APIS and Auth, Credentials.
2. Create a new Client ID if you don't already have one there - you'll need the client id and secret for the configuration below.
3. Set the Redirect URI to: `https://mydomainname.com/oauth2callback`

#### Configuration

Configuration is done via JSON file named `config.json`.  Example content should be:

```javascript
{
    "server": {
      "url": "https://mydomainname.com",
      "port": 8443,
      "ssl": {
        "keyFile": "/home/a_user/ssl/server.key",
        "crtFile": "/home/a_user/ssl/server.crt"
      }
    },
    "proxies": [
        { "path": "/ipcam/",              "target": "http://192.168.0.5:10088", "stripPath": true },
        { "path": "/sickbeard/",          "target": "http://192.168.0.6:8081",  "protocolRewrite": "https:" },
        { "path": "/sabnzbd/",            "target": "http://192.168.0.7:8080"   },
        { "path": "/gc/",                 "target": "http://192.168.0.20:5100"  },
        { "path": "/couchpotato/",        "target": "http://192.168.0.20:5050"  }
    ],
    "oauth": {
        "clientId": "<your google client id>",
        "clientSecret": "<your google client secret>",
        "validUsers": [ "authorised_user_1@gmail.com", "authorised_user_2@gmail.com" ],
        "callbackPath": "/oauth2callback"
    },
    "cookie": {
        "keys": ["SEKRET_KEY_TO_SIGN_COOKIE"],
        "name": "__proxy_userinfo.email",
        "maxAge": 1209600000
    }
}
```

#### Configure ports not to need sudo/root

To use default HTTPS (443) port the app requires root privileges.  Recommend using IP 
tables to perform internal port forwarding to non-privileged ports.  To redirect port 443 to 8443 
use following command:

```bash
sudo iptables -A PREROUTING -t nat -p tcp --dport 443 -j REDIRECT --to-port 8443
```

#### Installing Node on Raspberry Pi

```bash
wget http://nodejs.org/dist/v0.10.28/node-v0.10.28-linux-arm-pi.tar.gz
tar xvf node-v0.10.28-linux-arm-pi.tar.gz
sudo mkdir /opt/node
sudo cp -r node-v0.10.28-linux-arm-pi/* /opt/node
rm -rf node-v0.10.28-linux-arm-pi*
sudo nano /etc/profile
```
paste in:
```
NODE_JS_HOME="/opt/node"
PATH="$PATH:$NODE_JS_HOME/bin"
export PATH
```

Log out and back in and try node -v, it should give v0.10.28.
