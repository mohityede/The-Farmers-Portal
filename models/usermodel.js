const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String,
    password: {
        type: String,
        select: false
    }
});

userSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
module.exports = mongoose.model('usermodel',userSchema);