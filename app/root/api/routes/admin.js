const express = require('express');
const router = express.Router();
const verifyCookie = require('../middleware/verifyCookie');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const WorkingHours = require('../models/WorkingHours');
const mongoose = require('mongoose');

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
};

// Get dashboard statistics
router.get('/stats', verifyCookie, verifyAdmin, async (req, res) => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Get start of current week (Sunday)
    const currentDate = new Date();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const weekStart = startOfWeek.toISOString().split('T')[0];
    
    // Get start of current month
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthStart = startOfMonth.toISOString().split('T')[0];
    
    // Get appointment counts
    const todayCount = await Appointment.countDocuments({
      date: today,
      status: 'Confirmed'
    });
    
    const weekCount = await Appointment.countDocuments({
      date: { $gte: weekStart },
      status: 'Confirmed'
    });
    
    const monthCount = await Appointment.countDocuments({
      date: { $gte: monthStart },
      status: 'Confirmed'
    });
    
    // Get service distribution
    const serviceDistribution = await Appointment.aggregate([
      { $match: { status: 'Confirmed' } },
      { $group: { _id: '$type', value: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', value: 1 } }
    ]);
    
    // Get recent appointments
    const recentAppointments = await Appointment.find({ status: 'Confirmed' })
      .sort({ date: -1, timeSlot: -1 })
      .limit(5)
      .populate('userId', 'firstname lastname email');
    
    res.status(200).json({
      todayCount,
      weekCount,
      monthCount,
      serviceDistribution,
      recentAppointments
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

// Get appointments for a specific date
router.get('/appointments/:date', verifyCookie, verifyAdmin, async (req, res) => {
  try {
    const { date } = req.params;
    
    const appointments = await Appointment.find({ date })
      .populate('userId', 'firstname lastname email')
      .sort({ timeSlot: 1 });
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// Get all appointments
router.get('/appointments', verifyCookie, verifyAdmin, async (req, res) => {
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
      .populate('userId', 'firstname lastname email')
      .sort({ date: 1, timeSlot: 1 });
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching all appointments:', error);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// Add a new appointment
router.post('/appointments', verifyCookie, verifyAdmin, async (req, res) => {
  try {
    const { date, timeSlot, type, userId, status = 'Confirmed' } = req.body;
    
    // Validate user ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      date,
      timeSlot,
      status: 'Confirmed'
    });
    
    if (existingAppointment) {
      return res.status(409).json({ message: 'This time slot is already booked' });
    }
    
    // For Hair and Beard service, check next slot availability
    if (type === 'Hair and Beard') {
      // Calculate next time slot (40 minutes later)
      const [hours, minutes] = timeSlot.split(':').map(Number);
      let newMinutes = minutes + 40;
      let newHours = hours;
      
      if (newMinutes >= 60) {
        newMinutes -= 60;
        newHours += 1;
      }
      
      const nextTimeSlot = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
      
      // Check if next slot is available
      const nextSlotBooked = await Appointment.findOne({
        date,
        timeSlot: nextTimeSlot,
        status: 'Confirmed'
      });
      
      if (nextSlotBooked) {
        return res.status(409).json({
          message: 'The next time slot is not available for Hair and Beard service'
        });
      }
    }
    
    // Create the appointment
    const appointment = new Appointment({
      date,
      timeSlot,
      type,
      userId,
      status,
      bookedAt: new Date()
    });
    
    await appointment.save();
    
    res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Error creating appointment' });
  }
});

// Get all appointmets for a specific user
router.get('/users/:userId/appointments', verifyCookie, verifyAdmin, async (req, res) => {
    try {
        const { userId } = req.params;

        const appointments = await Appointment.find({ userId })
            .populate('userId', 'firstname lastname email')
            .sort({ date: 1, timeSlot: 1 });
        
        res.status(200).json(appointments);
    } catch (error) {
        console.error('Error fetching user appointments:', error);
        res.status(500).json({ message: 'Error fetching user appointments' });
    }
});


// Cancel an appointment
router.delete('/appointments/:id', verifyCookie, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }
    
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Handle special cases for different appointment types
    // Similar to your existing cancelAppointment logic but without time restriction
    
    if (appointment.type === 'Hair and Beard') {
      // Handle special case for Hair and Beard appointments
      // Clear associated slots in WorkingHours
      const workingHours = await WorkingHours.findOne({ date: appointment.date });
      
      if (workingHours) {
        // Remove any blocked slots for this appointment
        workingHours.blockedSlots = workingHours.blockedSlots.filter(
          slot => !slot.blockedBy.equals(appointment._id)
        );
        
        // Remove any intermediate slots for this appointment
        workingHours.intermediateSlots = workingHours.intermediateSlots.filter(
          slot => !slot.createdDueToAppointmentId.equals(appointment._id)
        );
        
        // Remove any shifted slots for this appointment
        workingHours.shiftedSlots = workingHours.shiftedSlots.filter(
          slot => !slot.createdDueToAppointmentId.equals(appointment._id)
        );
        
        await workingHours.save();
      }
    }
    
    // Delete the appointment
    await Appointment.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Error cancelling appointment' });
  }
});

// Get all users
router.get('/users', verifyCookie, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'firstname lastname email role');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Update user role
router.patch('/users/:id/role', verifyCookie, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Validate role
    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent removing the last admin
    if (user.role === 'admin' && role === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      
      if (adminCount <= 1) {
        return res.status(403).json({ message: 'Cannot remove the last admin user' });
      }
    }
    
    user.role = role;
    await user.save();
    
    res.status(200).json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

module.exports = router;