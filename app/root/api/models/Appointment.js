const { mongoose } = require("../mongoDB/mongoDB-config");

const AppointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum:['Hair', 'Hair and Beard', 'Beard'], required: true },
  date: {type: String, required: true},
  timeSlot: {type: String, required: true},
  status: {type: String, enum: ['Pending', 'Confirmed'], default: 'Pending'
  },
  confirmationHex: {type: String},
  bookedAt: {type:Date} ,
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 600000), 
    expires: 0 // TTL index enabled
}
});

const Appointment = mongoose.model("Appointments", AppointmentSchema);

module.exports = Appointment;
