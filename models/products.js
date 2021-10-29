const mongoose = require('mongoose');

// product schema
const productSchema = new mongoose.Schema({
    name: String,
    producer: String,
    price: Number,
    available: Number,
    details: String,
    imgUrl:[String],
    createDate: {
        type:Date,
        default: Date.now
    },
    bid:[{
        consumerName: String,
        consumerId: String,
        status: {
            type: String,
            default: "incomplete"
        },
        dated: {
            type:Date,
            default: Date.now
        },
        quantity: Number,
        bidPrice: Number,
        remark: String
    }]
});

module.exports = mongoose.model('products',productSchema);
