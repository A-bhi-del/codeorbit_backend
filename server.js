import { createServer } from "http";
import app from "./app.js";
import { startStatsCron } from "./jobs/updateStats.job.js";
import { startExpirePingsCron } from "./jobs/expirePings.job.js";
import { initializeStreamChat } from "./services/stream.service.js";

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = createServer(app);

// Initialize Stream Chat (replaces Socket.IO)
initializeStreamChat();

// Start cron jobs
startStatsCron();
startExpirePingsCron();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Stream Chat initialized`);
});
