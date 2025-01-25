const express = require("express");
const cors = require("cors");
const config = require("./config/config");
const aiRoutes = require("./routes/aiRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json(config.bodyParser));
app.use(express.urlencoded({ extended: true, ...config.bodyParser }));

// Health check
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Routes
app.use("/api", aiRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(config.port, "0.0.0.0", () => {
  console.log(`Server running on port ${config.port}`);
});
