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
        .json({ message: "No working hours found for this date!" });
    }

    res.status(200).json({
      startTime: workingHours.startTime,
      endTime: workingHours.endTime,
      breakStart: workingHours.breakStart,
      breakEnd: workingHours.breakEnd,
      shiftedSlots: workingHours.shiftedSlots || [],
      intermediateSlots: workingHours.intermediateSlots || []
    });
  } catch (error) {
    next(error);
  }
});

router.post("/set-working-hours", async (req, res, next) => {
  try {
    const { date, startTime, endTime, breakStart, breakEnd } = req.body;
    const appointmentDate = new Date(`${date}T00:00:00Z`);

    // Ensure `date` is valid
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Set expiration date to 1 day after `date`
    const expiresAt = new Date(appointmentDate.setDate(appointmentDate.getDate() + 1));
    const updatedObject = await WorkingHours.findOneAndUpdate(
      { date },
      { startTime, endTime, expiresAt, breakEnd, breakStart },
      { upsert: true, new: true }
    );

    res
      .status(200)
      .json({
        startTime: updatedObject.startTime,
        endTime: updatedObject.endTime,
        breakStart: updatedObject.breakStart,
        breakEnd: updatedObject.breakEnd
      });
  } catch (error) {
    next(error);
  }
});

router.get("/custom-slots/:date", async (req, res, next) => {
  try {
    let { date } = req.params;
    date = date.slice(1);
    
    const workingHours = await WorkingHours.findOne({ date });
    
    if (!workingHours || !workingHours.hasCustomSlotPattern) {
      return res.status(200).json({ 
        hasCustomPattern: false,
        canceledHairAndBeardSlots: [],
        shiftedSlots: [],
        intermediateSlots: []
      });
    }
    
    res.status(200).json({
      hasCustomPattern: true,
      canceledHairAndBeardSlots: workingHours.canceledHairAndBeardSlots || [],
      shiftedSlots: workingHours.shiftedSlots || [],
      intermediateSlots: workingHours.intermediateSlots || []
    });
  } catch (error) {
    next(error);
  }
});

// New route to get all shifted and intermediate slots
router.get("/dynamic-slots/:date", async (req, res, next) => {
  try {
    let { date } = req.params;
    date = date.slice(1);
    
    const workingHours = await WorkingHours.findOne({ date });
    
    if (!workingHours) {
      return res.status(200).json({
        shiftedSlots: [],
        intermediateSlots: []
      });
    }
    
    // Return both shifted and intermediate slots
    res.status(200).json({
      shiftedSlots: workingHours.shiftedSlots || [],
      intermediateSlots: workingHours.intermediateSlots || []
    });
  } catch (error) {
    next(error);
  }
});

// Update shifted slot status
router.post("/update-slot-status", async (req, res, next) => {
  try {
    const { date, slotTime, slotType, isBooked, appointmentId } = req.body;
    
    const workingHours = await WorkingHours.findOne({ date });
    
    if (!workingHours) {
      return res.status(404).json({ message: "Working hours not found for this date" });
    }
    
    if (slotType === 'shifted') {
      const slotIndex = workingHours.shiftedSlots.findIndex(
        slot => slot.shiftedTime === slotTime
      );
      
      if (slotIndex === -1) {
        return res.status(404).json({ message: "Shifted slot not found" });
      }
      
      workingHours.shiftedSlots[slotIndex].isBooked = isBooked;
      
      if (appointmentId) {
        workingHours.shiftedSlots[slotIndex].bookedAppointmentId = appointmentId;
      }
    } 
    else if (slotType === 'intermediate') {
      const slotIndex = workingHours.intermediateSlots.findIndex(
        slot => slot.slotTime === slotTime
      );
      
      if (slotIndex === -1) {
        return res.status(404).json({ message: "Intermediate slot not found" });
      }
      
      workingHours.intermediateSlots[slotIndex].isBooked = isBooked;
      
      if (appointmentId) {
        workingHours.intermediateSlots[slotIndex].bookedAppointmentId = appointmentId;
      }
    }
    else {
      return res.status(400).json({ message: "Invalid slot type" });
    }
    
    await workingHours.save();
    
    res.status(200).json({ message: "Slot status updated successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;