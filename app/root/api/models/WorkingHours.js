const  { mongoose } = require('../mongoDB/mongoDB-config')

const WorkingHoursSchema = new mongoose.Schema({
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    startTime: { type: String, required: true }, // Example: "09:00"
    endTime: { type: String, required: true },// Example: "18:00"
    expiresAt: { 
        type: Date, 
        default: () => new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
        expires: 0 // TTL index enabled
    }

})

const WorkingHours = mongoose.model('WorkingHours', WorkingHoursSchema);

module.exports=WorkingHours;