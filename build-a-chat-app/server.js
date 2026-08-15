import http from 'http';
import fs from 'fs';
import { WebSocketServer } from 'ws';

const PORT = 3001;

const server = http.createServer((req, res) => {
  if (req.url === '/script.js') {
    fs.readFile('./public/script.js', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading script.js');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      res.end(data);
    });
  } else {
    fs.readFile('./public/index.html', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  }
});

const wss = new WebSocketServer({ server });

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { 
      client.send(message);
    }
  });
}

wss.on('connection', (socket, req) => {
  const username = new URL(req.url, 'http://localhost').searchParams.get('username');
  broadcast({
    type: 'system',
    text: `${username} joined`
  });

  socket.on('message', (data) => {
    try {
      const parsed = JSON.parse(data);
      broadcast({
        type: 'chat',
        username: parsed.username,
        text: parsed.text
      });
    } catch {
    }
  });

  socket.on('close', () => {
    broadcast({
      type: 'system',
      text: `${username} left`
    });
  });
});

server.listen(PORT, () => {
  console.log('Chat server running at http://localhost:3001');
});