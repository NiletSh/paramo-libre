const jwt = require('jsonwebtoken');
const { WebSocketServer } = require('ws');
const { handleShelfReading } = require('./shelf.service');

const JWT_SECRET = process.env.JWT_SECRET || 'paramo_libre_secret_key';

const browsers = new Set();
const devices = new Set();

const snapshot = {
  type: 'shelf',
  result: 'status',
  deviceOnline: false,
  peso: null,
  mov: false,
  oscuro: false,
  rfid: false,
  uid: '',
  presentes: '1111',
  message: 'El estante todavía no se ha conectado.'
};

function deviceOnline() {
  return devices.size > 0;
}

function send(ws, payload) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(payload));
  }
}

function publish(payload) {
  const message = JSON.stringify({ ...snapshot, ...payload, deviceOnline: deviceOnline() });
  Object.assign(snapshot, payload, { deviceOnline: deviceOnline() });
  for (const client of browsers) {
    if (client.readyState === 1) client.send(message);
  }
}

function authorizeDevice(request) {
  const expected = process.env.SHELF_API_KEY;
  if (!expected) return false;
  const header = request.headers['x-shelf-key'];
  if (header && header === expected) return true;
  try {
    const url = new URL(request.url, 'http://localhost');
    return url.searchParams.get('key') === expected;
  } catch {
    return false;
  }
}

function authorizeBrowser(request) {
  try {
    const url = new URL(request.url, 'http://localhost');
    const token = url.searchParams.get('token');
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function reject(socket, status, message) {
  socket.write(`HTTP/1.1 ${status} ${message}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

async function onDeviceMessage(ws, raw) {
  let data;
  try {
    data = JSON.parse(raw.toString());
  } catch {
    send(ws, { ok: false, message: 'JSON inválido' });
    return;
  }

  if (data.type === 'status') {
    publish({
      type: 'shelf',
      result: 'status',
      peso: Number.isFinite(Number(data.peso)) ? Number(data.peso) : snapshot.peso,
      mov: Boolean(data.mov),
      oscuro: Boolean(data.oscuro),
      rfid: data.rfid !== false,
      uid: typeof data.uid === 'string' ? data.uid.slice(0, 32) : snapshot.uid,
      presentes: typeof data.presentes === 'string' ? data.presentes.slice(0, 8) : snapshot.presentes,
      message: snapshot.message
    });
    return;
  }

  if (data.type !== 'book') {
    send(ws, { ok: false, message: 'Tipo de mensaje no reconocido' });
    return;
  }

  try {
    const result = await handleShelfReading({
      bookId: data.book_id || data.bookId,
      uid: data.uid,
      event: data.event,
      weight: data.weight
    });
    const peso = Number(data.weight);
    publish({
      ...result,
      peso: Number.isFinite(peso) ? peso : snapshot.peso
    });
    send(ws, { ok: true, ...result });
  } catch (error) {
    send(ws, { ok: false, message: error.message || 'No se pudo registrar el movimiento' });
  }
}

function attachShelfSocket(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    let pathname = '';
    try {
      pathname = new URL(request.url, 'http://localhost').pathname;
    } catch {
      reject(socket, 400, 'Bad Request');
      return;
    }

    if (pathname === '/ws/shelf') {
      if (!process.env.SHELF_API_KEY) {
        reject(socket, 503, 'Shelf key missing');
        return;
      }
      if (!authorizeDevice(request)) {
        reject(socket, 401, 'Unauthorized');
        return;
      }
      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.role = 'device';
        wss.emit('connection', ws, request);
      });
      return;
    }

    if (pathname === '/ws/live') {
      if (!authorizeBrowser(request)) {
        reject(socket, 401, 'Unauthorized');
        return;
      }
      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.role = 'browser';
        wss.emit('connection', ws, request);
      });
      return;
    }

    reject(socket, 404, 'Not Found');
  });

  wss.on('connection', (ws) => {
    if (ws.role === 'browser') {
      browsers.add(ws);
      send(ws, { ...snapshot, deviceOnline: deviceOnline() });
      ws.on('close', () => browsers.delete(ws));
      return;
    }

    devices.add(ws);
    const message = snapshot.result === 'status'
      ? 'Estante conectado. Esperando un movimiento de libro.'
      : snapshot.message;
    publish({ result: 'status', message });
    ws.on('message', (raw) => {
      onDeviceMessage(ws, raw).catch((error) => {
        console.error('Error en mensaje del estante:', error);
      });
    });
    ws.on('close', () => {
      devices.delete(ws);
      publish({ ...snapshot, result: 'status' });
    });
  });
}

module.exports = {
  attachShelfSocket,
  publishShelf: publish
};
