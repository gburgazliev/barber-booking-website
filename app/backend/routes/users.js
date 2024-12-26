const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const verifyCookie = require("../middleware/verifyCookie");
const signJWT = require("../helpers/signJWT");
const nodemailer = require("nodemailer");

const COOKIE_OPTIONS = {
  httpOnly: true,
  signed: true,
  secure: false,  // Only true in production
  sameSite:'none', // "none" for production, "lax" for development

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

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "Wrong or unexisting email" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(404).json({ message: "Incorrect password" });
    }

    const token = signJWT(user);
    res.cookie("jwt", token, {
      ...COOKIE_OPTIONS,
      maxAge: 3600000,
    });
    

    res.status(200).json({ message: "Authorized succesfully", user });
  } catch (error) {
    res.status(404).json({ message: "Error authorizing user" });
  }
});

router.get("/login", verifyCookie, (req, res) => {
 
  const user = { ...req.user._doc, iat: req.user.iat, exp: req.user.exp };

  res.status(200).json({ message: "Authorized succesfully", user });
});

router.get("/logout", (req, res) => {
  res.clearCookie("jwt", {
    ...COOKIE_OPTIONS,
  });
  res.status(200).json({ message: "Cookie cleared successfully!" });
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
  const user = await User.findOne({ resetToken: resetToken });

  if (!user) {
    return res.status(401).json({ message: "Invalid reset link !" });
  }

  if (user.resetTokenExpirationTime < Date.now()) {
    return res.status(410).json({ message: "Reset time expired !" });
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    return res.status(400).json({
      message: "New password should not be the same your current password.",
    });
  }

  const newPasswordHash = await hashPassword(newPassword);
  user.password = newPasswordHash;
  user.resetToken = null;
  user.resetTokenExpirationTime = null;
  await user.save();
  res.status(200).json({ message: "Password reset successfully" });
});

module.exports = router;
