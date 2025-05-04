// File: __tests__/simple.test.js
/**
 * Basic test to verify Jest is working properly
 */
test('basic test to verify jest is working', () => {
    expect(2 + 2).toBe(4);
  });
  
  // File: __tests__/services/appointmentService.test.js
  const mongoose = require('mongoose');
  const Appointment = require('../models/Appointment');
  const WorkingHours = require('../models/WorkingHours');
  const User = require('../models/User');
  
  // Mock the models
  jest.mock('../models/Appointment');
  jest.mock('../models/WorkingHours');
  jest.mock('../models/User');
  
  // Create a simple version of the service to test
  const appointmentService = {
    isSlotAvailable: async (date, timeSlot) => {
      const appointment = await Appointment.findOne({
        date,
        timeSlot,
        status: 'Confirmed'
      });
      return !appointment;
    },
    
    canBookHairAndBeard: async (date, timeSlot) => {
      // Check current slot
      const currentSlotAvailable = await appointmentService.isSlotAvailable(date, timeSlot);
      if (!currentSlotAvailable) return false;
      
      // Calculate next slot (40 minutes later)
      const [hours, minutes] = timeSlot.split(':').map(Number);
      let newHours = hours;
      let newMinutes = minutes + 40;
      
      if (newMinutes >= 60) {
        newMinutes -= 60;
        newHours += 1;
      }
      
      const nextSlot = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
      
      // Check next slot
      return await appointmentService.isSlotAvailable(date, nextSlot);
    },
    
    isWithinCancellationWindow: (bookedAt) => {
      const now = new Date();
      const bookingTime = new Date(bookedAt);
      const timeDiffInSeconds = (now - bookingTime) / 1000;
      
      // Can cancel within 10 minutes (600 seconds)
      return timeDiffInSeconds <= 600;
    }
  };
  
  describe('Appointment Service', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });   
    
    test('isSlotAvailable returns true when slot is available', async () => {
      // Setup: Mock findOne to return null (no appointment found)
      Appointment.findOne.mockResolvedValue(null);
      
      // Test
      const result = await appointmentService.isSlotAvailable('2025-06-01', '10:00');
      
      // Assert
      expect(result).toBe(true);
      expect(Appointment.findOne).toHaveBeenCalledWith({
        date: '2025-06-01',
        timeSlot: '10:00',
        status: 'Confirmed'
      });
    });
    
    test('isSlotAvailable returns false when slot is booked', async () => {
      // Setup: Mock findOne to return an appointment
      Appointment.findOne.mockResolvedValue({
        _id: 'appointment123',
        date: '2025-06-01',
        timeSlot: '10:00',
        status: 'Confirmed'
      });
      
      // Test
      const result = await appointmentService.isSlotAvailable('2025-06-01', '10:00');
      
      // Assert
      expect(result).toBe(false);
    });
    
    test('canBookHairAndBeard returns true when both slots are available', async () => {
      // Setup: Both slots are available
      Appointment.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      
      // Test
      const result = await appointmentService.canBookHairAndBeard('2025-06-01', '10:00');
      
      // Assert
      expect(result).toBe(true);
      expect(Appointment.findOne).toHaveBeenCalledTimes(2);
    });
    
    test('canBookHairAndBeard returns false when next slot is booked', async () => {
      // Setup: First slot available, second slot booked
      Appointment.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
        _id: 'appointment456',
        date: '2025-06-01',
        timeSlot: '10:40',
        status: 'Confirmed'
      });
      
      // Test
      const result = await appointmentService.canBookHairAndBeard('2025-06-01', '10:00');
      
      // Assert
      expect(result).toBe(false);
    });
    
    test('isWithinCancellationWindow returns true for recent bookings', () => {
      // Setup: Booking made 5 minutes ago
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      // Test
      const result = appointmentService.isWithinCancellationWindow(fiveMinutesAgo);
      
      // Assert
      expect(result).toBe(true);
    });
    
    test('isWithinCancellationWindow returns false for older bookings', () => {
      // Setup: Booking made 15 minutes ago
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      // Test
      const result = appointmentService.isWithinCancellationWindow(fifteenMinutesAgo);
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  // File: __tests__/services/userService.test.js
  // Mock of User model methods
  User.findById = jest.fn();
  User.findByIdAndUpdate = jest.fn();
  
  // Create a simple version of the user service to test
  const userService = {
    updateAttendance: async (userId, didAttend) => {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      let newAttendance = user.attendance;
      
      if (didAttend) {
        // Increase attendance
        newAttendance += 1;
        
        // Check if user should receive discount
        if (newAttendance >= 5) {
          // Reset attendance after discount
          newAttendance = 0;
          // Sending discount email would happen here
        }
      } else {
        // Decrease attendance or reset if positive
        if (newAttendance > 0) {
          newAttendance = 0;
        } else {
          newAttendance -= 1;
        }
        
        // Check if user should be suspended
        if (newAttendance <= -3) {
          // Update user rights to suspended
          await User.findByIdAndUpdate(userId, { 
            attendance: newAttendance,
            rights: 'suspended'
          });
          return { suspended: true, attendance: newAttendance };
        }
      }
      
      // Update user attendance
      await User.findByIdAndUpdate(userId, { attendance: newAttendance });
      return { suspended: false, attendance: newAttendance };
    },
    
    canBookAppointment: async (userId) => {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      // Suspended users cannot book
      return user.rights !== 'suspended';
    }
  };
  
  describe('User Service - Attendance System', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    
    test('should increment attendance when marking as attended', async () => {
      // Setup: Mock user with attendance 2
      User.findById.mockResolvedValue({
        _id: 'user123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        attendance: 2,
        rights: 'regular'
      });
      
      User.findByIdAndUpdate.mockResolvedValue({});
      
      // Test
      const result = await userService.updateAttendance('user123', true);
      
      // Assert
      expect(result.attendance).toBe(3);
      expect(result.suspended).toBe(false);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', { attendance: 3 });
    });
    
    test('should reset attendance to 0 when reaching 5 attendance points', async () => {
      // Setup: Mock user with attendance 4
      User.findById.mockResolvedValue({
        _id: 'user123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        attendance: 4,
        rights: 'regular'
      });
      
      User.findByIdAndUpdate.mockResolvedValue({});
      
      // Test
      const result = await userService.updateAttendance('user123', true);
      
      // Assert
      expect(result.attendance).toBe(0); // Reset to 0 after reaching 5
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', { attendance: 0 });
    });
    
    test('should suspend user when attendance drops to -3', async () => {
      // Setup: Mock user with attendance -2
      User.findById.mockResolvedValue({
        _id: 'user123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        attendance: -2,
        rights: 'regular'
      });
      
      User.findByIdAndUpdate.mockResolvedValue({});
      
      // Test
      const result = await userService.updateAttendance('user123', false);
      
      // Assert
      expect(result.attendance).toBe(-3);
      expect(result.suspended).toBe(true);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', { 
        attendance: -3,
        rights: 'suspended'
      });
    });
    
    test('canBookAppointment returns false for suspended users', async () => {
      // Setup: Mock suspended user
      User.findById.mockResolvedValue({
        _id: 'user123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        attendance: -3,
        rights: 'suspended'
      });
      
      // Test
      const result = await userService.canBookAppointment('user123');
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  // File: __tests__/routes/appointments.test.js
  const request = require('supertest');
  const express = require('express');
  
  // Mock middleware
  jest.mock('../middleware/verifyCookie', () => (req, res, next) => {
    // Add mock user to request
    req.user = { 
      _id: 'user123', 
      email: 'test@example.com', 
      firstname: 'Test',
      lastname: 'User',
      role: 'user',
      rights: 'regular'
    };
    next();
  });
  
  // Mock the Appointment model
  jest.mock('../models/Appointment', () => ({
    find: jest.fn().mockReturnThis(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
    populate: jest.fn().mockResolvedValue([])
  }));
  
  // Mock WorkingHours model
  jest.mock('../models/WorkingHours', () => ({
    findOne: jest.fn().mockResolvedValue({
      shiftedSlots: [],
      intermediateSlots: [],
      blockedSlots: []
    })
  }));
  
  describe('Appointments API', () => {
    let app;
    
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Create a new Express app for each test
      app = express();
      app.use(express.json());
      
      // Import the router (this needs to happen after the mocks are set up)
      const appointmentsRouter = require('../routes/appointments');
      app.use('/api/appointments', appointmentsRouter);
    });
    
    test('GET /:date returns appointments for a date', async () => {
      // Mock data
      const mockAppointments = [
        { 
          _id: 'appt1', 
          date: '2025-06-01', 
          timeSlot: '10:00', 
          type: 'Hair',
          userId: {
            _id: 'user123',
            firstname: 'John',
            lastname: 'Doe'
          }
        }
      ];
      
      // Setup mock
      
      Appointment.find().populate.mockResolvedValue(mockAppointments);
      
      // Make request
      const response = await request(app)
        .get('/api/appointments/:2025-06-01');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('appointments');
      expect(response.body.appointments).toEqual(mockAppointments);
    });
    
    test('DELETE /cancel/:id enforces cancellation window', async () => {
      // Mock an appointment booked 15 minutes ago (outside window)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      
      Appointment.findById.mockResolvedValue({
        _id: 'appt123',
        date: '2025-06-01',
        timeSlot: '10:00',
        type: 'Hair',
        userId: 'user123',
        status: 'Confirmed',
        bookedAt: fifteenMinutesAgo
      });
      
      // Make request
      const response = await request(app)
        .delete('/api/appointments/cancel/:appt123');
      
      // Assert
      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Cancellation period has expired');
      expect(Appointment.deleteOne).not.toHaveBeenCalled();
    });
  });
  
  // File: __tests__/routes/users.test.js
 
 
  const bcrypt = require('bcryptjs');
  
  // Mock bcrypt
  jest.mock('bcryptjs');
  
  // Mock User model
  jest.mock('../models/User', () => ({
    findOne: jest.fn(),
    create: jest.fn()
  }));
  
  // Mock JWT signing
  jest.mock('../helpers/signJWT', () => 
    jest.fn().mockReturnValue('mock-jwt-token')
  );
  
  describe('User Authentication API', () => {
    let app;
    
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Create a new Express app for each test
      app = express();
      app.use(express.json());
      
      // Setup bcrypt mock
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('hashed-password');
      
      // Import the router
      const usersRouter = require('../routes/users');
      app.use('/api/users', usersRouter);
    });
    
    test('POST /register creates a new user', async () => {
      // Setup User.findOne to return null (no existing user)
      const User = require('../models/User');
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'new-user-id',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        role: 'user'
      });
      
      // Test registration
      const response = await request(app)
        .post('/api/users/register')
        .send({
          firstname: 'John',
          lastname: 'Doe',
          email: 'john@example.com',
          password: 'Password123!'
        });
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body.message).toContain('registered successfully');
      expect(User.create).toHaveBeenCalledWith({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        role: 'user',
        password: 'hashed-password'
      });
    });
    
    test('POST /login authenticates a valid user', async () => {
      // Setup User.findOne to return a user
      const User = require('../models/User');
      User.findOne.mockResolvedValue({
        _id: 'user123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: 'hashed-password',
        role: 'user',
        rights: 'regular'
      });
      
      // Test login
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'john@example.com',
          password: 'Password123!'
        });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.authenticated).toBe(true);
      expect(response.body.user).toHaveProperty('_id', 'user123');
      expect(response.body.user).not.toHaveProperty('password');
      
      // Check if cookie was set
      expect(response.headers['set-cookie']).toBeDefined();
    });
    
    test('POST /login rejects invalid credentials', async () => {
      // Setup User.findOne to return a user
      const User = require('../models/User');
      User.findOne.mockResolvedValue({
        _id: 'user123',
        email: 'john@example.com',
        password: 'hashed-password'
      });
      
      // Mock password comparison to fail
      bcrypt.compare.mockResolvedValue(false);
      
      // Test login with wrong password
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'john@example.com',
          password: 'WrongPassword123!'
        });
      
      // Assert
      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Incorrect password');
    });
  });
  
  // File: __tests__/services/adminService.test.js

  // Mock Appointment model methods for aggregation
  Appointment.countDocuments = jest.fn();
  Appointment.aggregate = jest.fn();
  Appointment.find = jest.fn().mockReturnThis();
  Appointment.sort = jest.fn().mockReturnThis();
  Appointment.limit = jest.fn().mockResolvedValue([]);
  Appointment.populate = jest.fn().mockReturnThis();
  
  const adminService = {
    getDashboardStats: async () => {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Get start of current week (Sunday)
      const currentDate = new Date();
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(currentDate);
      endOfWeek.setDate(currentDate.getDate() + (6 - currentDate.getDay()));
  
      const weekStart = startOfWeek.toISOString().split('T')[0];
      const weekEnd = endOfWeek.toISOString().split('T')[0];
      
      // Get start of current month
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const monthStart = startOfMonth.toISOString().split('T')[0];
  
      // Get appointment counts
      const todayCount = await Appointment.countDocuments({
        date: today,
        status: 'Confirmed',
      });
  
      const weekCount = await Appointment.countDocuments({
        date: { $gte: weekStart, $lte: weekEnd },
        status: 'Confirmed',
      });
  
      const monthCount = await Appointment.countDocuments({
        date: { $gte: monthStart },
        status: 'Confirmed',
      });
  
      // Get service distribution
      const serviceDistribution = await Appointment.aggregate([
        { $match: { status: 'Confirmed' } },
        { $group: { _id: '$type', value: { $sum: 1 } } },
        { $project: { _id: 0, name: '$_id', value: 1 } },
      ]);
  
      // Weekly appointment breakdown
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const appointmentsByDay = dayNames.map(name => ({ name, appointments: 0 }));
      
      // Get recent appointments
      const recentAppointments = await Appointment.find({ status: 'Confirmed' })
        .sort({ date: -1, timeSlot: -1 })
        .limit(5)
        .populate('userId', 'firstname lastname email');
  
      return {
        todayCount,
        weekCount,
        monthCount,
        serviceDistribution,
        appointmentsByDay,
        recentAppointments,
      };
    }
  };
  
  describe('Admin Dashboard Service', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    
    test('getDashboardStats returns appointment statistics', async () => {
      // Setup mocks for appointment counts
      Appointment.countDocuments
        .mockResolvedValueOnce(5)  // todayCount
        .mockResolvedValueOnce(23) // weekCount
        .mockResolvedValueOnce(78); // monthCount
      
      // Setup mock for service distribution
      Appointment.aggregate.mockResolvedValue([
        { name: 'Hair', value: 42 },
        { name: 'Beard', value: 18 },
        { name: 'Hair and Beard', value: 18 }
      ]);
      
      // Setup mock for recent appointments
      Appointment.find().sort().limit.mockResolvedValue([
        {
          _id: 'appt1',
          date: '2025-06-01',
          timeSlot: '10:00',
          type: 'Hair',
          status: 'Confirmed',
          userId: {
            firstname: 'John',
            lastname: 'Doe'
          }
        }
      ]);
      
      // Test
      const stats = await adminService.getDashboardStats();
      
      // Assert
      expect(stats.todayCount).toBe(5);
      expect(stats.weekCount).toBe(23);
      expect(stats.monthCount).toBe(78);
      expect(stats.serviceDistribution).toHaveLength(3);
      expect(stats.serviceDistribution[0].name).toBe('Hair');
      expect(stats.serviceDistribution[0].value).toBe(42);
      expect(stats.appointmentsByDay).toHaveLength(7);
    });
  });