
const mongoose = require('mongoose');
const sizeof  = require('object-sizeof');

const Shipment = require('../models/shipments');

class BatchProcessing {

    constructor(delay, maxProcessSize) {
        this.delay = delay;
        this.maxProcessSize = maxProcessSize;
        this._activeRequest = [];
        this._activeResponse = [];
        this._isScheduled = false;
        this._schedulerId = 0;
        this._toBeProcessed = 0;
        this._STATUS = {
            OK: {
                code: 200,
                msg: 'Executed successfully'
            },
            ERROR:  {
                code: 500,
                msg: 'Error'
            }
        }
    }

    /**
     * Adds incoming requests to a batch for processing
     * @param {Object} req 
     * @param {Object} res 
     */
    addToBatch(req, res) {
        if(this._toBeProcessed >= this.maxProcessSize) {
            // console.log('', this._toBeProcessed);
            return res.status(429).json({
                msg: 'Too many incoming requests'
            });
        }

        const id = req.params.shipmentId;
        // If serving the first request of the batch
        // Start the batch
        if(!this._isScheduled) {
            // Delaying the response till the batch is processed
            let that = this;
            this._schedulerId = setTimeout(() => {
                if(that._activeRequest.length !== 0) {
                    that._fetchData();
                }
            }, this.delay);
    
            this._isScheduled = true;
        }/* else if(this._activeRequest.length >= this.batchSize){
            //If request size exceeds the btchSize, batch will be processed
            this._fetchData();
        }*/

        // Push incoming request ids and its corrosponding responses to form a batch
        this._activeRequest.push(id);
        this._activeResponse.push(res);
        this._toBeProcessed++;
    }

    /**
     * Resets scheduler values to start a new batch
     */
    _resetScheduler() {
        this._isScheduled = false;
        this._activeRequest = [];
        this._activeResponse = [];

        clearTimeout(this._schedulerId);
    }

    /**
     * Stores only unique ids amongst all request ids
     */
    _getUniqueRequest(processRequest) {
        let uniqueRequest = processRequest.filter((req, idx) => {
            return processRequest.indexOf(req) == idx
        });

        return uniqueRequest;
    }

    /**
     * format the structure of the response
     * @param {array} docs 
     * @returns array
     */
    _formatResponse(docs) {
        let response = [];
        docs.forEach(doc => {
            response[doc._id] = {
                id: doc._id,
                distance: doc.distance,
                price: doc.price
            }
        });
        return response;
    }

    /**
     * Fetches data from the db 
     */
    _fetchData() {
        let that = this;
        // Pools to store the requests and response ids till the time of them being processed
        let processRequest = that._activeRequest;
        let processResponse = that._activeResponse;
        let uniqueIds = that._getUniqueRequest(processRequest);
       
        // fetching data from db
        console.log('before processing response', processRequest.length, processResponse.length);
        Shipment.find({
            '_id': { $in: uniqueIds}
        }, function(err, docs){
            console.log('Serving ', processRequest.length, ' requests');
            that._pushResponse(
                err ? that._STATUS.ERROR : that._STATUS.OK,
                err ? undefined : that._formatResponse(docs),
                processRequest,
                processResponse
            );
           
        });
        // Create a new batch as the previous batch is being processed
        that._resetScheduler();
    }

    /**
     * Sends response with appropriate messages
     * @param {string} msg 
     * @param {number} status 
     * @param {array} formattedResponse 
     */
    _pushResponse(status, formattedResponse, processRequest, processResponse) {
        processResponse.forEach((res, idx) => {
            let id = processRequest[idx];
            let resData = formattedResponse === undefined
                ? []
                : formattedResponse[id];

            res.status(status.code).json({
                message: status.msg,
                response: resData
            });
        });

        this._toBeProcessed -= processRequest.length;
    }
}

module.exports = BatchProcessing;