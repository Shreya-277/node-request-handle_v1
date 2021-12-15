
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const perf_hooks = require('perf_hooks');

const Shipment = require('../../models/shipments');

// let activeRequest = [];
// let activeResponse = [];
// let timer = 0;
// let timeoutId = 0;

class BatchProcessing {

    constructor(delay, batchSize) {
        this.delay = delay;
        this.batchSize = batchSize;
        this.activeRequest = [];
        this.activeResponse = [];
        this.isScheduled = false;
        this.schedulerId = 0;
        this.STATUS = {
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

    addToBatch(req, res) {
        const id = req.params.shipmentId;
        //if serving the first request
        if(!this.isScheduled) {
            console.log('A');
            //delaying the response till a bacth is processed
            let that = this;
            this.schedulerId = setTimeout(() => {
                if(that.activeRequest.length !== 0) {
                    that.fetchData();
                }
            }, this.delay);
    
            this.isScheduled = true;
        } else if(this.activeRequest.length >= this.batchSize){
            this.fetchData();
            // clearTimeout
        }

        //push id to array to create a batch
        //create a batch of incoming request ids and its corrosponding responses
        this.activeRequest.push(id);
        this.activeResponse.push(res);
    }

    resetScheduler() {
        this.isScheduled = false;
        this.activeRequest = [];
        this.activeResponse = [];

        clearTimeout(this.schedulerId);
    }
    /**
     * Stores only unique ids amongst all request ids
     */
    getUniqueRequest(processRequest) {
        // let activeRequest = this.activeRequest;
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
    formatResponse(docs) {
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
    fetchData() {
        let that = this;
        let processRequest = that.activeRequest;
        let processResponse = that.activeResponse;
        let uniqueIds = that.getUniqueRequest(processRequest);
       
       
        // fetching data from db
        console.log('before processing response', processRequest.length, processResponse.length);
        // console.log(this.activeResponse);
        Shipment.find({
            '_id': { $in: uniqueIds}
        }, function(err, docs){
            console.log('activeRequest length::', that.activeRequest.length);
            if(err) {
                that.pushResponse(that.STATUS.ERROR, undefined, processRequest, processResponse);
            } else {
                let response = that.formatResponse(docs);
                that.pushResponse(that.STATUS.OK, response, processRequest, processResponse);
            }
            
            console.log('End');
        });
        that.resetScheduler();
    }

    /**
     * Sends response with appropriate messages
     * @param {string} msg 
     * @param {number} status 
     * @param {array} formattedResponse 
     */
    pushResponse(status, formattedResponse, processRequest, processResponse) {
        // let that = this;
        console.log('request length', processRequest.length);
        console.log('response length',processResponse.length);
        processResponse.forEach((res, idx) => {
            let id = processRequest[idx];
            let resData = formattedResponse === undefined
                ? []
                : formattedResponse[id];

            res.status(status.code).json({
                message: status.msg,
                response: resData
            })
        })
    }

    
}

const batch = new BatchProcessing(150, 100);

router.get('/:shipmentId', (req, res) => {
    batch.addToBatch(req, res);
});


module.exports = router;