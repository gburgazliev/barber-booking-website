const { mongoose } = require("../mongoDB/mongoDB-config");

const AppointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum:['Hair', 'Hair and Beard', 'Beard'], required: true },
  date: {type: String, required: true},
  timeSlot: {type: String, required: true},
  duration: {type: Number, default: 40},
  status: {type: String, enum: ['Pending', 'Confirmed'], default: 'Pending'},
  confirmationHex: {type: String},
  bookedAt: {type: Date},
  
  // New fields for tracking slot types
  isShiftedSlot: {type: Boolean, default: false},
  isIntermediateSlot: {type: Boolean, default: false},
  originalSlotTime: {type: String}, // Original time for shifted slots
  attended: {type: Boolean, default: null}, // Track if the appointment was attended
  price: {type: Number},
  discountApplied: {type: Boolean, default: false, required: true}, // Track if a discount was applied
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 600000), 
    expires: 0 // TTL index enabled
  }
});

const Appointment = mongoose.model("Appointments", AppointmentSchema);

module.exports = Appointment;