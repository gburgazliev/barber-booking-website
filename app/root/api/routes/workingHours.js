const express = require("express");
const router = express.Router();
const WorkingHours = require("../models/WorkingHours");
const verifyCookie = require("../middleware/verifyCookie");
router.get("/get-working-hours/:date", async (req, res, next) => {
  try {
    let { date } = req.params;
    date = date.slice(1);
    const workingHours = await WorkingHours.findOne({ date });

    if (!workingHours) {
      return res
        .status(400)
        .json({ message: "No working hours found for this date !" });
    }

    res.status(200).json({
      startTime: workingHours.startTime,
      endTime: workingHours.endTime,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/set-working-hours", async (req, res, next) => {
  try {
    const { date, startTime, endTime } = req.body;
    const updatedObject = await WorkingHours.findOneAndUpdate(
      { date },
      { startTime, endTime },
      { upsert: true, new: true }
    );

    res
      .status(200)
      .json({
        startTime: updatedObject.startTime,
        endTime: updatedObject.endTime,
      });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
