const http = require('http')
const httpProxy = require('http-proxy')
const proxy = httpProxy.createProxyServer({})

http.createServer((req, res) => {
  const target = 'http://147.185.221.26:12086' + req.url
  proxy.web(req, res, { target })
}).listen(3000, () => console.log('Project Furina Reverse Proxy is now active.'))
