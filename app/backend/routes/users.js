const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const verifyCookie = require("../middleware/verifyCookie");
const signJWT = require("../helpers/signJWT");
const COOKIE_OPTIONS = {
  httpOnly: true,
  signed: true,
  secure: true,
  sameSite: "strict",
};

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
    const userCheck = User.find({ email: email });
      
    if (userCheck !== null &&  userCheck !== undefined) {
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
    const token = signJWT({ firstname, lastname, email, passwordHash });
    res.cookie("jwt", token, {
      ...COOKIE_OPTIONS,
      maxAge: 3600000,
    });
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res
      .status(403)
      .json({ message: `Error registering user: ${error.message}` });
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
  const user = req.user;
  res.status(200).json({ message: "Authorized succesfully", user });
});

router.get("/logout", (req, res) => {
  res.clearCookie("jwt", {
    ...COOKIE_OPTIONS,
  });
  res.status(200).json({ message: "Cookie cleared successfully!" });
});

module.exports = router;
