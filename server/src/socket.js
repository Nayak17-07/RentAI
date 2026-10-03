const { Server } = require('socket.io');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
    }
  });

  io.on('connection', (socket) => {
    // Rooms for targeted real-time push
    socket.on('join:admin', () => {
      socket.join('room:admin');
    });

    socket.on('join:user', (userId) => {
      if (userId) socket.join(`room:user_${userId}`);
    });

    socket.on('join:owner', (ownerId) => {
      if (ownerId) socket.join(`room:owner_${ownerId}`);
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
}

function getIO() {
  return io;
}

function notifyAdmin(event, data) {
  if (io) {
    io.to('room:admin').emit(event, { ...data, timestamp: new Date().toISOString() });
    io.emit('broadcast:admin_event', { event, ...data, timestamp: new Date().toISOString() });
  }
}

function notifyUser(userId, event, data) {
  if (io && userId) {
    io.to(`room:user_${userId}`).emit(event, { ...data, timestamp: new Date().toISOString() });
  }
}

function notifyOwner(ownerId, event, data) {
  if (io && ownerId) {
    io.to(`room:owner_${ownerId}`).emit(event, { ...data, timestamp: new Date().toISOString() });
  }
}

function broadcastEvent(event, data) {
  if (io) {
    io.emit(event, { ...data, timestamp: new Date().toISOString() });
  }
}

module.exports = {
  initSocket,
  getIO,
  notifyAdmin,
  notifyUser,
  notifyOwner,
  broadcastEvent
};
