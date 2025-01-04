const express = require("express");
const cors = require("cors");
const mongoose = require("./mongoDB/mongoDB-config");
const connectToDB = require("./mongoDB/mongoDB-config");
const cookieParser = require("cookie-parser");
// const rateLimit = require('express-rate-limit');
const CORS_OPTIONS = {
  origin: [
    "http://localhost:5173",
    "http://192.168.100.2:5173",
    process.env.FRONTEND_URL,
  ], // Allow requests from this origin
  // Allowed HTTP methods
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cookie",
    "Cache-Control",
    "Pragma",
  ],
  exposedHeaders: ["Set-Cookie"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100 // limit each IP to 100 requests per windowMs
// });

// app.use(limiter);

async function startServer() {
  await connectToDB();

  const app = express();

  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.options("*", cors(CORS_OPTIONS));
  app.use(cors(CORS_OPTIONS));
  app.use(express.json());
  const port = process.env.PORT || 5000;
  app.listen(port);
  app.get("/", (req, res) => {
    res.status(200).json({ message: "Backend is running!" });
  });

  const UserRouter = require("./routes/users");

  app.use("/api/users", UserRouter);
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: err.message });
  });
}
startServer();

// Improved server startup
