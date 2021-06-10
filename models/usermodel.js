const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String,
    password: {
        type: String,
        select: false
    },
    role: String,
    location: {
        local: String,
        district: String,
        state: String,
        pin: Number
    },
    wishlist: [{
        proId: String,
        proName: String,
        proAvailable: Number,
        proPrice: Number
    }],
    org:String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

userSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
module.exports = mongoose.model('usermodel',userSchema);