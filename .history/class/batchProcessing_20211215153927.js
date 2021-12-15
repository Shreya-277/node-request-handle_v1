
const express = require('express');
const router = express.Router();
const Shipment = require('../../models/shipments');

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
    getUniqueRequest() {
        let activeRequest = this.activeRequest;
        let uniqueRequest = activeRequest.filter((req, idx) => {
            return activeRequest.indexOf(req) == idx
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
        let uniqueIds = this.getUniqueRequest();
        let that = this;
        // fetching data from db
        Shipment.find({
            '_id': { $in: uniqueIds}
        }, function(err, docs){
            if(err) {
                that.pushResponse(that.STATUS.ERROR, undefined);
            } else {
                let response = that.formatResponse(docs);
                that.pushResponse(that.STATUS.OK, response);
            }
            that.resetScheduler();
        });
    }

    /**
     * Sends response with appropriate messages
     * @param {string} msg 
     * @param {number} status 
     * @param {array} formattedResponse 
     */
    pushResponse(status, formattedResponse) {
        let that = this;

        that.activeResponse.forEach((res, idx) => {
            let id = that.activeRequest[idx];
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