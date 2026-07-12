const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || "http://127.0.0.1:5500",
  credentials: true
};

module.exports = corsOptions;