
const express = require('express');
const router = express.Router();


const Shipment = require('../../models/shipments');
const BatchProcessing = require('../../class/batchProcessing');
const batch = new BatchProcessing(150, 100);

router.get('/:shipmentId', (req, res) => {
    batch.addToBatch(req, res);
});


module.exports = router;