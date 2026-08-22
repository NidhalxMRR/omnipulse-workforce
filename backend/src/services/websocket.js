import { WebSocketServer } from 'ws';

let wss = null;
const clients = new Set();

export function initWebSocketServer(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    clients.add(ws);
    // Send welcome heartbeat
    ws.send(JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() }));

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('[WebSocket Client Error]', err.message);
      clients.delete(ws);
    });
  });

  console.log('📡 Realtime WebSocket Gateway Ready.');
}

export function broadcastAgentUpdate(agentUpdate) {
  if (!wss || clients.size === 0) return;

  const payload = JSON.stringify({
    type: 'AGENT_UPDATE',
    data: agentUpdate,
    timestamp: new Date().toISOString()
  });

  for (const client of clients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(payload);
    }
  }
}
