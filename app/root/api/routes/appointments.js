const express = require("express");
const router = express.Router();
const verifyCookie = require("../middleware/verifyCookie");
const crypto = require("crypto");
const Appointment = require("../models/Appointment");
const WorkingHours = require("../models/WorkingHours");
const nodemailer = require("nodemailer");
const { default: mongoose } = require("mongoose");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, // Your Gmail address
    pass: process.env.EMAIL_PASSWORD, // Your Gmail app password
  },
});

// Import helper functions for slot management
const {
  calculateTimeWithOffset,
  calculateNextTimeSlot,
  calculateIntermediateSlot,
  calculateShiftedSlot,
  isWithinWorkingHours,
  isRegularSlot
} = require('../helpers/slot-management-utilities');

router.get("/:date", async (req, res, next) => {
  let { date } = req.params;
  date = date.slice(1);
  try {
    const appointments = await Appointment.find({ date, status:'Confirmed' }).populate("userId");

    // Get working hours to include shifted slot information
    const workingHours = await WorkingHours.findOne({ date });
    
    // Include additional slot information if available
    const result = {
      appointments,
      shiftedSlots: workingHours?.shiftedSlots || [],
      intermediateSlots: workingHours?.intermediateSlots || []
    };

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: "Confirmed" });
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching appointments!" });
  }
});

router.post("/book", verifyCookie, async (req, res, next) => {
  try {
    const { date, timeSlot, type, duration = 40, isShiftedSlot = false, isIntermediateSlot = false } = req.body;
    const userId = req.user._id;
    const { email, firstname } = req.user;

    // Check if user already has a booking for this date
    const hasUserBooked = await Appointment.findOne({
      userId: userId,
      date,
      status: "Confirmed",
    });
    
    if (hasUserBooked) {
      return res
        .status(400)
        .json({ message: "You have already booked a slot on this date!" });
    }
    
    // Check if this slot is already booked
    const isBooked = await Appointment.findOne({
      date,
      timeSlot,
      status: "Confirmed",
    });

    if (isBooked) {
      return res
        .status(409)
        .json({ message: "This time slot is already booked!" });
    }

    // For Hair and Beard service, ALWAYS check if the next slot is available
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
    
    // Check if the slot duration is valid for the service type
    if (duration === 30 && type !== "Beard" && type !== 'Hair') {
      return res
        .status(400)
        .json({ message: "Only Beard or Hair service can be booked in 30-minute slots!" });
    }

    // Generate confirmation token
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    
    // Create the appointment
    const createdAppointment = await Appointment.create({
      date,
      timeSlot,
      type,
      userId,
      confirmationHex: confirmationToken,
      duration: duration,
      isShiftedSlot,
      isIntermediateSlot,
      originalSlotTime: isShiftedSlot ? req.body.originalSlotTime : null
    });

    // ONLY for Hair and Beard: Create shifted and intermediate slots
    if (type === "Hair and Beard") {
      const nextSlot = calculateNextTimeSlot(timeSlot);
      
      // Get working hours for the day
      let workingHours = await WorkingHours.findOne({ date });
      
      if (!workingHours) {
        // Create default working hours if not found
        workingHours = await WorkingHours.create({
          date,
          startTime: "09:00",
          endTime: "19:00",
          breakStart: "13:00",
          breakEnd: "14:00",
          hasCustomSlotPattern: true,
          expiresAt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
        });
      }
      
      // Mark this pattern as custom
      workingHours.hasCustomSlotPattern = true;
      
      // Important: The third slot is the one AFTER the next slot
      // If Hair and Beard is at 09:40, it blocks 09:40 and 10:20, so third slot is 11:00
      const thirdSlot = calculateNextTimeSlot(nextSlot);
      
      // Create a shifted slot (the third slot + 10 minutes)
      // If third slot is 11:00, shifted would be 11:10
      const shiftedSlot = calculateShiftedSlot(thirdSlot);
      
      // Create an intermediate slot between the end of first slot and start of third slot
      // If first slot ends at 10:20 and third is 11:00, intermediate is around 10:30
      const intermediateSlot = calculateTimeWithOffset(nextSlot, 10); // 10 minutes after the second slot starts
      
      // Check if these slots are within working hours
      if (isWithinWorkingHours(shiftedSlot, workingHours.startTime, workingHours.endTime, 
          workingHours.breakStart, workingHours.breakEnd)) {
        // Add shifted slot
        workingHours.shiftedSlots.push({
          originalTime: thirdSlot,
          shiftedTime: shiftedSlot,
          createdDueToAppointmentId: createdAppointment._id,
          isBooked: false
        });
      }
      
      if (isWithinWorkingHours(intermediateSlot, workingHours.startTime, workingHours.endTime, 
          workingHours.breakStart, workingHours.breakEnd)) {
        // Add intermediate slot
        workingHours.intermediateSlots.push({
          slotTime: intermediateSlot,
          createdDueToAppointmentId: createdAppointment._id,
          isBooked: false
        });
      }
      
      await workingHours.save();
    }

    // Send confirmation email
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

    res.status(200).json({ message: "Confirmation link sent to email!" });
  } catch (error) {
    next(error);
  }
});

router.get("/confirmation/:confirmHex", async (req, res) => {
  try {
    let { confirmHex } = req.params;
    confirmHex = confirmHex.slice(1);

    // Find the appointment with this confirmation token
    const appointment = await Appointment.findOne({
      confirmationHex: confirmHex,
    });
    
    if (!appointment) {
      return res.status(410).json({ message: "Confirmation link expired!" });
    }

    // Check if user already has a confirmed booking for this date
    const hasUserBooked = await Appointment.findOne({
      date: appointment.date, 
      userId: appointment.userId, 
      status: 'Confirmed'
    });
  
    if (hasUserBooked) {
      return res.status(400).json({message: 'You have already booked a slot for this date!'});
    }

    // Check if the slot is still available
    const isBooked = await Appointment.findOne({
      date: appointment.date,
      timeSlot: appointment.timeSlot,
      status: "Confirmed",
    });
    
    if (isBooked) {
      return res.status(400).json({ message: "Slot is already booked!" });
    }

    // For Hair and Beard service, check if the next slot is still available
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

    // If confirming a slot that was created due to another appointment,
    // mark it as booked in the working hours document
    if (appointment.isShiftedSlot || appointment.isIntermediateSlot) {
      const workingHours = await WorkingHours.findOne({ date: appointment.date });
      
      if (workingHours) {
        if (appointment.isShiftedSlot) {
          const slotIndex = workingHours.shiftedSlots.findIndex(
            slot => slot.shiftedTime === appointment.timeSlot
          );
          
          if (slotIndex >= 0) {
            workingHours.shiftedSlots[slotIndex].isBooked = true;
            workingHours.shiftedSlots[slotIndex].bookedAppointmentId = appointment._id;
          }
        }
        
        if (appointment.isIntermediateSlot) {
          const slotIndex = workingHours.intermediateSlots.findIndex(
            slot => slot.slotTime === appointment.timeSlot
          );
          
          if (slotIndex >= 0) {
            workingHours.intermediateSlots[slotIndex].isBooked = true;
            workingHours.intermediateSlots[slotIndex].bookedAppointmentId = appointment._id;
          }
        }
        
        await workingHours.save();
      }
    }

    // Confirm the appointment
    appointment.status = "Confirmed";
    appointment.confirmationHex = null;
    appointment.bookedAt = new Date();
    const appointmentDate = new Date(appointment.date + "T00:00:00Z"); // Ensure UTC

    // Set expiresAt to 1 day after the appointment date
    appointment.expiresAt = new Date(
      appointmentDate.setDate(appointmentDate.getDate() + 1)
    );

    await appointment.save();
    res.status(200).json({ message: "Appointment confirmed successfully!" });
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

      // Check if cancellation is within the allowed timeframe (10 minutes)
      const bookingTime = new Date(appointmentToCancel.bookedAt);
      const currentTime = new Date();
      const timeDiff = Math.floor((currentTime - bookingTime) / 1000); // difference in seconds
      
      if (timeDiff > 600) { // 10 minutes = 600 seconds
        return res.status(403).json({ message: "Cancellation period has expired!" });
      }

      // Handle Hair and Beard cancellation - complex case
      if (appointmentToCancel.type === "Hair and Beard") {
        const date = appointmentToCancel.date;
        const originalSlot = appointmentToCancel.timeSlot;
        const nextSlot = calculateNextTimeSlot(originalSlot);
        
        // Get the working hours document
        let workingHours = await WorkingHours.findOne({ date });
        
        if (workingHours) {
          // Check if any intermediate slots created by this appointment were booked
          const bookedIntermediateSlot = workingHours.intermediateSlots.find(
            slot => slot.createdDueToAppointmentId.equals(appointmentToCancel._id) && slot.isBooked
          );
          
          // Check if any shifted slots created by this appointment were booked
          const bookedShiftedSlot = workingHours.shiftedSlots.find(
            slot => slot.createdDueToAppointmentId.equals(appointmentToCancel._id) && slot.isBooked
          );
          
          if (bookedIntermediateSlot || bookedShiftedSlot) {
            // If slots created due to this appointment are booked, we can't fully restore
            // Add to canceled slots so we know there was a conflict
            workingHours.canceledHairAndBeardSlots.push({
              originalSlot,
              nextSlot,
              canceledAt: new Date()
            });
          } else {
            // If no conflicts, we can safely remove the shifted and intermediate slots
            workingHours.intermediateSlots = workingHours.intermediateSlots.filter(
              slot => !slot.createdDueToAppointmentId.equals(appointmentToCancel._id)
            );
            
            workingHours.shiftedSlots = workingHours.shiftedSlots.filter(
              slot => !slot.createdDueToAppointmentId.equals(appointmentToCancel._id)
            );
            
            // Record the cancellation
            workingHours.canceledHairAndBeardSlots.push({
              originalSlot,
              nextSlot,
              canceledAt: new Date()
            });
          }
          
          await workingHours.save();
        } else {
          // If no working hours document exists yet, create it
          await WorkingHours.create({
            date,
            startTime: "09:00",
            endTime: "19:00",
            breakStart: "13:00",
            breakEnd: "14:00", 
            hasCustomSlotPattern: true,
            canceledHairAndBeardSlots: [{
              originalSlot,
              nextSlot,
              canceledAt: new Date()
            }],
            expiresAt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
          });
        }
      }
      
      // If canceling a shifted or intermediate slot appointment
      if (appointmentToCancel.isShiftedSlot || appointmentToCancel.isIntermediateSlot) {
        const workingHours = await WorkingHours.findOne({ date: appointmentToCancel.date });
        
        if (workingHours) {
          if (appointmentToCancel.isShiftedSlot) {
            const slotIndex = workingHours.shiftedSlots.findIndex(
              slot => slot.bookedAppointmentId && slot.bookedAppointmentId.equals(appointmentToCancel._id)
            );
            
            if (slotIndex >= 0) {
              workingHours.shiftedSlots[slotIndex].isBooked = false;
              workingHours.shiftedSlots[slotIndex].bookedAppointmentId = null;
            }
          }
          
          if (appointmentToCancel.isIntermediateSlot) {
            const slotIndex = workingHours.intermediateSlots.findIndex(
              slot => slot.bookedAppointmentId && slot.bookedAppointmentId.equals(appointmentToCancel._id)
            );
            
            if (slotIndex >= 0) {
              workingHours.intermediateSlots[slotIndex].isBooked = false;
              workingHours.intermediateSlots[slotIndex].bookedAppointmentId = null;
            }
          }
          
          await workingHours.save();
        }
      }
      
      // Finally, delete the appointment
      await Appointment.deleteOne({ _id: id });

      res.status(200).json({ body: "Appointment canceled successfully!" });
    } else {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }
  } catch (error) {
    console.error("Error canceling appointment:", error);
    res.status(500).json({ message: "Error canceling appointment!" });
  }
});

module.exports = router;