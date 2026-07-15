const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://127.0.0.1:5500")
  .split(",")
  .map((origin) => origin.trim());

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    }
  },
  credentials: true
};

module.exports = corsOptions;