const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const {verifyCookie} = require("../middleware/verifyCookie");
const signJWT = require("../helpers/signJWT");
const nodemailer = require("nodemailer");
const verifyAdmin = require("../middleware/verifyAdmin");

const COOKIE_OPTIONS = {
  httpOnly: true,
  signed: true,
  secure: true, // Only true in production
  sameSite: "Strict", // "none" for production, "lax" for development
  path: "/",
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, // Your Gmail address  add to env
    pass: process.env.EMAIL_PASSWORD, // Your Gmail app password
  },
});

const hashPassword = async (password) => {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
};

router.get("/", async (req, res) => {
  const users = await User.find();
  res.status(200).json(users);
});

router.post("/register", async (req, res, next) => {
  try {
    const { email, firstname, lastname, password } = req.body;
    const userCheck = await User.findOne({ email: email });

    if (userCheck !== null) {
      throw new Error("User with this email already exists!");
    }
    const passwordHash = await hashPassword(password);
    await User.create({
      firstname,
      lastname,
      email,
      role: "user",
      password: passwordHash,
    });
    // const token = signJWT({ firstname, lastname, email, passwordHash });
    // res.cookie("jwt", token, {
    //   ...COOKIE_OPTIONS,
    //   maxAge: 3600000,
    // });
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(403).json({ message: `${error.message}` });
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email })
      .select("+password")
      .lean()
      .exec();
    if (!user) {
      return res.status(401).json({ message: "Wrong or unexisting email" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(404).json({ message: "Incorrect password" });
    }
    const userForToken = {
      _id: user._id,
      email: user.email,
      role: user.role,
      firstname: user.firstname,
      lastname: user.lastname,
      rights: user.rights,
      attendance: user.attendance,
      discountEligible: user.discountEligible,
    };

    const token = signJWT(userForToken);

    delete user.password;

    res.cookie("jwt", token, {
      ...COOKIE_OPTIONS,
      maxAge: 3600000,
    });

    return res
      .status(200)
      .json({ message: "Authorized succesfully", user, authenticated: true });
  } catch (error) {
    console.error("Login error:", error);

    // Check for specific error types
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid input data",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    if (error.name === "MongoError" || error.name === "MongoServerError") {
      return res.status(503).json({
        message: "Database error, please try again later",
      });
    }

    // Pass unexpected errors to the error handling middleware
    return next(error);
  }
});

router.get("/login", verifyCookie, (req, res, next) => {
  try {
    const user = req.user._doc ? { ...req.user._doc } : { ...req.user };
    delete user.resetToken;
    delete user.resetTokenExpirationTime;
    delete user.password;
    delete user.__v;
    res.status(200).json({ message: "Authorized succesfully", user });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/logout", (req, res, next) => {
  try {
    res.cookie("jwt", "", {
      ...COOKIE_OPTIONS,
      maxAge: 0,
      expires: new Date(0),
    });

    res.status(200).json({ message: "Cookie cleared successfully!" });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post("/reset-password", async (req, res) => {
  const { email } = req.body;
  const resetTokenHex = crypto.randomBytes(32).toString("hex");
  const resetTokenExpDate = Date.now() + 3600000; // 1hour

  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(404).json({ message: "No such email found!" });
  }

  user.resetToken = resetTokenHex;
  user.resetTokenExpirationTime = resetTokenExpDate;
  await user.save();
  clearUserCache(user._id.toString()); // Clear cache for the user

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetTokenHex}`;
  await transporter.sendMail({
    from: "barbariavarna@gmail.com",
    to: email, // This can be any email address
    subject: "Password reset",
    html: `
    <p>You requested a password reset</p>
        <p>Click this <a href="${resetUrl}">link</a> to set a new password.</p>
        <p>This link is valid for 1 hour</p>
        <p>If you didn't request this, please ignore this email</p>
    `,
  });

  res.status(200).json({ message: "Reset email sent!" });
});

router.post("/new-password", async (req, res) => {
  const { resetToken, newPassword } = req.body;
  const user = await User.findOne({ resetToken: resetToken }).select(
    "+password"
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid reset link !" });
  }

  if (user.resetTokenExpirationTime < Date.now()) {
    return res.status(410).json({ message: "Reset time expired !" });
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    return res.status(400).json({
      message: "New password should not be the same as your current password.",
    });
  }

  const newPasswordHash = await hashPassword(newPassword);
  user.password = newPasswordHash;
  user.resetToken = null;
  user.resetTokenExpirationTime = null;
  await user.save();
  clearUserCache(user._id.toString());
  res.status(200).json({ message: "Password reset successfully" });
});

router.patch("/update-attendance/:id", verifyCookie, verifyAdmin, async (req, res) => {
  
  let { id } = req.params;
  id = id.slice(1)
  const { attendance } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.attendance = attendance;
    user.save();
    clearUserCache(user._id.toString()); 
    res.status(200).json({ message: "Attendance updated successfully", user });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
