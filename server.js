import app from "./app.js";
import { startStatsCron } from "./jobs/updateStats.job.js";
import cors from "cors";

const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://codeorbit-sage.vercel.app",
    "https://codeorbit-git-main-arpit-srivastavas-projects-4aa240ca.vercel.app",
    "https://codeorbit-9eqzasyrb-arpit-srivastavas-projects-4aa240ca.vercel.app"
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Apply CORS middleware
app.use(cors(corsOptions));

startStatsCron();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for origins:`, corsOptions.origin);
});
