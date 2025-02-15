const { mongoose } = require("../mongoDB/mongoDB-config");

const WorkingHoursSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  startTime: { type: String, required: true }, // Example: "09:00"
  endTime: { type: String, required: true }, // Example: "18:00"
  breakStart: {type: String, required: true},
  breakEnd: {type: String, required: true},
  // No default value here
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 600000),
    expires: 0, // TTL index enabled
  },
});

const WorkingHours = mongoose.model("WorkingHours", WorkingHoursSchema);

module.exports = WorkingHours;
