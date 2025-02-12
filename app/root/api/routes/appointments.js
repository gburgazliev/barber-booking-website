const express = require("express");
const router = express.Router();
const verifyCookie = require("../middleware/verifyCookie");
const crypto = require("crypto");
const Appointment = require("../models/Appointment");
const nodemailer = require("nodemailer");
const { default: mongoose } = require("mongoose");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, // Your Gmail address  add to env
    pass: process.env.EMAIL_PASSWORD, // Your Gmail app password
  },
});

router.post("/book", verifyCookie, async (req, res, next) => {
  try {
    const { date, timeSlot, type } = req.body;
    const userId = req.user._id;
    const { email, firstname } = req.user;
    const isBooked = await Appointment.findOne({
      date,
      timeSlot,
      status: "Confirmed",
    });

    if (isBooked) {
      return res
        .status(409)
        .json({ message: "This time slot is already booked !" });
    }

    const confirmationToken = crypto.randomBytes(32).toString("hex");
    await Appointment.create({
      date,
      timeSlot,
      type,
      userId,
      confirmationHex: confirmationToken,
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
    console.log(confirmHex);
    const appointment = await Appointment.findOne({
      confirmationHex: confirmHex,
    });
    if (!appointment) {
      return res.status(410).json({ message: "Confirmation time expired !" });
    }
    appointment.status = "Confirmed";
    const appointmentDate = new Date(appointment.date + "T00:00:00Z"); // Ensure UTC

    // Set expiresAt to **1 day after the appointment date**
    appointment.expiresAt = new Date(
      appointmentDate.setDate(appointmentDate.getDate() + 1)
    );

    await appointment.save();
    res.status(200).json({ message: "Appointment confirmed successfully !" });
  } catch (error) {}
});

router.delete("/cancel/:id", async (req, res) => {
  try {
    let { id } = req.params;
    id = id.slice(1);
    if (mongoose.Types.ObjectId.isValid(id)) {
      await Appointment.deleteOne({ _id: id });
      res.status(200).json({ message: "Appointment canceled successfully !" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error canceling appointment !" });
  }
});

module.exports = router;
