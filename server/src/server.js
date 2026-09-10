import app from "./app.js";
import { env, validateEnv } from "./config/env.js";
import { connectDB } from "./config/db.js";

const startServer = async () => {
  try {
    validateEnv();
    await connectDB();

    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server");
    console.error(error);
    process.exit(1);
  }
};

startServer();
