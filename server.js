import { createServer } from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { startStatsCron } from "./jobs/updateStats.job.js";
import { startExpirePingsCron } from "./jobs/expirePings.job.js";
import { initializeStreamChat } from "./services/stream.service.js";

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = createServer(app);

// Start server only after MongoDB connects
const startServer = async () => {
  try {
    // 1. Connect to MongoDB first
    await connectDB();
    
    // 2. Initialize Stream Chat
    initializeStreamChat();
    
    // 3. Start cron jobs
    startStatsCron();
    startExpirePingsCron();
    
    // 4. Start HTTP server
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Stream Chat initialized`);
      console.log(`✅ All services ready!`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
