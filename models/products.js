const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: String,
    producer : String,
    price: Number,
    available: Number,
    details: String,
    imgUrl:[String],
    createDate: {
        type:Date,
        default: Date.now
    }
});

module.exports = mongoose.model('products',productSchema);