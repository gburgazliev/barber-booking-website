const express = require("express");
const cors = require("cors");
const { connectDB } = require("./mongoDB/mongoDB-config");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const morgan = require('morgan');
const winston = require('winston');
const fs = require('fs');
const path = require('path');
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


// Create logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

const startServer = async () => {
  await connectDB();

  const app = express();

  // Create log directory if it doesn't exist
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  // Setup HTTP request logging
  const accessLogStream = fs.createWriteStream(
    path.join(logDir, 'access.log'),
    { flags: 'a' }
  );
  app.use(morgan('combined', { stream: accessLogStream }));

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
  const AdminRouter = require("./routes/admin");
  const PriceRouter = require("./routes/prices");

  // Apply auth limiter to authentication routes

  // app.use("/api/users/register", authLimiter);
  // app.use("/api/users/reset-password", authLimiter);

  // Apply routes
  app.use("/api/users", UserRouter);
  app.use("/api/schedule", ScheduleRouter);
  app.use("/api/appointments", AppointmentRouter);
  app.use("/api/admin", AdminRouter);
  app.use("/api/prices", PriceRouter);

  // Error handling middleware
  // Add global error handler with logging
  app.use((err, req, res, next) => {
    logger.error({
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    const message = process.env.NODE_ENV === 'production'
      ? "Something went wrong!"
      : err.message;

    res.status(500).json({ message });
  });

  // Make logger available throughout the application
  app.locals.logger = logger;

  console.log(`Server started on port ${port}`);
  logger.info(`Server started on port ${port}`);
};

startServer().catch(err => {
  console.error("Failed to start server:", err);
  logger.error("Failed to start server:", err);
  process.exit(1);
});