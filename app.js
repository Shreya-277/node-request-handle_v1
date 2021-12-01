const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');


mongoose.connect('mongodb+srv://mongodb:EG34qwTYQRuEW5S@cluster0.p8hsk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority');

const productsRoute = require('./api/route/products');
const ordersRoute = require('./api/route/orders');
// app.use((req, res, next) => {
//     res.status(200).json({
//         message: 'It works!!'
//     });
// });
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Headers', '*')
//     if(req.method === 'OPTIONS') {
//         res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, PATCH, DELETE');
//         res.status(200).json({});
//     }
// });

app.use('/products', productsRoute);
app.use('/orders', ordersRoute);
app.use((req, res, next) => {
    const error = new Error('Not found!');
    error.status = 404;
    next(error);
});
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    })
})
module.exports = app;