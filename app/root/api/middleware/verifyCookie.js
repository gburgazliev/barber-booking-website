const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Simple in-memory cache with TTL (Time To Live)
const userCache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

const verifyCookie = async (req, res, next) => {
  const token = req.signedCookies.jwt;

  if (!token)
    return res.status(401).json({ message: "Unauthorized: no token provided" });
    
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded._id;
    
    // Check cache first
    const cached = userCache.get(userId);
    const now = Date.now();
    
    let freshUser;
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      // Use cached data if it's fresh enough
      freshUser = cached.user;
    } else {
      // Fetch fresh user data from database
      freshUser = await User.findById(userId)
        .select('-password -resetToken -resetTokenExpirationTime')
        .lean();
      
      if (!freshUser) {
        return res.status(401).json({ message: "Unauthorized: user not found" });
      }
      
      // Cache the fresh data
      userCache.set(userId, {
        user: freshUser,
        timestamp: now
      });
    }
    
    // Check if user account is suspended
    if (freshUser.rights === 'suspended') {
      return res.status(403).json({ message: "Account suspended" });
    }
    
    // Attach fresh user data to request
    req.user = freshUser;
    
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Unauthorized: token has expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Unauthorized: invalid token" });
    }
    console.error("JWT verification error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Optional: Clear cache when user data changes
const clearUserCache = (userId) => {
  userCache.delete(userId);
};

module.exports = { verifyCookie, clearUserCache };