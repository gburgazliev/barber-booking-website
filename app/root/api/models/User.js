const  { mongoose } = require('../mongoDB/mongoDB-config')

const UserSchema = new mongoose.Schema({
    firstname: {type: String, required:true },
    lastname: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true, select: false},
    role: {type: String, required: true},
    resetToken: String,
    resetTokenExpirationTime: Date,
    attendance: {type: Number, default: 0, min: -3, max: 5}, 
    rights: {type:String, default:'regular', enum:['regular', 'suspended']},
})

// Pre-save middleware to update rights based on attendance
UserSchema.pre('save', function(next) {
    // If attendance is changed OR this is a new document
    if (this.isModified('attendance') || this.isNew) {
        // Set rights based on attendance value
        if (this.attendance <= -3) {
            this.rights = 'suspended';
        } else {
            this.rights = 'regular';
        }
    }
    next();
});

const User = mongoose.model('User', UserSchema);

module.exports = User;