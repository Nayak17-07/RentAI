require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { connectDb } = require('./src/db');
const { initSocket } = require('./src/socket');

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    await connectDb();
    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`  🚀 Rentora Node.js, Express & WebSocket API Server Running!`);
      console.log(`  📡 URL: http://127.0.0.1:${PORT}`);
      console.log(`  ⚡ Socket.io: ws://127.0.0.1:${PORT}`);
      console.log(`  🔗 Health: http://127.0.0.1:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
