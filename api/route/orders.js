const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Orders = require('../../models/orders');
const Products = require('../../models/products');

router.get('/', (req, res, next) => {
    Orders.find()
        .select('productId quantity _id')
        .exec()
        .then(docs => {
            const response = {
                count: docs.length,
                orders: docs.map((doc) => {
                    return {
                        _id: doc._id,
                        productId: doc.productId,
                        quantity: doc.quantity,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/orders/' + doc._id
                        }
                    }
                })
            }
            res.status(200).json(response);
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.post('/', (req, res, next) => {
    Products.findById(req.body.productId)
            .then(product => {
                console.log(product);
                if(!product) {
                    res.status(404).json({
                        message: 'Product not found'
                    });
                }
                const order = new Orders({
                    _id: mongoose.Types.ObjectId(),
                    productId: req.body.productId,
                    quantity: req.body.quantity
                });
                return order.save()
                        .then(result => {
                            const response = {
                                message: 'Order created!',
                                order: order,
                                result: result
                            }
                            res.status(200).json(response);
                        })
                        .catch(err => {
                            res.status(500).json({
                                message: 'Order not found!',
                                error: err
                            })
                        })
            })
            .catch(err => {
                res.status(500).json({
                    error: err
                })
            })
});

router.get('/:orderId', (req, res, next) => {
    const id = req.params.orderId;
    Orders.findById(id) 
            .exec()
            .then(doc => {
                const response = {
                    id: doc._id,
                    productId: doc.productId,
                    quantity: doc.quantity,
                    request: {
                        type: 'GET',
                        url: 'http://localhost:3000/orders/'+ doc._id                    }
                }
                res.status(200).json(response);
            })
            .catch(err => {
                res.status(500).json({
                    error: err
                })
            });
});

router.delete('/:orderId', (req, res, next) => {
    const id = req.params.orderId;
    res.status(200).json({
        message: 'Deleted order: ' + id
    });
});

module.exports = router;