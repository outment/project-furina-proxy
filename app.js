const net = require('net')
const http = require('http')
const httpProxy = require('http-proxy')

const PORT = process.env.PORT || 3000

function createProxyAgent(req) {
  return new http.Agent({
    createConnection: (options, callback) => {
      const socket = net.connect(options, () => {
        const header = `PROXY TCP4 ${req.connection.remoteAddress} ${options.host} ${req.connection.remotePort} ${options.port}\r\n`
        socket.write(header, () => callback(null, socket))
      })
    }
  })
}

const proxy = httpProxy.createProxyServer({})

http.createServer((req, res) => {
  const targetUrl = 'http://147.185.221.25:33187' + req.url
  const agent = createProxyAgent(req)
  proxy.web(req, res, { target: targetUrl, agent })
}).listen(PORT, () => console.log(`Project Furina Reverse Proxy is now active on port ${PORT}.`))
