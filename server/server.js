require("dotenv").config();
const app = require("./src/app");
const connectDatabase = require("./src/config/database");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 5000;

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    logger.error("Failed to connect to MongoDB", error.message);
    process.exit(1);
  });