const  { mongoose } = require('../mongoDB/mongoDB-config')

const UserSchema = new mongoose.Schema({
    firstname: {type: String, required:true },
    lastname: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true, select: false},
    role: {type: String, required: true},
    resetToken: String,
    resetTokenExpirationTime: Date
})

const User = mongoose.model('User', UserSchema);

module.exports = User;