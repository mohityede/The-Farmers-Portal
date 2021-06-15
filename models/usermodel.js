const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    phone: String,
    phoneState: {
        type: Boolean,
        default: false
    },
    email: String,
    aadharNum: String,
    aadharState: {
        type: Boolean,
        default: false
    },
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
        proImg: String,
        proId: String,
        proName: String,
        proAvailable: Number,
        proPrice: Number
    }],
    cart:[{
        proImg: String,
        proId: String,
        proName: String,
        proQuantity: Number,
        proPrice: Number,
    }],
    notification:[String],
    org:String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

userSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
module.exports = mongoose.model('usermodel',userSchema);