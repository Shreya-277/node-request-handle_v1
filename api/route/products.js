const fs = require('fs');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');

const Product = require('../../models/products');

router.get('/', (req, res, next) => {
    Product.find()
            .select('_id name price')
            .exec()
            .then(docs => {
                const response = {
                    count: docs.length,
                    products: docs.map(doc => {
                        return {
                            id: doc._id,
                            name: doc.name,
                            price: doc.price,
                            request: {
                                type: 'GET',
                                url: 'https://localhost:3000/products/' + doc._id
                            }
                        }
                    })
                }
                res.status(200).json(response)
            })
            .catch(err => {
                res.status(500).json({
                    error: err
                })
            });
});

router.post('/', (req, res, next) => {
    const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price
    });
    product.save()
            .then(result => {
                writeCacheFile(product._id, product);
                res.status(200).json({
                    message: 'Product added',
                    products: product,
                    result: result
                });
                
            })
            .catch(err => {
                res.status(500).json({
                    error: err
                })
            });

});

router.get('/:productId', (req, res, next) => {
    const id = req.params.productId;
    const cacheResponse = readCacheFile(id);
    if(cacheResponse) {
        res.status(200).json(cacheResponse);
    } else {
        Product.findById(id)
        .select('_id name price')
        .exec()
        .then(doc => {
            const response = {
                product: {
                    id: doc._id,
                    name: doc.name,
                    price: doc.price,
                    request: {
                        type: 'GET',
                        url: 'https://localhost:3000/products/' + doc._id
                    }
                }
            }
            res.status(200).json(response)
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
    }
});

router.delete('/:productId', (req, res, next) => {
    const id = req.params.productId;
    Product.remove({_id: id})
            .exec()
            .then(result => {
                const response = {
                    message: 'Product deleted',
                    request: {
                        type: 'DELETE',
                        url: 'https://localhost/products/' + id
                    }
                }
                res.status(200).json(response);
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({
                    error: err
                });
            });
});

const writeCacheFile = (_id, data) => {
    const filename = _id + '.json';
    const dataToJSON = JSON.stringify(data);
    fs.writeFileSync(path.resolve(__dirname, '../../cache/' + filename), dataToJSON);
    console.log('File written in cache successfully!');
}

const readCacheFile = (id) => {
    let response = null;
    const filename = id + '.json';
    try {
        const data = fs.readFileSync(path.resolve(__dirname, '../../cache/' + filename));
        if(data) {
            const parsedData = JSON.parse(data.toString());
            response = parsedData;
        }
        
    } catch(err) {
        console.log(err)
    }
    return response;
}

// readCacheFile()
// writeCacheFile();
module.exports = router;