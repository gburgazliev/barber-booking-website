const express = require("express");
const cors = require("cors");
const { connectDB } = require("./mongoDB/mongoDB-config");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const sanitizeInputs = require("./middleware/sanitize");

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

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { message: "Too many requests, please try again later" }
});

// More strict rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 login attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" }
});

const startServer = async () => {
  await connectDB();

  const app = express();
  
  // Security headers
  app.use(helmet());
  
  // Parse cookies
  app.use(cookieParser(process.env.COOKIE_SECRET));
  
  // CORS configuration
  app.options("*", cors(CORS_OPTIONS));
  app.use(cors(CORS_OPTIONS));
  
  // Apply rate limiting
  app.use(limiter);
  
  // Parse JSON request bodies
  app.use(express.json({ limit: '1mb' }));
  
  // Sanitize all inputs
  app.use(sanitizeInputs);
  
  const port = process.env.PORT || 5000;
  app.listen(port);
  
  // Basic healthcheck route
  app.get("/", (req, res) => {
    res.status(200).json({ message: "Backend is running!" });
  });

  // Import routes
  const UserRouter = require("./routes/users");
  const ScheduleRouter = require("./routes/workingHours");
  const AppointmentRouter = require("./routes/appointments");

  // Apply auth limiter to authentication routes
 
  app.use("/api/users/register", authLimiter);
  app.use("/api/users/reset-password", authLimiter);
  
  // Apply routes
  app.use("/api/users", UserRouter);
  app.use("/api/schedule", ScheduleRouter);
  app.use("/api/appointments", AppointmentRouter);
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Sanitize error messages in production
    const message = process.env.NODE_ENV === 'production' 
      ? "Something went wrong!" 
      : err.message;
      
    res.status(500).json({ 
      message, 
      error: process.env.NODE_ENV === 'production' ? undefined : err.message 
    });
  });
  
  console.log(`Server started on port ${port}`);
};

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});