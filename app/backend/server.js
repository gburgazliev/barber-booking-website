const express = require("express");
const cors = require("cors");
const mongoose = require("./mongoDB/mongoDB-config");
const cookieParser = require("cookie-parser");
const CORS_OPTIONS = {
  origin: [
    "http://localhost:5173",
    process.env.FRONTEND_URL,
  ], // Allow requests from this origin
   // Allowed HTTP methods
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["set-cookie"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
const app = express();
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(cors(CORS_OPTIONS));
app.use(express.json());
const port = process.env.PORT || 5000;
app.listen(port);
app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend is running!" });
});

const UserRouter = require("./routes/users");

app.options("*", cors(CORS_OPTIONS));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Something went wrong!", error: err.message });
});

app.use("/api/users", UserRouter);
