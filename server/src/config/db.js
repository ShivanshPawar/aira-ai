import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async () => {
    try {
        await mongoose.connect(env.MONGODB_URI);
        console.log("Connected to MongoDB")

    } catch (error) {
        console.log("MongoDB Connection Failed");
        console.log(error.message);
        process.exit(1);
    }
}