const express = require("express");
const cors = require("cors");
const corsOptions = require("./config/cors");
const authRoutes = require("./routes/authRoutes");
const groupRoutes = require("./routes/groupRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "SplitEasy API is running. This server only serves /api routes — open the frontend separately (e.g. via Live Server) to use the app."
  });
});

app.get("/api", (req, res) => {
  res.status(200).json({
    message: "SplitEasy API root. Available endpoints are under /api/auth and /api/health.",
    endpoints: [
      "GET /api/health",
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/auth/me",
      "POST /api/auth/upload-photo"
    ]
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/groups", expenseRoutes);

app.use(errorHandler);

module.exports = app;