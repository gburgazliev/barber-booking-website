const express = require("express");
const router = express.Router();
const verifyCookie = require("../middleware/verifyCookie");
const crypto = require("crypto");
const Appointment = require("../models/Appointment");
const WorkingHours = require("../models/WorkingHours");
const nodemailer = require("nodemailer");
const { default: mongoose } = require("mongoose");
const validator = require("validator");
const { appointmentValidationRules } = require("../middleware/validate");

// Import helper functions for slot management
const {
  calculateTimeWithOffset,
  calculateNextTimeSlot,
  calculateIntermediateSlot,
  calculateShiftedSlot,
  isWithinWorkingHours,
  isRegularSlot,
} = require("../helpers/slot-management-utilities");

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Sanitizes date parameter to prevent injection
 * @param {string} dateStr - Date string to sanitize
 * @returns {string} Sanitized date string
 */
const sanitizeDate = (dateStr) => {
  // Remove any characters that aren't digits or hyphens
  let sanitized = dateStr.replace(/[^0-9\-]/g, '');
  
  // Ensure it matches YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(sanitized)) {
    return sanitized;
  }
  
  // Return null if invalid format
  return null;
};

/**
 * Sanitizes time string to prevent injection
 * @param {string} timeStr - Time string to sanitize
 * @returns {string} Sanitized time string
 */
const sanitizeTime = (timeStr) => {
  // Remove any characters that aren't digits or colons
  let sanitized = timeStr.replace(/[^0-9:]/g, '');
  
  // Ensure it matches HH:MM format
  if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(sanitized)) {
    return sanitized;
  }
  
  // Return null if invalid format
  return null;
};

/**
 * Sanitizes service type 
 * @param {string} serviceType - Service type to sanitize
 * @returns {string} Sanitized service type
 */
const sanitizeServiceType = (serviceType) => {
  const validTypes = ['Hair', 'Beard', 'Hair and Beard'];
  
  // Trim and escape the service type
  const sanitized = validator.escape(serviceType.trim());
  
  // Ensure it's one of the valid types
  if (validTypes.includes(sanitized)) {
    return sanitized;
  }
  
  return null;
};

/**
 * Sanitizes MongoDB ID to prevent injection
 * @param {string} id - MongoDB ID to sanitize
 * @returns {string} Sanitized MongoDB ID
 */
const sanitizeMongoId = (id) => {
  // Check if it's a valid MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(id)) {
    return id;
  }
  
  return null;
};

// Get appointments for a specific date
router.get("/:date", async (req, res, next) => {
  try {
    let { date } = req.params;
    date = date.slice(1);
    
    // Sanitize date input
    const sanitizedDate = sanitizeDate(date);
    if (!sanitizedDate) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const appointments = await Appointment.find({
      date: sanitizedDate,
      status: "Confirmed",
    }).populate("userId");

    // Get working hours to include shifted slot information
    const workingHours = await WorkingHours.findOne({ date: sanitizedDate });

    // Include additional slot information if available
    const result = {
      appointments,
      shiftedSlots: workingHours?.shiftedSlots || [],
      intermediateSlots: workingHours?.intermediateSlots || [],
      blockedSlots: workingHours?.blockedSlots || [],
    };

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Get all appointments
router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: "Confirmed" });
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching appointments!" });
  }
});

// Book a new appointment
router.post("/book", verifyCookie, appointmentValidationRules, async (req, res, next) => {
  try {
    const {
      date,
      timeSlot,
      type,
      duration = 40,
      isShiftedSlot = false,
      isIntermediateSlot = false,
    } = req.body;
    
    // Sanitize inputs
    const sanitizedDate = sanitizeDate(date);
    const sanitizedTimeSlot = sanitizeTime(timeSlot);
    const sanitizedType = sanitizeServiceType(type);
    const sanitizedDuration = Number(duration);
    
    // Validate all inputs
    if (!sanitizedDate) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    
    if (!sanitizedTimeSlot) {
      return res.status(400).json({ message: "Invalid time slot format" });
    }
    
    if (!sanitizedType) {
      return res.status(400).json({ message: "Invalid service type" });
    }
    
    if (![30, 40].includes(sanitizedDuration)) {
      return res.status(400).json({ message: "Invalid duration" });
    }
    
    const userId = req.user._id;
    const { email, firstname } = req.user;

    // Check if user already has a booking for this date
    const hasUserBooked = await Appointment.findOne({
      userId: userId,
      date: sanitizedDate,
      status: "Confirmed",
    });

    // Check if this slot is already booked
    const isBooked = await Appointment.findOne({
      date: sanitizedDate,
      timeSlot: sanitizedTimeSlot,
      status: "Confirmed",
    });

    if (isBooked) {
      return res
        .status(409)
        .json({ message: "This time slot is already booked!" });
    }

    // For Hair and Beard service, ALWAYS check if the next slot is available
    if (sanitizedType === "Hair and Beard") {
      if (sanitizedDuration !== 40) {
        return res.status(400).json({
          message:
            "Hair and Beard service can only be booked in 40-minute slots!",
        });
      }

      // Calculate the next time slot (40 minutes later)
      const nextTimeSlot = calculateNextTimeSlot(sanitizedTimeSlot);
      const nextNextTimeSlot = calculateNextTimeSlot(nextTimeSlot);

      // Check if the next slot is already booked
      const isNextSlotBooked = await Appointment.findOne({
        date: sanitizedDate,
        timeSlot: nextTimeSlot,
        status: "Confirmed",
      });

      const isNextNextSlotBooked = await Appointment.findOne({
        date: sanitizedDate,
        timeSlot: nextNextTimeSlot,
        status: "Confirmed",
      });

      if (isNextNextSlotBooked) {
        return res.status(409).json({
          message:
            "The next time slot is not available for Hair and Beard service!",
        });
      }

      if (isNextSlotBooked) {
        return res.status(409).json({
          message:
            "The next time slot is not available for Hair and Beard service!",
        });
      }
      // check if next slot is blocked by timeslot and date
      const isBlocked = await WorkingHours.findOne({
        date: sanitizedDate,
        blockedSlots: { $elemMatch: { timeSlot: nextTimeSlot, date: sanitizedDate } },
      });
      if (isBlocked) {
        return res.status(409).json({
          message:
            "The next time slot is not available for Hair and Beard service!",
        });
      }
    }

    // Check if the slot duration is valid for the service type
    if (sanitizedDuration === 30 && sanitizedType !== "Beard" && sanitizedType !== "Hair") {
      return res.status(400).json({
        message: "Only Beard or Hair service can be booked in 30-minute slots!",
      });
    }

    let workingHours = await WorkingHours.findOne({ date: sanitizedDate });
    if (workingHours) {
      if (isShiftedSlot) {
        const isThereShiftedSlot = workingHours.shiftedSlots.find(
          (slot) => slot.shiftedTime === sanitizedTimeSlot && sanitizedDate === slot.date
        );
        if (!isThereShiftedSlot) {
          return res.status(400).json({
            message: "This shifted slot is no longer available!",
          });
        }
      } else if (isIntermediateSlot) {
        const isThereIntermediateSlot = workingHours.intermediateSlots.find(
          (slot) => slot.slotTime === sanitizedTimeSlot && sanitizedDate === slot.date
        );
        if (!isThereIntermediateSlot) {
          return res.status(400).json({
            message: "This intermediate slot is no longer available!",
          });
        }
      } else {
        const isThereBlockedSlot = workingHours.blockedSlots.find(
          (slot) => slot.timeSlot === sanitizedTimeSlot && sanitizedDate === slot.date
        );
        if (isThereBlockedSlot) {
          return res.status(400).json({
            message: "This time slot is blocked!",
          });
        }
      }
    }
    // Generate confirmation token
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    // Create the appointment
    const createdAppointment = await Appointment.create({
      date: sanitizedDate,
      timeSlot: sanitizedTimeSlot,
      type: sanitizedType,
      userId,
      confirmationHex: confirmationToken,
      duration: sanitizedDuration,
      isShiftedSlot,
      isIntermediateSlot,
      originalSlotTime: isShiftedSlot ? sanitizeTime(req.body.originalSlotTime) : null,
    });

    // Send confirmation email
    const confirmationLink = `${process.env.FRONTEND_URL}/confirm-appointment/:${confirmationToken}`;
    
    // Sanitize email content
    const safeFirstName = validator.escape(firstname);
    const safeDate = validator.escape(sanitizedDate);
    const safeTimeSlot = validator.escape(sanitizedTimeSlot);
    const safeType = validator.escape(sanitizedType);
    
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Confirm Your Appointment",
      html: `
          <h2>Confirm Your Appointment</h2>
          <p>Dear ${safeFirstName},</p>
          <p>Please click the link below to confirm your appointment:</p>
          <p><strong>Date:</strong> ${safeDate}</p>
          <p><strong>Time:</strong> ${safeTimeSlot}</p>
          <p><strong>Service:</strong> ${safeType}</p>
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

// Confirm appointment
router.get("/confirmation/:confirmHex", async (req, res) => {
  try {
    let { confirmHex } = req.params;
    confirmHex = confirmHex.slice(1);
    
    // Validate the confirmation token
    if (!confirmHex || confirmHex.length !== 64 || !/^[a-f0-9]+$/i.test(confirmHex)) {
      return res.status(400).json({ message: "Invalid confirmation token" });
    }

    // Find the appointment with this confirmation token
    const appointment = await Appointment.findOne({
      confirmationHex: confirmHex,
    });

    if (!appointment) {
      return res.status(410).json({ message: "Confirmation link expired!" });
    }
    
    const sanitizedDate = sanitizeDate(appointment.date);
    if (!sanitizedDate) {
      return res.status(400).json({ message: "Invalid date in appointment" });
    }
    
    let workingHours = await WorkingHours.findOne({ date: sanitizedDate });

    await appointment?.populate("userId");
    const isAdmin = appointment.userId.role === "admin";
    // Check if user already has a confirmed booking for this date
    const hasUserBooked = await Appointment.findOne({
      date: appointment.date,
      userId: appointment.userId,
      status: "Confirmed",
    });

    if (hasUserBooked && !isAdmin) {
      return res
        .status(400)
        .json({ message: "You have already booked a slot for this date!" });
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

    const isBlocked = workingHours?.blockedSlots.find(
      (slot) => slot.timeSlot === appointment.timeSlot && sanitizedDate === slot.date
    );
    if (isBlocked) {
      return res.status(400).json({
        message: "Invalid slot!",
      });
    }

    // For Hair and Beard service, check if the next slot is still available
    if (appointment.type === "Hair and Beard") {
      const nextTimeSlot = calculateNextTimeSlot(appointment.timeSlot);

      // Check if the next slot is already booked by someone
      const isNextSlotBooked = await Appointment.findOne({
        date: appointment.date,
        timeSlot: nextTimeSlot,
        status: "Confirmed",
      });

      const isNextNextSlotBooked = await Appointment.findOne({
        date: appointment.date,
        timeSlot: calculateNextTimeSlot(nextTimeSlot),
        status: "Confirmed",
      });
      if (isNextNextSlotBooked) {
        return res.status(400).json({
          message:
            "The next time slot is no longer available for Hair and Beard service!",
        });
      }

      if (isNextSlotBooked) {
        return res.status(400).json({
          message:
            "The next time slot is no longer available for Hair and Beard service!",
        });
      }

      // Get working hours for the day
      if (!workingHours) {
        // Create default working hours if not found
        workingHours = await WorkingHours.create({
          date: sanitizedDate,
          startTime: "09:00",
          endTime: "18:20",
          breakStart: "",
          breakEnd: "",
          hasCustomSlotPattern: true,
          expiresAt: new Date(
            new Date(sanitizedDate).setDate(new Date(sanitizedDate).getDate() + 1)
          ),
        });
      }

      // Mark this pattern as custom
      workingHours.hasCustomSlotPattern = true;

      // Important: The third slot is the one AFTER the next slot
      // If Hair and Beard is at 09:40, it blocks 09:40 and 10:20, so third slot is 11:00
      const thirdSlot = calculateNextTimeSlot(nextTimeSlot);

      // Create a shifted slot (the third slot + 10 minutes)
      // If third slot is 11:00, shifted would be 11:10
      const shiftedSlot = calculateShiftedSlot(thirdSlot);

      // Create an intermediate slot between the end of first slot and start of third slot
      // If first slot ends at 10:20 and third is 11:00, intermediate is around 10:40
      const intermediateSlot = calculateTimeWithOffset(nextTimeSlot, 20); // 20 minutes after the second slot starts

      workingHours.blockedSlots.push(
        { timeSlot: nextTimeSlot, blockedBy: appointment._id, date: sanitizedDate },
        { timeSlot: thirdSlot, blockedBy: appointment._id, date: sanitizedDate }
      );
      // Check if these slots are within working hours
      if (
        isWithinWorkingHours(
          shiftedSlot,
          workingHours.startTime,
          workingHours.endTime,
          workingHours.breakStart,
          workingHours.breakEnd
        )
      ) {
        // Add shifted slot
        workingHours.shiftedSlots.push({
          originalTime: thirdSlot,
          shiftedTime: shiftedSlot,
          createdDueToAppointmentId: appointment._id,
          isBooked: false,
          date: sanitizedDate,
        });
      }

      if (
        isWithinWorkingHours(
          intermediateSlot,
          workingHours.startTime,
          workingHours.endTime,
          workingHours.breakStart,
          workingHours.breakEnd
        )
      ) {
        // Add intermediate slot
        workingHours.intermediateSlots.push({
          slotTime: intermediateSlot,
          createdDueToAppointmentId: appointment._id,
          date: sanitizedDate,
          isBooked: false,
        });
      }

      await workingHours.save();
    }

    // If confirming a slot that was created due to another appointment,
    // mark it as booked in the working hours document
    if (appointment.isShiftedSlot || appointment.isIntermediateSlot) {
      if (workingHours) {
        if (appointment.isShiftedSlot) {
          const isThereShiftedSlot = workingHours.shiftedSlots.find(
            (slot) =>
              slot.shiftedTime === appointment.timeSlot && sanitizedDate === slot.date
          );
          if (!isThereShiftedSlot) {
            res.status(400).json({
              message: "This shifted slot is no longer available!",
            });
            return;
          }

          const slotIndex = workingHours.shiftedSlots.findIndex(
            (slot) => slot.shiftedTime === appointment.timeSlot
          );

          if (slotIndex >= 0) {
            workingHours.shiftedSlots[slotIndex].isBooked = true;
            workingHours.shiftedSlots[slotIndex].bookedAppointmentId =
              appointment._id;
          }
        }

        if (appointment.isIntermediateSlot) {
          const isThereIntermediateSlot = workingHours.intermediateSlots.find(
            (slot) =>
              slot.slotTime === appointment.timeSlot && sanitizedDate === slot.date
          );
          if (!isThereIntermediateSlot) {
            res.status(400).json({
              message: "This intermediate slot is no longer available!",
            });
            return;
          }

          const slotIndex = workingHours.intermediateSlots.findIndex(
            (slot) => slot.slotTime === appointment.timeSlot
          );

          if (slotIndex >= 0) {
            workingHours.intermediateSlots[slotIndex].isBooked = true;
            workingHours.intermediateSlots[slotIndex].bookedAppointmentId =
              appointment._id;
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

// Cancel appointment
router.delete("/cancel/:id", verifyCookie, async (req, res) => {
  try {
    let { id } = req.params;
    id = id.slice(1);
    
    // Sanitize MongoDB ID
    const sanitizedId = sanitizeMongoId(id);
    if (!sanitizedId) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointmentToCancel = await Appointment.findById(sanitizedId);

    if (!appointmentToCancel) {
      return res.status(404).json({ message: "Appointment not found!" });
    }

    // Check if cancellation is within the allowed timeframe (10 minutes)
    const bookingTime = new Date(appointmentToCancel.bookedAt);
    const currentTime = new Date();
    const timeDiff = Math.floor((currentTime - bookingTime) / 1000); // difference in seconds
    const isAdmin = req.user.role === "admin";
    if (!isAdmin && timeDiff > 600) {
      // 10 minutes = 600 seconds
      return res
        .status(403)
        .json({ message: "Cancellation period has expired!" });
    }

    // Sanitize date from appointment
    const sanitizedDate = sanitizeDate(appointmentToCancel.date);
    if (!sanitizedDate) {
      return res.status(400).json({ message: "Invalid date in appointment" });
    }

    // Handle Hair and Beard cancellation - complex case
    if (appointmentToCancel.type === "Hair and Beard") {
      const originalSlot = appointmentToCancel.timeSlot;

      // Get the working hours document
      let workingHours = await WorkingHours.findOne({ date: sanitizedDate });

      if (workingHours) {
        // Check if any intermediate slots created by this appointment were booked
        const bookedIntermediateSlot = workingHours.intermediateSlots.find(
          (slot) =>
            slot.createdDueToAppointmentId?.equals(appointmentToCancel._id) &&
            slot.isBooked
        );

        // Check if any shifted slots created by this appointment were booked
        const bookedShiftedSlot = workingHours.shiftedSlots.find(
          (slot) =>
            slot.createdDueToAppointmentId?.equals(appointmentToCancel._id) &&
            slot.isBooked
        );

        if (bookedIntermediateSlot || bookedShiftedSlot) {
          // Create a new slot 30 minutes before the intermediate slot
          let newSlotTime = originalSlot; // Default to original slot time
          if (bookedIntermediateSlot) {
            newSlotTime = calculateTimeWithOffset(
              bookedIntermediateSlot.slotTime,
              -30 // 30 minutes before the intermediate or shifted slot
            );
          }

          if (bookedShiftedSlot) {
            newSlotTime = calculateTimeWithOffset(
              bookedShiftedSlot.shiftedTime,
              -60 // 10 minutes before the shifted slot
            );
          }

          // Check if the new slot is within working hours
          if (
            isWithinWorkingHours(
              newSlotTime,
              workingHours.startTime,
              workingHours.endTime,
              workingHours.breakStart,
              workingHours.breakEnd
            )
          ) {
            if (bookedIntermediateSlot) {
              workingHours.intermediateSlots.push({
                slotTime: newSlotTime,
                createdDueToAppointmentId: appointmentToCancel._id,
                isBooked: false,
                date: sanitizedDate,
              });
            }
            if (bookedShiftedSlot) {
              workingHours.shiftedSlots.push({
                originalTime: bookedShiftedSlot.originalTime,
                shiftedTime: newSlotTime,
                createdDueToAppointmentId: appointmentToCancel._id,
                isBooked: false,
                date: sanitizedDate,
              });
            }
          }
        } else {
          // If no conflicts, remove the shifted and intermediate slots
          workingHours.intermediateSlots =
            workingHours.intermediateSlots.filter(
              (slot) =>
                !slot.createdDueToAppointmentId?.equals(
                  appointmentToCancel._id
                )
            );

          workingHours.shiftedSlots = workingHours.shiftedSlots.filter(
            (slot) =>
              !slot.createdDueToAppointmentId?.equals(appointmentToCancel._id)
          );

          // Remove blocked slots
          workingHours.blockedSlots = workingHours.blockedSlots.filter(
            (slot) => !slot.blockedBy?.equals(appointmentToCancel._id)
          );
        }

        await workingHours.save();
      }
    }

    // If canceling an intermediate slot appointment
    if (appointmentToCancel.isIntermediateSlot) {
      const workingHours = await WorkingHours.findOne({
        date: sanitizedDate,
      });

      if (workingHours) {
        // Update the slot's booked status to false
        const slotIndex = workingHours.intermediateSlots.findIndex(
          (slot) =>
            slot.slotTime === appointmentToCancel.timeSlot &&
            sanitizedDate === slot.date
        );

        if (slotIndex >= 0) {
          workingHours.intermediateSlots[slotIndex].isBooked = false;
          workingHours.intermediateSlots[slotIndex].bookedAppointmentId =
            null;
        }

        await workingHours.save();
      }
    }

    // If canceling a shifted slot appointment
    if (appointmentToCancel.isShiftedSlot) {
      const workingHours = await WorkingHours.findOne({
        date: sanitizedDate,
      });

      if (workingHours) {
        const slotIndex = workingHours.shiftedSlots.findIndex(
          (slot) =>
            slot.shiftedTime === appointmentToCancel.timeSlot &&
            sanitizedDate === slot.date
        );

        if (slotIndex >= 0) {
          workingHours.shiftedSlots[slotIndex].isBooked = false;
          workingHours.shiftedSlots[slotIndex].bookedAppointmentId = null;
        }

        await workingHours.save();
      }
    }

    // Only clean up slots if they're created by this specific appointment
    // and it's a derived slot that's being canceled
    if (
      appointmentToCancel.isShiftedSlot ||
      appointmentToCancel.isIntermediateSlot
    ) {
      const workingHours = await WorkingHours.findOne({
        date: sanitizedDate,
      });

      if (workingHours) {
        // Get the slot object that's being canceled
        let slotObj;
        if (appointmentToCancel.isShiftedSlot) {
          slotObj = workingHours.shiftedSlots.find(
            (slot) =>
              slot.shiftedTime === appointmentToCancel.timeSlot &&
              sanitizedDate === slot.date
          );
        } else if (appointmentToCancel.isIntermediateSlot) {
          slotObj = workingHours.intermediateSlots.find(
            (slot) =>
              slot.slotTime === appointmentToCancel.timeSlot &&
              sanitizedDate === slot.date
          );
        }

        // Only if we found the actual slot object
        if (slotObj && slotObj.createdDueToAppointmentId) {
          // Find the original appointment
          const originalAppointmentId = slotObj.createdDueToAppointmentId;
          const originalAppointment = await Appointment.findOne({
            _id: originalAppointmentId,
          });

          // Find all slots related to the original appointment
          const relatedShiftedSlots = workingHours.shiftedSlots.filter(
            (slot) =>
              slot.createdDueToAppointmentId &&
              slot.createdDueToAppointmentId.equals(originalAppointmentId)
          );

          const relatedIntermediateSlots =
            workingHours.intermediateSlots.filter(
              (slot) =>
                slot.createdDueToAppointmentId &&
                slot.createdDueToAppointmentId.equals(originalAppointmentId)
            );

          // Check if ANY of the related slots are still booked (except this one being canceled)
          const isAnySlotStillBooked = [
            ...relatedShiftedSlots,
            ...relatedIntermediateSlots,
          ].some(
            (slot) =>
              slot.isBooked &&
              (!slot.bookedAppointmentId ||
                !slot.bookedAppointmentId.equals(appointmentToCancel._id))
          );

          // ONLY clean up ALL slots if:
          // 1. The original appointment doesn't exist anymore AND
          // 2. No other slots related to this original appointment are booked
          if (!originalAppointment && !isAnySlotStillBooked) {
            // Remove all slots related to the original appointment
            workingHours.shiftedSlots = workingHours.shiftedSlots.filter(
              (slot) =>
                !slot.createdDueToAppointmentId ||
                !slot.createdDueToAppointmentId.equals(originalAppointmentId)
            );

            workingHours.intermediateSlots =
              workingHours.intermediateSlots.filter(
                (slot) =>
                  !slot.createdDueToAppointmentId ||
                  !slot.createdDueToAppointmentId.equals(
                    originalAppointmentId
                  )
              );

            // Also clean up related blocked slots
            workingHours.blockedSlots = workingHours.blockedSlots.filter(
              (slot) => !slot.blockedBy.equals(originalAppointmentId)
            );
          }

          await workingHours.save();
        }
      }
    }

    // Finally, delete the appointment
    await Appointment.deleteOne({ _id: sanitizedId });

    res.status(200).json({ body: "Appointment canceled successfully!" });
  } catch (error) {
    console.error("Error canceling appointment:", error);
    res.status(500).json({ message: "Error canceling appointment!" });
  }
});

module.exports = router;