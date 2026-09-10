import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async () => {
	try {
		await mongoose.connect(env.MONGODB_URI);
		console.log("Connected to MongoDB")

	} catch (error) {
		console.log("MongoDB Connection Failed");
		console.log(error.message);
		// Do not accept requests that would fail later because their primary data store is unavailable.
		process.exit(1);
	}
}
