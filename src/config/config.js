const dotenv = require("dotenv");
dotenv.config();

const config = {
  port: process.env.PORT || 8000,
  openaiApiKey: process.env.OPENAI_API_KEY,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  bodyParser: {
    limit: "50mb",
  },
};

module.exports = config;
