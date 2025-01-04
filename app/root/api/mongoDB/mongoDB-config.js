const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please set up your MongoDB URI in the environment variables");
}

// Connect to MongoDB using Mongoose
const connectDB = async () => {
  try {
    await mongoose.connect(uri)
    console.log("Connected to MongoDB using Mongoose");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};



module.exports = connectDB