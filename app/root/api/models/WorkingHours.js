const { mongoose } = require("../mongoDB/mongoDB-config");

const WorkingHoursSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  startTime: { type: String, required: true }, // Example: "09:00"
  endTime: { type: String, required: true }, // Example: "18:00"
  breakStart: {type: String, required: true},
  breakEnd: {type: String, required: true},
  
  // Fields for custom slot patterns
  hasCustomSlotPattern: { type: Boolean, default: false },
  
  // Track canceled Hair and Beard slots
  canceledHairAndBeardSlots: [{
    originalSlot: { type: String },
    nextSlot: { type: String },
    canceledAt: { type: Date, default: Date.now }
  }],
  
  // New field to track shifted slots
  shiftedSlots: [{
    originalTime: { type: String },
    shiftedTime: { type: String },
    createdDueToAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointments" },
    isBooked: { type: Boolean, default: false },
    bookedAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointments", default: null }
  }],
  
  // New field to track intermediate slots
  intermediateSlots: [{
    slotTime: { type: String },
    createdDueToAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointments" },
    isBooked: { type: Boolean, default: false },
    bookedAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointments", default: null }
  }],
  
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 600000),
    expires: 0, // TTL index enabled
  },
});

const WorkingHours = mongoose.model("WorkingHours", WorkingHoursSchema);

module.exports = WorkingHours;