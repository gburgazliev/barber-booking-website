const express = require("express");
const router = express.Router();
const verifyCookie = require("../middleware/verifyCookie");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const WorkingHours = require("../models/WorkingHours");
const mongoose = require("mongoose");
const {
  calculateTimeWithOffset,
  calculateNextTimeSlot,
  calculateIntermediateSlot,
  calculateShiftedSlot,
  isWithinWorkingHours,
  isRegularSlot,
} = require("../helpers/slot-management-utilities");

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Access denied: Admin privileges required" });
  }
};

// Get dashboard statistics
router.get("/stats", verifyCookie, verifyAdmin, async (req, res) => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Get start of current week (Sunday)
    const currentDate = new Date();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const weekStart = startOfWeek.toISOString().split("T")[0];

    // Get start of current month
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const monthStart = startOfMonth.toISOString().split("T")[0];

    // Get appointment counts
    const todayCount = await Appointment.countDocuments({
      date: today,
      status: "Confirmed",
    });

    const weekCount = await Appointment.countDocuments({
      date: { $gte: weekStart },
      status: "Confirmed",
    });

    const monthCount = await Appointment.countDocuments({
      date: { $gte: monthStart },
      status: "Confirmed",
    });

    // Get service distribution
    const serviceDistribution = await Appointment.aggregate([
      { $match: { status: "Confirmed" } },
      { $group: { _id: "$type", value: { $sum: 1 } } },
      { $project: { _id: 0, name: "$_id", value: 1 } },
    ]);

    // Get recent appointments
    const recentAppointments = await Appointment.find({ status: "Confirmed" })
      .sort({ date: -1, timeSlot: -1 })
      .limit(5)
      .populate("userId", "firstname lastname email");

    res.status(200).json({
      todayCount,
      weekCount,
      monthCount,
      serviceDistribution,
      recentAppointments,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard statistics" });
  }
});

// Get appointments for a specific date
router.get(
  "/appointments/:date",
  verifyCookie,
  verifyAdmin,
  async (req, res) => {
    try {
      const { date } = req.params;

      const appointments = await Appointment.find({ date })
        .populate("userId", "firstname lastname email")
        .sort({ timeSlot: 1 });

      res.status(200).json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Error fetching appointments" });
    }
  }
);

// Get all appointments
router.get("/appointments", verifyCookie, verifyAdmin, async (req, res) => {
  try {
    // Optional query parameters for filtering
    const { status, startDate, endDate } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.date = { $gte: startDate };
    } else if (endDate) {
      filter.date = { $lte: endDate };
    }

    const appointments = await Appointment.find(filter)
      .populate("userId", "firstname lastname email")
      .sort({ date: 1, timeSlot: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching all appointments:", error);
    res.status(500).json({ message: "Error fetching appointments" });
  }
});

// Add a new appointment
router.post("/appointments", verifyCookie, verifyAdmin, async (req, res) => {
  try {
    const { date, timeSlot, type, userEmail, status = "Confirmed" } = req.body;
    let workingHours = await WorkingHours.findOne({ date });
    // Validate user email

    const user = await User.findOne({ email:userEmail });
     console.log(user)
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      date,
      timeSlot,
      status: "Confirmed",
    });

    if (existingAppointment) {
      return res
        .status(409)
        .json({ message: "This time slot is already booked" });
    }
const appointment = new Appointment({
      date,
      timeSlot,
      type,
      userId: user._id,
      status,
      bookedAt: new Date(),
    });
    // For Hair and Beard service, check next slot availability
    if (type === "Hair and Beard") {
      const nextTimeSlot = calculateNextTimeSlot(timeSlot);

      // Check if the next slot is already booked by someone
      const isNextSlotBooked = await Appointment.findOne({
        date: date,
        timeSlot: nextTimeSlot,
        status: "Confirmed",
      });

      const isNextNextSlotBooked = await Appointment.findOne({
        date: date,
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
          date,
          startTime: "09:00",
          endTime: "18:20",
          breakStart: "",
          breakEnd: "",
          hasCustomSlotPattern: true,
          expiresAt: new Date(
            new Date(date).setDate(new Date(date).getDate() + 1)
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
        { timeSlot: nextTimeSlot, blockedBy: appointment._id, date: date },
        { timeSlot: thirdSlot, blockedBy: appointment._id, date: date }
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
          date: date,
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
          date: date,
          isBooked: false,
        });
      }

      
    }
    // Check if appointment slot is matching a intermediate or shifted slot and mark it as booked
    const isIntermediateSlot = workingHours.intermediateSlots.find(
      (slot) =>
        slot.slotTime === timeSlot &&
        slot.date === date
    );
    
    const isShiftedSlot = workingHours.shiftedSlots.find(
      (slot) =>
        slot.shiftedTime === timeSlot &&
        slot.date === date
    );
    if (isIntermediateSlot) {

      const slotIndex = workingHours.intermediateSlots.findIndex(
        (slot) =>
          slot.slotTime === timeSlot && slot.date === date
      );
      if (slotIndex !== -1) {
        workingHours.intermediateSlots[slotIndex].isBooked = true;
        workingHours.intermediateSlots[slotIndex].bookedAppointmentId =
          appointment._id;
      } 
      // isIntermediateSlot.isBooked = true;
      // isIntermediateSlot.bookedAppointmentId = appointment._id;
    } else if (isShiftedSlot) {




      const slotIndex = workingHours.shiftedSlots.findIndex(
        (slot) =>
          slot.shiftedTime === timeSlot && slot.date === date
      );
      if (slotIndex !== -1) {
        workingHours.shiftedSlots[slotIndex].isBooked = true;
        workingHours.shiftedSlots[slotIndex].bookedAppointmentId =
          appointment._id;

   
    } 
  }
      // If it's not an intermediate or shifted slot, just block i
   console.log(isIntermediateSlot)
    await workingHours.save();
    appointment.bookedAt = new Date();
    const appointmentDate = new Date(appointment.date + "T00:00:00Z"); // Ensure UTC

    // Set expiresAt to 1 day after the appointment date
    appointment.expiresAt = new Date(
      appointmentDate.setDate(appointmentDate.getDate() + 1)
    );

    if (isIntermediateSlot) {
      appointment.isIntermediateSlot = true;
    } else if (isShiftedSlot) {
      appointment.isShiftedSlot = true;
    } 
    
    await appointment.save();

    res.status(201).json({
      message: "Appointment created successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({ message: "Error creating appointment" });
  }
});

// Get all appointmets for a specific user
router.get(
  "/users/:userId/appointments",
  verifyCookie,
  verifyAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const appointments = await Appointment.find({ userId })
        .populate("userId", "firstname lastname email")
        .sort({ date: 1, timeSlot: 1 });

      res.status(200).json(appointments);
    } catch (error) {
      console.error("Error fetching user appointments:", error);
      res.status(500).json({ message: "Error fetching user appointments" });
    }
  }
);

// Cancel an appointment
// router.delete(
//   "/appointments/:id",
//   verifyCookie,
//   verifyAdmin,
//   async (req, res) => {
//     try {
//       const { id } = req.params;

//       if (!mongoose.Types.ObjectId.isValid(id)) {
//         return res.status(400).json({ message: "Invalid appointment ID" });
//       }

//       const appointment = await Appointment.findById(id);

//       if (!appointment) {
//         return res.status(404).json({ message: "Appointment not found" });
//       }

//       // Handle special cases for different appointment types
//       // Similar to your existing cancelAppointment logic but without time restriction

//       if (appointment.type === "Hair and Beard") {
//         // Handle special case for Hair and Beard appointments
//         // Clear associated slots in WorkingHours
//         const workingHours = await WorkingHours.findOne({
//           date: appointment.date,
//         });

//         if (workingHours) {
//           // Remove any blocked slots for this appointment
//           workingHours.blockedSlots = workingHours.blockedSlots.filter(
//             (slot) => !slot.blockedBy.equals(appointment._id)
//           );

//           // Remove any intermediate slots for this appointment
//           workingHours.intermediateSlots =
//             workingHours.intermediateSlots.filter(
//               (slot) => !slot.createdDueToAppointmentId.equals(appointment._id)
//             );

//           // Remove any shifted slots for this appointment
//           workingHours.shiftedSlots = workingHours.shiftedSlots.filter(
//             (slot) => !slot.createdDueToAppointmentId.equals(appointment._id)
//           );

//           await workingHours.save();
//         }
//       }

//       // Delete the appointment
//       await Appointment.findByIdAndDelete(id);

//       res.status(200).json({ message: "Appointment cancelled successfully" });
//     } catch (error) {
//       console.error("Error cancelling appointment:", error);
//       res.status(500).json({ message: "Error cancelling appointment" });
//     }
//   }
// );

// Get all users
router.get("/users", verifyCookie, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({}, "firstname lastname email role");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});
//
router.delete("/appointments/:id", verifyCookie, verifyAdmin, async (req, res) => {
  try {
    let { id } = req.params;
     // Remove any colons from the ID
     id = id.replace(/:/g, "");
    console.log(id)
    console.log("Deleting appointment with ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
     
    // Handle special cases for different appointment types
    // Similar to your existing cancelAppointment logic but without time restriction
       const workingHours = await WorkingHours.findOne({
        date: appointment.date,
      });
    if (appointment.type === "Hair and Beard") {
      // Handle special case for Hair and Beard appointments
      // Clear associated slots in WorkingHours
    
       
      if (workingHours) {
        // Check if any intermediate slots created by this appointment were booked
        const bookedIntermediateSlot = workingHours.intermediateSlots.find(
          (slot) =>
            slot.createdDueToAppointmentId.equals(appointment._id) &&
            slot.isBooked
        );

        // Check if any shifted slots created by this appointment were booked
        const bookedShiftedSlot = workingHours.shiftedSlots.find(
          (slot) =>
            slot.createdDueToAppointmentId.equals(appointment._id) &&
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
                createdDueToAppointmentId: appointment._id,
                isBooked: false,
              });
            }
            if (bookedShiftedSlot) {
              workingHours.shiftedSlots.push({
                originalTime: bookedShiftedSlot.originalTime,
                shiftedTime: newSlotTime,
                createdDueToAppointmentId: appointment._id,
                isBooked: false,
              });
            }
          }
        } else {
          // If no conflicts, remove the shifted and intermediate slots
          workingHours.intermediateSlots =
            workingHours.intermediateSlots.filter(
              (slot) =>
                !slot.createdDueToAppointmentId.equals(
                  appointment._id
                )
            );

          workingHours.shiftedSlots = workingHours.shiftedSlots.filter(
            (slot) =>
              !slot.createdDueToAppointmentId.equals(appointment._id)
          );

          // Remove blocked slots
          workingHours.blockedSlots = workingHours.blockedSlots.filter(
            (slot) => !slot.blockedBy.equals(appointment._id)
          );
        }

        await workingHours.save();
      }
    } else {
      const isIntermediateSlot = workingHours.intermediateSlots.find(
        (slot) =>
          slot.bookedAppointmentId &&
          slot.bookedAppointmentId.equals(appointment._id) &&
          slot.date === appointment.date
      );
      const isShiftedSlot = workingHours.shiftedSlots.find(
        (slot) =>
          slot.bookedAppointmentId &&
          slot.bookedAppointmentId.equals(appointment._id) &&
          slot.date === appointment.date
      );
      if (isIntermediateSlot) {
        isIntermediateSlot.isBooked = false;
        isIntermediateSlot.bookedAppointmentId = null;
      } else if (isShiftedSlot) {
        isShiftedSlot.isBooked = false;
        isShiftedSlot.bookedAppointmentId = null;
      }
      // Remove blocked slots
     
    }

    // Delete the appointment
    await Appointment.findByIdAndDelete(id);
    res.status(200).json({ message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ message: "Error cancelling appointment" });
  }
});


    

    
// Update user role
router.patch("/users/:id/role", verifyCookie, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Validate role
    if (role !== "user" && role !== "admin") {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent removing the last admin
    if (user.role === "admin" && role === "user") {
      const adminCount = await User.countDocuments({ role: "admin" });

      if (adminCount <= 1) {
        return res
          .status(403)
          .json({ message: "Cannot remove the last admin user" });
      }
    }

    user.role = role;
    await user.save();

    res.status(200).json({ message: "User role updated successfully" });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Error updating user role" });
  }
});

module.exports = router;
