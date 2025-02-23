const net = require('net')
const http = require('http')
const httpProxy = require('http-proxy')

const PORT = process.env.PORT || 3000

function createProxyAgent(req) {
  return new http.Agent({
    createConnection: (options, callback) => {
      const socket = net.connect(options, () => {
        const sourceAddress = req.connection.remoteAddress
        const sourcePort = req.connection.remotePort
        const destAddress = socket.localAddress
        const destPort = socket.localPort
        const header = `PROXY TCP4 ${sourceAddress} ${destAddress} ${sourcePort} ${destPort}\r\n`
        socket.write(header, () => callback(null, socket))
      })
    }
  })
}

const proxy = httpProxy.createProxyServer({})

http.createServer((req, res) => {
  const targetUrl = 'http://147.185.221.26:12086/' + req.url
  const agent = createProxyAgent(req)
  proxy.web(req, res, { target: targetUrl, agent })
}).listen(PORT, () => console.log(`Project Furina Reverse Proxy is now active on port ${PORT}.`))
