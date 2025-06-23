/**
 * Simple HTTP server for local development
 * Run with: node local-server.js
 * Then open: http://localhost:8080
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  console.debug(`${req.method} ${req.url}`);
  
  // Parse URL
  const parsedUrl = url.parse(req.url);
  
  // Extract the path from the URL
  let pathname = `.${parsedUrl.pathname}`;
  
  // If path ends with '/', serve index.html
  if (pathname === './') {
    pathname = './index.html';
  }
  
  // Get the file extension
  const ext = path.parse(pathname).ext;
  
  // Maps file extension to MIME type
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  // Read the file from disk
  fs.readFile(pathname, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404);
        res.end(`File ${pathname} not found!`);
        return;
      }
      
      // Server error
      res.writeHead(500);
      res.end(`Error getting the file: ${err.code}`);
      return;
    }
    
    // Success - return the file
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.debug(`Server running at http://localhost:${PORT}/`);
  console.debug(`Press Ctrl+C to stop the server`);
});