A reverse proxy that provides authentication using Google OAuth2 to authenticate users.

Port of this [GO implementation](https://github.com/drweaver/google_auth_proxy) 
(originally forked from [bitly/google_auth_proxy](https://github.com/bitly/google_auth_proxy))



Free SSL certificate can be created from [startSSL](http://www.startssl.com/)

To use default HTTPS (443) port the app requires root privileges.  Recommend using IP 
tables to perform internal port forwarding to non-privileged ports.  To redirect port 443 to 8443 
use following command:

```bash
sudo iptables -A PREROUTING -t nat -p tcp --dport 443 -j REDIRECT --to-port 8443
```

## Installing Node on Raspberry Pi

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
