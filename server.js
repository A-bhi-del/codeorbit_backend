import app from "./app.js";
import { startStatsCron } from "./jobs/updateStats.job.js";

const PORT = process.env.PORT || 5000;

startStatsCron();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});