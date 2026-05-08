import { createServer } from "http";
import app from "./app.js";
import { startStatsCron } from "./jobs/updateStats.job.js";
import { startExpirePingsCron } from "./jobs/expirePings.job.js";
import { initializeSocket } from "./sockets/socketManager.js";
import { initializeStreamChat } from "./services/stream.service.js";

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Initialize Stream Chat
initializeStreamChat();

// Start cron jobs
startStatsCron();
startExpirePingsCron();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO initialized`);
});
