const express = require("express");
const router = express.Router();

const Price = require("../models/Price");
const verifyCookie = require("../middleware/verifyCookie");
const verifyAdmin = require("../middleware/verifyAdmin");


router.get("/", async (req, res) => {
  try {
    const prices = await Price.find();
    res.status(200).json(prices);
  } catch (error) {
    res.status(500).json({ message: "Error fetching prices" });
  }
});

// set a price
router.post("/set-price", verifyCookie, verifyAdmin, async (req, res) => {
  try {
    const { type, price } = req.body;
    const existingPrice = await Price.findOne({ type });
    if (existingPrice) {
      existingPrice.price = price;
      await existingPrice.save();
      return res.status(200).json({ message: "Price updated successfully!" });
    } else {
      const newPrice = new Price({ type, price });
      await newPrice.save();
      return res.status(201).json({ message: "Price set successfully!" });
    }
    } catch (error) {
    res.status(500).json({ message: "Error setting price" });
  }
}
);

module.exports = router;