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
      // req.method req.url
      res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Service Unavailable</title>
  <meta name="description" content="The requested page is not available at the moment.">
  <meta name="keywords" content="503, Service Unavailable, Error">
  <meta name="author" content="Project Furina">
  <meta property="og:title" content="Project Furina" />
  <meta property="og:description" content="The requested page is not available at the moment." />
  <meta property="og:image" content="https://project-furina.sytes.net/publiccdn/furina.png" />
  <meta property="og:url" content="https://project-furina.sytes.net" />
  <link rel="icon" href="/cdn/favicon.ico">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #121212;
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    
    .container {
      max-width: 600px;
      padding: 2rem;
      background: #1e1e1e;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      border-radius: 8px;
    }
    
    .icon {
      font-size: 80px;
      color: #FF5722;
      margin-bottom: 1rem;
    }
    
    h1 {
      font-size: 48px;
      margin: 0;
      color: #ffffff;
    }
    
    h2 {
      font-size: 24px;
      margin: 0.5rem 0 1.5rem;
      color: #cccccc;
    }
    
    p {
      font-size: 16px;
      line-height: 1.5;
      color: #b0b0b0;
      margin-bottom: 1.5rem;
    }
    
    a {
      color: #4dabf7;
      text-decoration: none;
      font-weight: 500;
    }
    
    a:hover {
      text-decoration: underline;
    }

    @keyframes flash {
        0%,
        100% {
            opacity: 1;
        }

        50% {
            opacity: 0.5;
        }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon" style="animation: flash 1.5s infinite;">&#9888;</div>
    <h1>503</h1>
    <h2>Service Unavailable</h2>
    <p>
      Project Furina Proxy failed to establish a connection to Project Furina Servers.
    </p>
    <p>
      Request Information: ${req.method} ${req.url}
    </p>
    <p>
      In the mean time, please refresh, try again later, or <a href="https://project-furina.statuspage.io/">check our status page</a>.
    </p>
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
