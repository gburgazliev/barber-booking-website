

const verifyAdmin = (req, res, next) => {
    // Check if the user is an admin
    if (req.user && req.user.role === "admin") {
        next(); // User is admin, proceed to the next middleware or route handler
    } else {
        res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    }

module.exports = verifyAdmin;