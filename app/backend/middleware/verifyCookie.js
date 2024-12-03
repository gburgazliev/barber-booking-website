const jwt = require("jsonwebtoken");

const verifyCookie = (req, res, next) => {
  const token = req.signedCookies.jwt;

  if (!token)
    return res.status(401).json({ message: "Unauthorized: no token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

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

module.exports = verifyCookie;
