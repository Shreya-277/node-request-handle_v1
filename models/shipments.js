const mongoose = require('mongoose');

const shipmentsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    distance: { type: Number, required: true}, // in kms
    price: { type: Number, required: true}
});

module.exports = mongoose.model('Shipment', shipmentsSchema);