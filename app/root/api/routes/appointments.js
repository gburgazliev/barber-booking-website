const express = require("express");
const router = express.Router();
const verifyCookie = require("../middleware/verifyCookie");
const crypto = require("crypto");
const Appointment = require("../models/Appointment");
const WorkingHours = require("../models/WorkingHours")
const nodemailer = require("nodemailer");
const { default: mongoose } = require("mongoose");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, // Your Gmail address  add to env
    pass: process.env.EMAIL_PASSWORD, // Your Gmail app password
  },
});

// Helper function to calculate the next time slot (40 minutes later)
const calculateNextTimeSlot = (timeSlot) => {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  let newMinutes = minutes + 40;
  let newHours = hours;
  
  if (newMinutes >= 60) {
    newMinutes -= 60;
    newHours += 1;
  }
  
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
};

router.get("/:date", async (req, res, next) => {
  let { date } = req.params;
  date = date.slice(1);
  try {
    const appointments = await Appointment.find({ date, status:'Confirmed' }).populate("userId");

    res.status(200).json(appointments);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: "Confirmed" });
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching appointments !" });
  }
});

router.post("/book", verifyCookie, async (req, res, next) => {
  try {
    const { date, timeSlot, type,  duration = 40 } = req.body;
    const userId = req.user._id;
    const { email, firstname } = req.user;

    const hasUserBooked = await Appointment.findOne({
      userId: userId,
      date,
      status: "Confirmed",
    });
    
    if (hasUserBooked) {
      return res
        .status(400)
        .json({ message: "You have already booked a slot on this date !" });
    }
    const isBooked = await Appointment.findOne({
      date,
      timeSlot,
      status: "Confirmed",
    }); // consider appointment booked only if status is Confirmed

    if (isBooked) {
      return res
        .status(409)
        .json({ message: "This time slot is already booked !" });
    }

    // For Hair and Beard service, check if the next slot is available
    if (type === "Hair and Beard") {

      if (duration !== 40) {
        return res
          .status(400)
          .json({ message: "Hair and Beard service can only be booked in 40-minute slots!" });
      }
      // Calculate the next time slot (40 minutes later)
      const nextTimeSlot = calculateNextTimeSlot(timeSlot);
      
      // Check if the next slot is already booked
      const isNextSlotBooked = await Appointment.findOne({
        date,
        timeSlot: nextTimeSlot,
        status: "Confirmed",
      });
      
      if (isNextSlotBooked) {
        return res
          .status(409)
          .json({ message: "The next time slot is not available for Hair and Beard service!" });
      }
    }
    if (duration === 30 && type !== "Beard" && type !== 'Hair') {
      return res
        .status(400)
        .json({ message: "Only Beard or Hair service can be booked in 30-minute slots!" });
    }

    const confirmationToken = crypto.randomBytes(32).toString("hex");
    await Appointment.create({
      date,
      timeSlot,
      type,
      userId,
      confirmationHex: confirmationToken,
      duration: duration // Store the slot duration
    });

    const confirmationLink = `${process.env.FRONTEND_URL}/confirm-appointment/:${confirmationToken}`;
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Confirm Your Appointment",
      html: `
          <h2>Confirm Your Appointment</h2>
          <p>Dear ${firstname},</p>
          <p>Please click the link below to confirm your appointment:</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${timeSlot}</p>
          <p><strong>Service:</strong> ${type}</p>
          <p><a href="${confirmationLink}">Confirm Appointment</a></p>
          <p>If you did not request this, please ignore this email.</p>
          <p>Best Regards,</p>
          <p>Barber Booking Team</p>
        `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Confirmation link sent to email !" });
  } catch (error) {
    next(error);
  }
});

router.get("/confirmation/:confirmHex", async (req, res) => {
  try {
    let { confirmHex } = req.params;

    confirmHex = confirmHex.slice(1);

    const appointment = await Appointment.findOne({
      confirmationHex: confirmHex,
    });
    if (!appointment) {
      return res.status(410).json({ message: "Confirmation link expired !" });
    }

    const hasUserBooked = await Appointment.findOne({date: appointment.date, userId: appointment.userId, status: 'Confirmed'});
  
    if(hasUserBooked) {
     return res.status(400).json({message: 'You have already booked a slot for this date !'})
    }

    
    const isBooked = await Appointment.findOne({
      date: appointment.date,
      timeSlot: appointment.timeSlot,
      status: "Confirmed",
    });
    if (isBooked) {
      return res.status(400).json({ message: "Slot is already booked !" });
    }

    if (appointment.type === "Hair and Beard") {
      const nextTimeSlot = calculateNextTimeSlot(appointment.timeSlot);
      
      // Check if the next slot is already booked by someone
      const isNextSlotBooked = await Appointment.findOne({
        date: appointment.date,
        timeSlot: nextTimeSlot,
        status: "Confirmed"
      });
      
      if (isNextSlotBooked) {
        return res.status(400).json({ 
          message: "The next time slot is no longer available for Hair and Beard service!" 
        });
      }
    }

    appointment.status = "Confirmed";
    appointment.confirmationHex = null;
    appointment.bookedAt = new Date();
    const appointmentDate = new Date(appointment.date + "T00:00:00Z"); // Ensure UTC

    // Set expiresAt to **1 day after the appointment date**
    appointment.expiresAt = new Date(
      appointmentDate.setDate(appointmentDate.getDate() + 1)
    );

    await appointment.save();
    res.status(200).json({ message: "Appointment confirmed successfully !" });
  } catch (error) {
    console.error("Error confirming appointment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



router.delete("/cancel/:id", async (req, res) => {
  try {
    let { id } = req.params;
    id = id.slice(1);
    if (mongoose.Types.ObjectId.isValid(id)) {
      const appointmentToCancel = await Appointment.findById(id);

      if (!appointmentToCancel) {
        return res.status(404).json({ message: "Appointment not found!" });
      }

         // Special handling for Hair and Beard appointments
         if (appointmentToCancel.type === "Hair and Beard") {
          const date = appointmentToCancel.date;
          const originalSlot = appointmentToCancel.timeSlot;
          const nextSlot = calculateNextTimeSlot(originalSlot); // Get the next 40-min slot
          
          // Update the working hours with custom slot pattern information
          await WorkingHours.findOneAndUpdate(
            { date: date },
            { 
              $set: { hasCustomSlotPattern: true },
              $push: { 
                canceledHairAndBeardSlots: {
                  originalSlot: originalSlot,
                  nextSlot: nextSlot,
                  canceledAt: new Date()
                }
              }
            },
            { upsert: true }
          );
        }
        // Delete the appointment
      await Appointment.deleteOne({ _id: id });

      res.status(200).json({ message: "Appointment canceled successfully !" });
    } else {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error canceling appointment !" });
  }
});

module.exports = router;
