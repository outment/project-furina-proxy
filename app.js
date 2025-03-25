const net = require('net');
const http = require('http');
const fs = require('fs');
const httpProxy = require('http-proxy');

const PORT = process.env.PORT || 3000;
const ALLOWED_HOST = 'project-furina.sytes.net';

function createProxyAgent(req) {
  return new http.Agent({
    createConnection: (options, callback) => {
      const socket = net.connect(options, () => {
        const remoteAddress = req.socket ? req.socket.remoteAddress : req.connection.remoteAddress;
        const remotePort = req.socket ? req.socket.remotePort : req.connection.remotePort;
        const header = `PROXY TCP4 ${remoteAddress} ${options.host} ${remotePort} ${options.port}\r\n`;
        socket.write(header, () => callback(null, socket));
      });
      socket.on('error', callback);
    }
  });
}

const proxy = httpProxy.createProxyServer({});

proxy.on('error', (err, req, res) => {
  console.error("Proxy encountered an error:", err);

  if (res && typeof res.writeHead === 'function') {
    try {
      if (!res.headersSent) {
        res.writeHead(503, { 'Content-Type': 'text/html' });
      }
      res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proxy Route Failure</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; color: #333; }
    .container { padding: 2rem; }
    h1, h2 { color: #007bff; }
    .endpoint { background-color: #fff; border: 1px solid #ddd; margin: 1rem 0; padding: 1rem; border-radius: 4px; }
    .endpoint code { background-color: #f4f4f4; padding: 0.2rem; border-radius: 4px; }
    .request-method { font-weight: bold; color: #333; }
    .response { background-color: #f8f9fa; padding: 1rem; margin-top: 1rem; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="endpoint">
      <h1>Proxy Route Failure</h1>
      <p class="request-method">${req.method} ${req.url}</p>
      <p>PFPRXY failed to connect to Project Furina Servers.</p>
      <h2>Further Information</h2>
      <div class="response">
        <pre>Project Furina Proxy attempted to connect to the target machine, but the target machine did not respond in a timely manner.</pre>
        <pre>ERROR: PFPRXY_CONNECTION_TIMEOUT</pre>
      </div>
      <i>PFPRXY encountered a connection error, therefore you are not able to access this website at the moment.</i>
    </div>
  </div>
</body>
</html>`);
    } catch (writeErr) {
      console.error("Error writing error response:", writeErr);
    }
  } else {
    if (req.socket && req.socket.writable) {
      req.socket.end();
    }
  }
});

const server = http.createServer((req, res) => {
  const hostHeader = req.headers.host || '';
  if (!hostHeader.includes(ALLOWED_HOST)) {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed: You are not permitted to access this end-point. Please use https://project-furina.sytes.net/');
    return;
  }
  
  if (req.url === '/pfprxy/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }
  
  const targetUrl = process.env.PROXIEDADDRESS;
  if (!targetUrl) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('PROXIEDADDRESS is not set.');
    return;
  }
  
  const agent = createProxyAgent(req);
  proxy.web(req, res, { target: targetUrl, agent });
});

server.on('upgrade', (req, socket, head) => {
  const hostHeader = req.headers.host || '';
  if (!hostHeader.includes(ALLOWED_HOST)) {
    socket.write('HTTP/1.1 405 Method Not Allowed\r\n\r\n');
    socket.destroy();
    return;
  }
  
  const targetUrl = process.env.PROXIEDADDRESS;
  if (!targetUrl) {
    socket.end('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    return;
  }
  
  const agent = createProxyAgent(req);
  proxy.ws(req, socket, head, { target: targetUrl, agent });
});

server.listen(PORT, () => console.log(`Project Furina Reverse Proxy is now active on port ${PORT}.`));
